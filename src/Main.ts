import { Blockchain } from "./blockchain/Blockchain.js";
import { HttpApi } from "./HttpApi.js";
import { Node } from "./Node.js";

const NodeDefaultPort = 3000;
let HttpApiPort = 3333;

// Get Node Port from args
const args = process.argv.slice();
const nodePort = parseInt(args[2]);

// Create Node
const node = new Node(Number.isNaN(nodePort) ? NodeDefaultPort : nodePort);

if (args.length === 4) {
  // This is the first node
  node.startAsFirstNode();
  HttpApiPort = parseInt(args[3]);

} else if (args.length === 5) {
  // Join an existing network
  const existingNodePort = parseInt(args[3]);
  node.joinNetwork(existingNodePort);
  HttpApiPort = parseInt(args[4])
}

HttpApi.initHttpServer(HttpApiPort, new Blockchain(), node);