export class TransactionOutput {
  public address: string; // public key of recipient
  public amount: number;

  constructor(address: string, amount: number) {
    this.address = address;
    this.amount = amount;
  }
}