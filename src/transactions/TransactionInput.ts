export class TransactionInput {
  public txOutId: string; // ID of unspent transaction output this input is referencing
  public txOutIndex: number; // index of output in transaction outputs it is referencing
  public signature: string; // proof of ownership

  constructor() {
    this.txOutId = "";
    (this.txOutIndex = 0), (this.signature = "");
  }
}