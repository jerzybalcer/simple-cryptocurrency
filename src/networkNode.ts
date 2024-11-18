import { Node } from "./Node.js";

// Create node network

const NodeDefaultPort = 3000;
// Get Node Port from args
const args = process.argv.slice();
const nodePort = parseInt(args[0]);

// Create Node
const node = new Node(Number.isNaN(nodePort) ? NodeDefaultPort : nodePort);

if (args.length === 1) {
  // This is the first node
  node.startAsFirstNode();
} else if (args.length === 2) {
  const existingNodePort = parseInt(args[1]);
  node.joinNetwork(existingNodePort);
}
