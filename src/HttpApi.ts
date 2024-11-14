import express, { Request, Response } from 'express';
import { Blockchain } from './Blockchain';
import { Block } from './Block';

export class HttpApi {
    static initHttpServer = (port: number, blockchain: Blockchain) => {
        const app = express();
        app.use(express.json());

        app.get('/blocks', (_: Request, response: Response) => {
            response.send(blockchain.getBlocks());
        });

        app.post('/mineBlock', (request: Request, response: Response) => {
            const newBlock: Block = blockchain.generateNextBlock(request.body.data);
            response.status(200).send(newBlock);
        });

        app.get('/peers', (_: Request, response: Response) => {
            // TODO: return peers
            response.status(200).send([]);
        });

        app.post('/addPeer', (_: Request, response: Response) => {
            // TODO: add peer
            response.status(200).send();
        });

        app.listen(port, () => {
            console.log('HTTP API listening on port:', port);
        });
    };
}