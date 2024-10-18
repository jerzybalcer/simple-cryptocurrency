import * as fs from "fs";
import { KeyPair } from "./wallet/KeyPair.js";

export class KeyPairsDatabase {
    private static path = './keys.json';

    static load(): KeyPair[] {
        if(!fs.existsSync(KeyPairsDatabase.path)){
            return [];
        }

        const parsedKeyPairs = JSON.parse(fs.readFileSync(KeyPairsDatabase.path, 'utf-8')) as KeyPair[];

        // Instantiate KeyPair objects for class methods to be available
        return parsedKeyPairs.map((keyPair) => 
            new KeyPair(keyPair.publicKey, keyPair.encryptedPrivateKey, keyPair.initializationVector, keyPair.salt)
        );
    }

    static save(keyPairs: KeyPair[]) {
        fs.writeFileSync(KeyPairsDatabase.path, JSON.stringify(keyPairs));
    }
}