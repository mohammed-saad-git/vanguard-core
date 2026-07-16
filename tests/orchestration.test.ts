import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { INITIAL_SECTORS } from "../src/data";
import {
  assessSeverity,
  createSimulationResult,
  getPolygonCentroid,
  getRerouteSectorIds,
  resolveAffectedSectorId,
  sanitizeText,
  updateSectorDensityById,
  validateOrchestrationPayload
} from "../src/lib/orchestration";

describe("orchestration safety rules", () => {
  it("sanitizes script payloads while preserving useful incident text", () => {
    const sanitized = sanitizeText("<script>alert(1)</script>javascript:medical crowd crush near Gate B", 500);

    assert.equal(sanitized.includes("<script>"), false);
    assert.equal(sanitized.includes("javascript:"), false);
    assert.match(sanitized, /medical crowd crush near Gate B/);
  });

  it("validates required telemetry values and returns sanitized input", () => {
    const result = validateOrchestrationPayload({
      stadium_name: "MetLife Stadium",
      current_match_phase: "Pre-match ingress",
      incident_report: "  Fire alarm near section 101 <img src=x>  ",
      current_crowd_density_level: "High",
      playing_teams: "USA vs Mexico"
    });

    assert.equal(result.ok, true);
    assert.equal(result.value?.incident_report, "Fire alarm near section 101");
    assert.equal(result.value?.current_crowd_density_level, "High");
  });

  it("rejects unknown density values", () => {
    const result = validateOrchestrationPayload({
      stadium_name: "MetLife Stadium",
      current_match_phase: "Pre-match ingress",
      incident_report: "Gate delay",
      current_crowd_density_level: "Packed"
    });

    assert.equal(result.ok, false);
    assert.equal(result.error, "Invalid crowd density level.");
  });

  it("escalates medical, crush, fire, and structural incidents to priority one", () => {
    for (const report of ["medical response needed", "possible crush hazard", "small fire", "structural failure"]) {
      const severity = assessSeverity(report, "Low");
      assert.equal(severity.priority, 1);
      assert.equal(severity.urgency, "Immediate");
    }
  });

  it("uses density-based severity when no critical term is present", () => {
    assert.equal(assessSeverity("turnstile delay", "High").priority, 3);
    assert.equal(assessSeverity("turnstile delay", "Critical").priority, 2);
    assert.equal(assessSeverity("turnstile delay", "Low").priority, 4);
  });

  it("resolves affected sectors from report keywords", () => {
    assert.equal(resolveAffectedSectorId("collapse near west gate"), "sec-104");
    assert.equal(resolveAffectedSectorId("pyro in south east"), "sec-107");
    assert.equal(resolveAffectedSectorId("gate c blackout"), "sec-105");
    assert.equal(resolveAffectedSectorId("turnstile queue"), "sec-101");
    assert.equal(resolveAffectedSectorId("generic north gate delay"), "sec-102");
  });

  it("updates sector density immutably with capacity-based counts", () => {
    const updated = updateSectorDensityById(INITIAL_SECTORS, "sec-103", "Critical");
    const sector = updated.find((item) => item.id === "sec-103");

    assert.notEqual(updated, INITIAL_SECTORS);
    assert.equal(sector?.density, "Critical");
    assert.equal(sector?.currentCount, Math.round(4500 * 0.98));
    assert.equal(INITIAL_SECTORS.find((item) => item.id === "sec-103")?.density, "Low");
  });

  it("routes only to adjacent sectors that are not critical", () => {
    const reroutes = getRerouteSectorIds(INITIAL_SECTORS, "sec-104");

    assert.deepEqual(reroutes, ["sec-103", "sec-105"]);
    assert.equal(getRerouteSectorIds(INITIAL_SECTORS, "missing").length, 0);
  });

  it("creates deterministic simulation payloads when an id factory is provided", () => {
    const result = createSimulationResult(
      {
        stadium_name: "MetLife Stadium",
        current_match_phase: "Pre-match ingress",
        incident_report: "medical alert near Gate B",
        current_crowd_density_level: "Low",
        playing_teams: "USA vs Mexico"
      },
      () => "STAD-2026-TEST"
    );

    assert.equal(result.incident_id, "STAD-2026-TEST");
    assert.equal(result.severity_assessment.priority_level, 1);
    assert.equal(result.automated_broadcasts.english.length > 20, true);
  });

  it("calculates polygon centroids and falls back for invalid coordinates", () => {
    assert.deepEqual(getPolygonCentroid("0,0 10,0 10,10 0,10"), { x: 5, y: 5 });
    assert.deepEqual(getPolygonCentroid("not-a-point"), { x: 150, y: 110 });
  });
});
