import { Encrytojs } from './crypto';
import { UserModel } from '../modules/users-module/models';
export class CacheHandler {

    private static SECRET = 'cache-handler-secret';
    /* --------------------- Main handler getter and setter --------------------- */
    public static store(key, obj) {
        let data = '{}';
        try { data = JSON.stringify(obj); } catch (err) { }
        data = Encrytojs.encrypt(data, CacheHandler.SECRET);
        localStorage.setItem(key, data);
    }
    public static get(key): any {
        try {
            return JSON.parse(Encrytojs.decrypt(localStorage.getItem(key), CacheHandler.SECRET));
        } catch (err) {
            return {};
        }
    }
    /* -------------------------------------------------------------------------- */

    /* ------------------------- Storing login response ------------------------- */
    public static storeLoginData(obj) {
        CacheHandler.store('___d', obj);
    }
    public static removeLoginData() {
        localStorage.removeItem('___d');
    }

    public static storeUserLater(user) {
        let token = CacheHandler.getStoredToken();
        CacheHandler.storeLoginData({ token, user });
    }

    /* ----------------------------- Get cached user ---------------------------- */

    public static getStoredUser(): UserModel {
        try { return CacheHandler.get('___d').user } catch (err) { return null; }
    }

    /* ---------------------------- Get stored token ---------------------------- */
    public static getStoredToken() {
        try { return CacheHandler.get('___d').token } catch (err) { return null; }
    }

}