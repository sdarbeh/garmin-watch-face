import { expect, it } from "vitest";
import {
  simulationValues,
  createDefaultSimulation,
  DEFAULT_SIMULATION,
  shiftDate,
  shiftTime,
} from "@/components/editor/model/simulation";
import {
  clampSimulationNumber,
  isSimulationDateValid,
  isSimulationNumberValid,
  METRIC_SIMULATION_CONSTRAINTS,
} from "@/components/editor/model/simulation-constraints";
import { renderModel } from "@/watchface/render-model";
import { defaultDesign, serializeProject } from "@/watchface/schema";

it("wraps simulated time across midnight", () => {
  expect(shiftTime("23:55", 15)).toBe("00:10");
  expect(shiftTime("00:05", -15)).toBe("23:50");
});

it("enforces realistic simulation ranges", () => {
  const heartRate = METRIC_SIMULATION_CONSTRAINTS.heartRate;

  expect(isSimulationNumberValid(68, heartRate)).toBe(true);
  expect(isSimulationNumberValid(68.5, heartRate)).toBe(false);
  expect(isSimulationNumberValid(1_000_000, heartRate)).toBe(false);
  expect(clampSimulationNumber(68.5, heartRate)).toBe(69);
  expect(clampSimulationNumber(1_000_000, heartRate)).toBe(254);
});

it("rejects impossible and out-of-range simulation dates", () => {
  expect(isSimulationDateValid("2028-02-29")).toBe(true);
  expect(isSimulationDateValid("2026-02-31")).toBe(false);
  expect(isSimulationDateValid("2200-01-01")).toBe(false);
});

it("simulates time formats and low battery without changing the saved design", () => {
  const design = defaultDesign();
  const time = design.elements.find((e) => e.type === "time")!;
  time.timeFormat = "12";
  const original = serializeProject(design);
  const model = renderModel(
    design,
    simulationValues({ ...DEFAULT_SIMULATION, time: "00:15" }, "low-battery"),
  );
  expect(model.find((e) => e.type === "time")?.sample).toBe("12:15");
  expect(model.find((e) => e.type === "battery")?.sample).toBe("5% battery");
  expect(serializeProject(design)).toBe(original);
});

it("simulates date, steps and battery independently", () => {
  const values = simulationValues(
    { ...DEFAULT_SIMULATION, date: "2028-02-29", steps: 12345, battery: 42 },
    "normal",
  );
  expect(values.date).toBe("TUE 29 FEB");
  expect(values.steps).toBe("12345 steps");
  expect(values.battery).toBe("42% battery");
  expect(shiftDate("2028-02-28", 1)).toBe("2028-02-29");
  expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
});

it("seeds the editor from local device calendar fields, including midnight", () => {
  expect(createDefaultSimulation(new Date(2027, 0, 1, 0, 5))).toEqual({
    ...DEFAULT_SIMULATION,
    date: "2027-01-01",
    time: "00:05",
  });
  expect(createDefaultSimulation(new Date(2026, 8, 9, 23, 59))).toMatchObject({
    date: "2026-09-09",
    time: "23:59",
  });
});
