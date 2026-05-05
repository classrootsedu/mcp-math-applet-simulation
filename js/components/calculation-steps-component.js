/**
 * Calculation Steps Component - React 18 Optimized
 * 
 * This component displays calculation steps progressively with:
 * - Text stacking (previous steps remain visible)
 * - Optional images via ImageStackComponent
 * - Global blanks with per-step property updates
 * - Configurable reveal button
 * - Optional explanation text area
 */

// Dependencies: SharedUtilities, GridCellFontUtils, ImageStackComponent, InteractionComponents should be loaded before this file

/**
 * Calculation Steps Component
 * 
 * @param {Object} props - Component properties
 * @param {String} props.mode - Display mode: 'text-only' or 'text+image' (default: 'text-only')
 * @param {Array} props.steps - Array of step objects: [{text, images, buttonText, blankChanges, explanationText}, ...]
 * @param {Array} props.textCoordinates - [x1, y1, x2, y2] for text display area
 * @param {Array} props.imageCoordinates - [x1, y1, x2, y2] for image display (text+image mode)
 * @param {Array} props.buttonCoordinates - [x1, y1, x2, y2] for reveal button
 * @param {Array} props.explanationCoordinates - [x1, y1, x2, y2] for explanation text (optional)
 * @param {String} props.stepGap - Gap between step texts (default: '5gc')
 * @param {Array} props.blanks - Array of blank objects (FillBlanksComponent format)
 * @param {String} props.defaultButtonText - Default button text (default: 'Next')
 * @param {Object} props.textStyle - Additional styles for text area
 * @param {Object} props.buttonStyle - Additional styles for button
 * @param {Object} props.explanationStyle - Additional styles for explanation area
 * @param {Boolean} props.animateTransitions - Enable animations (default: true)
 * @param {Boolean} props.disabled - Disable component interactions
 * @param {String} props.id - Component ID
 */
const CalculationStepsComponent = React.memo((props) => {
  const elementId = React.useId();
  const componentId = props.id || elementId;
  
  // Extract page number from component ID (e.g., 'page6-calc-steps' -> 'page6')
  const pageMatch = componentId.match(/page(\d+)/);
  const pageId = pageMatch ? `page${pageMatch[1]}` : 'default';
  
  // Function to convert LaTeX fractions to HTML fractions
  const convertLatexFractions = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // Match LaTeX fraction pattern: $\frac{numerator}{denominator}$
    const fractionPattern = /\$\\frac\{([^}]+)\}\{([^}]+)\}\$/g;
    
    return text.replace(fractionPattern, (match, numerator, denominator) => {
      // Create HTML fraction with proper styling
      return `<span style="display: inline-block; vertical-align: middle; text-align: center; line-height: 1.2;">
        <span style="display: block; border-bottom: 1px solid currentColor; padding: 0 2px;">${numerator}</span>
        <span style="display: block; padding: 0 2px;">${denominator}</span>
      </span>`;
    });
  };
  
  const {
    mode = 'text-only',
    steps = [],
    textCoordinates = [],
    imageCoordinates = [],
    buttonCoordinates = [],
    explanationCoordinates = [],
    stepGap = '5gc',
    blanks = [],
    defaultButtonText = 'Next',
    buttonTextSize = null, // Font size for button text (e.g., '24gc', '20px')
    textStyle = {},
    buttonStyle = {},
    explanationStyle = {},
    // Tap GIF props
    showTapGif = false, // Show tap.gif animation
    tapGifCoordinates = [], // [x1, y1, x2, y2] coordinates for tap.gif
    tapGifOpacity = 1.0, // Opacity for tap.gif (0.0 to 1.0)
    tapGifSrc = 'assets/tap.gif', // Source path for tap.gif
    animateTransitions = true,
    disabled = false,
    position,
    processedStyles,
    elementZIndex = 1000,
    // Blank tile properties (from FillBlanksComponent)
    blankBorderWidth = '2gc',
    blankBorderColor = '#ffffff',
    blankBorderType = 'solid',
    blankBackgroundColor = 'transparent',
    blankFontSize = '24gc',
    blankFontColor = '#ffffff',
    // Card styling props
    showCards = false, // Enable/disable card styling
    cardBackgroundColor = 'rgba(0, 0, 0, 0.3)',
    cardBorder = '2gc solid rgba(255, 255, 255, 0.3)',
    cardBorderRadius = '10gc',
    // Separate padding props (if not provided, falls back to cardPadding)
    cardPadding = '15gc', // Default padding (used if individual padding props not set)
    cardPaddingTop = null, // Top padding (e.g., '15gc', '20px')
    cardPaddingBottom = null, // Bottom padding (e.g., '15gc', '20px')
    cardPaddingLeft = null, // Left padding (e.g., '15gc', '20px')
    cardPaddingRight = null, // Right padding (e.g., '15gc', '20px')
    cardBoxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)',
    cardWidth = '100%', // Width of the card (can be '100%', 'auto', or specific size like '400gc', '500px', etc.)
    cardMaxWidth = null, // Maximum width of the card (e.g., '600gc', '800px')
    cardMinWidth = null, // Minimum width of the card (e.g., '200gc', '300px')
    // Step number circle props
    showStepNumber = false, // Show step number in a circle on the left edge
    stepNumberSize = '40gc', // Size of the step number circle (diameter)
    stepNumberColor = '#ffffff', // Font color of the step number text
    stepNumberBackgroundColor = '#00FF7F', // Background color of the circle
    stepNumberBorder = '2gc solid #ffffff', // Border of the circle (full border string, e.g., '2gc solid #ffffff')
    stepNumberBorderColor = null, // Border color (if provided, overrides color in stepNumberBorder)
    stepNumberBorderWidth = null, // Border width (if provided, overrides width in stepNumberBorder)
    stepNumberBorderStyle = null, // Border style (if provided, overrides style in stepNumberBorder)
    stepNumberFontSize = '24gc', // Font size of the step number
    stepNumberFontWeight = 'bold', // Font weight of the step number
    // Step explainer props
    explainerFontSize = '28gc', // Font size for step explainers
    explainerColor = '#ffffff', // Text color for step explainers
    explainerFontWeight = 'normal', // Font weight for step explainers
    explainerFontStyle = 'italic', // Font style for step explainers (italic, normal, etc.)
    explainerMarginBottom = '10gc', // Margin bottom for step explainers
    // Header props
    headerText = '',
    headerColor = '#ffffff',
    headerCoordinates = [],
    headerFontSize = '36gc',
    // Line props
    lineCoordinates = [],
    lineColor = '#00FF7F',
    lineThickness = '3gc',
    lineStyle = 'solid',
    initialStepIndex = 0, // Initial step index to show (default: 0)
    ...otherProps
  } = props;
  
  console.log('🧮 [CalculationSteps] Component rendered with props:', props);
  
  // Initialize global state store if it doesn't exist
  if (typeof window !== 'undefined' && !window.calculationStepsStateStore) {
    window.calculationStepsStateStore = {};
  }
  
  // State for current step index
  const [currentStepIndex, setCurrentStepIndex] = React.useState(initialStepIndex);
  
  // State for steps array (allows dynamic updates)
  const [dynamicSteps, setDynamicSteps] = React.useState(steps);
  
  // Update dynamicSteps when steps prop changes
  React.useEffect(() => {
    setDynamicSteps(steps);
  }, [steps]);
  
  // Listen for updateCalculationStep event (for page 9, 11, and 12)
  React.useEffect(() => {
    if (pageId !== 'page9' && pageId !== 'page11' && pageId !== 'page12') return; // Only listen for pages 9, 11, and 12
    
    const handleUpdateCalculationStep = (event) => {
      console.log('🔍 [CalculationSteps] Received updateCalculationStep event:', event.detail);
      const { stepIndex, newText } = event.detail;
      
      if (stepIndex === 0 && newText && pageId === 'page9') {
        // Update step 1's text for page 9
        setDynamicSteps(prevSteps => {
          const updatedSteps = [...prevSteps];
          if (updatedSteps[0]) {
            updatedSteps[0] = {
              ...updatedSteps[0],
              text: newText
            };
          }
          return updatedSteps;
        });
        console.log('✅ [CalculationSteps] Updated step 1 text for page 9');
      } else if (stepIndex === 1 && newText && (pageId === 'page11' || pageId === 'page12')) {
        // Update step 2's text for pages 11 and 12
        setDynamicSteps(prevSteps => {
          const updatedSteps = [...prevSteps];
          if (updatedSteps[1]) {
            updatedSteps[1] = {
              ...updatedSteps[1],
              text: newText
            };
          }
          return updatedSteps;
        });
        console.log('✅ [CalculationSteps] Updated step 2 text for', pageId);
      }
    };
    
    window.addEventListener('updateCalculationStep', handleUpdateCalculationStep);
    
    return () => {
      window.removeEventListener('updateCalculationStep', handleUpdateCalculationStep);
    };
  }, [pageId]);
  
  // State for blank properties (cumulative updates per step)
  const [blankStates, setBlankStates] = React.useState(() => {
    // Initialize with default blank properties
    const initialStates = {};
    blanks.forEach(blank => {
      initialStates[blank.id] = {
        text: blank.text || '',
        bgColor: blank.bgColor || blank.backgroundColor || blankBackgroundColor,
        fontColor: blank.fontColor || blank.color || blankFontColor,
        borderColor: blank.borderColor || blankBorderColor,
        borderBlink: blank.borderBlink || false,
        bgBlink: blank.bgBlink || false,
        hidden: blank.hidden || false
      };
    });
    return initialStates;
  });
  
  // Restore or initialize state when componentId changes (page navigation)
  React.useEffect(() => {
    const stateKey = componentId;
    const savedState = window.calculationStepsStateStore?.[stateKey];
    
    if (savedState) {
      console.log('🔄 [CalculationSteps] Restoring saved state for', componentId);
      setCurrentStepIndex(savedState.currentStepIndex !== undefined ? savedState.currentStepIndex : initialStepIndex);
      setBlankStates(savedState.blankStates || {});
    } else {
      console.log('🔄 [CalculationSteps] Initializing fresh state for', componentId);
      setCurrentStepIndex(initialStepIndex);
      // Reset blank states to initial values
      const initialStates = {};
      blanks.forEach(blank => {
        initialStates[blank.id] = {
          text: blank.text || '',
          bgColor: blank.bgColor || blank.backgroundColor || blankBackgroundColor,
          fontColor: blank.fontColor || blank.color || blankFontColor,
          borderColor: blank.borderColor || blankBorderColor,
          borderBlink: blank.borderBlink || false,
          bgBlink: blank.bgBlink || false,
          hidden: blank.hidden || false
        };
      });
      setBlankStates(initialStates);
    }
  }, [componentId, initialStepIndex]);
  
  // Save state whenever it changes
  React.useEffect(() => {
    const stateKey = componentId;
    if (!window.calculationStepsStateStore) {
      window.calculationStepsStateStore = {};
    }
    
    window.calculationStepsStateStore[stateKey] = {
      currentStepIndex,
      blankStates
    };
    
    console.log('💾 [CalculationSteps] Saved state for', stateKey);
  }, [componentId, currentStepIndex, blankStates]);
  
  // Apply blank changes from current step
  React.useEffect(() => {
    const currentStep = dynamicSteps[currentStepIndex];
    if (currentStep && currentStep.blankChanges && currentStep.blankChanges.length > 0) {
      console.log('🔧 [CalculationSteps] Applying blank changes for step', currentStepIndex, currentStep.blankChanges);
      
      setBlankStates(prevStates => {
        const newStates = { ...prevStates };
        
        currentStep.blankChanges.forEach(change => {
          if (newStates[change.blankId]) {
            // Apply changes (only update provided properties)
            if (change.text !== undefined) newStates[change.blankId].text = change.text;
            if (change.bgColor !== undefined) newStates[change.blankId].bgColor = change.bgColor;
            if (change.fontColor !== undefined) newStates[change.blankId].fontColor = change.fontColor;
            if (change.borderColor !== undefined) newStates[change.blankId].borderColor = change.borderColor;
            if (change.borderBlink !== undefined) newStates[change.blankId].borderBlink = change.borderBlink;
            if (change.bgBlink !== undefined) newStates[change.blankId].bgBlink = change.bgBlink;
            if (change.hidden !== undefined) newStates[change.blankId].hidden = change.hidden;
          }
        });
        
        return newStates;
      });
    }
  }, [currentStepIndex, dynamicSteps]);
  
  // Process gc properties
  const processGcProperty = (value, propertyType) => {
    if (value && typeof value === 'string' && value.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
      return window.GridCellFontUtils.processGcProperty(value, propertyType);
    }
    return value;
  };
  
  const processedStepGap = processGcProperty(stepGap, 'gap');
  const processedBlankFontSize = processGcProperty(blankFontSize, 'fontSize');
  const processedBlankBorderWidth = processGcProperty(blankBorderWidth, 'borderWidth');
  
  // Convert array coordinates [x1, y1, x2, y2] to percentage-based CSS
  const convertCoordinatesToCSS = React.useCallback((coords) => {
    if (!coords || coords.length !== 4) return {};
    const [x1, y1, x2, y2] = coords;
    
    // Use gridPositions if available
    if (typeof gridPositions !== 'undefined' && gridPositions.convertToCSS) {
      const cssPosition = gridPositions.convertToCSS(coords, 'calc-steps', 'page', 'custom');
      return cssPosition.css || cssPosition;
    }
    
    // Fallback calculation
    if (typeof GridPrecisionConfig !== 'undefined') {
      const config = GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision];
      const left = ((x1 - 1) / config.cols) * 100;
      const top = ((y1 - 1) / config.rows) * 100;
      const width = ((x2 - x1) / config.cols) * 100;
      const height = ((y2 - y1) / config.rows) * 100;
      return {
        position: 'absolute',
        left: `${left.toFixed(2)}%`,
        top: `${top.toFixed(2)}%`,
        width: `${width.toFixed(2)}%`,
        height: `${height.toFixed(2)}%`
      };
    }
    
    return {};
  }, []);
  
  // Get current step data (use dynamicSteps instead of steps)
  const currentStep = React.useMemo(() => {
    return dynamicSteps[currentStepIndex] || {};
  }, [dynamicSteps, currentStepIndex]);
  
  // Check if this is the last step
  const isLastStep = currentStepIndex >= dynamicSteps.length - 1;
  
  // Handle reveal button click
  const handleRevealClick = React.useCallback(() => {
    if (disabled) return;
    
    console.log(`🎯 [CalculationSteps] Step ${currentStepIndex} revealed`);
    
    // Move to next step or complete
    if (isLastStep) {
      console.log('✅ [CalculationSteps] All steps completed!');
      
      // Dispatch quizCompleted event
      if (typeof window !== 'undefined') {
        const quizCompletedEvent = new CustomEvent('quizCompleted', {
          detail: {
            componentId: componentId,
            componentType: 'CalculationStepsComponent',
            allStepsCompleted: true,
            totalSteps: dynamicSteps.length,
            pageNumber: window.getCurrentPage?.() || null,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(quizCompletedEvent);
        console.log('✅ [CalculationSteps] Dispatched quizCompleted event');
      }
    } else {
      setCurrentStepIndex(prev => prev + 1);
      console.log(`➡️ [CalculationSteps] Moving to step ${currentStepIndex + 1}`);
    }
    
    // Play click sound if available
    if (typeof window !== 'undefined' && window.playAnswerSound) {
      window.playAnswerSound(true);
    }
  }, [disabled, currentStepIndex, dynamicSteps.length, isLastStep, componentId]);
  
  // Render stacked text (all steps from 0 to currentStepIndex)
  const renderStackedText = React.useMemo(() => {
    if (!textCoordinates || textCoordinates.length !== 4) return null;
    
    const textPosition = convertCoordinatesToCSS(textCoordinates);
    
    // Calculate offset to start cards 1.5x stepGap below header
    let topOffset = null;
    if (headerCoordinates && headerCoordinates.length === 4 && stepGap) {
      // Calculate 1.5x stepGap
      if (typeof stepGap === 'string' && stepGap.includes('gc')) {
        // Parse GC units
        const match = stepGap.match(/^([\d.]+)gc$/);
        if (match) {
          const numericValue = parseFloat(match[1]);
          const offsetGc = `${numericValue * 1.5}gc`;
          topOffset = processGcProperty(offsetGc, 'paddingTop');
        }
      } else {
        // For other units, try to process directly
        const processedGap = processGcProperty(stepGap, 'paddingTop');
        if (processedGap && typeof processedGap === 'string') {
          const match = processedGap.match(/^([\d.]+)(px|gc|em|rem)?$/);
          if (match) {
            const numericValue = parseFloat(match[1]);
            const unit = match[2] || 'px';
            topOffset = `${numericValue * 1.5}${unit}`;
          }
        } else if (typeof processedGap === 'number') {
          topOffset = `${processedGap * 1.5}px`;
        }
      }
    }
    
    // Extract fontSize and color from textStyle for individual step texts
    const stepTextFontSize = textStyle.fontSize || textStyle.fontSize;
    const stepTextColor = textStyle.color || textStyle.color;
    const stepTextFontWeight = textStyle.fontWeight || textStyle.fontWeight;
    const stepTextAlign = textStyle.textAlign || textStyle.textAlign;
    
    // Process fontSize if it's in gc units
    const processedStepTextFontSize = stepTextFontSize ? processGcProperty(stepTextFontSize, 'fontSize') : undefined;
    
    // Process card styling properties if in gc units
    const processedCardBorderRadius = cardBorderRadius ? processGcProperty(cardBorderRadius, 'borderRadius') : undefined;
    
    // Process individual padding props (handle GC units)
    const processedCardPaddingTop = cardPaddingTop ? processGcProperty(cardPaddingTop, 'paddingTop') : undefined;
    const processedCardPaddingBottom = cardPaddingBottom ? processGcProperty(cardPaddingBottom, 'paddingBottom') : undefined;
    const processedCardPaddingLeft = cardPaddingLeft ? processGcProperty(cardPaddingLeft, 'paddingLeft') : undefined;
    const processedCardPaddingRight = cardPaddingRight ? processGcProperty(cardPaddingRight, 'paddingRight') : undefined;
    
    // Use single padding value only if no individual paddings are set
    const useSinglePadding = !cardPaddingTop && !cardPaddingBottom && !cardPaddingLeft && !cardPaddingRight && cardPadding;
    const processedCardPadding = useSinglePadding ? processGcProperty(cardPadding, 'padding') : undefined;
    
    // Process step number circle props
    const processedStepNumberSize = showStepNumber && stepNumberSize ? processGcProperty(stepNumberSize, 'width') : undefined;
    const processedStepNumberFontSize = showStepNumber && stepNumberFontSize ? processGcProperty(stepNumberFontSize, 'fontSize') : undefined;
    
    // Process step number border - use separate props if provided, otherwise parse from stepNumberBorder
    let processedStepNumberBorder = undefined;
    if (showStepNumber) {
      // If separate border props are provided, use them
      if (stepNumberBorderWidth || stepNumberBorderStyle || stepNumberBorderColor) {
        const borderWidth = stepNumberBorderWidth 
          ? (stepNumberBorderWidth.includes('gc') ? processGcProperty(stepNumberBorderWidth, 'borderWidth') : stepNumberBorderWidth)
          : (stepNumberBorder && typeof stepNumberBorder === 'string' 
              ? (() => {
                  const match = stepNumberBorder.match(/^(\d+(?:\.\d+)?)(gc|px|em|rem)?/);
                  return match ? (match[2] === 'gc' ? processGcProperty(`${match[1]}gc`, 'borderWidth') : `${match[1]}${match[2] || 'px'}`) : '2px';
                })()
              : '2px');
        
        const borderStyle = stepNumberBorderStyle || (stepNumberBorder && typeof stepNumberBorder === 'string'
          ? (stepNumberBorder.match(/\s+(solid|dashed|dotted|double)\s+/) || [])[1] || 'solid'
          : 'solid');
        
        const borderColor = stepNumberBorderColor || (stepNumberBorder && typeof stepNumberBorder === 'string'
          ? (stepNumberBorder.match(/\s+(#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)|[a-zA-Z]+)$/) || [])[1] || '#ffffff'
          : '#ffffff');
        
        processedStepNumberBorder = `${borderWidth} ${borderStyle} ${borderColor}`;
      } else if (stepNumberBorder && typeof stepNumberBorder === 'string' && stepNumberBorder.includes('gc')) {
        // Parse from stepNumberBorder string if it contains GC units
        const borderMatch = stepNumberBorder.match(/^(\d+(?:\.\d+)?)gc\s+(solid|dashed|dotted|double)\s+(.+)$/);
        if (borderMatch) {
          const borderWidth = borderMatch[1];
          const borderStyle = borderMatch[2];
          const borderColor = borderMatch[3];
          const processedWidth = processGcProperty(`${borderWidth}gc`, 'borderWidth');
          processedStepNumberBorder = `${processedWidth} ${borderStyle} ${borderColor}`;
        } else {
          processedStepNumberBorder = stepNumberBorder;
        }
      } else if (stepNumberBorder) {
        processedStepNumberBorder = stepNumberBorder;
      }
    }
    
    // Process cardBorder - handle GC units in border width
    let processedCardBorder = cardBorder;
    if (cardBorder && typeof cardBorder === 'string' && cardBorder.includes('gc')) {
      // Parse border string like "2gc solid rgba(255, 255, 255, 0.3)"
      const borderMatch = cardBorder.match(/^(\d+(?:\.\d+)?)gc\s+(solid|dashed|dotted)\s+(.+)$/);
      if (borderMatch) {
        const borderWidth = borderMatch[1];
        const borderStyle = borderMatch[2];
        const borderColor = borderMatch[3];
        const processedWidth = processGcProperty(`${borderWidth}gc`, 'borderWidth');
        processedCardBorder = `${processedWidth} ${borderStyle} ${borderColor}`;
      }
    }
    
    // Process card width properties (handle GC units)
    const processedCardWidth = cardWidth && typeof cardWidth === 'string' && cardWidth.includes('gc') 
      ? processGcProperty(cardWidth, 'width') 
      : cardWidth;
    const processedCardMaxWidth = cardMaxWidth && typeof cardMaxWidth === 'string' && cardMaxWidth.includes('gc')
      ? processGcProperty(cardMaxWidth, 'maxWidth')
      : cardMaxWidth;
    const processedCardMinWidth = cardMinWidth && typeof cardMinWidth === 'string' && cardMinWidth.includes('gc')
      ? processGcProperty(cardMinWidth, 'minWidth')
      : cardMinWidth;
    
    const containerStyle = {
      ...textPosition,
      ...textStyle,
      display: 'flex',
      flexDirection: 'column',
      gap: processedStepGap,
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      overflow: showStepNumber ? 'visible' : 'auto', // Allow overflow when step numbers extend outside
      position: 'absolute',
      zIndex: elementZIndex + 100,
      // Add padding-top to start cards 1.5x stepGap below header
      ...(topOffset && { paddingTop: topOffset })
    };
    
    // Process explainer styling props
    const processedExplainerFontSize = explainerFontSize ? processGcProperty(explainerFontSize, 'fontSize') : undefined;
    
    // Check if any step has answer type (for blinking animation)
    const hasAnswerType = dynamicSteps.some((step, idx) => idx <= currentStepIndex && step?.type === 'answer');
    const blinkBorderKeyframes = hasAnswerType ? `
      @keyframes blink-border-calc-step {
        0%, 100% { border-color: var(--blink-border-start, #00FF7F); }
        50% { border-color: var(--blink-border-end, #00FF00); }
      }
    ` : '';
    
    const stepTexts = [];
    for (let i = 0; i <= currentStepIndex && i < dynamicSteps.length; i++) {
      const step = dynamicSteps[i];
      
      // Render explainer text if provided (before the step)
      if (step && step.explainer) {
        const explainerElement = React.createElement('div', {
          key: `step-explainer-${i}`,
          className: 'calc-step-explainer',
          style: {
            fontSize: processedExplainerFontSize || explainerFontSize,
            color: explainerColor,
            fontWeight: explainerFontWeight,
            fontStyle: explainerFontStyle,
            // No marginBottom - let container's gap property handle spacing
            opacity: animateTransitions ? 1 : 1,
            transition: animateTransitions ? 'opacity 0.3s ease-in-out' : 'none',
            width: '100%'
          }
        }, step.explainer);
        stepTexts.push(explainerElement);
      }
      
      if (step && step.text) {
        const stepTextStyle = {
          opacity: animateTransitions ? 1 : 1,
          transition: animateTransitions ? 'opacity 0.3s ease-in-out' : 'none'
        };
        
        // Apply fontSize and color to individual step text if provided
        if (processedStepTextFontSize) {
          stepTextStyle.fontSize = processedStepTextFontSize;
        }
        
        // Apply type-based styling
        const stepType = step.type || 'calculation'; // Default to 'calculation'
        let typeBasedTextColor = stepTextColor;
        let typeBasedBorder = processedCardBorder || cardBorder;
        let typeBasedBorderBlink = false;
        
        if (stepType === 'formula') {
          // Formula: dashed border, font color = highlightColor1 (#FFD700)
          typeBasedTextColor = '#FFD700'; // highlightColor1
          // Parse existing border to change style to dashed
          if (typeBasedBorder && typeof typeBasedBorder === 'string') {
            const borderMatch = typeBasedBorder.match(/^([\d.]+(?:px|gc|em|rem)?)\s+(solid|dashed|dotted)\s+(.+)$/);
            if (borderMatch) {
              typeBasedBorder = `${borderMatch[1]} dashed ${borderMatch[3]}`;
            } else {
              // If can't parse, create dashed border with same width and color
              const widthMatch = typeBasedBorder.match(/^([\d.]+(?:px|gc|em|rem)?)/);
              const colorMatch = typeBasedBorder.match(/#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)|[a-zA-Z]+/);
              const width = widthMatch ? widthMatch[1] : '2gc';
              const color = colorMatch ? colorMatch[0] : 'rgba(255, 255, 255, 0.4)';
              typeBasedBorder = `${width} dashed ${color}`;
            }
          }
        } else if (stepType === 'answer') {
          // Answer: bg = highlightColor4 (#00FF7F), border = highlightColor4, blinking, font color = black
          typeBasedTextColor = '#000000'; // Black font color
          // Parse existing border to change color to highlightColor4
          if (typeBasedBorder && typeof typeBasedBorder === 'string') {
            const borderMatch = typeBasedBorder.match(/^([\d.]+(?:px|gc|em|rem)?)\s+(solid|dashed|dotted)\s+(.+)$/);
            if (borderMatch) {
              typeBasedBorder = `${borderMatch[1]} ${borderMatch[2]} #00FF7F`; // highlightColor4
            } else {
              // If can't parse, create border with highlightColor4
              const widthMatch = typeBasedBorder.match(/^([\d.]+(?:px|gc|em|rem)?)/);
              const width = widthMatch ? widthMatch[1] : '2gc';
              typeBasedBorder = `${width} solid #00FF7F`; // highlightColor4
            }
          }
          typeBasedBorderBlink = true; // Enable blinking
        }
        
        if (typeBasedTextColor) {
          stepTextStyle.color = typeBasedTextColor;
        }
        if (stepTextFontWeight) {
          stepTextStyle.fontWeight = stepTextFontWeight;
        }
        if (stepTextAlign) {
          stepTextStyle.textAlign = stepTextAlign;
        }
        
         // Calculate step number circle size for positioning (half inside, half outside)
         let stepNumberHalfSize = '20px'; // Default fallback
         let stepNumberHalfSizeNegative = '-20px'; // Negative value for left positioning
         if (showStepNumber) {
           const stepNumberSizeValue = processedStepNumberSize || stepNumberSize || '40gc';
           if (typeof stepNumberSizeValue === 'string') {
             // Extract numeric value and unit
             const match = stepNumberSizeValue.match(/^([\d.]+)(px|gc|em|rem)?$/);
             if (match) {
               const numericValue = parseFloat(match[1]);
               const unit = match[2] || 'px';
               stepNumberHalfSize = `${numericValue / 2}${unit}`;
               stepNumberHalfSizeNegative = `-${numericValue / 2}${unit}`;
             } else {
               // Fallback: try to parse as number
               const num = parseFloat(stepNumberSizeValue);
               if (!isNaN(num)) {
                 stepNumberHalfSize = `${num / 2}px`;
                 stepNumberHalfSizeNegative = `-${num / 2}px`;
               }
             }
           } else if (typeof stepNumberSizeValue === 'number') {
             stepNumberHalfSize = `${stepNumberSizeValue / 2}px`;
             stepNumberHalfSizeNegative = `-${stepNumberSizeValue / 2}px`;
           }
         }
         
         // Card container style if cards are enabled
         // Process border width for answer type if it contains GC units
         let processedAnswerBorderWidth = '2px';
         if (typeBasedBorderBlink) {
           const borderWidthMatch = typeBasedBorder.match(/^([\d.]+(?:px|gc|em|rem)?)/);
           if (borderWidthMatch) {
             const borderWidth = borderWidthMatch[1];
             if (borderWidth.includes('gc')) {
               processedAnswerBorderWidth = processGcProperty(borderWidth, 'borderWidth') || borderWidth;
             } else {
               processedAnswerBorderWidth = borderWidth;
             }
           }
         }
         
        const cardStyle = showCards ? {
          // For answer type: bg = highlightColor4, for others use default
          backgroundColor: stepType === 'answer' ? '#00FF7F' : cardBackgroundColor,
          // For answer type with blinking, we need to handle border separately
          ...(typeBasedBorderBlink ? {
            borderStyle: 'solid',
            borderWidth: processedAnswerBorderWidth,
            borderColor: '#00FF7F', // Will be animated
            animation: 'blink-border-calc-step 1s ease-in-out infinite',
            '--blink-border-start': '#00FF7F',
            '--blink-border-end': '#00FF00'
          } : {
            border: typeBasedBorder // Use type-based border for formula and calculation
          }),
           borderRadius: processedCardBorderRadius || cardBorderRadius,
           // Use individual padding values if provided, otherwise use single padding value
           ...(processedCardPadding 
             ? { padding: processedCardPadding }
             : {
                 ...(processedCardPaddingTop && { paddingTop: processedCardPaddingTop }),
                 ...(processedCardPaddingBottom && { paddingBottom: processedCardPaddingBottom }),
                 ...(processedCardPaddingLeft && { paddingLeft: processedCardPaddingLeft }),
                 ...(processedCardPaddingRight && { paddingRight: processedCardPaddingRight })
               }
           ),
           boxShadow: cardBoxShadow,
           width: processedCardWidth || cardWidth || '100%',
           ...(processedCardMaxWidth && { maxWidth: processedCardMaxWidth }),
           ...(processedCardMinWidth && { minWidth: processedCardMinWidth }),
           boxSizing: 'border-box',
           position: 'relative', // Make card a positioning context for absolute circle
           display: 'flex',
           alignItems: 'center',
           overflow: 'visible', // Allow circle to extend outside card
           ...(showStepNumber ? {} : { gap: '0' })
         } : {};
         
         // Convert LaTeX fractions to HTML
         const convertedText = convertLatexFractions(step.text);
         // Check if text contains HTML (fractions or other HTML tags)
         const containsHTML = convertedText !== step.text || /<[^>]+>/.test(convertedText);
         
         // Create the step text element
         const stepTextElement = React.createElement('div', {
           key: `step-text-${i}`,
           className: 'calc-step-text',
           style: {
             ...stepTextStyle,
             flex: 1 // Take remaining space
           },
           ...(containsHTML ? { dangerouslySetInnerHTML: { __html: convertedText } } : {})
         }, containsHTML ? null : convertedText);
         
         // Create step number circle if enabled - positioned half inside, half outside
         const stepNumberCircle = showStepNumber ? React.createElement('div', {
           key: `step-number-${i}`,
           className: 'calc-step-number',
           style: {
             position: 'absolute',
             left: stepNumberHalfSizeNegative, // Position half outside (negative half size)
             top: '50%',
             transform: 'translateY(-50%)', // Center vertically
             width: processedStepNumberSize || stepNumberSize,
             height: processedStepNumberSize || stepNumberSize,
             borderRadius: '50%',
             backgroundColor: stepNumberBackgroundColor,
             color: stepNumberColor,
             border: processedStepNumberBorder || stepNumberBorder,
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             fontSize: processedStepNumberFontSize || stepNumberFontSize,
             fontWeight: stepNumberFontWeight,
             flexShrink: 0,
             zIndex: (elementZIndex || 100) + 150 // Ensure circle is above card
           }
         }, (i + 1).toString()) : null;
        
        // Wrap in card if enabled
        if (showCards) {
          stepTexts.push(
            React.createElement('div', {
              key: `step-card-${i}`,
              className: 'calc-step-card',
              style: cardStyle
            }, [stepNumberCircle, stepTextElement].filter(Boolean))
          );
        } else {
          stepTexts.push(stepTextElement);
        }
      }
    }
    
    // Return container with animation styles if needed
    const animationStyles = [];
    if (hasAnswerType && blinkBorderKeyframes) {
      animationStyles.push(
        React.createElement('style', {
          key: 'blink-border-calc-step-keyframes',
          dangerouslySetInnerHTML: { __html: blinkBorderKeyframes }
        })
      );
    }
    
    return React.createElement('div', {
      key: 'text-container',
      className: 'calc-steps-text-container',
      style: containerStyle
    }, [...animationStyles, ...stepTexts]);
  }, [textCoordinates, currentStepIndex, steps, convertCoordinatesToCSS, textStyle, processedStepGap, stepGap, animateTransitions, elementZIndex, processGcProperty, showCards, cardBackgroundColor, cardBorder, cardBorderRadius, cardPadding, cardPaddingTop, cardPaddingBottom, cardPaddingLeft, cardPaddingRight, cardBoxShadow, cardWidth, cardMaxWidth, cardMinWidth, showStepNumber, stepNumberSize, stepNumberColor, stepNumberBackgroundColor, stepNumberBorder, stepNumberBorderColor, stepNumberBorderWidth, stepNumberBorderStyle, stepNumberFontSize, stepNumberFontWeight, explainerFontSize, explainerColor, explainerFontWeight, explainerFontStyle, headerCoordinates]);
  
  // Render images using ImageStackComponent (text+image mode)
  const renderImages = React.useMemo(() => {
    if (mode !== 'text+image' || !imageCoordinates || imageCoordinates.length !== 4) return null;
    if (!currentStep.images || currentStep.images.length === 0) return null;
    
    const ImageStackComp = window.ImageStackComponent?.ImageStackComponent;
    if (!ImageStackComp) {
      console.warn('⚠️ [CalculationSteps] ImageStackComponent not found');
      return null;
    }
    
    const imagePosition = convertCoordinatesToCSS(imageCoordinates);
    
    return React.createElement(ImageStackComp, {
      key: `images-step-${currentStepIndex}`,
      id: `${componentId}-images-${currentStepIndex}`,
      elementName: `${componentId}-images`,
      currentPage: pageId,
      coordinates: imageCoordinates,
      zIndex: elementZIndex + 200,
      images: currentStep.images
    });
  }, [mode, imageCoordinates, currentStep, currentStepIndex, convertCoordinatesToCSS, elementZIndex, componentId, pageId]);
  
  // Process button text size
  const processedButtonTextSize = buttonTextSize ? processGcProperty(buttonTextSize, 'fontSize') : undefined;
  
  // Dispatch quiz completion event when last step is reached (if button is empty)
  React.useEffect(() => {
    if (isLastStep && currentStep && (!currentStep.buttonText || currentStep.buttonText === '')) {
      console.log('✅ [CalculationSteps] Last step reached with empty button - dispatching quizCompleted event');
      
      // Dispatch quizCompleted event
      if (typeof window !== 'undefined') {
        const quizCompletedEvent = new CustomEvent('quizCompleted', {
          detail: {
            componentId: componentId,
            componentType: 'CalculationStepsComponent',
            allStepsCompleted: true,
            totalSteps: dynamicSteps.length,
            pageNumber: window.getCurrentPage?.() || null,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(quizCompletedEvent);
        console.log('✅ [CalculationSteps] Dispatched quizCompleted event (last step with empty button)');
      }
    }
  }, [isLastStep, currentStep, componentId, steps.length]);
  
  // Render reveal button
  const renderButton = React.useMemo(() => {
    if (!buttonCoordinates || buttonCoordinates.length !== 4) return null;
    
    const buttonText = currentStep.buttonText || defaultButtonText;
    
    // Hide button if last step and button text is empty
    if (isLastStep && (!currentStep.buttonText || currentStep.buttonText === '')) {
      return null;
    }
    
    const buttonPosition = convertCoordinatesToCSS(buttonCoordinates);
    
    // Combine button style with text size
    const finalButtonStyle = {
      ...buttonStyle,
      ...(processedButtonTextSize && { fontSize: processedButtonTextSize })
    };
    
    const NextButtonComponent = window.InteractionComponents?.NextButtonComponent;
    if (!NextButtonComponent) {
      console.warn('⚠️ [CalculationSteps] NextButtonComponent not found, rendering basic button');
      return React.createElement('button', {
        key: 'reveal-button',
        onClick: handleRevealClick,
        disabled: disabled,
        style: {
          ...buttonPosition,
          ...finalButtonStyle,
          position: 'absolute',
          zIndex: elementZIndex + 300
        },
        className: 'calc-steps-button'
      }, buttonText);
    }
    
    return React.createElement(NextButtonComponent, {
      key: 'reveal-button',
      text: buttonText,
      onClick: handleRevealClick,
      disabled: disabled,
      ignorePageCompletion: true,
      fontSize: buttonTextSize, // Pass raw fontSize with 'gc' units (NextButtonComponent will process it)
      style: {
        ...buttonPosition,
        ...buttonStyle, // Don't include fontSize in style since it's passed as prop
        position: 'absolute'
      },
      position: {
        css: buttonPosition
      },
      elementZIndex: elementZIndex + 300,
      className: 'calc-steps-button'
    });
  }, [buttonCoordinates, currentStep, defaultButtonText, handleRevealClick, disabled, buttonStyle, processedButtonTextSize, buttonTextSize, convertCoordinatesToCSS, elementZIndex, isLastStep]);
  
  // Render tap GIF
  const renderTapGif = React.useMemo(() => {
    // Hide tapGif on last step
    if (isLastStep || !showTapGif || !tapGifCoordinates || tapGifCoordinates.length !== 4) {
      return null;
    }
    
    const tapGifPosition = convertCoordinatesToCSS(tapGifCoordinates);
    const processedTapGifOpacity = typeof tapGifOpacity === 'number' ? tapGifOpacity : parseFloat(tapGifOpacity) || 1.0;
    
    const tapGifStyle = {
      ...tapGifPosition,
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: elementZIndex + 350, // Above button
      pointerEvents: 'none', // Don't interfere with button clicks
      opacity: processedTapGifOpacity
    };
    
    return React.createElement('div', {
      key: 'calc-tap-gif',
      className: 'calc-steps-tap-gif',
      style: tapGifStyle
    }, React.createElement('img', {
      src: tapGifSrc,
      alt: 'Tap',
      style: {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        pointerEvents: 'none'
      }
    }));
  }, [isLastStep, showTapGif, tapGifCoordinates, tapGifOpacity, tapGifSrc, convertCoordinatesToCSS, elementZIndex]);
  
  // Render explanation text (optional)
  const renderExplanation = React.useMemo(() => {
    if (!explanationCoordinates || explanationCoordinates.length !== 4) return null;
    if (!currentStep.explanationText) return null;
    
    const explanationPosition = convertCoordinatesToCSS(explanationCoordinates);
    
    return React.createElement('div', {
      key: `explanation-${currentStepIndex}`,
      className: 'calc-steps-explanation',
      style: {
        ...explanationPosition,
        ...explanationStyle,
        position: 'absolute',
        opacity: animateTransitions ? 1 : 1,
        transition: animateTransitions ? 'opacity 0.3s ease-in-out' : 'none',
        zIndex: elementZIndex + 150
      }
    }, currentStep.explanationText);
  }, [explanationCoordinates, currentStep, currentStepIndex, explanationStyle, animateTransitions, convertCoordinatesToCSS, elementZIndex]);
  
  // Render blanks (similar to FillBlanksComponent)
  const renderBlanks = React.useMemo(() => {
    if (!blanks || blanks.length === 0) return null;
    
    // Check if any blank has borderBlink or bgBlink enabled
    const hasBlinkingBorders = blanks.some(blank => blankStates[blank.id]?.borderBlink === true);
    const hasBlinkingBackgrounds = blanks.some(blank => blankStates[blank.id]?.bgBlink === true);
    
    const blinkBorderKeyframes = hasBlinkingBorders ? `
      @keyframes blink-border-calc {
        0%, 100% { border-color: var(--blink-border-start, #ffffff); }
        50% { border-color: var(--blink-border-end, #ff0000); }
      }
    ` : '';
    
    const blinkBgKeyframes = hasBlinkingBackgrounds ? `
      @keyframes blink-bg-calc {
        0%, 100% { background-color: var(--blink-bg-start, transparent); }
        50% { background-color: var(--blink-bg-end, #ff0000); }
      }
    ` : '';
    
    const blankElements = blanks.map(blank => {
      const blankState = blankStates[blank.id] || {};
      
      // Skip if hidden
      if (blankState.hidden) return null;
      
      const blankPosition = convertCoordinatesToCSS(blank.coordinate);
      
      const finalBorderColor = blankState.borderColor || blankBorderColor;
      const backgroundColor = blankState.bgColor || blankBackgroundColor;
      const finalFontColor = blankState.fontColor || blankFontColor;
      
      const blankBorderStyle = `${blankBorderType} ${processedBlankBorderWidth} ${finalBorderColor}`;
      
      // Add border blink animation if enabled
      const borderBlinkStyle = blankState.borderBlink === true ? {
        animationName: 'blink-border-calc',
        animationDuration: '1s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
        '--blink-border-start': finalBorderColor,
        '--blink-border-end': finalBorderColor === '#ffffff' ? '#ff0000' : '#ffffff',
        borderStyle: blankBorderType,
        borderWidth: processedBlankBorderWidth,
        borderColor: finalBorderColor
      } : {};
      
      // Add background blink animation if enabled
      const bgBlinkStyle = blankState.bgBlink === true ? {
        animationName: 'blink-bg-calc',
        animationDuration: '1s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
        '--blink-bg-start': backgroundColor,
        '--blink-bg-end': backgroundColor === '#ffffff' || backgroundColor === 'transparent' ? '#ff0000' : '#ffffff'
      } : {};
      
      return React.createElement('div', {
        key: `blank-${blank.id}`,
        'data-blank-id': blank.id,
        className: 'calc-steps-blank',
        style: {
          ...blankPosition,
          ...(blankState.borderBlink === true ? {} : { border: blankBorderStyle }),
          ...(blankState.bgBlink === true ? {} : { backgroundColor: backgroundColor }),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: processedBlankFontSize,
          color: finalFontColor,
          boxSizing: 'border-box',
          padding: '0.5em',
          position: 'absolute',
          transition: animateTransitions ? 'all 0.3s ease' : 'none',
          zIndex: elementZIndex + 250,
          ...borderBlinkStyle,
          ...bgBlinkStyle
        }
      }, blankState.text || '');
    });
    
    // Return blanks with animation styles if needed
    const animationStyles = [];
    if (hasBlinkingBorders && blinkBorderKeyframes) {
      animationStyles.push(
        React.createElement('style', {
          key: 'blink-border-keyframes',
          dangerouslySetInnerHTML: { __html: blinkBorderKeyframes }
        })
      );
    }
    if (hasBlinkingBackgrounds && blinkBgKeyframes) {
      animationStyles.push(
        React.createElement('style', {
          key: 'blink-bg-keyframes',
          dangerouslySetInnerHTML: { __html: blinkBgKeyframes }
        })
      );
    }
    
    if (animationStyles.length > 0) {
      return [...animationStyles, ...blankElements.filter(Boolean)];
    }
    
    return blankElements.filter(Boolean);
  }, [blanks, blankStates, convertCoordinatesToCSS, blankBorderColor, blankBackgroundColor, blankFontColor, blankBorderType, processedBlankBorderWidth, processedBlankFontSize, animateTransitions, elementZIndex]);
  
  // Render header
  const renderHeader = React.useMemo(() => {
    if (!headerText || !headerCoordinates || headerCoordinates.length !== 4) return null;
    
    const headerPosition = convertCoordinatesToCSS(headerCoordinates);
    const processedHeaderFontSize = headerFontSize ? processGcProperty(headerFontSize, 'fontSize') : undefined;
    
    // Check if header text contains HTML tags
    const containsHTML = /<[^>]+>/.test(headerText);
    
    return React.createElement('div', {
      key: 'calc-header',
      className: 'calc-steps-header',
      style: {
        ...headerPosition,
        color: headerColor,
        fontSize: processedHeaderFontSize || headerFontSize,
        fontWeight: 'bold',
        textAlign: 'left',
        position: 'absolute',
        zIndex: elementZIndex + 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
      },
      ...(containsHTML ? { dangerouslySetInnerHTML: { __html: headerText } } : {})
    }, containsHTML ? null : headerText);
  }, [headerText, headerColor, headerCoordinates, headerFontSize, convertCoordinatesToCSS, elementZIndex, processGcProperty]);
  
  // Render line
  const renderLine = React.useMemo(() => {
    if (!lineCoordinates || lineCoordinates.length !== 4) return null;
    
    const [x1, y1, x2, y2] = lineCoordinates;
    const processedLineThickness = lineThickness ? processGcProperty(lineThickness, 'borderWidth') : undefined;
    const thicknessValue = processedLineThickness || (typeof lineThickness === 'string' && lineThickness.includes('gc') ? '3px' : lineThickness) || '3px';
    
    const LineComponent = window.LineComponent?.LineComponent;
    
    if (!LineComponent) {
      console.log('⚠️ [CalculationSteps] LineComponent not available, using fallback div');
      
      // Fallback to a simple div line if LineComponent not available
      const isHorizontal = y1 === y2;
      
      // Convert coordinates to percentages manually for the line
      const gridWidth = 1600;
      const gridHeight = 900;
      const leftPercent = (x1 / gridWidth) * 100;
      const topPercent = (y1 / gridHeight) * 100;
      const widthPercent = ((x2 - x1) / gridWidth) * 100;
      
      const fallbackLineStyle = {
        position: 'absolute',
        left: `${leftPercent.toFixed(2)}%`,
        top: `${topPercent.toFixed(2)}%`,
        width: `${widthPercent.toFixed(2)}%`,
        height: isHorizontal ? thicknessValue : `${((y2 - y1) / gridHeight) * 100}%`,
        backgroundColor: lineColor,
        zIndex: elementZIndex + 75
      };
      
      return React.createElement('div', {
        key: 'calc-line',
        className: 'calc-steps-line',
        style: fallbackLineStyle
      });
    }
    
    // Use LineComponent for proper line rendering
    return React.createElement(LineComponent, {
      key: 'calc-line',
      coordinates: [x1, y1, x2, y2],
      lineType: y1 === y2 ? 'horizontal' : (x1 === x2 ? 'vertical' : 'slanted'),
      borderColor: lineColor,
      borderWidth: processedLineThickness || lineThickness,
      borderStyle: lineStyle, // This is the prop, not a style object
      zIndex: elementZIndex + 75
    });
  }, [lineCoordinates, lineColor, lineThickness, lineStyle, elementZIndex, processGcProperty]);
  
  // Container style
  const containerStyle = React.useMemo(() => {
    return {
      ...(position?.css || {}),
      ...processedStyles,
      position: 'relative',
      width: '100%',
      height: '100%',
      zIndex: elementZIndex
    };
  }, [position, processedStyles, elementZIndex]);
  
  console.log('🎬 [CalculationSteps] Render state:', {
    currentStepIndex,
    totalSteps: steps.length,
    currentStep,
    isLastStep,
    disabled,
    mode
  });
  
  // Main render
  return React.createElement('div', {
    id: componentId,
    className: 'calculation-steps-container',
    style: containerStyle,
    'data-element-type': 'CalculationStepsComponent',
    'data-component-type': 'CalculationStepsComponent',
    'data-current-step': currentStepIndex,
    'data-total-steps': steps.length,
    'data-mode': mode
  }, [
    // Render header
    renderHeader,
    
    // Render line
    renderLine,
    
    // Render stacked text
    renderStackedText,
    
    // Render images (text+image mode)
    renderImages,
    
    // Render blanks
    ...(renderBlanks || []),
    
    // Render explanation text
    renderExplanation,
    
    // Render reveal button
    renderButton,
    
    // Render tap GIF
    renderTapGif
  ].filter(Boolean));
});

// Export for use in elements registry
const CalculationStepsElement = {
  calculationSteps: {
    type: 'calculation-steps',
    coordinates: [0, 0, 1600, 900],
    zIndex: 'var(--z-content)',
    props: {
      mode: 'text-only',
      steps: [],
      textCoordinates: [],
      imageCoordinates: [],
      buttonCoordinates: [],
      explanationCoordinates: [],
      stepGap: '5gc',
      blanks: [],
      defaultButtonText: 'Next'
    },
    
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('calculation-steps', (props, elementId) => {
      return React.createElement(CalculationStepsComponent, props);
    })
  }
};

// Export to global scope
window.CalculationStepsComponent = {
  CalculationStepsComponent: CalculationStepsComponent,
  CalculationStepsElement: CalculationStepsElement
};

console.log('✅ Calculation Steps Component loaded successfully');

