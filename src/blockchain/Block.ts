import { Cryptography } from "../Cryptography.js";
import { IBlock } from "./IBlock.js";


export class Block implements IBlock {
    index: number;
    hash: string;
    previousHash: string;
    timestamp: number;
    data: string;
    difficulty: number;
    nonce: number;

    constructor(index: number, previousHash: string, timestamp: number, data: string, difficulty: number, nonce: number) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.difficulty = difficulty;
        this.nonce = nonce;
        this.hash = this.calculateHash();
    }

    static calculateHash(index: number, previousHash: string, timestamp: number, data: string, difficulty: number, nonce: number): string {
        console.log(nonce)
        console.log(Cryptography.hashUsingSHA256(index + previousHash + timestamp + data + difficulty + nonce))
        return Cryptography.hashUsingSHA256(index + previousHash + timestamp + data + difficulty + nonce);
    }

    calculateHash(): string {
        return Block.calculateHash(this.index, this.previousHash, this.timestamp, this.data, this.difficulty, this.nonce);
    }

    hasValidStructure(): boolean {
        return typeof this.index === 'number'
            && typeof this.hash === 'string'
            && typeof this.previousHash === 'string'
            && typeof this.timestamp === 'number'
            && typeof this.data === 'string';
    }
}