export interface IBlock {
    index: number;
    hash: string;
    previousHash: string;
    timestamp: number;
    data: string;
    difficulty: number;
    nonce: number;
}