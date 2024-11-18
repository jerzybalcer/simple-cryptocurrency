import { Cryptography } from "../Cryptography.js";

export class Block {
    index: number;
    hash: string;
    previousHash: string;
    timestamp: number;
    data: string;

    constructor(index: number, previousHash: string, timestamp: number, data: string) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = this.calculateHash();
    }

    calculateHash(): string {
        return Cryptography.hashUsingSHA256(this.index + this.previousHash + this.timestamp + this.data);
    }

   public hasValidStructure(): boolean {
        return typeof this.index === 'number'
            && typeof this.hash === 'string'
            && typeof this.previousHash === 'string'
            && typeof this.timestamp === 'number'
            && typeof this.data === 'string';
    }
}