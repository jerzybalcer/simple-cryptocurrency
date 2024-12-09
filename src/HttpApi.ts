import express, { Request, Response } from "express";
import { Blockchain } from "./blockchain/Blockchain.js";
import { Block } from "./blockchain/Block.js";
import { Node } from "./Node.js";

export class HttpApi {
  static initHttpServer = (
    port: number,
    blockchain: Blockchain,
    node: Node
  ) => {
    const app = express();

    app.use(express.json());

    node.passBlockchain(blockchain);

    app.get("/blocks", (_: Request, response: Response) => {
      response.send(blockchain.getBlocks());
    });

    app.get("/requestBlockchain", (_: Request, response: Response) => {
        node.requestBlockchain();
        response.send(blockchain.getBlocks());
    });

    app.post("/mineBlock", (request: Request, response: Response) => {
      if (!request.body.data) {
        response.status(400).send("Invalid block data");
        return;
      }

      const newBlock: Block = blockchain.generateNextBlock(request.body.data);

      node.broadcastBlock(newBlock);

      response.status(200).send(newBlock);
    });

    app.get("/peers", (_: Request, response: Response) => {
      // Return known ports
      const portsArray = Array.from(node.getKnownPorts());

      response.status(200).send(JSON.stringify(portsArray));
    });

    app.post("/addPeer", (_: Request, response: Response) => {
      // TODO: add peer - currently joining the network happens when calling Main.js
      // node.addPeer();

      response.status(200).send();
    });

    app.listen(port, () => {
      console.log("HTTP API listening on port:", port);
    });
  };
}
