import { Transaction } from "../transactions/Transaction.js";
import { TransactionHandler } from "../transactions/TransactionHandler.js";
import { TransactionInput } from "../transactions/TransactionInput.js";
import { UnspentOutputTransactions } from "../transactions/UnspentOutputTransactions.js";
import { KeyPair } from "./KeyPair.js";
import { KeyPairsDatabase } from "./KeyPairsDatabase.js";

export class Wallet {
  public tranHandler = new TransactionHandler();

  private keyPairs: KeyPair[] = [];

  constructor(password: string) {
    this.keyPairs = KeyPairsDatabase.load();
    if (this.keyPairs.length === 0) {
      this.generateNewKeyPair(password);
    }
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

  // getBalance(
  //   address: string,
  //   unspentTxOuts: UnspentOutputTransactions[]
  // ): number {
  //   let amount = 0;
  //   unspentTxOuts.forEach((utxo) => {
  //     if (utxo.address === address) {
  //       amount = amount + utxo.amount;
  //     }
  //   });
  //   return amount;
  // }
  getBalance(address:string,
    unspentTxOuts: UnspentOutputTransactions[]
  ): Record<string, number> {
      const balances: Record<string, number> = {};

      unspentTxOuts.forEach((utxo) => {
        // Clip the address to show only the last 4 characters
        const clippedAddress = utxo.address.slice(-4);

        if (!balances[clippedAddress]) {
          balances[clippedAddress] = 0;
        }
        balances[clippedAddress] += utxo.amount;
      });

      return balances;
  }

  createNewTransaction(
    receiverAddress: string,
    amount: number,
    password: string,
    unspentTxOuts: UnspentOutputTransactions[]
  ): Transaction {
    const myAddress: string = this.getFirstAvailableKeyPair()?.getAddress()!;
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
  }
}