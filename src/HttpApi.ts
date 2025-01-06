import express, { Request, Response } from "express";
import { Blockchain } from "./blockchain/Blockchain.js";
import { Block } from "./blockchain/Block.js";
import { Node } from "./Node.js";
import { Wallet } from "./wallet/Wallet.js";
import { UnspentOutputTransactions } from "./transactions/UnspentOutputTransactions.js";

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
    
    node.passBlockchain(blockchain);
    node.linkedWallet = wallet;

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
      // For now only first keypair is used
      let adr = wallet.getFirstAvailableKeyPair()?.getAddress()!;
      let utxo = wallet.tranHandler.createUTXOList(blockchain.getBlocks());

      const balance = wallet.getBalance(adr, utxo);
      res.send({balances: balance});
    });

    app.post("/makeTransaction", (request: Request, response: Response) => {
      //Make transaction to address specified in request - no cheats allowed.
      utxoList = wallet.tranHandler.createUTXOList(blockchain.getBlocks());
      let tr = wallet.createNewTransaction(
        request.body.receiverAddress,
        request.body.amount,
        request.body.password,
        utxoList
      );
      node.broadcastTransaction(tr);
      response.sendStatus(200);
    });

    app.get("/requestBlockchain", (_: Request, response: Response) => {
      node.requestBlockchain();
      response.send(blockchain.getBlocks());
    });

    app.get("/peers", (_: Request, response: Response) => {
      const knownPortsArray = Array.from(node.getKnownPorts());

      response.status(200).send(JSON.stringify(knownPortsArray));
    });

    app.get("/address", (_: Request, response: Response) => {
      response.status(200).send(wallet.getFirstAvailableKeyPair()?.getAddress());
    });

    app.listen(port, () => {
      console.log("HTTP API listening on port:", port);
    });
  };
}
