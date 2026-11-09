import { Booking } from "../domain/booking/Booking";

// Les objets du domaine ne sortent pas de l'hexagone : on renvoie des DTO
export interface BookingDto {
  id: string;
  screeningId: string;
  email: string;
  seats: number;
  tariff: string;
  total: number; // centimes
  status: string;
  createdAt: Date;
  cancelledAt?: Date;
}

export function toBookingDto(b: Booking): BookingDto {
  return {
    id: b.id,
    screeningId: b.screeningId,
    email: b.email.value,
    seats: b.seats.value,
    tariff: b.tariff,
    total: b.total.cents,
    status: b.status,
    createdAt: b.createdAt,
    ...(b.cancelledAt ? { cancelledAt: b.cancelledAt } : {}),
  };
}