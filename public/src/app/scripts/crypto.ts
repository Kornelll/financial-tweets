import * as CryptoJS from 'crypto-js';
export class Encrytojs {
    
    static encrypt(plain: string, key?: string, replace?: boolean, replaceWith?: string): string {
        if(!key) key = 'secret key 123';
        let a = CryptoJS.AES.encrypt(plain, key);
        // console.log("plain: "+ plain);
        // console.log("cipher: "+ a);
        if(replace && a) {
            try {

                a = a.toString().replace(/\//g, "-");
            }
            catch(er){
                console.warn(er);
            }
            // console.log("cipherTo: "+ a.toString());
        }
        return a;
    }
    static decrypt(cipher: string, key?: string): string {
        if(!key) key = 'secret key 123';
        let bytes  = CryptoJS.AES.decrypt(cipher.toString(), key);
        return bytes.toString(CryptoJS.enc.Utf8);
    }
}
