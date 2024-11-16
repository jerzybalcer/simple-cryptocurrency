import express, { Request, Response } from 'express';
import { Blockchain } from './blockchain/Blockchain.js';
import { Block } from './blockchain/Block.js';
import { Node } from './Node.js';

export class HttpApi {
    static initHttpServer = (port: number, blockchain: Blockchain, node: Node) => {
        const app = express();
        app.use(express.json());

        app.get('/blocks', (_: Request, response: Response) => {
            response.send(blockchain.getBlocks());
        });

        app.post('/mineBlock', (request: Request, response: Response) => {
            if(!request.body.data){
                response.status(400).send('Invalid block data');
                return;
            }

            const newBlock: Block = blockchain.generateNextBlock(request.body.data);

            // TODO: broadcast new block to other nodes
            // node.broadcast(newBlock);

            response.status(200).send(newBlock);
        });

        app.get('/peers', (_: Request, response: Response) => {
            // TODO: return peers
            // node.getPeers();

            response.status(200).send([]);
        });

        app.post('/addPeer', (_: Request, response: Response) => {
            // TODO: add peer
            // node.addPeer();
            
            response.status(200).send();
        });

        app.listen(port, () => {
            console.log('HTTP API listening on port:', port);
        });
    };
}