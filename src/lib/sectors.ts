import { StadiumSector } from "../types";
import { CrowdDensity } from "../types";
import { BLOCKED_REROUTE_DENSITIES, DENSITY_FILL_RATIO, FALLBACK_CENTROID } from "./config";

export type { CrowdDensity };

/**
 * Resolve the affected sector by scanning the report text for known identifiers.
 *
 * The pattern list is deliberately ordered from most specific (sector id, gate
 * names, incident signatures) to the most generic fallback so that an ambiguous
 * report still produces a deterministic sector instead of `undefined`.
 */
const SECTOR_MATCHERS: Array<{ id: string; patterns: readonly string[] }> = [
  { id: "sec-104", patterns: ["104", "west gate", "collapse"] },
  { id: "sec-107", patterns: ["107", "south east", "pyro"] },
  { id: "sec-105", patterns: ["105", "south west", "blackout", "gate c"] },
  { id: "sec-101", patterns: ["101", "turnstile"] },
  { id: "sec-108", patterns: ["108", "east gate", "gate e"] },
  { id: "sec-106", patterns: ["106", "south gate"] },
  { id: "sec-103", patterns: ["103", "north west", "stairwell"] },
  { id: "sec-102", patterns: ["102", "north gate", "gate b"] }
];

const DEFAULT_SECTOR_ID = "sec-102";

export function resolveAffectedSectorId(text: string): string {
  const lowerText = text.toLowerCase();
  for (const { id, patterns } of SECTOR_MATCHERS) {
    if (patterns.some((pattern) => lowerText.includes(pattern))) {
      return id;
    }
  }
  return DEFAULT_SECTOR_ID;
}

/**
 * Returns an immutable copy of `sectors` with the matching sector's density and
 * derived head-count updated. Identical references for untouched sectors let
 * React.memo / useMemo skip work on unchanged slices of state.
 */
export function updateSectorDensityById(
  sectors: StadiumSector[],
  sectorId: string,
  density: CrowdDensity
): StadiumSector[] {
  const ratio = DENSITY_FILL_RATIO[density];
  return sectors.map((sector) =>
    sector.id === sectorId
      ? { ...sector, density, currentCount: Math.round(sector.capacity * ratio) }
      : sector
  );
}

/**
 * Returns reroute targets: adjacent sectors whose density is not blocking.
 *
 * O(adjacencies) lookup via a pre-built Map; we deliberately exclude *both* High
 * and Critical sectors to keep rerouted streams comfortably safe rather than
 * merely 'not critical'.
 */
export function getRerouteSectorIds(sectors: StadiumSector[], activeSectorId?: string): string[] {
  if (!activeSectorId) return [];

  const sectorById = new Map(sectors.map((sector) => [sector.id, sector]));
  const activeSector = sectorById.get(activeSectorId);
  if (!activeSector) return [];

  return activeSector.adjacentSectors.filter((sectorId) => {
    const target = sectorById.get(sectorId);
    return target ? !BLOCKED_REROUTE_DENSITIES.has(target.density) : false;
  });
}

interface Point {
  x: number;
  y: number;
}

/**
 * Compute the geometric centroid of an SVG polygon. Falls back to the configured
 * stadium-centre centroid when the input cannot be parsed, so the UI never
 * renders a stray label at (0,0).
 */
export function getPolygonCentroid(coordinates: string): Point {
  const points = coordinates
    .trim()
    .split(/\s+/)
    .map((point) => point.split(",").map(Number))
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

  if (points.length === 0) {
    return { ...FALLBACK_CENTROID };
  }

  const totals = points.reduce(
    (sum, [x, y]) => ({ x: sum.x + x, y: sum.y + y }),
    { x: 0, y: 0 }
  );

  return {
    x: Math.round(totals.x / points.length),
    y: Math.round(totals.y / points.length)
  };
}
