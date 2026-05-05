/**
 * Tile Component - React 18 Optimized
 * 
 * A flexible tile component with mode support (normal, incorrect, correct, focus)
 * Supports standard styling props and coordinates-based positioning
 */

// Dependencies: SharedUtilities, GridCellFontUtils, gridPositions should be loaded before this file

/**
 * Tile Component
 * @param {Object} props - Component props
 * @param {string} props.id - Component ID
 * @param {string} props.elementName - Element name from PageConfig
 * @param {number} props.currentPage - Current page number
 * @param {Array<number>} props.coordinates - [x1, y1, x2, y2] coordinates
 * @param {number|string} props.zIndex - Z-index value
 * @param {string} props.mode - Visual mode: 'normal', 'incorrect', 'correct', or 'focus'
 * @param {string} props.backgroundColor - Background color (default: 'transparent')
 * @param {string} props.borderColor - Border color
 * @param {string} props.borderWidth - Border width (default: '2px')
 * @param {string} props.borderRadius - Border radius (supports gc units)
 * @param {string} props.color - Text color
 * @param {string} props.fontSize - Font size (supports gc units)
 * @param {string} props.fontWeight - Font weight
 * @param {string} props.padding - Padding (supports gc units)
 * @param {string} props.textAlign - Text alignment
 * @param {React.ReactNode} props.children - Child elements
 */
const TileComponent = React.memo((props) => {
  const {
    id,
    elementName,
    currentPage,
    coordinates,
    zIndex,
    mode = 'normal',
    backgroundColor = 'transparent',
    borderColor = '#ffffff',
    borderWidth = '2px',
    borderRadius = '0gc',
    color = '#ffffff',
    fontSize = '28gc',
    fontWeight = 'normal',
    padding = '15gc',
    textAlign = 'center',
    children
  } = props;

  // Get position from gridPositions if coordinates are provided
  const position = React.useMemo(() => {
    if (coordinates && typeof gridPositions !== 'undefined') {
      return gridPositions.getPosition(elementName || id, currentPage);
    }
    return null;
  }, [coordinates, elementName, id, currentPage]);

  // Process GC units for styling
  const processGcProperty = (value) => {
    if (typeof GridCellFontUtils !== 'undefined' && GridCellFontUtils.processGcProperty) {
      return GridCellFontUtils.processGcProperty(value, position?.coordinates || [0, 0, 100, 100]);
    }
    return value;
  };

  // Helper function to get mode-specific styles
  const getModeStyles = (mode) => {
    switch (mode) {
      case 'incorrect':
        return {
          backgroundColor: '#FA8072', // salmon
          border: `${borderWidth} solid #E9967A`, // dark salmon border
          color: '#FFFFFF' // white
        };
      case 'correct':
        return {
          backgroundColor: '#4CAF50', // green
          border: `${borderWidth} solid #45a049`, // dark green border
          color: '#FFFFFF' // white
        };
      case 'focus':
        return {
          backgroundColor: '#FFEB3B', // yellow
          border: `${borderWidth} solid #FFFFFF`, // white border
          color: '#000000' // black
        };
      case 'normal':
      default:
        return null; // No override, use default styles
    }
  };

  // Get mode-specific styles
  const modeStyles = getModeStyles(mode);

  // Get mode-specific animation class
  const getModeClassName = (mode) => {
    switch (mode) {
      case 'incorrect':
        return 'table-cell-wiggle';
      case 'focus':
        return 'table-cell-focus-blink';
      default:
        return '';
    }
  };

  const modeClassName = getModeClassName(mode);

  // Build container style
  const containerStyle = React.useMemo(() => {
    const baseStyle = {
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: backgroundColor,
      borderColor: borderColor,
      borderWidth: borderWidth,
      borderStyle: 'solid',
      borderRadius: processGcProperty(borderRadius),
      color: color,
      fontSize: processGcProperty(fontSize),
      fontWeight: fontWeight,
      padding: processGcProperty(padding),
      textAlign: textAlign,
      boxSizing: 'border-box',
      zIndex: zIndex || 1000
    };

    // Apply position if available
    if (position?.css) {
      Object.assign(baseStyle, position.css);
    }

    // Apply mode styles (override base styles)
    if (modeStyles) {
      Object.assign(baseStyle, modeStyles);
    }

    return baseStyle;
  }, [position, backgroundColor, borderColor, borderWidth, borderRadius, color, fontSize, fontWeight, padding, textAlign, zIndex, modeStyles, mode]);

  // Build className
  const className = ['tile-component', modeClassName].filter(Boolean).join(' ') || undefined;

  return React.createElement('div', {
    id: id || `${elementName}-${currentPage}`,
    className: className,
    style: containerStyle,
    'data-element-name': elementName,
    'data-page': currentPage,
    'data-mode': mode
  }, children);
});

// Tile Element Configuration
const TileElement = {
  tile: {
    type: 'tile',
    coordinates: [0, 0, 100, 100],
    zIndex: 1000,
    props: {
      mode: 'normal',
      backgroundColor: 'transparent',
      borderColor: '#ffffff',
      borderWidth: '2px',
      borderRadius: '0gc',
      color: '#ffffff',
      fontSize: '28gc',
      fontWeight: 'normal',
      padding: '15gc',
      textAlign: 'center'
    },
    
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('tile', (props, elementId) => {
      return React.createElement(TileComponent, props);
    })
  }
};

// Export to window for global access
if (typeof window !== 'undefined') {
  window.TileComponent = {
    TileComponent,
    TileElement
  };
}

