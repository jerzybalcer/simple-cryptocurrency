import { Socket } from "dgram";
import WebSocket, { WebSocketServer } from "ws";

interface Message {
  mode: string; // type of message, used to determine which action should be taken in handleMessage method
  type: string; // start, success, error  - defines the stage at which message is
  port: number; // node port which sent message
  data: any; // data inside message, can be anything, but mostly object
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

  // Method for handling communication between nodes
  // sourceSocket is the socket from which message comes - used if there is need to communicate back
  handleMessage(data: Message, sourceSocket: WebSocket = null) {
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

const args = process.argv.slice(2);
const port = parseInt(args[0]); // Port for this node

const node = new Node(port);

if (args.length === 1) {
  // This is the first node
  node.startAsFirstNode();
} else if (args.length === 2) {
  // Join an existing network
  const existingNodePort = parseInt(args[1]);
  node.joinNetwork(existingNodePort);
}
