var CryptoJS = require('crypto-js');
function encrypted(text, key) {
    if(!key) key = 'secret key 123';
    return CryptoJS.AES.encrypt(text, key).toString();
}
function decrypted(cipher, key, replace, replaceWith) {
    if (replace) {
        cipher = cipher.replace(/-/g, "\/");
    }
    if(!key) {
        key = 'secret key 123';
    }
    var bytes = CryptoJS.AES.decrypt(cipher, key);
    var plain = bytes.toString(CryptoJS.enc.Utf8);
    return plain;
}

module.exports = {
    encrypt: encrypted,
    decrypt: decrypted
}
