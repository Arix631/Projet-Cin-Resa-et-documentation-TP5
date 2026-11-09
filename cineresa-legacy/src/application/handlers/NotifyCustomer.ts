import { BookingCancelled, BookingConfirmed } from "../../domain/booking/events";
import { Notifier } from "../ports/out/Notifier";

// Réagit aux événements : les use cases n'appellent plus le notifier
export class NotifyCustomer {
  constructor(private readonly notifier: Notifier) {}

  async onBookingConfirmed(e: BookingConfirmed): Promise<void> {
    await this.notifier.bookingConfirmed({
      email: e.email.value,
      bookingId: e.bookingId,
      movie: e.movie,
      seats: e.seats.value,
      totalCents: e.total.cents,
    });
  }

  async onBookingCancelled(e: BookingCancelled): Promise<void> {
    await this.notifier.bookingCancelled({
      email: e.email.value,
      bookingId: e.bookingId,
      refundCents: e.refund.cents,
    });
  }
}