import { Block } from "./Block.js";
import { BlocksDatabase } from "./BlocksDatabase.js";

export class Blockchain {
  private chain: Block[];

  private genesisBlock: Block = new Block(
    0,
    "",
    1731602440343,
    "Genesis Block"
  );

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
    const newBlock: Block = new Block(
      previousBlock.index + 1,
      previousBlock.hash,
      new Date().getTime(),
      blockData
    );

    this.addBlock(newBlock);

    BlocksDatabase.save(this.chain);

    return newBlock;
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

    // TODO: broadcast new chain to other nodes
    return this.chain;
  };

  public hasValidStructure(block: Block): boolean {
    console.log(block instanceof Block); // Powinno zwrócić `true`
    console.log(typeof block.hasValidStructure); // Powinno zwrócić `function`
    return block.hasValidStructure();
  }
}
