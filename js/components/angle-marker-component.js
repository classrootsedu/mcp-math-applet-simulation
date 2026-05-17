/**
 * Angle Marker Component - React 18 Optimized
 * 
 * Renders visual angle markers on quadrilaterals:
 * - Arc markers for general angles with optional degree labels
 * - Right angle squares for 90° angles
 * - Equal angle indicators (matching arc marks) for congruent angles
 */

// Dependencies: React, GridCellFontUtils, gridPositions

/**
 * Angle Marker Component
 * @param {Object} props - Component props
 * @param {string} props.id - Component ID
 * @param {number} props.angle - Angle value in degrees
 * @param {string} props.angleType - Type: 'right', 'acute', 'obtuse', 'straight'
 * @param {Array<number>} props.vertexCoords - [x, y] coordinates of the vertex
 * @param {Array<number>} props.point1Coords - [x, y] coordinates of first arm point
 * @param {Array<number>} props.point2Coords - [x, y] coordinates of second arm point
 * @param {boolean} props.showDegrees - Show angle degree label (default: true)
 * @param {boolean} props.showArc - Show arc marker (default: true)
 * @param {string} props.arcColor - Arc color (default: '#0066CC')
 * @param {string} props.arcRadius - Arc radius in gc units (default: '30gc')
 * @param {number} props.arcMarks - Number of arc marks for equal angles (0-3, default: 0)
 * @param {string} props.labelColor - Label text color (default: '#000000')
 * @param {string} props.fontSize - Font size in gc units (default: '12gc')
 * @param {number} props.zIndex - Z-index value (default: 2000)
 */
const AngleMarkerComponent = React.memo((props) => {
  const {
    id,
    angle = 90,
    angleType = 'acute',
    vertexCoords = [0, 0],
    point1Coords = [0, 0],
    point2Coords = [0, 0],
    showDegrees = true,
    showArc = true,
    arcColor = '#0066CC',
    arcRadius = '30gc',
    arcMarks = 0,
    labelColor = '#000000',
    fontSize = '12gc',
    zIndex = 2000
  } = props;

  // Process GC units
  const processGcProperty = (value) => {
    if (typeof GridCellFontUtils !== 'undefined' && GridCellFontUtils.processGcProperty) {
      return GridCellFontUtils.processGcProperty(value);
    }
    return value;
  };

  const processedArcRadius = processGcProperty(arcRadius);
  const processedFontSize = processGcProperty(fontSize);

  // Convert coordinates to percentage-based positioning
  const getPercentageCoords = React.useCallback((coords) => {
    const [x, y] = coords;
    const gridRows = typeof GridPrecisionConfig !== 'undefined' ? 
      GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].rows : 900;
    const gridCols = typeof GridPrecisionConfig !== 'undefined' ? 
      GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].cols : 1600;
    
    return {
      left: `${((x - 1) / gridCols) * 100}%`,
      top: `${((y - 1) / gridRows) * 100}%`
    };
  }, []);

  // Calculate angles for arc positioning
  const calculateArcAngles = React.useCallback(() => {
    const [vx, vy] = vertexCoords;
    const [p1x, p1y] = point1Coords;
    const [p2x, p2y] = point2Coords;

    // Calculate angles from vertex to each point
    const angle1 = Math.atan2(p1y - vy, p1x - vx) * (180 / Math.PI);
    const angle2 = Math.atan2(p2y - vy, p2x - vx) * (180 / Math.PI);

    // Normalize angles to 0-360
    const normalizeAngle = (a) => ((a % 360) + 360) % 360;
    const norm1 = normalizeAngle(angle1);
    const norm2 = normalizeAngle(angle2);

    // Determine start and end angles for the arc (use smaller arc)
    let startAngle = Math.min(norm1, norm2);
    let endAngle = Math.max(norm1, norm2);
    
    // If the arc is greater than 180°, swap to show the smaller arc
    if (endAngle - startAngle > 180) {
      [startAngle, endAngle] = [endAngle, startAngle];
    }

    return { startAngle, endAngle, midAngle: (startAngle + endAngle) / 2 };
  }, [vertexCoords, point1Coords, point2Coords]);

  const arcAngles = React.useMemo(() => calculateArcAngles(), [calculateArcAngles]);

  // Position style for the container
  const containerStyle = React.useMemo(() => {
    const vertexPos = getPercentageCoords(vertexCoords);
    return {
      position: 'absolute',
      left: vertexPos.left,
      top: vertexPos.top,
      width: '0',
      height: '0',
      zIndex: zIndex,
      pointerEvents: 'none'
    };
  }, [vertexCoords, getPercentageCoords, zIndex]);

  // Render right angle square
  const renderRightAngleSquare = React.useMemo(() => {
    if (angleType !== 'right' || !showArc) return null;

    const radiusValue = parseFloat(processedArcRadius);
    const size = radiusValue * 0.4; // Square is smaller than arc radius

    // Calculate rotation to align with the angle
    const rotation = arcAngles.startAngle;

    const squareStyle = {
      position: 'absolute',
      width: `${size}px`,
      height: `${size}px`,
      border: `2px solid ${arcColor}`,
      backgroundColor: 'transparent',
      transform: `rotate(${rotation}deg)`,
      transformOrigin: '0 0',
      top: '0',
      left: '0'
    };

    return React.createElement('div', {
      key: 'right-angle-square',
      className: 'angle-marker-right-square',
      style: squareStyle
    });
  }, [angleType, showArc, processedArcRadius, arcColor, arcAngles]);

  // Render arc using SVG
  const renderArc = React.useMemo(() => {
    if (!showArc || angleType === 'right') return null;

    const radiusValue = parseFloat(processedArcRadius);
    const { startAngle, endAngle } = arcAngles;

    // Convert angles to radians
    const startRad = startAngle * (Math.PI / 180);
    const endRad = endAngle * (Math.PI / 180);

    // Calculate arc path
    const startX = radiusValue * Math.cos(startRad);
    const startY = radiusValue * Math.sin(startRad);
    const endX = radiusValue * Math.cos(endRad);
    const endY = radiusValue * Math.sin(endRad);

    const largeArcFlag = (endAngle - startAngle) > 180 ? 1 : 0;

    const pathData = `M ${startX} ${startY} A ${radiusValue} ${radiusValue} 0 ${largeArcFlag} 1 ${endX} ${endY}`;

    const svgSize = radiusValue * 2.5;
    const svgStyle = {
      position: 'absolute',
      left: `-${radiusValue * 1.25}px`,
      top: `-${radiusValue * 1.25}px`,
      width: `${svgSize}px`,
      height: `${svgSize}px`,
      overflow: 'visible',
      pointerEvents: 'none'
    };

    // Create multiple arcs for equal angle indicators
    const arcs = [];
    for (let i = 0; i < (arcMarks + 1); i++) {
      const offset = i * 5; // Offset each arc by 5px
      const currentRadius = radiusValue - offset;
      
      const arcStartX = currentRadius * Math.cos(startRad);
      const arcStartY = currentRadius * Math.sin(startRad);
      const arcEndX = currentRadius * Math.cos(endRad);
      const arcEndY = currentRadius * Math.sin(endRad);
      
      const arcPath = `M ${arcStartX} ${arcStartY} A ${currentRadius} ${currentRadius} 0 ${largeArcFlag} 1 ${arcEndX} ${arcEndY}`;

      arcs.push(
        React.createElement('path', {
          key: `arc-${i}`,
          d: arcPath,
          fill: 'none',
          stroke: arcColor,
          strokeWidth: '2',
          transform: `translate(${radiusValue * 1.25}, ${radiusValue * 1.25})`
        })
      );
    }

    return React.createElement('svg', {
      key: 'arc-svg',
      className: 'angle-marker-arc',
      style: svgStyle,
      xmlns: 'http://www.w3.org/2000/svg'
    }, arcs);
  }, [showArc, angleType, processedArcRadius, arcAngles, arcColor, arcMarks]);

  // Render degree label
  const renderDegreeLabel = React.useMemo(() => {
    if (!showDegrees) return null;

    const radiusValue = parseFloat(processedArcRadius);
    const { midAngle } = arcAngles;
    
    // Position label slightly beyond the arc
    const labelDistance = radiusValue * 1.3;
    const midRad = midAngle * (Math.PI / 180);
    const labelX = labelDistance * Math.cos(midRad);
    const labelY = labelDistance * Math.sin(midRad);

    const labelStyle = {
      position: 'absolute',
      left: `${labelX}px`,
      top: `${labelY}px`,
      transform: 'translate(-50%, -50%)',
      fontSize: processedFontSize,
      fontWeight: 'bold',
      color: labelColor,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      padding: '2px 4px',
      borderRadius: '3px',
      whiteSpace: 'nowrap',
      pointerEvents: 'none'
    };

    return React.createElement('div', {
      key: 'degree-label',
      className: 'angle-marker-label',
      style: labelStyle
    }, `${Math.round(angle)}°`);
  }, [showDegrees, processedArcRadius, processedFontSize, labelColor, angle, arcAngles]);

  // Build children array
  const children = React.useMemo(() => {
    const elements = [];
    if (renderRightAngleSquare) elements.push(renderRightAngleSquare);
    if (renderArc) elements.push(renderArc);
    if (renderDegreeLabel) elements.push(renderDegreeLabel);
    return elements;
  }, [renderRightAngleSquare, renderArc, renderDegreeLabel]);

  return React.createElement('div', {
    id: id || `angle-marker-${Math.random().toString(36).substr(2, 9)}`,
    className: `angle-marker angle-marker-${angleType}`,
    style: containerStyle,
    'data-angle': angle,
    'data-angle-type': angleType
  }, children);
});

// Angle Marker Element Configuration
const AngleMarkerElement = {
  angleMarker: {
    type: 'angleMarker',
    zIndex: 2000,
    props: {
      angle: 90,
      angleType: 'right',
      vertexCoords: [0, 0],
      point1Coords: [0, 0],
      point2Coords: [0, 0],
      showDegrees: true,
      showArc: true,
      arcColor: '#0066CC',
      arcRadius: '30gc',
      arcMarks: 0,
      labelColor: '#000000',
      fontSize: '12gc'
    },
    
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('angleMarker', (props, elementId) => {
      return React.createElement(AngleMarkerComponent, props);
    })
  }
};

// Export to window for global access
if (typeof window !== 'undefined') {
  window.AngleMarkerComponent = {
    AngleMarkerComponent,
    AngleMarkerElement
  };
}

