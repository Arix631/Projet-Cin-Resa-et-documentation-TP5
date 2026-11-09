import { describe, expect, it } from "vitest";
import { InMemoryEventBus } from "../src/adapters/out/events/InMemoryEventBus";
import { InMemoryScreeningRepository } from "../src/adapters/out/persistence/InMemoryScreeningRepository";
import { NotifyCustomer } from "../src/application/handlers/NotifyCustomer";
import { CancelBookingService } from "../src/application/usecases/CancelBookingService";
import { Screening } from "../src/domain/booking/Screening";
import { SeatCount } from "../src/domain/booking/SeatCount";
import { Email } from "../src/domain/shared/Email";
import { Money } from "../src/domain/shared/Money";
import { SpyNotifier } from "./helpers/SpyNotifier";

const NOW = new Date("2026-10-20T10:00:00Z");
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function setup(startsAt: Date, alreadyCancelled = false) {
  const screening = Screening.schedule({
    id: "s1", movie: "Dune", room: "1", startsAt, capacity: 10, unitPrice: Money.euros(10),
  });
  const bookedAt = new Date(NOW.getTime() - DAY);
  screening.book({ bookingId: "b1", email: new Email("a@b.fr"), seats: new SeatCount(2), tariff: "NORMAL", now: bookedAt });
  if (alreadyCancelled) screening.cancel("b1", bookedAt);
  screening.pullEvents();

  const repo = new InMemoryScreeningRepository([screening]);
  const bus = new InMemoryEventBus();
  const notifier = new SpyNotifier();
  const notifyCustomer = new NotifyCustomer(notifier);
  bus.subscribe("BookingConfirmed", (e) => notifyCustomer.onBookingConfirmed(e));
  bus.subscribe("BookingCancelled", (e) => notifyCustomer.onBookingCancelled(e));

  const service = new CancelBookingService(repo, bus, { now: () => NOW });
  return { service, repo, bus, notifier };
}

describe("CancelBookingService", () => {
  it("annule, sauvegarde, publie BookingCancelled et envoie le mail de remboursement", async () => {
    const { service, repo, bus, notifier } = setup(new Date(NOW.getTime() + 5 * HOUR));

    const result = await service.execute({ bookingId: "b1" });

    expect(result.status).toBe("CANCELLED");
    expect(result.cancelledAt).toEqual(NOW);
    expect((await repo.findById("s1"))!.remainingSeats()).toBe(10);
    expect(bus.published.map((e) => e.type)).toEqual(["BookingCancelled"]);
    expect(notifier.cancelled).toEqual([{ email: "a@b.fr", bookingId: "b1", refundCents: 2000 }]);
  });

  it("refuse une réservation inconnue (NOT_FOUND)", async () => {
    const { service } = setup(new Date(NOW.getTime() + 5 * HOUR));
    await expect(service.execute({ bookingId: "b0" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("refuse une réservation déjà annulée (CONFLICT)", async () => {
    const { service } = setup(new Date(NOW.getTime() + 5 * HOUR), true);
    await expect(service.execute({ bookingId: "b1" })).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Déjà annulée",
    });
  });

  it("accepte l'annulation pile 2 h avant la séance", async () => {
    const { service } = setup(new Date(NOW.getTime() + 2 * HOUR));
    await expect(service.execute({ bookingId: "b1" })).resolves.toMatchObject({ status: "CANCELLED" });
  });

  it("refuse l'annulation une milliseconde avant la limite de 2 h, sans rien publier", async () => {
    const { service, bus, notifier } = setup(new Date(NOW.getTime() + 2 * HOUR - 1));

    await expect(service.execute({ bookingId: "b1" })).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Annulation impossible moins de 2h avant la séance",
    });
    expect(bus.published).toHaveLength(0);
    expect(notifier.cancelled).toHaveLength(0);
  });
});