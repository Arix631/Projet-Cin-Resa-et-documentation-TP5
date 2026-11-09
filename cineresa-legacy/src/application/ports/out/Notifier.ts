export interface BookingConfirmation {
  email: string;
  bookingId: string;
  movie: string;
  seats: number;
  totalCents: number;
}

export interface BookingCancellation {
  email: string;
  bookingId: string;
  refundCents: number;
}

export interface Notifier {
  bookingConfirmed(confirmation: BookingConfirmation): Promise<void>;
  bookingCancelled(cancellation: BookingCancellation): Promise<void>;
}