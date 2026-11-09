import { DomainError } from "../../domain/shared/DomainError";
import { BookingDto, toBookingDto } from "../dto";
import { CancelBooking, CancelBookingCommand } from "../ports/in/CancelBooking";
import { Clock } from "../ports/out/Clock";
import { EventPublisher } from "../ports/out/EventPublisher";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";

export class CancelBookingService implements CancelBooking {
  constructor(
    private readonly screenings: ScreeningRepository,
    private readonly events: EventPublisher,
    private readonly clock: Clock
  ) {}

  async execute(command: CancelBookingCommand): Promise<BookingDto> {
    const screening = await this.screenings.findByBookingId(command.bookingId);
    if (!screening) throw new DomainError("NOT_FOUND", "Réservation introuvable");

    const booking = screening.cancel(command.bookingId, this.clock.now());

    await this.screenings.save(screening);
    await this.events.publish(screening.pullEvents());
    return toBookingDto(booking);
  }
}