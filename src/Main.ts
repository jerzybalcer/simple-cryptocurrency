import { Blockchain } from "./blockchain/Blockchain.js";
import { HttpApi } from "./HttpApi.js";
import { Node } from "./Node.js";

const NodeDefaultPort = 3000;
const HttpApiPort = 3333;

// Get Node Port from args
const args = process.argv.slice(2);
const nodePort = parseInt(args[0]);

// Create Node
const node = new Node(Number.isNaN(nodePort) ? NodeDefaultPort : nodePort);

if (args.length === 1) {
  // This is the first node
  node.startAsFirstNode();
} else if (args.length === 2) {
  // Join an existing network
  const existingNodePort = parseInt(args[1]);
  node.joinNetwork(existingNodePort);
}


HttpApi.initHttpServer(HttpApiPort, new Blockchain(), node);