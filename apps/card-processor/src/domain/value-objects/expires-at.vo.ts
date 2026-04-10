export class ExpiresAt {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static generate(): ExpiresAt {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 4);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return new ExpiresAt(`${month}/${year}`);
  }
}
