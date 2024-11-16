import * as fs from "fs";
import { Block } from "./Block.js";

export class BlocksDatabase {
    private static path = './blocks.json';

    static load(): Block[] {
        if(!fs.existsSync(BlocksDatabase.path)){
            return [];
        }

        const data = fs.readFileSync(BlocksDatabase.path, 'utf8');
        const dataParsed = JSON.parse(data) as any[];

        const blocks = dataParsed.map((blockData: any) => {
            const block = new Block(
                blockData.index,
                blockData.previousHash,
                blockData.timestamp,
                blockData.data
            );

            if (!block.hasValidStructure()) {
                throw new Error(`Invalid block structure at index ${blockData.index}`);
            }

            return block;
        });

        return blocks;
    }

    static save(blocks: Block[]) {
        fs.writeFileSync(BlocksDatabase.path, JSON.stringify(blocks));
    }
}