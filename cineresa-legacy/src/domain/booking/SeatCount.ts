import { DomainError } from "../shared/DomainError";

export class SeatCount {
  static readonly MIN = 1;
  static readonly MAX = 6;
  static readonly GROUP_MIN = 4;

  readonly value: number;

  constructor(value: number) {
    if (!Number.isInteger(value) || value < SeatCount.MIN || value > SeatCount.MAX) {
      throw new DomainError("INVALID", "Entre 1 et 6 places par réservation");
    }
    this.value = value;
    Object.freeze(this);
  }

  isGroup(): boolean {
    return this.value >= SeatCount.GROUP_MIN;
  }
}