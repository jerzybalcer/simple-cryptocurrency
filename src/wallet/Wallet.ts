import { KeyPair } from "./KeyPair.js";
import { KeyPairsDatabase } from "./KeyPairsDatabase.js";
import { Transaction, TransactionHandler, TransactionInput, UnspentOutputTransactions } from "../blockchain/Transactions.js";

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
    return this.keyPairs[0].publicKey;
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

  public getBalance(
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

  public createNewTransaction (
    receiverAddress: string,
    amount: number,
    password: string,
    unspentTxOuts: UnspentOutputTransactions[]
  ): Transaction {
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
        this.keyPairs[0],
        password,
        unspentTxOuts
      );
      return txIn;
    });

    return tx;
  };
}