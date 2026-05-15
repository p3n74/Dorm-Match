import { describe, expect, it } from "vitest";

import { roomStatusForReservation } from "./room-status";

describe("roomStatusForReservation", () => {
  it("maps confirmed to reserved", () => {
    expect(roomStatusForReservation("confirmed")).toBe("reserved");
  });

  it("maps active to occupied", () => {
    expect(roomStatusForReservation("active")).toBe("occupied");
  });

  it("maps completed to available", () => {
    expect(roomStatusForReservation("completed")).toBe("available");
  });

  it("returns null for pending", () => {
    expect(roomStatusForReservation("pending")).toBeNull();
  });
});
