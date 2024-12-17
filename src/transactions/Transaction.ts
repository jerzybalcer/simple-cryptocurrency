import { TransactionInput } from "./TransactionInput";
import { TransactionOutput } from "./TransactionOutput";

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