import { Cryptography } from "../Cryptography.js";

export class KeyPair {
    publicKey: string = "";
    encryptedPrivateKey: string = "";
    initializationVector: string = "";
    salt: string = "";
    tag: string = "";

    constructor(publicKey: string, encryptedPrivateKey: string, iv: string, salt: string, tag: string) {
        this.publicKey = publicKey;
        this.encryptedPrivateKey = encryptedPrivateKey;
        this.initializationVector = iv;
        this.salt = salt;
        this.tag = tag;
    }

    static generate(password: string): KeyPair {
        const { publicKey, privateKey } = Cryptography.generateECDSAKeyPair();

        const { secret, salt } = Cryptography.generateSecretFromPassword(password);

        const { encryptedValue: encryptedPrivateKey, iv, tag } = Cryptography.encryptUsingAES(privateKey, secret);

        return new KeyPair(publicKey, encryptedPrivateKey, iv, salt, tag);
    }

    public getAddress(): string {
        // For now address is just public key, probably it should be changed in the future
        return this.publicKey;
    }

    public getDecryptedPrivateKey(password: string): string {
        // const { secret } = Cryptography.generateSecretFromPassword(password, this.salt);
        // return Cryptography.decryptUsingAES(this.encryptedPrivateKey, secret, this.initializationVector, this.tag);

            const { secret } = Cryptography.generateSecretFromPassword(
              password,
              this.salt
            );
            const decryptedKey = Cryptography.decryptUsingAES(
              this.encryptedPrivateKey,
              secret,
              this.initializationVector,
              this.tag
            );
             if (!decryptedKey) {
               throw new Error(
                 "Decryption failed. Ensure all inputs are valid and not null."
               );
             }else {
               // Ensure the key is returned in PEM format
               return (
                 `-----BEGIN PRIVATE KEY-----\n` +
                 decryptedKey.match(/.{1,64}/g)?.join("\n") +
                 `\n-----END PRIVATE KEY-----`
               );
             }
            
           
    }
}
