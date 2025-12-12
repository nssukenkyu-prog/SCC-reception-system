import liff from '@line/liff';

export const initLiff = async () => {
    try {
        await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });
        if (!liff.isLoggedIn()) {
            liff.login();
        }
        return liff.getProfile();
    } catch (error) {
        console.error('LIFF initialization failed', error);
        throw error;
    }
};
