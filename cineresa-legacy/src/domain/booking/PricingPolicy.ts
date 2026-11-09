import { Money } from "../shared/Money";
import { SeatCount } from "./SeatCount";
import { Tariff } from "./Tariff";

export class PricingPolicy {
  static readonly STUDENT_FACTOR = 0.7; // -30 %
  static readonly GROUP_FACTOR = 0.9; // -10 %

  static total(unitPrice: Money, seats: SeatCount, tariff: Tariff): Money {
    const unit = tariff === "STUDENT" ? unitPrice.times(PricingPolicy.STUDENT_FACTOR) : unitPrice;
    const total = unit.times(seats.value);
    return seats.isGroup() ? total.times(PricingPolicy.GROUP_FACTOR) : total;
  }
}