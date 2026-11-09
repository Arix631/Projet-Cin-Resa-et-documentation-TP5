import { BookingCancellation, BookingConfirmation, Notifier } from "../../../application/ports/out/Notifier";

export class ConsoleNotifier implements Notifier {
  async bookingConfirmed(c: BookingConfirmation): Promise<void> {
    console.log(
      `[SMTP] To: ${c.email} — Votre réservation ${c.bookingId} pour "${c.movie}" ` +
        `(${c.seats} place(s), ${(c.totalCents / 100).toFixed(2)} €) est confirmée.`
    );
  }

  async bookingCancelled(c: BookingCancellation): Promise<void> {
    console.log(
      `[SMTP] To: ${c.email} — Votre réservation ${c.bookingId} a été annulée. Remboursement : ${(c.refundCents / 100).toFixed(2)} €`
    );
  }
}