import express, { Express } from "express";
import { domainErrorHandler } from "./adapters/in/http/domainErrorHandler";
import { httpRouter } from "./adapters/in/http/httpRouter";
import { InMemoryEventBus } from "./adapters/out/events/InMemoryEventBus";
import { ConsoleNotifier } from "./adapters/out/notification/ConsoleNotifier";
import { FakePaymentGateway } from "./adapters/out/payment/FakePaymentGateway";
import { InMemoryScreeningRepository } from "./adapters/out/persistence/InMemoryScreeningRepository";
import { SystemClock } from "./adapters/out/system/SystemClock";
import { UuidGenerator } from "./adapters/out/system/UuidGenerator";
import { NotifyCustomer } from "./application/handlers/NotifyCustomer";
import { Clock } from "./application/ports/out/Clock";
import { IdGenerator } from "./application/ports/out/IdGenerator";
import { Notifier } from "./application/ports/out/Notifier";
import { PaymentGateway } from "./application/ports/out/PaymentGateway";
import { ScreeningRepository } from "./application/ports/out/ScreeningRepository";
import { BookSeatsService } from "./application/usecases/BookSeatsService";
import { CancelBookingService } from "./application/usecases/CancelBookingService";
import { ListMyBookingsService } from "./application/usecases/ListMyBookingsService";
import { ListUpcomingScreeningsService } from "./application/usecases/ListUpcomingScreeningsService";
import { Screening } from "./domain/booking/Screening";
import { Money } from "./domain/shared/Money";

export interface Adapters {
  screenings: ScreeningRepository;
  payment: PaymentGateway;
  notifier: Notifier;
  clock: Clock;
  ids?: IdGenerator;
  eventBus?: InMemoryEventBus;
}

export function buildApp(adapters: Adapters): Express {
  const { screenings, payment, notifier, clock } = adapters;
  const ids = adapters.ids ?? new UuidGenerator();
  const bus = adapters.eventBus ?? new InMemoryEventBus();

  // Les e-mails réagissent aux événements
  const notifyCustomer = new NotifyCustomer(notifier);
  bus.subscribe("BookingConfirmed", (e) => notifyCustomer.onBookingConfirmed(e));
  bus.subscribe("BookingCancelled", (e) => notifyCustomer.onBookingCancelled(e));

  const useCases = {
    bookSeats: new BookSeatsService(screenings, payment, bus, clock, ids),
    cancelBooking: new CancelBookingService(screenings, bus, clock),
    listUpcomingScreenings: new ListUpcomingScreeningsService(screenings, clock),
    listMyBookings: new ListMyBookingsService(screenings),
  };

  const app = express();
  app.use(express.json());
  app.use(httpRouter(useCases));
  app.use(domainErrorHandler);
  return app;
}

export function memoryAdapters(): Adapters {
  const inHours = (h: number) => new Date(Date.now() + h * 60 * 60 * 1000);
  const screenings = [
    Screening.schedule({ id: "s1", movie: "Dune: Part Three", room: "Salle 1", startsAt: inHours(24), capacity: 120, unitPrice: Money.cents(1150) }),
    Screening.schedule({ id: "s2", movie: "Le Comte de Monte-Cristo", room: "Salle 2", startsAt: inHours(48), capacity: 80, unitPrice: Money.cents(1050) }),
    Screening.schedule({ id: "s3", movie: "Avant-première surprise", room: "Salle 3", startsAt: inHours(1), capacity: 4, unitPrice: Money.cents(900) }),
  ];
  return {
    screenings: new InMemoryScreeningRepository(screenings),
    payment: new FakePaymentGateway(() => Math.random() > 0.05), // comme le legacy
    notifier: new ConsoleNotifier(),
    clock: new SystemClock(),
  };
}