import { DomainError } from "./DomainError";

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export class Email {
  readonly value: string;

  constructor(raw: string) {
    const normalized = typeof raw === "string" ? raw.trim().toLowerCase() : "";
    if (!EMAIL_REGEX.test(normalized)) {
      throw new DomainError("INVALID", "Email invalide");
    }
    this.value = normalized;
    Object.freeze(this);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}