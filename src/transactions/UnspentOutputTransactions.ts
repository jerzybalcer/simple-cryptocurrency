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