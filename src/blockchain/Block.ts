import { Cryptography } from "../Cryptography.js";
import { IBlock } from "./IBlock.js";
import { Transaction } from "./Transactions.js";

export class Block implements IBlock {
    index: number;
    hash: string;
    previousHash: string;
    timestamp: number;
    data: Transaction[];
    difficulty: number;
    nonce: number;

    constructor(index: number, previousHash: string, timestamp: number, data: Transaction[], difficulty: number, nonce: number, hash:string = "") {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.difficulty = difficulty;
        this.nonce = nonce;
        if(hash === ""){
               this.hash = this.calculateHash();
        }else{
            this.hash = hash;
        }
     
    }

    static calculateHash(index: number, previousHash: string, timestamp: number, data: Transaction[], difficulty: number, nonce: number): string {
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
            && typeof this.data === 'object';
    }
}