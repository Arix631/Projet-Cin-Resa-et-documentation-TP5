import { BookingCancellation, BookingConfirmation, Notifier } from "../../src/application/ports/out/Notifier";

export class SpyNotifier implements Notifier {
  confirmed: BookingConfirmation[] = [];
  cancelled: BookingCancellation[] = [];

  async bookingConfirmed(c: BookingConfirmation): Promise<void> {
    this.confirmed.push(c);
  }

  async bookingCancelled(c: BookingCancellation): Promise<void> {
    this.cancelled.push(c);
  }
}