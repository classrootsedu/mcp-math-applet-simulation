/**
 * Progress Components - React 18 Optimized
 * 
 * This file contains progress-related components:
 * - Progress Dots
 */

// Dependencies: SharedUtilities, GridCellFontUtils should be loaded before this file

/**
 * Progress Dots Component with React 18 concurrent features
 */
const ProgressDotsComponent = React.memo((props) => {
  const elementId = React.useId();
  const [isPending, startTransition] = React.useTransition();
  
  // Default values for progress dots
  const {
    backgroundColor = 'transparent',
    borderRadius = '25gc',
    display = 'flex',
    flexDirection = 'row',
    alignItems = 'center',
    justifyContent = 'center',
    gap = '15gc',
    padding = '25gc',
    dotSize = '25gc',
    totalPages = 2,
    activeDotColor = '#4CAF50',
    inactiveDotColor = '#888888',
    activeDotBorder = '2px solid #ffffff',
    inactiveDotBorder = '2px solid #ffffff',
    activeDotShadow = '0 0 10px rgba(255, 171, 64, 0.5)',
    fontSize = '14gc',
    fontWeight = 'bold',
    color = 'white',
    transition = 'all 0.3s ease',
    currentPage = 1,
    ...otherProps
  } = props;
  
  const deferredCurrentPage = React.useDeferredValue(currentPage);
  
  // Get actual page numbers array if mapping functions are available
  const pageNumbers = React.useMemo(() => {
    if (typeof window !== 'undefined' && window.getPageNumbers) {
      return window.getPageNumbers();
    }
    // Fallback: create sequential array if mapping not available
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);
  
  const handleDotClick = React.useCallback((actualPageNumber) => {
    startTransition(() => {
      otherProps.onNavigate?.(actualPageNumber);
    });
  }, [otherProps.onNavigate]);
  
  const dots = React.useMemo(() => {
    return pageNumbers.map((actualPageNumber, index) => {
      const dotPosition = index + 1;
      const isActive = actualPageNumber === deferredCurrentPage;
      
      return React.createElement('div', {
        key: `dot-${actualPageNumber}`,
        className: `progress-dot ${isActive ? 'active' : 'inactive'}`,
        style: GridCellFontUtils.processGcStyles({
          width: dotSize,
          height: dotSize,
          backgroundColor: isActive ? activeDotColor : inactiveDotColor,
          border: isActive ? activeDotBorder : inactiveDotBorder,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: fontSize,
          fontWeight: fontWeight,
          color: color,
          transition: transition,
          opacity: isPending ? 0.7 : 1
        }),
        onClick: () => handleDotClick(actualPageNumber),
        'data-page': actualPageNumber
      }, actualPageNumber.toString());
    });
  }, [pageNumbers, deferredCurrentPage, dotSize, activeDotColor, inactiveDotColor, activeDotBorder, inactiveDotBorder, fontSize, fontWeight, color, transition, isPending, handleDotClick]);
  
  const containerStyle = {
    backgroundColor: backgroundColor,
    borderRadius: borderRadius,
    display: display,
    flexDirection: flexDirection,
    alignItems: alignItems,
    justifyContent: justifyContent,
    gap: gap,
    padding: padding,
    // Apply other props last to allow overrides
    ...otherProps
  };
  
  return React.createElement('div', {
    id: elementId,
    className: 'progress-dots-container',
    style: GridCellFontUtils.processGcStyles(containerStyle),
    'data-element-type': 'progress-dots'
  }, ...dots);
});

// Progress Elements Configuration
const ProgressElements = {
  progressDots: {
    type: 'progress',
    coordinates: [30, 64, 90, 68],
    zIndex: 'var(--z-notification)',
    props: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '50gc',
      padding: '25gc',
      
      // Dot styling
      dotSize: '75gc',
      activeDotColor: '#4CAF50',
      inactiveDotColor: 'rgba(255, 255, 255, 0.3)',
      activeDotBorder: '2px solid #4CAF50',
      inactiveDotBorder: '2px solid rgba(255, 255, 255, 0.5)',
      
      // Animation
      transition: 'all 0.3s ease',
      
      // Text styling (for numbers inside dots)
      fontSize: '45gc',
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center'
    },
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('progress', (props, elementId) => {
      return React.createElement(ProgressDotsComponent, props);
    })
  }
};

// Export components and configuration
window.ProgressComponents = {
  ProgressDotsComponent,
  ProgressElements
};

console.log('✅ Progress components loaded successfully');
