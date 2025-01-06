import { Blockchain } from "./blockchain/Blockchain.js";
import { HttpApi } from "./HttpApi.js";
import { Node } from "./Node.js";
import { Wallet } from "./wallet/Wallet.js";

const NodeDefaultPort = 3000;
let HttpApiPort = 3334;
const args = process.argv.slice();
let wallet =new Wallet(args[5]);
let bc = new Blockchain();
// Get Node Port from args

const nodePort = parseInt(args[2]);

// Create Node
const node = new Node(Number.isNaN(nodePort) ? NodeDefaultPort : nodePort);

if (args.length === 4) {
  // This is the first node
  node.startAsFirstNode();
  HttpApiPort = parseInt(args[3]);
} else if (args.length === 6) {
  // Join an existing network
  const existingNodePort = parseInt(args[3]);
  node.joinNetwork(existingNodePort);
  //wallet = new Wallet(args[5]);
  console.log("///////////////////////////////\n")
 console.log(args);
  console.log("password is: ",args[5]);
  HttpApiPort = parseInt(args[4]);
   console.log("port api is: ", HttpApiPort);
}

HttpApi.initHttpServer(
  HttpApiPort,
 bc,
  node,
  wallet
);
