import express, { Request, Response } from "express";
import { Blockchain } from "./blockchain/Blockchain.js";
import { Block } from "./blockchain/Block.js";
import { Node } from "./Node.js";
import { Wallet } from "./wallet/Wallet.js";
import { UnspentOutputTransactions } from "./blockchain/Transactions.js";

export class HttpApi {
  static initHttpServer = (
    port: number,
    blockchain: Blockchain,
    node: Node,
    wallet: Wallet
  ) => {
    const app = express();
    app.use(express.json());

    let utxoList: UnspentOutputTransactions[] = [];
    utxoList = wallet.tranHandler.createUTXOList(blockchain.getBlocks());
    
    console.log(blockchain.getBlocks());
    node.passBlockchain(blockchain);
    node.linkedWallet = wallet;

    app.get("/blocks", (_: Request, response: Response) => {
      response.send(blockchain.getBlocks());
    });

    app.get("/utxoList", (_: Request, res: Response) => {
      utxoList = wallet.tranHandler.createUTXOList(blockchain.getBlocks());
      res.send(utxoList);
    });

    app.get("/enableMining", (_: Request, res: Response) => {
      // Set three second period for checking waitning list
      node.enableMining(3000);
      res.send();
    });
    
    app.get("/getBalance", (_: Request, res: Response) => {
      let adr = wallet.getAddress();
      let utxo = wallet.tranHandler.createUTXOList(blockchain.getBlocks());
      console.log(wallet.getBalance(adr, utxo));
      res.send();
    });

    app.post("/makeTransaction", (request: Request, response: Response) => {
      //Make transaction to address specified in request - no cheats allowed.

      let tr = wallet.createNewTransaction(
        request.body.receiverAddress,
        request.body.amount,
        request.body.password,
        utxoList
      );
      node.broadcastTransaction(tr);
      response.send(200);
    });

    app.get("/getAddress", (_: Request, response: Response) => {
      // Get node address - this is a bit clunky but easier to implement this way
      response.status(200).send(wallet.getAddress());
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
