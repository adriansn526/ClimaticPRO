import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import { fetchWithAuth, API_BASE_URL } from '../utils/api';

export type Job = {
    id: string;
    product: string;
    region: string;
    address: string;
    client: string;
    phone?: string;
    date?: string;
    status?: string;
    products?: string[];
    notes?: string;
    amount?: string;
};

// ... Removed large MOCK block to use live DB data ...

type JobContextType = {
    availableJobs: Job[];
    activeJobs: Job[];
    acceptJob: (id: string) => void;
    completeJob: (id: string) => void;
    cancelJob: (id: string, reason: string) => void;
    getJobById: (id: string) => Job | undefined;
};

export const JobContext = createContext<JobContextType | null>(null);

export const JobProvider = ({ children }: { children: React.ReactNode }) => {
    const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
    const [activeJobs, setActiveJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshJobs = async () => {
        setIsLoading(true);
        try {
            // Check if token exists before making any request
            let token = null;
            if (Platform.OS === 'web') {
                token = localStorage.getItem('userToken');
            } else {
                import('expo-secure-store').then(SecureStore => {
                    SecureStore.getItemAsync('userToken').then(t => token = t);
                });
            }

            // Quick hack for async secure store for this context
            if (Platform.OS !== 'web') {
                const SecureStore = await import('expo-secure-store');
                token = await SecureStore.getItemAsync('userToken');
            }

            // Also get the user data to find the user's region
            let userDataStr = null;
            if (Platform.OS === 'web') {
                userDataStr = localStorage.getItem('userData');
            } else {
                const SecureStore = await import('expo-secure-store');
                userDataStr = await SecureStore.getItemAsync('userData');
            }

            let region = 'Bucuresti'; // Default fallback
            if (userDataStr) {
                try {
                    const parsedUser = JSON.parse(userDataStr);
                    // Just a robust check, if we add region to user profile later
                    if (parsedUser.region) region = parsedUser.region;
                    // Address parsing fallback (e.g. from seed "Bucuresti, Sector 1")
                    else if (parsedUser.address && parsedUser.address.includes('Bucuresti')) region = 'Bucuresti';
                } catch (e) { }
            }

            if (!token) {
                // User is likely logged out, do not fetch jobs
                setAvailableJobs([]);
                setActiveJobs([]);
                setIsLoading(false);
                return;
            }

            // Fetch Active Jobs specific to the installer
            const activeRes = await fetchWithAuth('/mobile/jobs');
            if (activeRes.success) {
                // Map the backend DB structure to local Job interface
                const mappedActive = activeRes.jobs.map((j: any) => ({
                    id: j.id,
                    client: j.client,
                    address: j.address,
                    phone: j.phone,
                    date: j.date,
                    status: j.status,
                    products: j.products,
                    amount: 'TBD', // In the future, bring this from Job Meta
                    product: j.products?.[0] || 'Produs instalare'
                }));
                setActiveJobs(mappedActive);
            }

            // Fetch Available Orders broadcasted to installers broadly using the installer's region
            const availRes = await fetchWithAuth(`/dispatch/orders?role=installer&region=${encodeURIComponent(region)}`);
            if (availRes.success) {
                const mappedAvail = availRes.orders.map((o: any) => ({
                    id: o.id.toString(),
                    client: o.client,
                    address: o.address,
                    region: o.region,
                    product: o.product,
                    date: o.date
                }));
                setAvailableJobs(mappedAvail);
            }
        } catch (e) {
            console.error("Failed fetching jobs from API", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshJobs();
    }, []);

    const acceptJob = async (id: string) => {
        try {
            // Get user data to find the installer ID and Name
            let userDataStr = null;
            if (Platform.OS === 'web') {
                userDataStr = localStorage.getItem('userData');
            } else {
                const SecureStore = await import('expo-secure-store');
                userDataStr = await SecureStore.getItemAsync('userData');
            }

            let installerId = 'unknown';
            let installerName = 'Instalator Mobil';
            if (userDataStr) {
                try {
                    const parsedUser = JSON.parse(userDataStr);
                    if (parsedUser.userId) installerId = parsedUser.userId;
                    else if (parsedUser.id) installerId = parsedUser.id.toString();

                    if (parsedUser.name) installerName = parsedUser.name;
                    else if (parsedUser.companyName) installerName = parsedUser.companyName;
                    else if (parsedUser.email) installerName = parsedUser.email; // fallback
                } catch (e) { }
            }

            // Actual API Call to accept WooCommerce Order and create a Job record
            const response = await fetchWithAuth('/dispatch/orders', {
                method: 'PUT',
                body: JSON.stringify({
                    orderId: parseInt(id),
                    action: 'accept',
                    installerId: installerId,
                    installerName: installerName
                })
            });
            if (response.success) {
                await refreshJobs(); // Simply refetch to get the updated status
            } else {
                alert("Eroare de la server: " + (response.error || 'Necunoscută'));
            }
        } catch (error) {
            console.error(error);
            alert("Nu s-a putut accepta comanda. Verifică conexiunea.");
        }
    };

    const completeJob = async (id: string) => {
        try {
            // await fetchWithAuth(`/mobile/jobs/${id}/complete`, {method: 'POST'})
            setActiveJobs(prev => prev.filter(j => j.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    const cancelJob = async (id: string, reason: string) => {
        try {
            const response = await fetchWithAuth(`/mobile/jobs/${id}/cancel`, {
                method: 'POST',
                body: JSON.stringify({ reason })
            });
            if (response.success) {
                // Remove from active list
                setActiveJobs(prev => prev.filter(j => j.id !== id));
                await refreshJobs(); // Optionally refetch available/active jobs to reset state
            } else {
                alert("Nu s-a putut anula lucrarea: " + (response.error || 'Necunoscut'));
            }
        } catch (e) {
            console.error(e);
            alert("Eroare de rețea la anularea lucrării.");
        }
    };

    const getJobById = (id: string) => {
        return activeJobs.find(j => j.id === id) || availableJobs.find(j => j.id === id);
    };

    return (
        <JobContext.Provider value={{ availableJobs, activeJobs, acceptJob, completeJob, cancelJob, getJobById }}>
            {children}
        </JobContext.Provider>
    );
};

export const useJobs = () => {
    const context = useContext(JobContext);
    if (!context) throw new Error("useJobs must be used within a JobProvider");
    return context;
};
