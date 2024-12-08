import { Block } from "./Block.js";
import { BlocksDatabase } from "./BlocksDatabase.js";

export class Blockchain {
  private chain: Block[];
  private readonly genesisBlock: Block = new Block(
    0,
    "",
    1731602440343,
    "Genesis Block",
    1,
    0
  );
  private readonly BlockGenerationIntervalMs: number = 10000;
  private readonly DifficultyAdjustmentIntervalBlocks: number = 10;

  constructor() {
    this.chain = BlocksDatabase.load();

    if (this.chain.length === 0) {
      this.chain = [this.genesisBlock];
    }
  }

  getBlocks(): Block[] {
    return this.chain;
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  generateNextBlock(blockData: string): Block {
    const previousBlock: Block = this.getLatestBlock();
    const nextIndex = previousBlock.index + 1;
    const nextTimestamp = new Date().getTime();

    const nonce = this.findNewBlockNonce(nextIndex, previousBlock.hash, nextTimestamp, blockData);

    const newBlock: Block = new Block(
      nextIndex,
      previousBlock.hash,
      nextTimestamp,
      blockData,
      this.getDifficulty(),
      nonce
    );

    this.addBlock(newBlock);

    BlocksDatabase.save(this.chain);

    return newBlock;
  }

  private findNewBlockNonce(nextIndex: number, previousHash: string, nextTimestamp: number, blockData: string): number {
    let nonce = 0;

    while(!this.hashMatchesDifficulty
      (Block.calculateHash(nextIndex, previousHash, nextTimestamp, blockData, this.getDifficulty(), nonce))
    ) 
    {
      nonce++;
    }

    return nonce;
  }

  private getDifficulty(): number {
    const latestBlock: Block = this.chain[this.chain.length - 1];

    if (latestBlock.index % this.DifficultyAdjustmentIntervalBlocks === 0 && latestBlock.index !== 0) {

      const lastAdjustedBlock: Block = this.chain[this.chain.length - this.DifficultyAdjustmentIntervalBlocks];
      const timeExpected: number = this.BlockGenerationIntervalMs * this.DifficultyAdjustmentIntervalBlocks;
      const timeTaken: number = latestBlock.timestamp - lastAdjustedBlock.timestamp;

      if (timeTaken < timeExpected / 2) {
        return lastAdjustedBlock.difficulty + 1;
      } 
      else if (timeTaken > timeExpected * 2) {
        return lastAdjustedBlock.difficulty - 1;
      } 
      else {
        return lastAdjustedBlock.difficulty;
      }
    } 
    else {
      return latestBlock.difficulty;
    }
  }

  private hashMatchesDifficulty(hash: string): boolean {
    const hashString: string = atob(hash);

    const hashCharsCodesBinary = new Array(hashString.length);

    for (let i = 0; i < hashCharsCodesBinary.length; i++) {
        const characterCode = hashString.charCodeAt(i);
        hashCharsCodesBinary[i] = characterCode.toString(2);
    }

    const hashBinary = hashCharsCodesBinary.join('');

    const requiredPrefix: string = '0'.repeat(this.getDifficulty());
    return hashBinary.startsWith(requiredPrefix);
  }

  private isNewBlockValid(newBlock: Block, previousBlock: Block): boolean {
    if (!this.hasValidStructure(newBlock)) {
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

    if(previousBlock.timestamp - 60*1000 > newBlock.timestamp
        && newBlock.timestamp - 60*1000 > new Date().getTime()) {
      return false;
    }

    return true;
  }

  public addBlock(newBlock: Block): void {
    const latestBlock = this.getLatestBlock();

    if (!this.isNewBlockValid(newBlock, latestBlock)) {
      throw Error("New block is invalid");
    }

    this.chain.push(newBlock);
  }

  private isOtherChainMatching = (otherChain: Block[]): boolean => {
    if (JSON.stringify(this.genesisBlock) !== JSON.stringify(otherChain[0])) {
      return false;
    }

    for (let i = 1; i < otherChain.length; i++) {
      if (!this.isNewBlockValid(otherChain[i], otherChain[i - 1])) {
        return false;
      }
    }

    return true;
  };

  replaceChain = (newChain: Block[]): Block[] => {
    if (!this.isOtherChainMatching(newChain)) {
      throw Error("New chain is invalid");
    }

    if (newChain.length <= this.chain.length) {
      throw Error("New chain should is not longer");
    }

    this.chain = newChain;

    return this.chain;
  };

  public hasValidStructure(block: Block): boolean {
    return block.hasValidStructure();
  }
}
