import { Node } from "./Node.js";

// Create node network

const NodeDefaultPort = 3000;
// Get Node Port from args
const args = process.argv.slice();
const nodePort = parseInt(args[2]);
// Create Node
const node = new Node(Number.isNaN(nodePort) ? NodeDefaultPort : nodePort);

if (args.length === 3) {
  // This is the first node
  node.startAsFirstNode();
} else if (args.length === 4) {
  const existingNodePort = parseInt(args[3]);
  node.joinNetwork(existingNodePort);
}
