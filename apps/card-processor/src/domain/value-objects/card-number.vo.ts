export class CardNumber {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static generate(): CardNumber {
    const groups = Array.from({ length: 4 }, () =>
      Math.floor(Math.random() * 9000 + 1000),
    );
    const number = `4${groups[0].toString().slice(1)}${groups[1]}${groups[2]}${groups[3]}`;
    return new CardNumber(number);
  }

  masked(): string {
    return `**** **** **** ${this.value.slice(-4)}`;
  }
}
