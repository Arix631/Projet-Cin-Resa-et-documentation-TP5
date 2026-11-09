import { BookingDto } from "../../dto";

export interface CancelBookingCommand {
  bookingId: string;
}

export interface CancelBooking {
  execute(command: CancelBookingCommand): Promise<BookingDto>;
}