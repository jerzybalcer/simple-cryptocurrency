import { KeyPair } from "./KeyPair.js";
import { KeyPairsDatabase } from "./KeyPairsDatabase.js";


export class Wallet {
    private keyPairs: KeyPair[] = [];

    constructor(password: string) {
        this.keyPairs = KeyPairsDatabase.load();

        if(this.keyPairs.length === 0){
            this.generateNewKeyPair(password);
        }
    }

    generateNewKeyPair(password: string) {
        const newKeyPair = KeyPair.generate(password);
        this.keyPairs.push(newKeyPair);
        KeyPairsDatabase.save(this.keyPairs);
    }

    getFirstAvailableKeyPair(): KeyPair | null {
        if(this.keyPairs.length === 0){
            return null;
        }

        return this.keyPairs[0];
    }
}