import { Screening } from "../../domain/booking/Screening";
import { SeatCount } from "../../domain/booking/SeatCount";
import { Tariff } from "../../domain/booking/Tariff";
import { DomainError } from "../../domain/shared/DomainError";
import { Email } from "../../domain/shared/Email";
import { BookingDto, toBookingDto } from "../dto";
import { BookSeats, BookSeatsCommand } from "../ports/in/BookSeats";
import { Clock } from "../ports/out/Clock";
import { EventPublisher } from "../ports/out/EventPublisher";
import { IdGenerator } from "../ports/out/IdGenerator";
import { PaymentGateway } from "../ports/out/PaymentGateway";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";

export class BookSeatsService implements BookSeats {
  constructor(
    private readonly screenings: ScreeningRepository,
    private readonly payment: PaymentGateway,
    private readonly events: EventPublisher,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  async execute(command: BookSeatsCommand): Promise<BookingDto> {
    const screening: Screening | null = await this.screenings.findById(command.screeningId);
    if (!screening) throw new DomainError("NOT_FOUND", "Séance introuvable");

    // Les value objects valident à la construction (INVALID)
    const email = new Email(command.email);
    const seats = new SeatCount(command.seats);
    const tariff: Tariff = command.tariff === "STUDENT" ? "STUDENT" : "NORMAL";

    // Les règles métier (début, capacité, prix) sont dans l'agrégat
    const booking = screening.book({
      bookingId: this.ids.next(),
      email,
      seats,
      tariff,
      now: this.clock.now(),
    });

    if (!(await this.payment.charge(booking.total.cents))) {
      throw new DomainError("PAYMENT_REFUSED", "Paiement refusé");
    }

    await this.screenings.save(screening);
    await this.events.publish(screening.pullEvents());
    return toBookingDto(booking);
  }
}