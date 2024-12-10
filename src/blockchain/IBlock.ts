import { Transaction } from "./Transactions";

export interface IBlock {
    index: number;
    hash: string;
    previousHash: string;
    timestamp: number;
    data: Transaction[];
    difficulty: number;
    nonce: number;
}