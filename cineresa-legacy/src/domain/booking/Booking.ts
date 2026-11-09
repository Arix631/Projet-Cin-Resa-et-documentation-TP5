import { DomainError } from "../shared/DomainError";
import { Email } from "../shared/Email";
import { Money } from "../shared/Money";
import { SeatCount } from "./SeatCount";
import { Tariff } from "./Tariff";

export type BookingStatus = "CONFIRMED" | "CANCELLED";

export interface BookingSnapshot {
  id: string;
  screeningId: string;
  email: string;
  seats: number;
  tariff: Tariff;
  totalCents: number;
  status: BookingStatus;
  createdAt: Date;
  cancelledAt?: Date;
}

export class Booking {
  private _status: BookingStatus;
  private _cancelledAt?: Date;

  private constructor(
    readonly id: string,
    readonly screeningId: string,
    readonly email: Email,
    readonly seats: SeatCount,
    readonly tariff: Tariff,
    readonly total: Money,
    status: BookingStatus,
    readonly createdAt: Date,
    cancelledAt?: Date
  ) {
    this._status = status;
    this._cancelledAt = cancelledAt;
  }

  static confirm(params: {
    id: string;
    screeningId: string;
    email: Email;
    seats: SeatCount;
    tariff: Tariff;
    total: Money;
    now: Date;
  }): Booking {
    return new Booking(
      params.id,
      params.screeningId,
      params.email,
      params.seats,
      params.tariff,
      params.total,
      "CONFIRMED",
      params.now
    );
  }

  get status(): BookingStatus {
    return this._status;
  }

  get cancelledAt(): Date | undefined {
    return this._cancelledAt;
  }

  isConfirmed(): boolean {
    return this._status === "CONFIRMED";
  }

  ensureConfirmed(): void {
    if (!this.isConfirmed()) throw new DomainError("CONFLICT", "Déjà annulée");
  }

  cancel(now: Date): void {
    this.ensureConfirmed();
    this._status = "CANCELLED";
    this._cancelledAt = now;
  }

  toSnapshot(): BookingSnapshot {
    return {
      id: this.id,
      screeningId: this.screeningId,
      email: this.email.value,
      seats: this.seats.value,
      tariff: this.tariff,
      totalCents: this.total.cents,
      status: this._status,
      createdAt: this.createdAt,
      ...(this._cancelledAt ? { cancelledAt: this._cancelledAt } : {}),
    };
  }

  static fromSnapshot(s: BookingSnapshot): Booking {
    return new Booking(
      s.id,
      s.screeningId,
      new Email(s.email),
      new SeatCount(s.seats),
      s.tariff,
      Money.cents(s.totalCents),
      s.status,
      s.createdAt,
      s.cancelledAt
    );
  }
}