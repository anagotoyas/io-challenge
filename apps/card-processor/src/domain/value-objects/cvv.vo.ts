export class Cvv {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static generate(): Cvv {
    return new Cvv(String(Math.floor(Math.random() * 900 + 100)));
  }
}
