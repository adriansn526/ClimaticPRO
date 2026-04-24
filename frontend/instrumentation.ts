export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const cron = await import('node-cron');
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        console.log('[INSTRUMENTATION] Booting node-cron Dynamic Scheduler...');

        // Verify conditions every 1 minute
        cron.schedule('* * * * *', async () => {
             try {
                // Fetch settings
                const settings = await prisma.appSetting.findMany({
                    where: { key: { in: ['scraper_cron_enabled', 'scraper_cron_time', 'scraper_cron_frequency', 'scraper_last_run_date'] } }
                });

                const enabled = settings.find(s => s.key === 'scraper_cron_enabled')?.value === 'true';
                if (!enabled) return;

                const cronTimeStr = settings.find(s => s.key === 'scraper_cron_time')?.value || '04:00';
                const frequencyStr = settings.find(s => s.key === 'scraper_cron_frequency')?.value || '24';
                const freqHours = parseInt(frequencyStr);
                const lastRunDateIso = settings.find(s => s.key === 'scraper_last_run_date')?.value;

                // Time math - Romania timezone
                const now = new Date();
                const roString = now.toLocaleString('en-US', { timeZone: 'Europe/Bucharest', hour12: false });
                
                const hourMatch = roString.match(/,\s*(2[0-3]|[01]?\d):([0-5]\d)/);
                if (!hourMatch) return;
                
                const currentHour = parseInt(hourMatch[1]);
                const currentMinute = parseInt(hourMatch[2]);

                const [baseHourStr, baseMinuteStr] = cronTimeStr.split(':');
                const baseHour = parseInt(baseHourStr);
                const baseMinute = parseInt(baseMinuteStr);

                // Is the current time equal to one of the execution ticks?
                let shouldRunNow = false;
                
                // Criteriu 1: Minutul ales prin selector se aliniază cu minutul actual
                if (currentMinute === baseMinute) {
                    
                    // Criteriu 2: Ora intră în numătoarea frecvenței
                    for (let i = 0; i < (24 / freqHours); i++) {
                        const targetHour = (baseHour + (freqHours * i)) % 24;
                        if (currentHour === targetHour) {
                            shouldRunNow = true;
                            break;
                        }
                    }
                }

                if (shouldRunNow) {
                    // Evităm execuțiile redundante în același minut
                    const tickId = `${now.toISOString().split('T')[0]}_${currentHour}:${currentMinute}`;
                    if (lastRunDateIso === tickId) return; 
                    
                    console.log(`[INSTRUMENTATION CRON] TICK MATCH! Triggering internal scrapers API (ID: ${tickId})`);
                    
                    // Notăm bifa ca executată
                    await prisma.appSetting.upsert({
                        where: { key: 'scraper_last_run_date' },
                        update: { value: tickId },
                        create: { key: 'scraper_last_run_date', value: tickId }
                    });

                    // Trigger the endpoint invizibil dar pe rețeaua internă sigură!
                    const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-123';
                    const port = process.env.PORT || '3000';
                    
                    try {
                        const res = await fetch(`http://127.0.0.1:${port}/api/cron/scrapers`, {
                            headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
                        });
                        console.log(`[INSTRUMENTATION CRON] API replied: HTTP ${res.status}`);
                    } catch (e) {
                         console.error('[INSTRUMENTATION CRON] Failed to wake up frontend API...', e);
                    }
                }
             } catch (e) {
                 console.error('[INSTRUMENTATION CRON] Background Validation Error:', e);
             }
        });
    }
}
