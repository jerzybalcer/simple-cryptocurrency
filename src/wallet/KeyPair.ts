import { Cryptography } from "../Cryptography.js";


export class KeyPair {
    publicKey: string = "";
    encryptedPrivateKey: string = "";
    initializationVector: string = "";
    salt: string = "";

    constructor(publicKey: string, encryptedPrivateKey: string, iv: string, salt: string) {
        this.publicKey = publicKey;
        this.encryptedPrivateKey = encryptedPrivateKey;
        this.initializationVector = iv;
        this.salt = salt;
    }

    static generate(password: string): KeyPair {
        const { publicKey, privateKey } = Cryptography.generateECDSAKeyPair();

        const { secret, salt } = Cryptography.generateSecretFromPassword(password);

        const { encryptedValue: encryptedPrivateKey, iv } = Cryptography.encryptUsingAES(privateKey, secret);

        return new KeyPair(publicKey, encryptedPrivateKey, iv, salt);
    }

    getAddress(): string {
        return Cryptography.hashUsingSHA256(this.publicKey);
    }

    getDecryptedPrivateKey(password: string): string {
        const { secret } = Cryptography.generateSecretFromPassword(password, this.salt);

        return Cryptography.decryptUsingAES(this.encryptedPrivateKey, secret, this.initializationVector);
    }
}
