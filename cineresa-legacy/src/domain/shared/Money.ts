import { DomainError } from "./DomainError";

export class Money {
  private constructor(public readonly cents: number) {
    Object.freeze(this);
  }

  static cents(cents: number): Money {
    if (!Number.isInteger(cents) || cents < 0) {
      throw new DomainError("INVALID", "Montant invalide");
    }
    return new Money(cents);
  }

  static euros(euros: number): Money {
    return Money.cents(Math.round(euros * 100));
  }

  times(factor: number): Money {
    return Money.cents(Math.round(this.cents * factor));
  }

  // discount(0.3) = -30 %. Retourne un NOUVEAU Money, l'original ne change pas.
  discount(rate: number): Money {
    return Money.cents(Math.round(this.cents * (1 - rate)));
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }

  toString(): string {
    return `${(this.cents / 100).toFixed(2)} €`;
  }
}