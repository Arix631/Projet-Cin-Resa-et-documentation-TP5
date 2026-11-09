import { Email } from "../../domain/shared/Email";
import { toBookingDto } from "../dto";
import { ListMyBookings, MyBookingView } from "../ports/in/ListMyBookings";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";

export class ListMyBookingsService implements ListMyBookings {
  constructor(private readonly screenings: ScreeningRepository) {}

  async execute(query: { email: string }): Promise<MyBookingView[]> {
    let email: Email;
    try {
      email = new Email(query.email);
    } catch {
      return []; // comme le legacy : un email inconnu ou invalide donne une liste vide, pas une erreur
    }

    const screenings = await this.screenings.findWithBookingsOf(email);
    return screenings.flatMap((s) =>
      s.bookingsOf(email).map((b) => ({ ...toBookingDto(b), movie: s.movie, startsAt: s.startsAt }))
    );
  }
}