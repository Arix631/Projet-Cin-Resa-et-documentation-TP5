import { describe, expect, it } from "vitest";
import { PricingPolicy } from "../src/domain/booking/PricingPolicy";
import { SeatCount } from "../src/domain/booking/SeatCount";
import { Tariff } from "../src/domain/booking/Tariff";
import { Money } from "../src/domain/shared/Money";

const total = (unitCents: number, seats: number, tariff: Tariff) =>
  PricingPolicy.total(Money.cents(unitCents), new SeatCount(seats), tariff).cents;

describe("PricingPolicy", () => {
  it("calcule le prix normal", () => expect(total(1150, 2, "NORMAL")).toBe(2300));
  it("applique la réduction étudiante", () => expect(total(1000, 1, "STUDENT")).toBe(700));
  it("applique la réduction de groupe", () => expect(total(1000, 4, "NORMAL")).toBe(3600));
  it("étudiant, 2 places", () => expect(total(1150, 2, "STUDENT")).toBe(1610));
  it("normal, 4 places", () => expect(total(1150, 4, "NORMAL")).toBe(4140));
  it("étudiant, 4 places", () => expect(total(1150, 4, "STUDENT")).toBe(2898));
});