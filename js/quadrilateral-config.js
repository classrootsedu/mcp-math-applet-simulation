/**
 * Quadrilateral Configuration
 * 
 * Comprehensive configuration for all quadrilateral types with properties and default coordinates.
 * This file contains:
 * - Default vertex coordinates for each shape type
 * - Complete property definitions (sides, angles, diagonals, symmetry)
 * - Helper functions for property detection and validation
 */

/**
 * Quadrilateral Types Configuration
 * Each type includes:
 * - name: Display name
 * - vertices: Default vertex coordinates [x1, y1, x2, y2, x3, y3, x4, y4]
 * - properties: Object describing all geometric properties
 */
const QuadrilateralConfig = {
  // ===== SQUARE =====
  square: {
    name: 'Square',
    description: 'All sides equal, all angles 90°, diagonals equal and bisect',
    vertices: [400, 300, 700, 300, 700, 600, 400, 600], // Square 300x300
    properties: {
      // Sides - Parallel
      parallelSides: 'two-pairs', // 'none', 'one-pair', 'two-pairs'
      parallelPairs: [[0, 2], [1, 3]], // Indices of parallel side pairs
      
      // Sides - Equality
      sideEquality: 'all-equal', // 'all-different', 'one-pair', 'two-pairs', 'all-equal'
      equalSidePairs: [[0, 1, 2, 3]], // All four sides equal
      
      // Angles
      oppositeAnglesEqual: true,
      equalAnglePairs: [[0, 2], [1, 3]], // But actually all angles equal
      adjacentAnglesSupplementary: true, // All 90°, so 90+90=180
      allAnglesEqual: true,
      rightAngles: [0, 1, 2, 3], // All vertices have right angles
      
      // Diagonals
      diagonalsEqual: true,
      diagonalsBisect: true,
      diagonalsPerpendicular: true,
      
      // Symmetry
      lineSymmetry: 4, // 4 lines of symmetry
      rotationalSymmetry: true,
      rotationalOrder: 4 // 90° rotations
    }
  },

  // ===== RECTANGLE =====
  rectangle: {
    name: 'Rectangle',
    description: 'Opposite sides equal, all angles 90°, diagonals equal',
    vertices: [300, 350, 800, 350, 800, 550, 300, 550], // Rectangle 500x200
    properties: {
      parallelSides: 'two-pairs',
      parallelPairs: [[0, 2], [1, 3]],
      
      sideEquality: 'two-pairs', // Opposite pairs equal
      equalSidePairs: [[0, 2], [1, 3]],
      
      oppositeAnglesEqual: true,
      equalAnglePairs: [[0, 2], [1, 3]],
      adjacentAnglesSupplementary: true,
      allAnglesEqual: true,
      rightAngles: [0, 1, 2, 3],
      
      diagonalsEqual: true,
      diagonalsBisect: true,
      diagonalsPerpendicular: false,
      
      lineSymmetry: 2,
      rotationalSymmetry: true,
      rotationalOrder: 2
    }
  },

  // ===== PARALLELOGRAM =====
  parallelogram: {
    name: 'Parallelogram',
    description: 'Opposite sides parallel and equal, opposite angles equal',
    vertices: [300, 400, 700, 400, 800, 600, 400, 600], // Parallelogram
    properties: {
      parallelSides: 'two-pairs',
      parallelPairs: [[0, 2], [1, 3]],
      
      sideEquality: 'two-pairs',
      equalSidePairs: [[0, 2], [1, 3]],
      
      oppositeAnglesEqual: true,
      equalAnglePairs: [[0, 2], [1, 3]],
      adjacentAnglesSupplementary: true,
      allAnglesEqual: false,
      rightAngles: [],
      
      diagonalsEqual: false,
      diagonalsBisect: true,
      diagonalsPerpendicular: false,
      
      lineSymmetry: 0,
      rotationalSymmetry: true,
      rotationalOrder: 2
    }
  },

  // ===== RHOMBUS =====
  rhombus: {
    name: 'Rhombus',
    description: 'All sides equal, opposite angles equal, diagonals perpendicular',
    vertices: [550, 250, 750, 450, 550, 650, 350, 450], // Rhombus (diamond)
    properties: {
      parallelSides: 'two-pairs',
      parallelPairs: [[0, 2], [1, 3]],
      
      sideEquality: 'all-equal',
      equalSidePairs: [[0, 1, 2, 3]],
      
      oppositeAnglesEqual: true,
      equalAnglePairs: [[0, 2], [1, 3]],
      adjacentAnglesSupplementary: true,
      allAnglesEqual: false,
      rightAngles: [],
      
      diagonalsEqual: false,
      diagonalsBisect: true,
      diagonalsPerpendicular: true,
      
      lineSymmetry: 2,
      rotationalSymmetry: true,
      rotationalOrder: 2
    }
  },

  // ===== TRAPEZOID (Generic) =====
  trapezoid: {
    name: 'Trapezoid',
    description: 'One pair of parallel sides',
    vertices: [350, 400, 750, 400, 650, 600, 450, 600], // Trapezoid
    properties: {
      parallelSides: 'one-pair',
      parallelPairs: [[0, 2]], // Only top and bottom parallel
      
      sideEquality: 'all-different',
      equalSidePairs: [],
      
      oppositeAnglesEqual: false,
      equalAnglePairs: [],
      adjacentAnglesSupplementary: false, // Only some adjacent angles
      allAnglesEqual: false,
      rightAngles: [],
      
      diagonalsEqual: false,
      diagonalsBisect: false,
      diagonalsPerpendicular: false,
      
      lineSymmetry: 0,
      rotationalSymmetry: false,
      rotationalOrder: 1
    }
  },

  // ===== ISOSCELES TRAPEZOID =====
  isoscelesTrapezoid: {
    name: 'Isosceles Trapezoid',
    description: 'One pair of parallel sides, non-parallel sides equal',
    vertices: [400, 350, 700, 350, 750, 600, 350, 600], // Isosceles trapezoid
    properties: {
      parallelSides: 'one-pair',
      parallelPairs: [[0, 2]],
      
      sideEquality: 'one-pair', // Non-parallel sides equal
      equalSidePairs: [[1, 3]],
      
      oppositeAnglesEqual: false,
      equalAnglePairs: [[0, 1], [2, 3]], // Base angles equal
      adjacentAnglesSupplementary: false,
      allAnglesEqual: false,
      rightAngles: [],
      
      diagonalsEqual: true,
      diagonalsBisect: false,
      diagonalsPerpendicular: false,
      
      lineSymmetry: 1,
      rotationalSymmetry: false,
      rotationalOrder: 1
    }
  },

  // ===== RIGHT TRAPEZOID =====
  rightTrapezoid: {
    name: 'Right Trapezoid',
    description: 'One pair of parallel sides, two right angles',
    vertices: [400, 350, 700, 350, 700, 600, 400, 600], // Right trapezoid
    properties: {
      parallelSides: 'one-pair',
      parallelPairs: [[1, 3]], // Left and right sides parallel
      
      sideEquality: 'one-pair',
      equalSidePairs: [[1, 3]],
      
      oppositeAnglesEqual: false,
      equalAnglePairs: [[0, 3]], // Left side angles
      adjacentAnglesSupplementary: false,
      allAnglesEqual: false,
      rightAngles: [0, 3], // Two right angles
      
      diagonalsEqual: false,
      diagonalsBisect: false,
      diagonalsPerpendicular: false,
      
      lineSymmetry: 0,
      rotationalSymmetry: false,
      rotationalOrder: 1
    }
  },

  // ===== KITE =====
  kite: {
    name: 'Kite',
    description: 'Two pairs of adjacent sides equal, diagonals perpendicular',
    vertices: [550, 250, 700, 450, 550, 650, 400, 450], // Kite
    properties: {
      parallelSides: 'none',
      parallelPairs: [],
      
      sideEquality: 'two-pairs', // Adjacent pairs equal
      equalSidePairs: [[0, 1], [2, 3]],
      
      oppositeAnglesEqual: 'one-pair', // One pair of opposite angles equal
      equalAnglePairs: [[1, 3]], // Left and right angles equal
      adjacentAnglesSupplementary: false,
      allAnglesEqual: false,
      rightAngles: [],
      
      diagonalsEqual: false,
      diagonalsBisect: 'one', // One diagonal bisects the other
      diagonalsPerpendicular: true,
      
      lineSymmetry: 1,
      rotationalSymmetry: false,
      rotationalOrder: 1
    }
  },

  // ===== IRREGULAR QUADRILATERAL =====
  irregular: {
    name: 'Irregular Quadrilateral',
    description: 'No special properties',
    vertices: [350, 300, 750, 350, 700, 650, 400, 600], // Irregular
    properties: {
      parallelSides: 'none',
      parallelPairs: [],
      
      sideEquality: 'all-different',
      equalSidePairs: [],
      
      oppositeAnglesEqual: false,
      equalAnglePairs: [],
      adjacentAnglesSupplementary: false,
      allAnglesEqual: false,
      rightAngles: [],
      
      diagonalsEqual: false,
      diagonalsBisect: false,
      diagonalsPerpendicular: false,
      
      lineSymmetry: 0,
      rotationalSymmetry: false,
      rotationalOrder: 1
    }
  }
};

/**
 * Helper: Calculate distance between two points
 */
const calculateDistance = (x1, y1, x2, y2) => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

/**
 * Helper: Calculate angle between three points (in degrees)
 * @param {number} x1, y1 - First point
 * @param {number} x2, y2 - Vertex point
 * @param {number} x3, y3 - Third point
 * @returns {number} Angle in degrees
 */
const calculateAngle = (x1, y1, x2, y2, x3, y3) => {
  // Vectors from vertex to the two other points
  const v1x = x1 - x2;
  const v1y = y1 - y2;
  const v2x = x3 - x2;
  const v2y = y3 - y2;
  
  // Dot product and magnitudes
  const dotProduct = v1x * v2x + v1y * v2y;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
  
  // Angle in radians, then convert to degrees
  const angleRad = Math.acos(dotProduct / (mag1 * mag2));
  return angleRad * (180 / Math.PI);
};

/**
 * Helper: Calculate slope of a line
 */
const calculateSlope = (x1, y1, x2, y2) => {
  if (Math.abs(x2 - x1) < 0.001) return Infinity; // Vertical line
  return (y2 - y1) / (x2 - x1);
};

/**
 * Helper: Check if two lines are parallel (same slope)
 */
const areParallel = (slope1, slope2, tolerance = 0.01) => {
  if (slope1 === Infinity && slope2 === Infinity) return true;
  if (slope1 === Infinity || slope2 === Infinity) return false;
  return Math.abs(slope1 - slope2) < tolerance;
};

/**
 * Helper: Check if two lines are perpendicular (slopes multiply to -1)
 */
const arePerpendicular = (slope1, slope2, tolerance = 0.1) => {
  if (slope1 === Infinity) return Math.abs(slope2) < tolerance;
  if (slope2 === Infinity) return Math.abs(slope1) < tolerance;
  return Math.abs(slope1 * slope2 + 1) < tolerance;
};

/**
 * Detect properties from vertex coordinates
 * @param {Array<number>} vertices - [x1, y1, x2, y2, x3, y3, x4, y4]
 * @returns {Object} Detected properties
 */
const detectProperties = (vertices) => {
  if (!vertices || vertices.length !== 8) {
    console.error('detectProperties: Invalid vertices array', vertices);
    return null;
  }

  const [x1, y1, x2, y2, x3, y3, x4, y4] = vertices;
  
  // Calculate side lengths
  const side1 = calculateDistance(x1, y1, x2, y2);
  const side2 = calculateDistance(x2, y2, x3, y3);
  const side3 = calculateDistance(x3, y3, x4, y4);
  const side4 = calculateDistance(x4, y4, x1, y1);
  
  // Calculate diagonal lengths
  const diag1 = calculateDistance(x1, y1, x3, y3);
  const diag2 = calculateDistance(x2, y2, x4, y4);
  
  // Calculate angles at each vertex
  const angle1 = calculateAngle(x4, y4, x1, y1, x2, y2);
  const angle2 = calculateAngle(x1, y1, x2, y2, x3, y3);
  const angle3 = calculateAngle(x2, y2, x3, y3, x4, y4);
  const angle4 = calculateAngle(x3, y3, x4, y4, x1, y1);
  
  // Calculate slopes
  const slope1 = calculateSlope(x1, y1, x2, y2);
  const slope2 = calculateSlope(x2, y2, x3, y3);
  const slope3 = calculateSlope(x3, y3, x4, y4);
  const slope4 = calculateSlope(x4, y4, x1, y1);
  const slopeDiag1 = calculateSlope(x1, y1, x3, y3);
  const slopeDiag2 = calculateSlope(x2, y2, x4, y4);
  
  // Tolerance for comparisons
  const lengthTolerance = 5; // pixels
  const angleTolerance = 2; // degrees
  
  // Check side equality
  const sidesEqual = (s1, s2) => Math.abs(s1 - s2) < lengthTolerance;
  const anglesEqual = (a1, a2) => Math.abs(a1 - a2) < angleTolerance;
  const isRightAngle = (angle) => Math.abs(angle - 90) < angleTolerance;
  
  // Detect equal sides
  const equalSidePairs = [];
  if (sidesEqual(side1, side2) && sidesEqual(side2, side3) && sidesEqual(side3, side4)) {
    equalSidePairs.push([0, 1, 2, 3]); // All equal
  } else {
    if (sidesEqual(side1, side2)) equalSidePairs.push([0, 1]);
    if (sidesEqual(side2, side3)) equalSidePairs.push([1, 2]);
    if (sidesEqual(side3, side4)) equalSidePairs.push([2, 3]);
    if (sidesEqual(side4, side1)) equalSidePairs.push([3, 0]);
    if (sidesEqual(side1, side3)) equalSidePairs.push([0, 2]);
    if (sidesEqual(side2, side4)) equalSidePairs.push([1, 3]);
  }
  
  // Detect parallel sides
  const parallelPairs = [];
  if (areParallel(slope1, slope3)) parallelPairs.push([0, 2]);
  if (areParallel(slope2, slope4)) parallelPairs.push([1, 3]);
  
  // Detect right angles
  const rightAngles = [];
  if (isRightAngle(angle1)) rightAngles.push(0);
  if (isRightAngle(angle2)) rightAngles.push(1);
  if (isRightAngle(angle3)) rightAngles.push(2);
  if (isRightAngle(angle4)) rightAngles.push(3);
  
  // Detect equal angles
  const equalAnglePairs = [];
  if (anglesEqual(angle1, angle2)) equalAnglePairs.push([0, 1]);
  if (anglesEqual(angle2, angle3)) equalAnglePairs.push([1, 2]);
  if (anglesEqual(angle3, angle4)) equalAnglePairs.push([2, 3]);
  if (anglesEqual(angle4, angle1)) equalAnglePairs.push([3, 0]);
  if (anglesEqual(angle1, angle3)) equalAnglePairs.push([0, 2]);
  if (anglesEqual(angle2, angle4)) equalAnglePairs.push([1, 3]);
  
  return {
    sides: [side1, side2, side3, side4],
    diagonals: [diag1, diag2],
    angles: [angle1, angle2, angle3, angle4],
    slopes: [slope1, slope2, slope3, slope4],
    
    parallelSides: parallelPairs.length === 0 ? 'none' : 
                   parallelPairs.length === 1 ? 'one-pair' : 'two-pairs',
    parallelPairs: parallelPairs,
    
    sideEquality: equalSidePairs.length === 0 ? 'all-different' :
                  equalSidePairs[0]?.length === 4 ? 'all-equal' :
                  equalSidePairs.length >= 2 ? 'two-pairs' : 'one-pair',
    equalSidePairs: equalSidePairs,
    
    rightAngles: rightAngles,
    equalAnglePairs: equalAnglePairs,
    allAnglesEqual: rightAngles.length === 4 || 
                    (equalAnglePairs.length >= 2 && 
                     anglesEqual(angle1, angle2) && anglesEqual(angle2, angle3)),
    
    oppositeAnglesEqual: anglesEqual(angle1, angle3) && anglesEqual(angle2, angle4),
    adjacentAnglesSupplementary: Math.abs(angle1 + angle2 - 180) < angleTolerance &&
                                  Math.abs(angle2 + angle3 - 180) < angleTolerance,
    
    diagonalsEqual: sidesEqual(diag1, diag2),
    diagonalsPerpendicular: arePerpendicular(slopeDiag1, slopeDiag2)
  };
};

/**
 * Get quadrilateral configuration by type
 */
const getQuadConfig = (quadType) => {
  return QuadrilateralConfig[quadType] || QuadrilateralConfig.irregular;
};

/**
 * Get list of all quadrilateral types
 */
const getQuadTypes = () => {
  return Object.keys(QuadrilateralConfig);
};

// Export for global access
if (typeof window !== 'undefined') {
  window.QuadrilateralConfig = {
    config: QuadrilateralConfig,
    getQuadConfig,
    getQuadTypes,
    detectProperties,
    helpers: {
      calculateDistance,
      calculateAngle,
      calculateSlope,
      areParallel,
      arePerpendicular
    }
  };
}

