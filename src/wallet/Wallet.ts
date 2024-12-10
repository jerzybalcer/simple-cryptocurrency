import { KeyPair } from "./KeyPair.js";
import { KeyPairsDatabase } from "./KeyPairsDatabase.js";
import * as ecdsa from "elliptic";
import { Transaction, TransactionHandler, TransactionInput, TransactionOutput, UnspentOutputTransactions } from "../blockchain/Transactions.js";


const ec = new ecdsa.ec("secp256k1");

export class Wallet {
  public tranHandler = new TransactionHandler();

  private keyPairs: KeyPair[] = [];

  constructor(password: string) {
    this.keyPairs = KeyPairsDatabase.load();
    if (this.keyPairs.length === 0) {
      this.generateNewKeyPair(password);
    }
  }
  public getAddress(){
    // For now assume that we only use one pair of keys
    // TODO sprawdź proszę co mozna by zrobić zeby móc się przełączać miedzy kluczami w ramach walleta?
    // Bo to trzeba tez jakoś dodać do obsługi broadcastów zeby wiedziec kiedy wiadomość dociera do wlasciwiego nadawcy
    return this.keyPairs[0].getAddress();
  }
  getPublicKey(): string {
    //either return address or public key, no idea which really :(
    if(true){
      return this.getAddress();
    }else {
       return this.keyPairs[0].getPublicKey();
    }
   // throw new Error("Method not implemented.");
  }

  generateNewKeyPair(password: string) {
    const newKeyPair = KeyPair.generate(password);
    this.keyPairs.push(newKeyPair);
    KeyPairsDatabase.save(this.keyPairs);
  }

  getFirstAvailableKeyPair(): KeyPair | null {
    if (this.keyPairs.length === 0) {
      return null;
    }
    return this.keyPairs[0];
  }

  private getPrivateFromWallet(): string {
    return "privateKey";
    // const buffer = readFileSync(privateKeyLocation, "utf8");
    // return buffer.toString();
  }

  public getPublicFromWallet(): string {
    const privateKey = this.getPrivateFromWallet();
    const key = ec.keyFromPrivate(privateKey, "hex");
    return key.getPublic().encode("hex", false);
  }

  generatePrivateKey(): string {
    // This is already done
    const keyPair = ec.genKeyPair();
    const privateKey = keyPair.getPrivate();
    return privateKey.toString(16);
  }

  // I think this is not needed
  initWallet() {
    // let's not override existing private keys
    //ALREADY DONE
    // if (existsSync(privateKeyLocation)) {
    //   return;
    // }
    // const newPrivateKey = generatePrivateKey();

    // writeFileSync(privateKeyLocation, newPrivateKey);
    console.log("new wallet with private key created");
  }

  getBalance(
    address: string,
    unspentTxOuts: UnspentOutputTransactions[]
  ): number {
    let amount = 0;
    unspentTxOuts.forEach((utxo) => {
      if (utxo.address === address) {
        amount = amount + utxo.amount;
      }
    });
    return amount;
  }

  // Create new transaction
  createTransaction = (
    receiverAddress: string,
    amount: number,
    privateKey: string,
    unspentTxOuts: UnspentOutputTransactions[]
  ): Transaction => {
    const myAddress: string = this.getPublicKey();
    const myUnspentTxOuts = unspentTxOuts.filter(
      (uTxO: UnspentOutputTransactions) => uTxO.address === myAddress
    );

    const { includedUnspentTxOuts, leftOverAmount } =
      this.tranHandler.findTransactionOutputsForAmount(amount, myUnspentTxOuts);

    const unsignedTxIns: TransactionInput[] = includedUnspentTxOuts.map(
      this.tranHandler.createUnsignedTransactionInputs
    );

    const tx: Transaction = new Transaction();
    tx.txIns = unsignedTxIns;
    tx.txOuts = this.tranHandler.createTransactionOutputs(
      receiverAddress,
      myAddress,
      amount,
      leftOverAmount
    );

    tx.id = this.tranHandler.getTransactionId(tx);

    tx.txIns = tx.txIns.map((txIn: TransactionInput, index: number) => {
      txIn.signature = this.tranHandler.signTxIn(
        tx,
        index,
        privateKey,
        unspentTxOuts
      );
      return txIn;
    });

    return tx;
  };
}