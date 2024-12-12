import { Wallet } from "./Wallet.js";

const wallet = new Wallet('bezpieczne hasło');

const keyPair = wallet.getFirstAvailableKeyPair();

if(keyPair) {
    console.log('Encrypted private key', keyPair.encryptedPrivateKey);
    console.log('Decrypted private key', keyPair.getDecryptedPrivateKey('bezpieczne hasło'));
    console.log('Address', keyPair.getAddress());
}

wallet.generateNewKeyPair('bezpieczne hasło');

