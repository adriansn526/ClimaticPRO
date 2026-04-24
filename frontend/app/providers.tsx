'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || '/ingest';

if (typeof window !== 'undefined') {
    if (POSTHOG_KEY) {
        posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            person_profiles: 'identified_only',
            capture_pageview: false, // Ne ocupam manual in componenta Suspense
            session_recording: {
                maskAllInputs: false,
                maskTextSelector: '*w-full',
            }
        });
    }
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Inregistraram manual pageviews
        posthog.capture('$pageview')
    }, [])

    return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
