import { Wallet } from "./wallet/Wallet.js";

const password = 'hasło'

const wallet = new Wallet(password);

wallet.generateNewKeyPair(password);