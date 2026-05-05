/**
 * Solution Step Component - React 18 Optimized
 * 
 * This component displays a hierarchical list of solution steps with numbered main steps
 * and alphabetically labeled sub-steps. Supports highlighting current, past, and future steps.
 */

// Dependencies: React should be loaded before this file

/**
 * Solution Step Component
 */
const SolutionStepComponent = React.memo((props) => {
  const elementId = React.useId();
  const componentId = props.id || elementId;
  
  const {
    position,
    processedStyles,
    elementZIndex,
    // Steps array (correct order with optional subSteps)
    steps = [],
    // Current step/substep tracking (1-indexed)
    currentStep = 1,
    currentSubStep = null, // null means no sub-step is active
    // Header
    headerText = 'Steps to Solve',
    headerFontSize = '24gc',
    headerFontColor = '#ffffff',
    headerBackgroundColor = 'rgba(0, 0, 0, 0.6)',
    // Step styling
    stepFontSize = '18gc',
    stepFontColor = '#000000',
    // State colors
    currentStepColor = '#2196F3', // Blue for current
    pastStepColor = '#4CAF50', // Green for completed
    futureStepColor = '#E0E0E0', // Light gray for future
    // Circle styling
    circleSize = '32gc',
    circleFontSize = '16gc',
    circleBackgroundColor = '#ffffff',
    circleBorderColor = '#333333',
    // Layout
    gap = '8gc',
    subStepIndent = '40gc',
    stepPadding = '12gc',
    stepBorderRadius = '8gc',
    // Collapsible behavior
    collapsible = true,
    // Container styling
    containerBackgroundColor = '#0A0A1A',
    containerBackgroundOpacity = 0.5,
    containerBorderWidth = '2gc',
    containerBorderColor = '#ffffff',
    containerBorderType = 'solid', // 'solid' or 'dashed'
    containerBorderRadius = '8gc',
    containerPadding = '16gc'
  } = props;
  
  // Process gc units using GridCellFontUtils
  const processGcProperty = (value, propertyType = 'fontSize') => {
    if (value && typeof value === 'string' && value.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
      return window.GridCellFontUtils.processGcProperty(value, propertyType);
    }
    return value;
  };
  
  // Process all gc properties
  const processedHeaderFontSize = processGcProperty(headerFontSize, 'fontSize');
  const processedStepFontSize = processGcProperty(stepFontSize, 'fontSize');
  const processedCircleSize = processGcProperty(circleSize, 'width');
  const processedCircleFontSize = processGcProperty(circleFontSize, 'fontSize');
  const processedGap = processGcProperty(gap, 'gap');
  const processedSubStepIndent = processGcProperty(subStepIndent, 'marginLeft');
  const processedStepPadding = processGcProperty(stepPadding, 'padding');
  const processedStepBorderRadius = processGcProperty(stepBorderRadius, 'borderRadius');
  const processedContainerBorderWidth = processGcProperty(containerBorderWidth, 'borderWidth');
  const processedContainerBorderRadius = processGcProperty(containerBorderRadius, 'borderRadius');
  const processedContainerPadding = processGcProperty(containerPadding, 'padding');
  
  // State for expanded steps (when collapsible is true)
  const [expandedSteps, setExpandedSteps] = React.useState(() => {
    // Initially expand the current step if it has sub-steps
    const initial = {};
    steps.forEach((step, index) => {
      if (step.subSteps && step.subSteps.length > 0) {
        // Expand current step by default
        initial[index] = (index + 1) === currentStep;
      }
    });
    return initial;
  });
  
  // Update expanded state when currentStep changes
  React.useEffect(() => {
    if (currentStep > 0 && currentStep <= steps.length) {
      const stepIndex = currentStep - 1;
      if (steps[stepIndex]?.subSteps?.length > 0) {
        setExpandedSteps(prev => ({
          ...prev,
          [stepIndex]: true
        }));
      }
    }
  }, [currentStep, steps]);
  
  // Toggle step expansion
  const toggleStep = React.useCallback((stepIndex) => {
    if (!collapsible) return;
    if (!steps[stepIndex]?.subSteps?.length) return;
    
    setExpandedSteps(prev => ({
      ...prev,
      [stepIndex]: !prev[stepIndex]
    }));
  }, [collapsible, steps]);
  
  // Determine step state (past, current, future)
  const getStepState = React.useCallback((stepIndex) => {
    const stepNum = stepIndex + 1;
    if (stepNum < currentStep) return 'past';
    if (stepNum === currentStep) return 'current';
    return 'future';
  }, [currentStep]);
  
  // Determine sub-step state
  const getSubStepState = React.useCallback((stepIndex, subStepIndex) => {
    const stepNum = stepIndex + 1;
    const subStepNum = subStepIndex + 1;
    
    if (stepNum < currentStep) return 'past';
    if (stepNum > currentStep) return 'future';
    
    // We're in the current step
    if (currentSubStep === null) {
      // No sub-step active, all sub-steps are future within current step
      return 'future';
    }
    
    if (subStepNum < currentSubStep) return 'past';
    if (subStepNum === currentSubStep) return 'current';
    return 'future';
  }, [currentStep, currentSubStep]);
  
  // Get background color based on state
  const getBackgroundColor = React.useCallback((state) => {
    switch (state) {
      case 'past': return pastStepColor;
      case 'current': return currentStepColor;
      case 'future': return futureStepColor;
      default: return futureStepColor;
    }
  }, [pastStepColor, currentStepColor, futureStepColor]);
  
  // Convert number to letter (0 -> 'a', 1 -> 'b', etc.)
  const numberToLetter = (num) => String.fromCharCode(97 + num);
  
  // Helper function to convert hex to rgba (same as InformationAnalysisComponent)
  const hexToRgba = (hex, opacity) => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
      return hex; // Return as-is if not a hex color
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };
  
  // Container styles
  const containerStyle = {
    ...(position?.css || {}),
    ...(processedStyles || {}),
    position: 'absolute',
    zIndex: elementZIndex || 1,
    backgroundColor: hexToRgba(containerBackgroundColor, containerBackgroundOpacity),
    border: `${processedContainerBorderWidth} ${containerBorderType} ${containerBorderColor}`,
    borderRadius: processedContainerBorderRadius,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'inherit'
  };
  
  // Header styles
  const headerStyle = {
    backgroundColor: headerBackgroundColor,
    color: headerFontColor,
    fontSize: processedHeaderFontSize,
    fontWeight: 'bold',
    padding: processedContainerPadding,
    margin: 0
  };
  
  // Steps container styles
  const stepsContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: processedGap,
    padding: processedContainerPadding
  };
  
  // Step row styles
  const getStepRowStyle = (state) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: processedStepPadding,
    backgroundColor: getBackgroundColor(state),
    borderRadius: processedStepBorderRadius,
    cursor: collapsible ? 'pointer' : 'default',
    transition: 'background-color 0.3s ease, transform 0.2s ease',
    userSelect: 'none'
  });
  
  // Sub-step row styles
  const getSubStepRowStyle = (state) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: processedStepPadding,
    marginLeft: processedSubStepIndent,
    backgroundColor: getBackgroundColor(state),
    borderRadius: processedStepBorderRadius,
    transition: 'background-color 0.3s ease, opacity 0.3s ease, transform 0.3s ease'
  });
  
  // Circle styles
  const circleStyle = {
    width: processedCircleSize,
    height: processedCircleSize,
    minWidth: processedCircleSize,
    minHeight: processedCircleSize,
    borderRadius: '50%',
    backgroundColor: circleBackgroundColor,
    border: `2px solid ${circleBorderColor}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: processedCircleFontSize,
    fontWeight: 'bold',
    color: '#333333',
    flexShrink: 0
  };
  
  // Step text styles
  const stepTextStyle = {
    fontSize: processedStepFontSize,
    color: stepFontColor,
    flex: 1,
    lineHeight: 1.4
  };
  
  // Sub-steps container styles (for animation)
  const getSubStepsContainerStyle = (isExpanded) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: processedGap,
    overflow: 'hidden',
    maxHeight: isExpanded ? '1000px' : '0',
    opacity: isExpanded ? 1 : 0,
    transition: 'max-height 0.3s ease, opacity 0.3s ease',
    marginTop: isExpanded ? processedGap : '0'
  });
  
  return React.createElement('div', {
    style: containerStyle,
    'data-component-id': componentId
  }, [
    // Header
    React.createElement('div', {
      key: 'header',
      style: headerStyle
    }, headerText),
    
    // Steps container
    React.createElement('div', {
      key: 'steps-container',
      style: stepsContainerStyle
    }, steps.map((step, stepIndex) => {
      const stepState = getStepState(stepIndex);
      const hasSubSteps = step.subSteps && step.subSteps.length > 0;
      const isExpanded = expandedSteps[stepIndex] || false;
      
      return React.createElement('div', {
        key: `step-${stepIndex}`,
        style: { display: 'flex', flexDirection: 'column' }
      }, [
        // Main step row
        React.createElement('div', {
          key: `step-row-${stepIndex}`,
          style: getStepRowStyle(stepState),
          onClick: () => toggleStep(stepIndex),
          onMouseEnter: (e) => {
            if (collapsible && hasSubSteps) {
              e.currentTarget.style.transform = 'scale(1.01)';
            }
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }
        }, [
          // Number circle
          React.createElement('div', {
            key: `circle-${stepIndex}`,
            style: circleStyle
          }, stepIndex + 1),
          
          // Step text
          React.createElement('div', {
            key: `text-${stepIndex}`,
            style: stepTextStyle
          }, step.text),
          
          // Expand/collapse indicator (if has sub-steps and collapsible)
          hasSubSteps && collapsible ? React.createElement('div', {
            key: `indicator-${stepIndex}`,
            style: {
              fontSize: '16px',
              transition: 'transform 0.3s ease',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
            }
          }, '▼') : null
        ]),
        
        // Sub-steps container
        hasSubSteps ? React.createElement('div', {
          key: `substeps-container-${stepIndex}`,
          style: getSubStepsContainerStyle(isExpanded)
        }, step.subSteps.map((subStep, subStepIndex) => {
          const subStepState = getSubStepState(stepIndex, subStepIndex);
          
          return React.createElement('div', {
            key: `substep-${stepIndex}-${subStepIndex}`,
            style: getSubStepRowStyle(subStepState)
          }, [
            // Letter circle
            React.createElement('div', {
              key: `subcircle-${stepIndex}-${subStepIndex}`,
              style: {
                ...circleStyle,
                width: `calc(${processedCircleSize} * 0.85)`,
                height: `calc(${processedCircleSize} * 0.85)`,
                minWidth: `calc(${processedCircleSize} * 0.85)`,
                minHeight: `calc(${processedCircleSize} * 0.85)`,
                fontSize: `calc(${processedCircleFontSize} * 0.9)`
              }
            }, numberToLetter(subStepIndex)),
            
            // Sub-step text
            React.createElement('div', {
              key: `subtext-${stepIndex}-${subStepIndex}`,
              style: {
                ...stepTextStyle,
                fontSize: `calc(${processedStepFontSize} * 0.9)`
              }
            }, subStep.text)
          ]);
        })) : null
      ]);
    }))
  ]);
});

// Set display name for debugging
SolutionStepComponent.displayName = 'SolutionStepComponent';

// Export to window for global access
if (typeof window !== 'undefined') {
  window.SolutionStepComponent = {
    SolutionStepComponent: SolutionStepComponent
  };
  console.log('✅ SolutionStepComponent loaded and exported to window.SolutionStepComponent');
}

