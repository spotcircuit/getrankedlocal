/**
 * Grid calculation utilities for dynamic grid search
 */

export interface GridPoint {
  lat: number;
  lng: number;
  row: number;
  col: number;
  gridIndex: number;
}

export interface GridConfig {
  gridSize: number;
  radiusMiles: number;
  centerLat: number;
  centerLng: number;
}

/**
 * Generate grid points around a center location
 */
export function generateGridPoints(
  centerLat: number,
  centerLng: number,
  radiusMiles: number,
  gridSize: number
): GridPoint[] {
  const points: GridPoint[] = [];
  
  // Approximate degrees per mile
  const milesPerDegreeLat = 69.0;
  const milesPerDegreeLng = Math.cos((centerLat * Math.PI) / 180) * 69.0;
  
  // Calculate step sizes
  const denom = Math.max(gridSize - 1, 1);
  const stepLat = (radiusMiles * 2) / denom / milesPerDegreeLat;
  const stepLng = (radiusMiles * 2) / denom / milesPerDegreeLng;
  
  // Starting point (top-left of grid)
  const startLat = centerLat + (radiusMiles / milesPerDegreeLat);
  const startLng = centerLng - (radiusMiles / milesPerDegreeLng);
  
  // Generate grid points
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const lat = startLat - (row * stepLat);
      const lng = startLng + (col * stepLng);
      
      points.push({
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        row,
        col,
        gridIndex: row * gridSize + col
      });
    }
  }
  
  return points;
}

/**
 * Calculate appropriate zoom level for map based on radius
 */
export function calculateZoomLevel(radiusMiles: number): number {
  if (radiusMiles <= 2) return 14;
  if (radiusMiles <= 3) return 13;
  if (radiusMiles <= 5) return 12;
  if (radiusMiles <= 7) return 11;
  if (radiusMiles <= 10) return 10;
  return 9;
}

/**
 * Calculate grid spacing between points
 */
export function calculateGridSpacing(radiusMiles: number, gridSize: number): number {
  const denom = Math.max(gridSize - 1, 1);
  return Number(((radiusMiles * 2) / denom).toFixed(2));
}

/**
 * Convert spacing (miles between adjacent points) to radius miles (half the total span)
 */
export function spacingToRadiusMiles(spacingMiles: number, gridSize: number): number {
  const denom = Math.max(gridSize - 1, 1);
  return spacingMiles * (denom / 2);
}

/**
 * Convert radius miles to spacing miles
 */
export function radiusToSpacingMiles(radiusMiles: number, gridSize: number): number {
  return calculateGridSpacing(radiusMiles, gridSize);
}

/**
 * Compute degree deltas for a given spacing in miles at a latitude
 */
export function spacingMilesToDegreeSteps(centerLat: number, spacingMiles: number) {
  const milesPerDegreeLat = 69.0;
  const milesPerDegreeLng = Math.cos((centerLat * Math.PI) / 180) * 69.0;
  return {
    stepLat: spacingMiles / milesPerDegreeLat,
    stepLng: spacingMiles / milesPerDegreeLng,
  };
}

/**
 * Calculate total coverage area
 */
export function calculateCoverageArea(radiusMiles: number): number {
  return Number((Math.pow(radiusMiles * 2, 2)).toFixed(0));
}

/**
 * Get total number of points in grid
 */
export function getTotalPoints(gridSize: number): number {
  return gridSize * gridSize;
}

/**
 * Convert miles to meters (for Google Maps)
 */
export function milesToMeters(miles: number): number {
  return miles * 1609.34;
}

/**
 * Get grid configuration summary
 */
export function getGridSummary(gridSize: number, radiusMiles: number) {
  return {
    totalPoints: getTotalPoints(gridSize),
    spacing: calculateGridSpacing(radiusMiles, gridSize),
    coverageArea: calculateCoverageArea(radiusMiles),
    zoomLevel: calculateZoomLevel(radiusMiles)
  };
}
