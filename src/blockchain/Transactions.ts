import { Cryptography } from "../Cryptography.js";
import { Block } from "./Block";
import { KeyPair } from "../wallet/KeyPair";

const COINBASE_AMOUNT = 10;

export class UnspentOutputTransactions {
  // Class for unspent outputs, that are used to calculated how much coin each private key owns

  public readonly txOutId: string; // ID of transaction this output comes from
  public readonly txOutIndex: number; // index of specific output in transaction outputTransaction List
  public readonly address: string; //Recipient of output, ie owner of certain amount of money
  public readonly amount: number;

  constructor(
    txOutId: string,
    txOutIndex: number,
    address: string,
    amount: number
  ) {
    this.txOutId = txOutId;
    this.txOutIndex = txOutIndex;
    this.address = address;
    this.amount = amount;
  }
}
export class TransactionOutput {
  public address: string; // public key of recipient
  public amount: number;

  constructor(address: string, amount: number) {
    this.address = address;
    this.amount = amount;
  }
}
export class TransactionInput {
  public txOutId: string; // ID of unspent transaction output this input is referencing
  public txOutIndex: number; // index of output in transaction outputs it is referencing
  public signature: string; // proof of ownership
  constructor() {
    this.txOutId = "";
    (this.txOutIndex = 0), (this.signature = "");
  }
}
export class Transaction {
  public id: string;
  public txIns: TransactionInput[];
  public txOuts: TransactionOutput[];
  constructor() {
    this.id = "";
    this.txIns = [];
    this.txOuts = [];
  }
}

export class TransactionHandler {
  // Handles all operations related to transactions

  // Create UTXO list - should be done every time a blockchain is updated



  public createUTXOList(blockchain: Block[]): UnspentOutputTransactions[] {
    let utxoList: UnspentOutputTransactions[] = [];
    const findIndex = (
      utxo: UnspentOutputTransactions,
      txIn: TransactionInput
    ): boolean =>
      utxo.txOutId === txIn.txOutId && utxo.txOutIndex === txIn.txOutIndex;

    blockchain.forEach((block) => {
      block.data.forEach((tx) => {
        // Add all transaction outputs as potential UTXOs
        tx.txOuts.forEach((txOut, index) => {
          const newUTXO: UnspentOutputTransactions = {
            txOutId: tx.id,
            txOutIndex: index,
            address: txOut.address,
            amount: txOut.amount,
          };
          utxoList.push(newUTXO);
        });

        // Remove outputs that are referenced as inputs (spent)
        tx.txIns.forEach((txIn) => {
          const spentIndex = utxoList.findIndex((utxo) =>
            findIndex(utxo, txIn)
          );
          if (spentIndex >= 0) {
            utxoList.splice(spentIndex, 1); // Remove spent UTXO
          }
        });
      });
    });
    return utxoList;
  }

  // Create unsigned inputs for transaction
  public createUnsignedTransactionInputs(
    unspentTxOut: UnspentOutputTransactions
  ) {
    const txIn: TransactionInput = new TransactionInput();
    txIn.txOutId = unspentTxOut.txOutId;
    txIn.txOutIndex = unspentTxOut.txOutIndex;
    return txIn;
  }

  //Create transaction outputs

  public createTransactionOutputs(
    receiverAddress: string,
    myAddress: string,
    amount: number,
    leftOverAmount: number
  ) {
    const txOut1: TransactionOutput = new TransactionOutput(
      receiverAddress,
      amount
    );
    if (leftOverAmount === 0) {
      return [txOut1];
    } else {
      const leftOverTx = new TransactionOutput(myAddress, leftOverAmount);
      return [txOut1, leftOverTx];
    }
  }

  // Finds UTXOs for current transaction

  findTransactionOutputsForAmount(
    amount: number,
    myUnspentTxOuts: UnspentOutputTransactions[]
  ) {
    let currentAmount = 0;
    const includedUnspentTxOuts = [];
    console.log(myUnspentTxOuts);
    console.log(myUnspentTxOuts);
    for (const myUnspentTxOut of myUnspentTxOuts) {
      includedUnspentTxOuts.push(myUnspentTxOut);
      currentAmount = currentAmount + myUnspentTxOut.amount;
      if (currentAmount >= amount) {
        const leftOverAmount = currentAmount - amount;
        return { includedUnspentTxOuts, leftOverAmount };
      }
    }
    throw Error("not enough coins to send transaction");
  }
  // based on all input transaction and output transactions, create ID of transaction as a
  // hash of concatanation of all transactions data
  public getTransactionId(transaction: Transaction): string {
    const txInContent: string = transaction.txIns
      .map((txIn: TransactionInput) => txIn.txOutId + txIn.txOutIndex)
      .reduce((a, b) => a + b, "");

    const txOutContent: string = transaction.txOuts
      .map((txOut: TransactionOutput) => txOut.address + txOut.amount)
      .reduce((a, b) => a + b, "");

    return Cryptography.hashUsingSHA256(txInContent + txOutContent).toString();
  }

  // Validate coinbase and normal transaction in block, looking for double spending,
  // and host of other ( uses ValidateTransaction)
  public validateBlockTransactions(
    aTransactions: Transaction[],
    aUnspentTxOuts: UnspentOutputTransactions[],
    blockIndex: number
  ): boolean {
    const coinbaseTx = aTransactions[0];
    // This is reward transaction for mining the block
    if (!this.validateCoinbaseTransaction(coinbaseTx, blockIndex)) {
      console.log(
        "invalid coinbase transaction: " + JSON.stringify(coinbaseTx)
      );
      return false;
    }

    // Check for duplicate Inputs

    let array: TransactionInput[] = [];
    aTransactions.forEach((trans) => {
      array = array.concat(trans.txIns);
    });

    if (this.hasDuplicates(array)) {
      return false;
    }

    const normalTransactions: Transaction[] = aTransactions.slice(1);
    return normalTransactions
      .map((tx) => this.validateTransaction(tx, aUnspentTxOuts))
      .reduce((a, b) => a && b, true);
  }

  //Validate transaction, checking ID, inputs and amount.
  // references ValidateInputs
  public validateTransaction(
    transaction: Transaction,
    aUnspentTxOuts: UnspentOutputTransactions[]
  ): boolean {
    // Validate certain aspect of transaction

    // Check if ID is matching .ie if no one changed anything
    if (this.getTransactionId(transaction) !== transaction.id) {
      console.log("invalid transaction id: " + transaction.id);
      return false;
    }

    // Validate Inputs
    const hasValidTxIns: boolean = transaction.txIns
      .map((txIn) => this.validateInputs(txIn, transaction, aUnspentTxOuts))
      .reduce((a, b) => a && b, true);

    if (!hasValidTxIns) {
      console.log("some Inputs are invalid in transaction: " + transaction.id);
      return false;
    }

    // Check if amounts on both input and output are equal
    const totalTxInValues: number = transaction.txIns
      .map((txIn) => this.getInputAmount(txIn, aUnspentTxOuts))
      .reduce((a, b) => a + b, 0);

    const totalTxOutValues: number = transaction.txOuts
      .map((txOut) => txOut.amount)
      .reduce((a, b) => a + b, 0);

    if (totalTxOutValues !== totalTxInValues) {
      console.log(
        "OutputValue !== InputValue in transation: " + transaction.id
      );
      return false;
    }

    return true;
  }
  // Validate Inputs, checking for valid UXTO, and ownership of UXTO
  public validateInputs(
    txIn: TransactionInput,
    transaction: Transaction,
    unspentTransactionList: UnspentOutputTransactions[]
  ): boolean {
    //Validate input to check if it is coming from valid UTXO
    const referencedUTxOut: UnspentOutputTransactions | undefined =
      unspentTransactionList.find(
        (uTxO) =>
          uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex
      );

    if (referencedUTxOut == undefined) {
      console.log(
        "referenced unspent transaction ouput  not found: " +
          JSON.stringify(txIn)
      );
      return false;
    }
    const address = referencedUTxOut.address;
    // Check if decoded txIn.signature equals transaction.id
    return Cryptography.verifyUsingECDSA(
      transaction.id,
      txIn.signature,
      address
    );
  }
  // Finds amount needed for transaction,
  // references findUsnpentOutputs
  public getInputAmount(
    txIn: TransactionInput,
    aUnspentTxOuts: UnspentOutputTransactions[]
  ): number {
    return this.findUnspentOutput(txIn.txOutId, txIn.txOutIndex, aUnspentTxOuts)
      .amount;
  }
  // Finds UTXOs, based on transactionId
  public findUnspentOutput(
    transactionId: string,
    index: number,
    aUnspentTxOuts: UnspentOutputTransactions[]
  ): UnspentOutputTransactions {
    return aUnspentTxOuts.find(
      (uTxO) => uTxO.txOutId === transactionId && uTxO.txOutIndex === index
    )!;
  }

  // Check array for duplicate inputs
  public hasDuplicates(txIns: TransactionInput[]): boolean {
    let tempArray: { id: string }[] = [];
    txIns.forEach((input) => {
      tempArray.push({
        id: input.txOutId,
      });
    });

    const hasDuplicates =
      new Set(tempArray.map((a) => JSON.stringify(a))).size !== txIns.length;
    return hasDuplicates;
  }

  // Checks the reward transaction one gets for minig the block
  public validateCoinbaseTransaction(
    transaction: Transaction,
    blockIndex: number
  ): boolean {
    if (transaction == null) {
      console.log("First transaction must be coinbase");
      return false;
    }
    if (this.getTransactionId(transaction) !== transaction.id) {
      console.log("invalid coinbase transaction id: " + transaction.id);
      return false;
    }
    if (transaction.txIns.length !== 1) {
      console.log("one txIn must be specified in the coinbase transaction");
      return false;
    }
    if (transaction.txIns[0].txOutIndex !== blockIndex) {
      console.log("the txIn signature in coinbase tx must be the block height");
      return false;
    }
    if (transaction.txOuts.length !== 1) {
      console.log("invalid number of outputs in coinbase transaction");
      return false;
    }
    if (transaction.txOuts[0].amount != COINBASE_AMOUNT) {
      console.log("invalid coinbase amount in coinbase transaction");
      return false;
    }
    return true;
  }

  //Update unspent transaction output list
  // Adds new UTXOs and deltes old ones
  public updateUnspentTxOuts(
    newTransactions: Transaction[],
    aUnspentTxOuts: UnspentOutputTransactions[]
  ): UnspentOutputTransactions[] {
    const newUnspentTxOuts: UnspentOutputTransactions[] = newTransactions
      .map((t) => {
        return t.txOuts.map(
          (txOut, index) =>
            new UnspentOutputTransactions(
              t.id,
              index,
              txOut.address,
              txOut.amount
            )
        );
      })
      .reduce((a, b) => a.concat(b), []);

    const consumedTxOuts: UnspentOutputTransactions[] = newTransactions
      .map((t) => t.txIns)
      .reduce((a, b) => a.concat(b), [])
      .map(
        (txIn) =>
          new UnspentOutputTransactions(txIn.txOutId, txIn.txOutIndex, "", 0)
      );

    const resultingUnspentTxOuts = aUnspentTxOuts
      .filter(
        (uTxO) =>
          !this.findUnspentOutput(uTxO.txOutId, uTxO.txOutIndex, consumedTxOuts)
      )
      .concat(newUnspentTxOuts);

    return resultingUnspentTxOuts;
  }

  // Signs the data using private key
  signTxIn(
    transaction: Transaction,
    txInIndex: number,
    keyPair: KeyPair,
    password: string,
    aUnspentTxOuts: UnspentOutputTransactions[]
  ): string {
    const txIn: TransactionInput = transaction.txIns[txInIndex];
    const dataToSign = transaction.id;
    const referencedUnspentTxOut: UnspentOutputTransactions =
      this.findUnspentOutput(txIn.txOutId, txIn.txOutIndex, aUnspentTxOuts);

    if (referencedUnspentTxOut == null) {
      console.log("could not find referenced txOut");
      throw Error();
    }

    const referencedAddress = referencedUnspentTxOut.address;
    if (keyPair.publicKey !== referencedAddress) {
      console.log(
        "trying to sign an input with private" +
          " key that does not match the address that is referenced in txIn"
      );
      throw Error();
    }

    const signature = Cryptography.signUsingECDSA(
      dataToSign,
      keyPair.getDecryptedPrivateKey(password)
    );

    return signature;
  }

  // Creates coinbase transaction to be included in block
  public getCoinbaseTransaction(
    address: string,
    blockIndex: number
  ): Transaction {
    const txIn: TransactionInput = new TransactionInput();
    txIn.signature = "";
    txIn.txOutId = "";
    txIn.txOutIndex = blockIndex;
    const t = new Transaction();
    t.txIns = [txIn];
    t.txOuts = [new TransactionOutput(address, COINBASE_AMOUNT)];
    t.id = this.getTransactionId(t);
    return t;
  }

  // Process transaction:
  // Check id transaction has valid structure, check individual transactions (uses validateBkockTransactions)
  // Updated UTXOs if everything is okay
  public processTransactions(
    aTransactions: Transaction[],
    aUnspentTxOuts: UnspentOutputTransactions[],
    blockIndex: number,
    updateUTXOs: boolean = false
  ) {
    if (!this.isValidTransactionsStructure(aTransactions)) {
      return null;
    }

    if (
      !this.validateBlockTransactions(aTransactions, aUnspentTxOuts, blockIndex)
    ) {
      console.log("invalid block transactions");
      return null;
    }
    return updateUTXOs ?this.updateUnspentTxOuts(aTransactions, aUnspentTxOuts) : true;
  }

  public toHexString(byteArray: any): string {
    return Array.from(byteArray, (byte: any) => {
      return ("0" + (byte & 0xff).toString(16)).slice(-2);
    }).join("");
  }

  // Check if structure of transaction ( types) are correct
  // Uses isValidTransactionStructure
  public isValidTransactionsStructure(transactions: Transaction[]): boolean {
    return transactions
      .map(this.isValidTransactionStructure)
      .reduce((a, b) => a && b, true);
  }

  // Checks individual transaction structure,
  // uses isValidTxInstructure, isValidTxOutStructure
  public isValidTransactionStructure(transaction: Transaction) {
    const that = this;
    if (typeof transaction.id !== "string") {
      console.log("transactionId missing");
      return false;
    }
    if (!(transaction.txIns instanceof Array)) {
      console.log("invalid txIns type in transaction");
      return false;
    }
    if (
      !Array.isArray(transaction.txIns) ||
      !transaction.txIns
        .map(isValidTxInStructure)
        .reduce((a, b) => a && b, true)
    ) {
      return false;
    }

    if (!(transaction.txOuts instanceof Array)) {
      console.log("invalid txIns type in transaction");
      return false;
    }

    if (
      !transaction.txOuts
        .map(isValidTxOutStructure)
        .reduce((a, b) => a && b, true)
    ) {
      return false;
    }
    return true;
  }

  // Checks structure of transaction output
  // public isValidTxOutStructure(txOut: TransactionOutput): boolean {
  //   if (txOut == null) {
  //     console.log("txOut is null");
  //     return false;
  //   } else if (typeof txOut.address !== "string") {
  //     console.log("invalid address type in transaction output");
  //     return false;
  //   } else if (!isValidAddress(txOut.address)) {
  //     console.log("invalid transaction output address");
  //     return false;
  //   } else if (typeof txOut.amount !== "number") {
  //     console.log("invalid amount type in txOut");
  //     return false;
  //   } else {
  //     return true;
  //   }
  // }
}
  
 export const externalGetTransactionId = (transaction: Transaction): string => {
    const txInContent: string = transaction.txIns
      .map((txIn: TransactionInput) => txIn.txOutId + txIn.txOutIndex)
      .reduce((a, b) => a + b, "");

    const txOutContent: string = transaction.txOuts
      .map((txOut: TransactionOutput) => txOut.address + txOut.amount)
      .reduce((a, b) => a + b, "");

    return Cryptography.hashUsingSHA256(txInContent + txOutContent).toString();
  }


  // Checks structure of transaction input
export const isValidTxInStructure = (txIn:TransactionInput) => {
    if (txIn == null) {
        console.log("txIn is null");
        return false;
    }
    else if (typeof txIn.signature !== "string") {
        console.log("invalid signature type in txIn");
        return false;
    }
    else if (typeof txIn.txOutId !== "string") {
        console.log("invalid txOutId type in txIn");
        return false;
    }
    else if (typeof txIn.txOutIndex !== "number") {
        console.log("invalid txOutIndex type in txIn");
        return false;
    }
    else {
        return true;
    }
};
// Checks structure of transaction output
   export const isValidTxOutStructure=(txOut:TransactionOutput):boolean =>{
        if (txOut == null) {
            console.log("txOut is null");
            return false;
        }
        else if (typeof txOut.address !== "string") {
            console.log("invalid address type in transaction output");
            return false;
        }
        else if (!isValidAddress(txOut.address)) {
            console.log("invalid transaction output address");
            return false;
        }
        else if (typeof txOut.amount !== "number") {
            console.log("invalid amount type in txOut");
            return false;
        }
        else {
            return true;
        }
    }

    //
   // Checks if address is valid - length, hexcharacters /. etc
  const isValidAddress = (address: string): boolean => {
    console.log("CHecking address validity\n");
    console.log(address);

    // THIS is wrong to check - our address has 120 chars
    // if (address.length !== 130) {
    //   console.log("invalid public key length");
    //   return false;
    // } else 
     if (address.match(/^[A-Za-z0-9+/=]+$/) === null) {
       console.log("The address must contain only Base64 characters.");
       return false;
     }
     // THis is for hexendcoded eliptic curve address - we have base64
    //  } else if (!address.startsWith("04")) {
    //    console.log("public key must start with 04");
    //    return false;
    //  }
    return true;
  }
