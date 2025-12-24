export const startScheduler = () => {
    console.log('[Scheduler] Starting job scheduler...');

    setInterval(() => {
        console.log('[Scheduler] Running nightly cleanup job...');
    }, 60000); // Run every minute for demo
};
