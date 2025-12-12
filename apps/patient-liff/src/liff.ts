import liff from '@line/liff';

export const initLiff = async () => {
    try {
        console.log('Initializing LIFF with ID:', import.meta.env.VITE_LIFF_ID);
        await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });
        console.log('LIFF init success. InClient:', liff.isInClient(), 'LoggedIn:', liff.isLoggedIn());

        if (!liff.isLoggedIn() && !liff.isInClient()) {
            console.log('Not logged in and not in client. Triggering login...');
            liff.login();
            return null; // Will redirect
        }
        return liff.getProfile();
    } catch (error: any) {
        console.error('LIFF initialization failed:', error);
        // Re-throw with more info if possible
        throw new Error(error.message || 'LIFF init failed');
    }
};
