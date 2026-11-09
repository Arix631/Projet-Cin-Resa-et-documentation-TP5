import { ListUpcomingScreenings, ScreeningView } from "../ports/in/ListUpcomingScreenings";
import { Clock } from "../ports/out/Clock";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";

export class ListUpcomingScreeningsService implements ListUpcomingScreenings {
  constructor(
    private readonly screenings: ScreeningRepository,
    private readonly clock: Clock
  ) {}

  async execute(): Promise<ScreeningView[]> {
    const upcoming = await this.screenings.findStartingAfter(this.clock.now());
    return upcoming.map((s) => ({
      id: s.id,
      movie: s.movie,
      room: s.room,
      startsAt: s.startsAt,
      price: s.unitPrice.cents,
      remaining: s.remainingSeats(),
    }));
  }
}