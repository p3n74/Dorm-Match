import type { AvailabilityStatus } from "@DormMatch/db/schema/enums";
import type { ReservationStatus } from "@DormMatch/db/schema/enums";

export function roomStatusForReservation(
  reservationStatus: ReservationStatus,
): AvailabilityStatus | null {
  switch (reservationStatus) {
    case "pending":
      return null;
    case "confirmed":
      return "reserved";
    case "active":
      return "occupied";
    case "completed":
    case "cancelled":
      return "available";
    default:
      return null;
  }
}
