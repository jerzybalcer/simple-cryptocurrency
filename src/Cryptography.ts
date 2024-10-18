import * as crypto from "crypto";

export class Cryptography {
    static generateECDSAKeyPair(): {publicKey: string, privateKey: string} {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', 
        {
            namedCurve: 'secp256k1',
            publicKeyEncoding: {
                type: 'spki',
                format: 'der'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'der'
            }
        });

        return { publicKey: publicKey.toString('base64'), privateKey: privateKey.toString('base64')};
    }

    static generateSecretFromPassword(password: string, salt?: string): {secret: string, salt: string} {

        if(!salt) {
            salt = crypto.randomBytes(16).toString('base64');
        }

        const secret = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha512').toString('base64');

        return { secret: secret, salt: salt };
    }

    static encryptUsingAES(valueToEncrypt: string, key: string): {encryptedValue: string, iv: string} {
        const iv = crypto.randomBytes(16);

        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
        let encryptedValue = cipher.update(valueToEncrypt, 'base64', 'base64');
        encryptedValue += cipher.final('base64');

        return { encryptedValue: encryptedValue, iv: iv.toString('base64') };
    }

    static decryptUsingAES(valueToDecrypt: string, key: string, iv: string): string {
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'base64'));
        let decryptedValue = decipher.update(valueToDecrypt, 'base64', 'base64');
        decryptedValue += decipher.final('base64');

        return Buffer.from(decryptedValue, 'base64').toString('base64');
    }

    static hashUsingSHA256(valueToHash: string) {
        return crypto.createHash('sha256').update(valueToHash, 'base64').digest('base64');
    }
}