import WebSocket, { WebSocketServer } from "ws";
import { Blockchain } from "./blockchain/Blockchain.js";
import { Block } from "./blockchain/Block.js";
import { IBlock } from "./blockchain/IBlock.js";

interface Message {
  mode: string; // type of message, used to determine which action should be taken in handleMessage method
  type: string; // start, success, error  - defines the stage at which message is
  port: number; // node port which sent message
  data: any; // data inside message, can be anything, but mostly object
}

interface AdvancedMessage {
  originalSender: number; // Orignal sender port number, to avoid message circulating through the network
  innerData: any; // data sent
  dataHash: string; // encrypted hash of innerData, to be decrypted and checked using provided key
  decryptionKey: string; // not used yet
  encrypted: boolean; // determines if message is encrypted or not
}

interface SocketPortPair {
  port: number;
  socket: WebSocket;
}

export class Node {
  private port: number;

  private server: WebSocketServer | null = null;

  private peers: SocketPortPair[] = []; // list of connected sockets
  private knownPorts: Set<number> = new Set<number>(); // list of known socket ports that current node knows

  private isFirstNode: boolean = false;

  private hasBlockChain = false;
  private blockChain: Blockchain = new Blockchain();

  constructor(port: number) {
    this.port = port;
    this.server = new WebSocketServer({ port: this.port });
    let that = this;

    this.server.on("connection", (socket: WebSocket) => {
      console.log("A new node has connected.");

      // move handling the data to separate method
      socket.on("message", (data: string) => {
        let message: Message = JSON.parse(data) as Message;
        that.handleMessage(message, socket);
      });
    });
  }

  startAsFirstNode() {
    // Currently not used
  }

  public getKnownPorts() {
    return this.knownPorts;
  }

  // pass blockchain to the node from https API - used for initialization of node only
  passBlockchain(blockChain: Blockchain) {
    this.blockChain = blockChain;
    this.hasBlockChain = true;
  }

  broadcastBlock(block: Block) {
    let innerMes: AdvancedMessage = {
      originalSender: this.port,
      innerData: JSON.stringify(block),
      dataHash: "test",
      decryptionKey: "test",
      encrypted: false,
    };
    let preMessage = {
      type: "start",
      mode: "broadcastBlock",
      port: this.port,
      data: innerMes,
    };
    let message = JSON.stringify(preMessage);
    this.peers.forEach((peer) => {
      console.log("Sending broadcast about new block");
      peer.socket.send(message);
    });
  }

  // Join an existing network by connecting to another node
  joinNetwork(existingNodePort: number) {
    let that = this;
    const socket = new WebSocket(`ws://localhost:${existingNodePort}`);

    socket.on("open", () => {
      let initialMessage: Message = {
        mode: "initialPortConnection",
        type: "start",
        port: this.port,
        data: "",
      };
      let data = JSON.stringify(initialMessage);
      socket.send(data);
    });

    // Lost connection to the server
    socket.on("close", () => {
      that.reconnect(existingNodePort);
    });

    socket.on("message", (data: string) => {
      let message: Message = JSON.parse(data) as Message;
      that.handleMessage(message, socket);
    });

    // Add socket to which we connected as socket-port pair to the register
    let pair: SocketPortPair = {
      socket: socket,
      port: existingNodePort,
    };
    this.peers.push(pair);
    this.knownPorts.add(existingNodePort);
  }
  broadcastBlockchain() {
    let message: Message = {
      type: "start",
      mode: "broadcastBlockchain",
      port: this.port,
      data: this.blockChain.getBlocks(),
    };
    this.peers.forEach((peer) => {
      console.log("Sending broadcast about blockchain");
      peer.socket.send(JSON.stringify(message));
    });
  }
  public requestBlockchain() {
    let message: Message = {
      type: "start",
      mode: "requestBlockchain",
      port: this.port,
      data: "",
    };
    this.peers.forEach((peer) => {
      console.log("Requesting blockchain");
      peer.socket.send(JSON.stringify(message));
    });
  }
  // Method for handling communication between nodes
  // sourceSocket is the socket from which message comes - used if there is need to communicate back
  handleMessage(data: Message, sourceSocket: WebSocket) {
    if (data.type === "start") {
      switch (data.mode) {
        case "initialPortConnection":
          console.log("Initial Port Connection - new node joined this node \n");
          data.type = "success";
          data.data = this.knownPorts;
          let response = JSON.stringify(data);
          sourceSocket.send(response);

          this.knownPorts.add(data.port);
          let pair: SocketPortPair = { port: data.port, socket: sourceSocket };
          this.peers.push(pair);
          let preMessage = {
            type: "start",
            mode: "broadcastNewNode",
            port: this.port,
            data: [...this.knownPorts],
          };
          let message = JSON.stringify(preMessage);
          this.peers.forEach((peer) => {
            if (peer.socket !== sourceSocket) {
              console.log("Sending broadcast about new node");
              peer.socket.send(message);
            }
          });

          break;

        case "requestBlockchain":
          // After request for blockchain is made, pass this information further and broadcast your own chain (if existing)
          console.log("Broadcast: request Blockchain \n");
          this.peers.forEach((peer) => {
            if (peer.socket !== sourceSocket) {
              peer.socket.send(JSON.stringify(data));
            }
          });
          console.log("Does have blockchain?: ");
          console.log(this.hasBlockChain);
          if (this.hasBlockChain) {
            console.log("begin broadcast of blockchain");
            this.broadcastBlockchain();
          }
          break;

        case "broadcastBlockchain":
          // broadcast current node blockchain (if exists)
          let chain = data.data;
          console.log("Receiving blockchain");
          console.log("Current chain length:");
          console.log(this.blockChain.getBlocks().length);
          console.log("Incoming chain length:");
          console.log(chain.length);
          if (this.hasBlockChain) {
            let tempChain: Block[] = [];
            chain.forEach((block: IBlock) => {
              let b = new Block(
                block.index,
                block.previousHash,
                block.timestamp,
                block.data,
                block.difficulty,
                block.nonce
              );
              tempChain.push(b);
            });
            if (tempChain.length > this.blockChain.getBlocks().length) {
              this.blockChain.replaceChain(tempChain);
              if (data.port !== this.port) {
                this.broadcastBlockchain();
              }
            }
          } else {
            this.peers.forEach((peer) => {
              if (peer.socket !== sourceSocket) {
                console.log("Passing along the broadcast about blockchain");
                peer.socket.send(JSON.stringify(data));
              }
            });
          }
          break;

        case "broadcastNewNode":
          console.log("Broadcast: new node joined network \n");
          let newSet = new Set<number>([
            ...(data.data as Set<number>),
            ...this.knownPorts,
          ]);
          this.knownPorts = newSet;
          let messageCopy = JSON.stringify(data);
          console.log(this.knownPorts);
          this.peers.forEach((peer) => {
            if (peer.socket !== sourceSocket) {
              peer.socket.send(messageCopy);
            }
          });
          break;
        case "broadcastBlock":
          console.log("Node broadcast");
          let messageInnerData = data.data as AdvancedMessage;
          if (this.hasBlockChain) {
            console.log("New block acquired");
            const rawBlock = JSON.parse(
              messageInnerData.innerData
            ) as IBlock;
            const newBlock = new Block(
              rawBlock.index,
              rawBlock.previousHash,
              rawBlock.timestamp,
              rawBlock.data,
              rawBlock.difficulty,
              rawBlock.nonce
            );
            this.blockChain.addBlock(newBlock);
          }
          let broadcastBLockMessage = JSON.stringify(data);
          if (data.data.port !== this.port) {
            this.peers.forEach((peer) => {
              if (peer.socket !== sourceSocket) {
                peer.socket.send(broadcastBLockMessage);
              }
            });
          }
      }
    } else if (data.type === "success") {
      switch (data.mode) {
        case "initialPortConnection":
          // For now do nothing
          console.log("Response from parent node");
          break;
      }
    }
  }

  reconnect(portLost: number) {
    let mes: Message = {
      type: "broadcastDeleteNode",
      mode: "start",
      port: this.port,
      data: portLost,
    };
    let message = JSON.stringify(mes);
    this.peers.forEach((peer) => {
      peer.socket.send(message);
    });

    this.knownPorts.delete(portLost);
    const newList: SocketPortPair[] = this.peers.filter(
      (item) => item.port !== portLost
    );
    console.log("Alert, connection to port lost!");
    // A mechanism is needed to somehow reestablish connection with the rest of the network
  }
}
