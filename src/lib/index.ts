/**
 * Public surface for the orchestration engine.
 *
 * Consumers (App.tsx, server.ts, tests) import from here so that internal
 * module boundaries can evolve without churn at call sites.
 */
export { buildOrchestrationPrompt } from "./prompt";
export { createSimulationResult, randomIncidentId } from "./simulation";
export { assessSeverity } from "./severity";
export {
  getPolygonCentroid,
  getRerouteSectorIds,
  resolveAffectedSectorId,
  updateSectorDensityById
} from "./sectors";
export { sanitizeText } from "./sanitize";
export { validateOrchestrationPayload } from "./validation";
export type { OrchestrationInput, ValidationResult } from "./validation";
export { validateIncidentResult } from "./aiResponse";
export { getPriorityBadgeClass, getPriorityBadgeTyped, getPriorityLabel } from "./priority";
export type { SeverityDecision } from "./severity";
