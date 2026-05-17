/**
 * Property Panel Component - React 18 Optimized
 * 
 * A text-based panel showing quadrilateral properties in checklist format.
 * Displays properties with checkmarks/crosses organized by category.
 */

// Dependencies: React, GridCellFontUtils

/**
 * Property Panel Component
 * @param {Object} props - Component props
 * @param {string} props.id - Component ID
 * @param {Object} props.properties - Properties object from quadrilateral config
 * @param {string} props.quadName - Name of the quadrilateral
 * @param {Array<number>} props.coordinates - Panel position [x1, y1, x2, y2]
 * @param {string} props.backgroundColor - Background color (default: 'rgba(255, 255, 255, 0.95)')
 * @param {string} props.borderColor - Border color (default: '#333333')
 * @param {string} props.textColor - Text color (default: '#000000')
 * @param {string} props.fontSize - Font size in gc units (default: '14gc')
 * @param {string} props.padding - Padding in gc units (default: '15gc')
 * @param {number} props.zIndex - Z-index value (default: 3000)
 */
const PropertyPanelComponent = React.memo((props) => {
  const {
    id,
    properties = {},
    quadName = 'Quadrilateral',
    coordinates = [50, 50, 400, 700],
    backgroundColor = 'rgba(255, 255, 255, 0.95)',
    borderColor = '#333333',
    textColor = '#000000',
    fontSize = '14gc',
    padding = '15gc',
    zIndex = 3000
  } = props;

  // Process GC units
  const processGcProperty = (value) => {
    if (typeof GridCellFontUtils !== 'undefined' && GridCellFontUtils.processGcProperty) {
      return GridCellFontUtils.processGcProperty(value);
    }
    return value;
  };

  const processedFontSize = processGcProperty(fontSize);
  const processedPadding = processGcProperty(padding);

  // Calculate position from coordinates
  const getPositionFromCoordinates = React.useCallback(() => {
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 4) {
      const [x1, y1, x2, y2] = coordinates;
      const gridRows = typeof GridPrecisionConfig !== 'undefined' ? 
        GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].rows : 900;
      const gridCols = typeof GridPrecisionConfig !== 'undefined' ? 
        GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].cols : 1600;
      
      const left = ((x1 - 1) / gridCols) * 100;
      const top = ((y1 - 1) / gridRows) * 100;
      const width = ((x2 - x1 + 1) / gridCols) * 100;
      const height = ((y2 - y1 + 1) / gridRows) * 100;
      
      return {
        left: `${left.toFixed(2)}%`,
        top: `${top.toFixed(2)}%`,
        width: `${width.toFixed(2)}%`,
        height: `${height.toFixed(2)}%`
      };
    }
    return {};
  }, [coordinates]);

  const position = React.useMemo(() => getPositionFromCoordinates(), [getPositionFromCoordinates]);

  // Container style
  const containerStyle = React.useMemo(() => ({
    position: 'absolute',
    ...position,
    backgroundColor: backgroundColor,
    border: `2px solid ${borderColor}`,
    borderRadius: '8px',
    padding: processedPadding,
    boxSizing: 'border-box',
    color: textColor,
    fontSize: processedFontSize,
    fontFamily: 'Arial, sans-serif',
    zIndex: zIndex,
    overflow: 'auto',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  }), [position, backgroundColor, borderColor, textColor, processedFontSize, processedPadding, zIndex]);

  // Format property values for display
  const formatPropertyValue = (value) => {
    if (typeof value === 'boolean') {
      return value ? '✓' : '✗';
    }
    if (typeof value === 'string') {
      return value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    return '-';
  };

  // Check if property is true/positive
  const isPropertyTrue = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value !== 'none' && value !== 'all-different';
    if (typeof value === 'number') return value > 0;
    if (Array.isArray(value)) return value.length > 0;
    return false;
  };

  // Create property rows
  const createPropertyRow = (label, value, key) => {
    const isTrue = isPropertyTrue(value);
    const icon = isTrue ? '✓' : '✗';
    const iconColor = isTrue ? '#00AA00' : '#CC0000';
    
    return React.createElement('div', {
      key: key,
      className: 'property-row',
      style: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '8px',
        paddingLeft: '10px'
      }
    }, [
      React.createElement('span', {
        key: 'icon',
        className: 'property-icon',
        style: {
          color: iconColor,
          fontWeight: 'bold',
          marginRight: '8px',
          fontSize: '1.1em'
        }
      }, icon),
      React.createElement('span', {
        key: 'label',
        className: 'property-label',
        style: {
          flex: 1
        }
      }, label),
      React.createElement('span', {
        key: 'value',
        className: 'property-value',
        style: {
          fontWeight: 'bold',
          color: '#555555'
        }
      }, formatPropertyValue(value))
    ]);
  };

  // Create category section
  const createCategorySection = (title, items, key) => {
    return React.createElement('div', {
      key: key,
      className: 'property-category',
      style: {
        marginBottom: '15px'
      }
    }, [
      React.createElement('h4', {
        key: 'title',
        className: 'category-title',
        style: {
          margin: '0 0 8px 0',
          fontSize: '1.1em',
          fontWeight: 'bold',
          borderBottom: `1px solid ${borderColor}`,
          paddingBottom: '4px',
          color: '#333333'
        }
      }, title),
      React.createElement('div', {
        key: 'items',
        className: 'category-items'
      }, items)
    ]);
  };

  // Build property sections
  const propertySections = React.useMemo(() => {
    const sections = [];

    // Title
    sections.push(
      React.createElement('h3', {
        key: 'title',
        className: 'panel-title',
        style: {
          margin: '0 0 15px 0',
          fontSize: '1.3em',
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#000000',
          borderBottom: `2px solid ${borderColor}`,
          paddingBottom: '8px'
        }
      }, quadName)
    );

    // Sides - Parallel
    if (properties.parallelSides !== undefined) {
      const items = [
        createPropertyRow('Parallel Sides', properties.parallelSides, 'parallel')
      ];
      sections.push(createCategorySection('Parallel Sides', items, 'section-parallel'));
    }

    // Sides - Equality
    if (properties.sideEquality !== undefined) {
      const items = [
        createPropertyRow('Side Equality', properties.sideEquality, 'equality')
      ];
      sections.push(createCategorySection('Side Equality', items, 'section-equality'));
    }

    // Angles
    const angleItems = [];
    if (properties.allAnglesEqual !== undefined) {
      angleItems.push(createPropertyRow('All Angles Equal', properties.allAnglesEqual, 'all-equal'));
    }
    if (properties.oppositeAnglesEqual !== undefined) {
      angleItems.push(createPropertyRow('Opposite Angles Equal', properties.oppositeAnglesEqual, 'opp-equal'));
    }
    if (properties.adjacentAnglesSupplementary !== undefined) {
      angleItems.push(createPropertyRow('Adjacent Supplementary', properties.adjacentAnglesSupplementary, 'adj-supp'));
    }
    if (properties.rightAngles !== undefined && Array.isArray(properties.rightAngles)) {
      angleItems.push(createPropertyRow('Right Angles', properties.rightAngles.length > 0 ? `${properties.rightAngles.length} angles` : 'None', 'right-angles'));
    }
    if (angleItems.length > 0) {
      sections.push(createCategorySection('Angles', angleItems, 'section-angles'));
    }

    // Diagonals
    const diagonalItems = [];
    if (properties.diagonalsEqual !== undefined) {
      diagonalItems.push(createPropertyRow('Equal Diagonals', properties.diagonalsEqual, 'diag-equal'));
    }
    if (properties.diagonalsBisect !== undefined) {
      const bisectValue = properties.diagonalsBisect === 'one' ? 'One bisects' : properties.diagonalsBisect;
      diagonalItems.push(createPropertyRow('Bisecting Diagonals', bisectValue, 'diag-bisect'));
    }
    if (properties.diagonalsPerpendicular !== undefined) {
      diagonalItems.push(createPropertyRow('Perpendicular Diagonals', properties.diagonalsPerpendicular, 'diag-perp'));
    }
    if (diagonalItems.length > 0) {
      sections.push(createCategorySection('Diagonals', diagonalItems, 'section-diagonals'));
    }

    // Symmetry
    const symmetryItems = [];
    if (properties.lineSymmetry !== undefined) {
      symmetryItems.push(createPropertyRow('Line Symmetry', properties.lineSymmetry > 0 ? `${properties.lineSymmetry} lines` : 'None', 'line-sym'));
    }
    if (properties.rotationalSymmetry !== undefined) {
      const rotValue = properties.rotationalSymmetry && properties.rotationalOrder ? 
        `Order ${properties.rotationalOrder}` : properties.rotationalSymmetry;
      symmetryItems.push(createPropertyRow('Rotational Symmetry', rotValue, 'rot-sym'));
    }
    if (symmetryItems.length > 0) {
      sections.push(createCategorySection('Symmetry', symmetryItems, 'section-symmetry'));
    }

    return sections;
  }, [properties, quadName, borderColor]);

  return React.createElement('div', {
    id: id || `property-panel-${Math.random().toString(36).substr(2, 9)}`,
    className: 'property-panel',
    style: containerStyle,
    'data-quad-name': quadName
  }, propertySections);
});

// Property Panel Element Configuration
const PropertyPanelElement = {
  propertyPanel: {
    type: 'propertyPanel',
    coordinates: [50, 50, 400, 700],
    zIndex: 3000,
    props: {
      properties: {},
      quadName: 'Quadrilateral',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#333333',
      textColor: '#000000',
      fontSize: '14gc',
      padding: '15gc'
    },
    
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('propertyPanel', (props, elementId) => {
      return React.createElement(PropertyPanelComponent, props);
    })
  }
};

// Export to window for global access
if (typeof window !== 'undefined') {
  window.PropertyPanelComponent = {
    PropertyPanelComponent,
    PropertyPanelElement
  };
}

