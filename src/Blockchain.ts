import { Block } from "./Block";

export class Blockchain {
    chain: Block[];

    genesisBlock: Block = new Block(0, '', 1731602440343, 'Genesis Block');

    constructor() {
        this.chain = [this.genesisBlock];
    }

    getBlocks(): Block[] {
        return this.chain;
    }

    getLatestBlock(): Block {
        return this.chain[this.chain.length - 1];
    }

    generateNextBlock = (blockData: string) => {
        const previousBlock: Block = this.getLatestBlock();
        const newBlock: Block = new Block(previousBlock.index + 1, previousBlock.hash, new Date().getTime(), blockData);

        this.addBlock(newBlock);

        // TODO: broadcast new block to other nodes
    
        return newBlock;
    };

    isNewBlockValid = (newBlock: Block, previousBlock: Block) => {
        if(!newBlock.hasValidStructure()) {
            return false;
        }

        if (previousBlock.index + 1 !== newBlock.index) {
            return false;
        }
        
        if (previousBlock.hash !== newBlock.previousHash) {
            return false;
        }
        
        if (newBlock.calculateHash() !== newBlock.hash) {
            return false;
        }

        return true;
    };

    addBlock(newBlock: Block) {
        const latestBlock = this.getLatestBlock();

        if (!this.isNewBlockValid(newBlock, latestBlock)) {
            throw Error('New block is invalid');
        }

        this.chain.push(newBlock);
    }

    isOtherChainMatching = (otherChain: Block[]): boolean => {
        if(JSON.stringify(this.genesisBlock) !== JSON.stringify(otherChain[0])){
            return false;
        }

        for (let i = 1; i < otherChain.length; i++) {
            if (!this.isNewBlockValid(otherChain[i], otherChain[i - 1])) {
                return false;
            }
        }

        return true;
    }

    replaceChain = (newChain: Block[]) => {
        if (!this.isOtherChainMatching(newChain)) {
            throw Error("New chain is invalid");
        }

        if(newChain.length <= this.chain.length) {
            throw Error("New chain should is not longer");
        }

        this.chain = newChain;

        // TODO: broadcast new chain to other nodes
    };
}