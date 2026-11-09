import { DomainEvent } from "../shared/DomainEvent";
import { Email } from "../shared/Email";
import { Money } from "../shared/Money";
import { SeatCount } from "./SeatCount";

export class BookingConfirmed implements DomainEvent {
  readonly type = "BookingConfirmed";

  constructor(
    readonly occurredAt: Date,
    readonly bookingId: string,
    readonly screeningId: string,
    readonly movie: string,
    readonly email: Email,
    readonly seats: SeatCount,
    readonly total: Money
  ) {}
}

export class BookingCancelled implements DomainEvent {
  readonly type = "BookingCancelled";

  constructor(
    readonly occurredAt: Date,
    readonly bookingId: string,
    readonly screeningId: string,
    readonly email: Email,
    readonly refund: Money
  ) {}
}