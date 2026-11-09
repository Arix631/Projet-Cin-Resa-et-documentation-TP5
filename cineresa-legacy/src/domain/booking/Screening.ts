import { DomainError } from "../shared/DomainError";
import { DomainEvent } from "../shared/DomainEvent";
import { Email } from "../shared/Email";
import { Money } from "../shared/Money";
import { Booking, BookingSnapshot } from "./Booking";
import { BookingCancelled, BookingConfirmed } from "./events";
import { PricingPolicy } from "./PricingPolicy";
import { SeatCount } from "./SeatCount";
import { Tariff } from "./Tariff";

const CANCELLATION_DEADLINE_MS = 2 * 60 * 60 * 1000; // 2 h

export interface ScreeningSnapshot {
  id: string;
  movie: string;
  room: string;
  startsAt: Date;
  capacity: number;
  unitPriceCents: number;
  bookings: BookingSnapshot[];
}

export interface BookRequest {
  bookingId: string;
  email: Email;
  seats: SeatCount;
  tariff: Tariff;
  now: Date;
}

export class Screening {
  private events: DomainEvent[] = [];

  private constructor(
    readonly id: string,
    readonly movie: string,
    readonly room: string,
    readonly startsAt: Date,
    readonly capacity: number,
    readonly unitPrice: Money,
    private readonly bookings: Booking[]
  ) {}

  static schedule(params: {
    id: string;
    movie: string;
    room: string;
    startsAt: Date;
    capacity: number;
    unitPrice: Money;
  }): Screening {
    if (!Number.isInteger(params.capacity) || params.capacity < 1) {
      throw new DomainError("INVALID", "Capacité invalide");
    }
    return new Screening(
      params.id,
      params.movie,
      params.room,
      params.startsAt,
      params.capacity,
      params.unitPrice,
      []
    );
  }

  remainingSeats(): number {
    const taken = this.bookings
      .filter((b) => b.isConfirmed())
      .reduce((total, b) => total + b.seats.value, 0);
    return this.capacity - taken;
  }

  book(request: BookRequest): Booking {
    if (this.startsAt <= request.now) {
      throw new DomainError("CONFLICT", "La séance a déjà commencé");
    }
    if (request.seats.value > this.remainingSeats()) {
      throw new DomainError("CONFLICT", "Plus assez de places");
    }

    const booking = Booking.confirm({
      id: request.bookingId,
      screeningId: this.id,
      email: request.email,
      seats: request.seats,
      tariff: request.tariff,
      total: PricingPolicy.total(this.unitPrice, request.seats, request.tariff),
      now: request.now,
    });
    this.bookings.push(booking);
    this.events.push(
      new BookingConfirmed(
        request.now,
        booking.id,
        this.id,
        this.movie,
        booking.email,
        booking.seats,
        booking.total
      )
    );
    return booking;
  }

  cancel(bookingId: string, now: Date): Booking {
    const booking = this.findBooking(bookingId);
    if (!booking) throw new DomainError("NOT_FOUND", "Réservation introuvable");
    booking.ensureConfirmed();

    if (this.startsAt.getTime() - now.getTime() < CANCELLATION_DEADLINE_MS) {
      throw new DomainError("CONFLICT", "Annulation impossible moins de 2h avant la séance");
    }

    booking.cancel(now);
    this.events.push(new BookingCancelled(now, booking.id, this.id, booking.email, booking.total));
    return booking;
  }

  findBooking(bookingId: string): Booking | undefined {
    return this.bookings.find((b) => b.id === bookingId);
  }

  bookingsOf(email: Email): Booking[] {
    return this.bookings.filter((b) => b.email.equals(email));
  }

  // Renvoie les événements accumulés et vide la liste
  pullEvents(): DomainEvent[] {
    const pulled = this.events;
    this.events = [];
    return pulled;
  }

  toSnapshot(): ScreeningSnapshot {
    return {
      id: this.id,
      movie: this.movie,
      room: this.room,
      startsAt: this.startsAt,
      capacity: this.capacity,
      unitPriceCents: this.unitPrice.cents,
      bookings: this.bookings.map((b) => b.toSnapshot()),
    };
  }

  static fromSnapshot(s: ScreeningSnapshot): Screening {
    return new Screening(
      s.id,
      s.movie,
      s.room,
      s.startsAt,
      s.capacity,
      Money.cents(s.unitPriceCents),
      s.bookings.map(Booking.fromSnapshot)
    );
  }
}