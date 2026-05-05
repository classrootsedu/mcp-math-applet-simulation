/**
 * Fill Blanks Component - React 18 Optimized
 * 
 * This component provides a fill-in-the-blanks interface with blank tiles and option tiles
 */

// Dependencies: SharedUtilities, GridCellFontUtils should be loaded before this file

/**
 * Fill Blanks Component with blank tiles and option tiles
 */
const FillBlanksComponent = React.memo((props) => {
  // Debug: Log when component renders with opt4 coordinate
  if (props.options && Array.isArray(props.options)) {
    const opt4 = props.options.find(opt => opt.id === 'opt4');
    if (opt4) {
      console.log(`🔍 [FillBlanks] Component render - opt4 coordinate:`, opt4.coordinate);
    }
  }
  const elementId = React.useId();
  const componentId = props.id || elementId;
  // Extract page number from component ID (e.g., 'page6-fill-blanks' -> 'page6')
  const pageMatch = componentId.match(/page(\d+)/);
  const pageId = pageMatch ? `page${pageMatch[1]}` : 'page6'; // Default to page6 for backward compatibility
  const feedbackStateKey = `${pageId}FeedbackState`;
  const feedbackEventName = `${pageId}FeedbackUpdate`;
  
  const { 
    position, 
    processedStyles, 
    elementZIndex,
    // Blank tile properties
    blanks = [], // Array of {id: "", coordinate: [x1, y1, x2, y2], image: "", text: "", bgColor: "", fontColor: "", borderColor: "", borderBlink: false, bgBlink: false, isDroppable: true} - text is default text to display, can be updated by option's blankID text. bgColor, fontColor, borderColor override global settings. borderBlink makes border blink between original color and contrast color. bgBlink makes background color blink between original color and contrast color. isDroppable controls whether options can be dropped on this blank (default: true).
    // Blank tile border properties
    blankBorderWidth = '2gc',
    blankBorderColor = '#ffffff',
    blankBorderType = 'solid', // solid or dashed
    blankBackgroundColor = 'transparent',
    // Blank tile font properties
    blankFontSize = '24gc',
    blankFontColor = '#ffffff',
    // Options container properties
    optionsContainerCoordinates = [], // [x1, y1, x2, y2]
    optionsBorderWidth = '2gc',
    optionsBorderColor = '#ffffff',
    optionsBorderType = 'dashed', // dashed or solid
    optionsBackgroundColor = 'transparent',
    showOptionsContainer = true, // Toggle to show/hide options container
    showOptionsContainerBorder = true, // Toggle to show/hide options container border
    showOptionsRowBorders = false, // Toggle to show/hide borders between instruction row and option tray row
    optionContainerInstructionHeight = 15, // Height percentage for instruction row (default 15%)
    optionContainerInstructionText = '', // Text to display in instruction row
    optionContainerInstructionTextColor = '#ffffff', // Font color for instruction text (default white)
    // Option button styling
    optionButtonColor = '#2a3f5f', // Background color for option buttons
    optionButtonFontSize = '24gc', // Font size for option buttons (in gc)
    optionButtonFontColor = '#ffffff', // Font color for option buttons (in gc)
    // Options grid orientation
    optionsRows = 2, // Number of rows in options grid
    optionsColumns = 2, // Number of columns in options grid
    optionButtonLayoutMode = 'auto', // 'auto' (use grid with rows/columns) or 'manual' (use coordinate for each option)
    // Wiggle animation duration
    wiggleDuration = 1250, // Duration in milliseconds for incorrect drop wiggle animation
    // Highlight unfilled blanks on wrong click
    highlightUnfilledBlanksOnWrong = false, // If true, highlight all unfilled blanks with salmon bg and wiggle when wrong option is clicked
    unfilledBlankWiggleDuration = 1000, // Duration in milliseconds for unfilled blank wiggle animation
    showFeedback = true, // If false, disable feedback text display
    // Interaction mode
    mode = 'DND', // 'DND' (drag and drop) or 'MCQ' (multiple choice question)
    // Options array
    options = [], // Array of {id: "", text: "", image: "", blankID: [] or "" or [{bid: "", text: ""}], feedbackText: ""} - blankID can be array of objects with bid and text, or array of strings, or single string
    // Panel update props (similar to QuizPanelComponent)
    keyConcepts = [], // Array of key concepts to update concept summary panel
    impFormulae = [] // Array of important formulae to update concept summary panel
  } = props;
  
  console.log('🔍 FillBlanksComponent RENDERED!');
  console.log('🔍 FillBlanksComponent props:', props);
  console.log('🔍 FillBlanksComponent mode:', mode);
  console.log('🔍 FillBlanksComponent blanks:', blanks);
  console.log('🔍 FillBlanksComponent options:', options);
  
  // Function to convert LaTeX fractions to HTML fractions
  const convertLatexFractions = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // First, handle fractions within $...$ blocks (may contain multiple fractions)
    // Match pattern: $...$ and replace all \frac{}{} inside
    let result = text.replace(/\$([^$]+)\$/g, (match, content) => {
      // Replace all \frac{numerator}{denominator} patterns within the $...$ block
      const fractionPattern = /\\frac\{([^}]+)\}\{([^}]+)\}/g;
      const convertedContent = content.replace(fractionPattern, (fracMatch, numerator, denominator) => {
        // Create HTML fraction with proper styling
        return `<span style="display: inline-block; vertical-align: middle; text-align: center; line-height: 1.2;">
          <span style="display: block; border-bottom: 1px solid currentColor; padding: 0 2px;">${numerator}</span>
          <span style="display: block; padding: 0 2px;">${denominator}</span>
        </span>`;
      });
      return convertedContent; // Return without the $ delimiters
    });
    
    // Also handle standalone fractions outside $...$ blocks (backward compatibility)
    const standaloneFractionPattern = /\$\\frac\{([^}]+)\}\{([^}]+)\}\$/g;
    result = result.replace(standaloneFractionPattern, (match, numerator, denominator) => {
      return `<span style="display: inline-block; vertical-align: middle; text-align: center; line-height: 1.2;">
        <span style="display: block; border-bottom: 1px solid currentColor; padding: 0 2px;">${numerator}</span>
        <span style="display: block; padding: 0 2px;">${denominator}</span>
      </span>`;
    });
    
    return result;
  };
  
  // State for filled blanks and selected options
  const [filledBlanks, setFilledBlanks] = React.useState({});
  const [selectedOptions, setSelectedOptions] = React.useState(new Set());
  const [feedbackState, setFeedbackState] = React.useState(null); // null, 'correct', 'incorrect'
  const [feedbackText, setFeedbackText] = React.useState('');
  
  // State for drag and drop (using Draggable component)
  const [draggedOptionId, setDraggedOptionId] = React.useState(null);
  const [draggedOverBlankId, setDraggedOverBlankId] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false); // Track if any option is being dragged
  
  // State for correctly placed options (persistent until browser refresh)
  const [correctlyPlacedOptions, setCorrectlyPlacedOptions] = React.useState(new Set());
  
  // State for incorrectly clicked options (blankID is null) - salmon background, disabled
  const [incorrectlyClickedOptions, setIncorrectlyClickedOptions] = React.useState(new Set());
  
  // State for incorrect wiggle animation
  const [wigglingOptions, setWigglingOptions] = React.useState(new Set());
  
  // State for unfilled blanks wiggle animation (when wrong option is clicked)
  const [wigglingUnfilledBlanks, setWigglingUnfilledBlanks] = React.useState(new Set());
  
  // Initialize global state store if it doesn't exist
  if (typeof window !== 'undefined' && !window.fillBlanksStateStore) {
    window.fillBlanksStateStore = {};
  }
  
  // Restore or initialize state when componentId changes (page navigation)
  // This ensures each page has its own independent state that persists across navigation
  React.useEffect(() => {
    const stateKey = componentId;
    const savedState = window.fillBlanksStateStore?.[stateKey];
    
    if (savedState) {
      // Restore saved state
      console.log('🔄 [FillBlanks] Component ID changed to:', componentId, '- Restoring saved state');
      setFilledBlanks(savedState.filledBlanks || {});
      setSelectedOptions(new Set(savedState.selectedOptions || []));
      setFeedbackState(savedState.feedbackState || null);
      setFeedbackText(savedState.feedbackText || '');
      setDraggedOptionId(savedState.draggedOptionId || null);
      setDraggedOverBlankId(savedState.draggedOverBlankId || null);
      setCorrectlyPlacedOptions(new Set(savedState.correctlyPlacedOptions || []));
      setIncorrectlyClickedOptions(new Set(savedState.incorrectlyClickedOptions || []));
      setWigglingOptions(new Set(savedState.wigglingOptions || []));
      setWigglingUnfilledBlanks(new Set(savedState.wigglingUnfilledBlanks || []));
    } else {
      // Initialize fresh state
      console.log('🔄 [FillBlanks] Component ID changed to:', componentId, '- Initializing fresh state');
      setFilledBlanks({});
      setSelectedOptions(new Set());
      setFeedbackState(null);
      setFeedbackText('');
      setDraggedOptionId(null);
      setDraggedOverBlankId(null);
      setCorrectlyPlacedOptions(new Set());
      setIncorrectlyClickedOptions(new Set());
      setWigglingOptions(new Set());
      setWigglingUnfilledBlanks(new Set());
    }
  }, [componentId]);
  
  // Save state whenever it changes
  React.useEffect(() => {
    const stateKey = componentId;
    if (!window.fillBlanksStateStore) {
      window.fillBlanksStateStore = {};
    }
    
    window.fillBlanksStateStore[stateKey] = {
      filledBlanks,
      selectedOptions: Array.from(selectedOptions),
      feedbackState,
      feedbackText,
      draggedOptionId,
      draggedOverBlankId,
      correctlyPlacedOptions: Array.from(correctlyPlacedOptions),
      incorrectlyClickedOptions: Array.from(incorrectlyClickedOptions),
      wigglingOptions: Array.from(wigglingOptions),
      wigglingUnfilledBlanks: Array.from(wigglingUnfilledBlanks)
    };
    
    console.log('💾 [FillBlanks] Saved state for', stateKey);
  }, [componentId, filledBlanks, selectedOptions, feedbackState, feedbackText, draggedOptionId, draggedOverBlankId, correctlyPlacedOptions, incorrectlyClickedOptions, wigglingOptions, wigglingUnfilledBlanks]);
  
  // Process gc properties
  const processGcProperty = (value, propertyType) => {
    if (value && typeof value === 'string' && value.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
      return window.GridCellFontUtils.processGcProperty(value, propertyType);
    }
    return value;
  };
  
  const processedBlankFontSize = processGcProperty(blankFontSize, 'fontSize');
  const processedBlankBorderWidth = processGcProperty(blankBorderWidth, 'borderWidth');
  const processedOptionsBorderWidth = processGcProperty(optionsBorderWidth, 'borderWidth');
  const processedOptionButtonFontSize = processGcProperty(optionButtonFontSize, 'fontSize');
  
  // Process spacing properties for responsive sizing
  const processedOptionPadding = processGcProperty('2gc', 'padding');
  const processedOptionMargin = processGcProperty('1gc', 'margin');
  const processedOptionGap = processGcProperty('2gc', 'gap');
  const processedOptionMinHeight = processGcProperty('8gc', 'minHeight');
  const processedFrameGap = processGcProperty('1gc', 'padding');
  const processedOptionBorderRadius = processGcProperty('1gc', 'borderRadius');
  
  // Helper function to normalize blankID to array of objects with bid and text
  // Supports both old format (string or array of strings) and new format (array of objects with bid and text)
  const normalizeBlankID = (blankID) => {
    if (blankID === null || blankID === undefined) {
      return [];
    }
    
    // If it's already an array of objects with bid property, return as is
    if (Array.isArray(blankID) && blankID.length > 0 && typeof blankID[0] === 'object' && blankID[0].bid !== undefined) {
      return blankID;
    }
    
    // If it's a single string, convert to array
    const blankIDArray = Array.isArray(blankID) ? blankID : [blankID];
    
    // Convert array of strings to array of objects with bid and empty text
    return blankIDArray
      .filter(id => id !== null && id !== undefined)
      .map(id => ({
        bid: id,
        text: '' // Empty text for old format
      }));
  };
  
  // Helper function to get all fillable blank IDs from options array
  // Only blanks that are referenced in options' blankID are considered fillable
  const getFillableBlankIds = React.useMemo(() => {
    const fillableIds = new Set();
    // Ensure options is an array before iterating
    if (Array.isArray(options)) {
      options.forEach(option => {
        const blankIDArray = normalizeBlankID(option.blankID);
        blankIDArray.forEach(blankIDObj => {
          if (blankIDObj.bid) {
            fillableIds.add(blankIDObj.bid);
          }
        });
      });
    }
    return Array.from(fillableIds);
  }, [options]);
  
  // Calculate options container position (relative to FillBlanksComponent container)
  const getOptionsContainerPosition = () => {
    if (optionsContainerCoordinates && optionsContainerCoordinates.length === 4 && position?.css) {
      const [optX1, optY1, optX2, optY2] = optionsContainerCoordinates;
      
      // Get component container coordinates from position
      const componentCoords = position.coordinates || [];
      if (componentCoords.length === 4) {
        const [compX1, compY1, compX2, compY2] = componentCoords;
        
        // Convert to relative coordinates within component container
        const relativeX1 = optX1 - compX1;
        const relativeY1 = optY1 - compY1;
        const relativeX2 = optX2 - compX1;
        const relativeY2 = optY2 - compY1;
        
        // Calculate component container dimensions
        const compWidth = compX2 - compX1;
        const compHeight = compY2 - compY1;
        
        // Convert to percentages relative to component container
        const left = (relativeX1 / compWidth) * 100;
        const top = (relativeY1 / compHeight) * 100;
        const width = ((relativeX2 - relativeX1) / compWidth) * 100;
        const height = ((relativeY2 - relativeY1) / compHeight) * 100;
        
        return {
          position: 'absolute',
          left: `${left.toFixed(2)}%`,
          top: `${top.toFixed(2)}%`,
          width: `${width.toFixed(2)}%`,
          height: `${height.toFixed(2)}%`
        };
      }
    }
    
    // Fallback to page coordinates if position coordinates not available
    if (optionsContainerCoordinates && optionsContainerCoordinates.length === 4) {
      const [x1, y1, x2, y2] = optionsContainerCoordinates;
      if (typeof gridPositions !== 'undefined' && gridPositions.convertToCSS) {
        const cssPosition = gridPositions.convertToCSS(optionsContainerCoordinates, 'fill-blanks-options', 'page', 'custom');
        return cssPosition.css || cssPosition;
      }
      // Fallback calculation - matches convertToCSS format (x2-x1 without +1)
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
    }
    return null;
  };
  
  // Calculate blank tile position (relative to FillBlanksComponent container)
  const getBlankTilePosition = (coordinate) => {
    if (coordinate && coordinate.length === 4 && position?.css) {
      const [blankX1, blankY1, blankX2, blankY2] = coordinate;
      
      // Get component container coordinates from position
      const componentCoords = position.coordinates || [];
      if (componentCoords.length === 4) {
        const [compX1, compY1, compX2, compY2] = componentCoords;
        
        // Convert to relative coordinates within component container
        const relativeX1 = blankX1 - compX1;
        const relativeY1 = blankY1 - compY1;
        const relativeX2 = blankX2 - compX1;
        const relativeY2 = blankY2 - compY1;
        
        // Calculate component container dimensions
        const compWidth = compX2 - compX1;
        const compHeight = compY2 - compY1;
        
        // Convert to percentages relative to component container
        const left = (relativeX1 / compWidth) * 100;
        const top = (relativeY1 / compHeight) * 100;
        const width = ((relativeX2 - relativeX1) / compWidth) * 100;
        const height = ((relativeY2 - relativeY1) / compHeight) * 100;
        
        return {
          position: 'absolute',
          left: `${left.toFixed(2)}%`,
          top: `${top.toFixed(2)}%`,
          width: `${width.toFixed(2)}%`,
          height: `${height.toFixed(2)}%`
        };
      }
    }
    
    // Fallback to page coordinates if position coordinates not available
    if (coordinate && coordinate.length === 4) {
      const [x1, y1, x2, y2] = coordinate;
      if (typeof gridPositions !== 'undefined' && gridPositions.convertToCSS) {
        const cssPosition = gridPositions.convertToCSS(coordinate, 'fill-blanks-blank', 'page', 'custom');
        return cssPosition.css || cssPosition;
      }
      // Fallback calculation - matches convertToCSS format (x2-x1 without +1)
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
    }
    return null;
  };
  
  // Handle option click
  const handleOptionClick = (optionId, optionData) => {
    // Check if all fillable blanks are filled (only blanks referenced in options)
    const allFillableBlanksFilled = getFillableBlankIds.every(blankId => filledBlanks[blankId]);
    
    // Don't allow interaction with correctly placed or incorrectly clicked options, or if all fillable blanks are filled
    if (correctlyPlacedOptions.has(optionId) || incorrectlyClickedOptions.has(optionId) || allFillableBlanksFilled) {
      return;
    }
    
    // Clear previous feedback when a new option is clicked (to show new feedback)
    // This ensures feedback persists until next click or drop
    if (feedbackState === 'incorrect' || feedbackState === 'correct') {
      setFeedbackState(null);
      setFeedbackText('');
    }
    
    if (mode === 'MCQ') {
      // MCQ mode: Click directly fills the blank
      const option = Array.isArray(options) ? options.find(opt => opt.id === optionId) : null;
      
      // Normalize blankID to array of objects with bid and text
      const blankIDArray = normalizeBlankID(option?.blankID);
      
      if (blankIDArray.length > 0) {
        // Option has valid blankID(s) - make it green and disabled
        // Mark option as correctly placed (persistent state, green background, disabled)
        setCorrectlyPlacedOptions(prev => new Set(prev).add(optionId));
        
        // Find all available blanks for this option (that are not already filled)
        // In MCQ mode, we allow filling non-droppable blanks via click (they just can't be dropped on in DND mode)
        const availableBlanks = blankIDArray
          .map(blankIDObj => blanks.find(blank => blank.id === blankIDObj.bid))
          .filter(blank => blank && !filledBlanks[blank.id]); // Allow all blanks in MCQ mode, regardless of isDroppable
        
        if (availableBlanks.length > 0) {
          // Fill all available blanks
          setSelectedOptions(prev => new Set(prev).add(optionId));
          
          const newFilledBlanks = { ...filledBlanks };
          availableBlanks.forEach(blank => {
            newFilledBlanks[blank.id] = optionId;
          });
          setFilledBlanks(newFilledBlanks);
          
          // Set feedback from option
          if (showFeedback) {
          setFeedbackState('correct');
          if (option && option.feedbackText) {
            setFeedbackText(option.feedbackText);
          } else {
            setFeedbackText('Correct!');
            }
          }
          
          // Dispatch event to update calculation steps for pages 11 and 12
          if (pageId === 'page11' || pageId === 'page12') {
            const updateStepEvent = new CustomEvent('updateCalculationStep', {
              detail: {
                stepIndex: 1,
                newText: '<span style="white-space: nowrap; display: inline-block;">\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0= <span style="display: inline-block; vertical-align: middle; text-align: center; line-height: 1.2;"><span style="display: block; border-bottom: 1px solid currentColor; padding: 0 2px;">112 ÷ \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0</span><span style="display: block; padding: 0 2px;">20 ÷ \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0</span></span> = $\\frac{28}{5}$</span>'
              }
            });
            window.dispatchEvent(updateStepEvent);
            console.log('🔍 [FillBlanks] Dispatched updateCalculationStep event for', pageId);
          }
          
          // Check if all blanks are filled correctly
          checkAnswers(newFilledBlanks);
          
          // Play correct sound if available
          if (typeof window !== 'undefined' && window.playAnswerSound) {
            window.playAnswerSound(true);
          }
          
          // Check if all fillable blanks are now filled and dispatch quizCompleted if so
          const allFillableBlanksFilledNow = getFillableBlankIds.every(blankId => newFilledBlanks[blankId]);
          if (allFillableBlanksFilledNow) {
            // Dispatch quizCompleted event to enable next button
            const enableNextEvent = new CustomEvent('quizCompleted', {
              detail: {
                componentId: componentId,
                componentType: 'FillBlanksComponent',
                pageNumber: window.getCurrentPage?.() || null
              }
            });
            window.dispatchEvent(enableNextEvent);
            console.log('🔍 [FillBlanks] Dispatched quizCompleted event for componentId:', componentId);
          }
          
          // Note: updateConceptSummaryPanel() is called inside checkAnswers() only when ALL blanks are correctly filled
          
          // Correct feedback persists for the page (no setTimeout)
        } else {
          // All blanks are already filled or not found - still mark as correctly placed (green, disabled)
          if (showFeedback) {
          setFeedbackState('correct');
          if (option.feedbackText) {
            setFeedbackText(option.feedbackText);
          } else {
            setFeedbackText('Correct!');
            }
          }
          
          // Play correct sound if available
          if (typeof window !== 'undefined' && window.playAnswerSound) {
            window.playAnswerSound(true);
          }
          
          // Correct feedback persists for the page (no setTimeout)
        }
      } else {
        // Option has no correct blank (blankID is null) - salmon background, disabled
        setIncorrectlyClickedOptions(prev => new Set(prev).add(optionId));
        
        if (showFeedback) {
        setFeedbackState('incorrect');
        if (option && option.feedbackText) {
          setFeedbackText(option.feedbackText);
        } else {
          setFeedbackText('This option cannot be placed.');
          }
        }
        
        // If highlightUnfilledBlanksOnWrong is true, highlight all unfilled blanks
        if (highlightUnfilledBlanksOnWrong) {
          const unfilledBlanks = blanks.filter(blank => !filledBlanks[blank.id]);
          const unfilledBlankIds = new Set(unfilledBlanks.map(blank => blank.id));
          
          // Set wiggling state for unfilled blanks
          setWigglingUnfilledBlanks(unfilledBlankIds);
          
          // Remove wiggle animation after unfilledBlankWiggleDuration
          setTimeout(() => {
            setWigglingUnfilledBlanks(new Set());
          }, unfilledBlankWiggleDuration);
        }
        
        // Play wrong sound if available
        if (typeof window !== 'undefined' && window.playAnswerSound) {
          window.playAnswerSound(false);
        }
        
        // Incorrect feedback persists until next click (no setTimeout)
      }
    } else {
      // DND mode: Click selects/deselects option for drag and drop
      if (selectedOptions.has(optionId)) {
        // Deselect option
        setSelectedOptions(prev => {
          const newSet = new Set(prev);
          newSet.delete(optionId);
          return newSet;
        });
        
        // Remove from filled blanks
        setFilledBlanks(prev => {
          const newFilled = { ...prev };
          Object.keys(newFilled).forEach(blankId => {
            if (newFilled[blankId] === optionId) {
              delete newFilled[blankId];
            }
          });
          return newFilled;
        });
        
        setFeedbackState(null);
        setFeedbackText('');
      } else {
        // Select option for drag and drop
        setSelectedOptions(prev => new Set(prev).add(optionId));
      }
    }
  };
  
  // Handle blank click to remove filled content
  const handleBlankClick = (blankId) => {
    if (filledBlanks[blankId]) {
      const optionId = filledBlanks[blankId];
      
      // Don't allow removing correctly placed options (persistent state)
      if (correctlyPlacedOptions.has(optionId)) {
        return; // Can't remove correctly placed options
      }
      
      setFilledBlanks(prev => {
        const newFilled = { ...prev };
        delete newFilled[blankId];
        return newFilled;
      });
      
      setSelectedOptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(optionId);
        return newSet;
      });
      
      setFeedbackState(null);
      setFeedbackText('');
    }
  };
  
  // Store refs for option elements
  const optionRefs = React.useRef({});
  
  // Update isDragging state when draggedOptionId changes
  React.useEffect(() => {
    setIsDragging(draggedOptionId !== null);
  }, [draggedOptionId]);
  
  
  // Function to update concept summary panel (same pattern as QuizPanelComponent)
  const updateConceptSummaryPanel = React.useCallback(() => {
    // Extract page number from componentId (e.g., "page6-fill-blanks" -> "6")
    const pageMatch = componentId.match(/page(\d+)-/);
    if (!pageMatch) {
      console.log('🔍 [FillBlanks] Could not extract page number from componentId:', componentId);
      return;
    }
    
    const pageNumber = pageMatch[1];
    
    // Prepare impFormulae array - convert strings to objects and add page-specific formulae when all blanks are filled
    let finalImpFormulae = (impFormulae || []).map(formula => {
      // If already an object, return as is; if string, convert to object
      if (typeof formula === 'string') {
        return { text: formula, color: '#70ACC7' };
      }
      return formula;
    });
    
    // Page 7: Add "Dona's mom needs 4 cups of 250 ml to make 1000 ml" when all blanks are filled
    if (pageNumber === '7') {
      const allFilled = getFillableBlankIds.every(bId => filledBlanks[bId]);
      if (allFilled) {
        // Get i18n text for the formula
        const getI18nText = (key, fallback) => {
          if (typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function') {
            return window.i18n.t(key, {}) || fallback;
          }
          return fallback;
        };
        
        // Check if this formula already exists to avoid duplicates
        const formulaText = getI18nText('pages.page7.conceptSummary.completionText', "Dona's mom needs 4 cups of 250 ml to make 1000 ml");
        const exists = finalImpFormulae.some(f => f.text === formulaText || f.text === "Dona's mom needs 4 cups of 250 ml to make 1000 ml" || f.text === "Ibu Dona membutuhkan 4 cangkir 250 ml untuk membuat 1000 ml");
        if (!exists) {
          finalImpFormulae.push({ text: formulaText, color: '#70ACC7' });
        }
      }
    }
    
    // Dispatch updateConceptSummary event (same as QuizPanelComponent)
    if ((keyConcepts && keyConcepts.length > 0) || (finalImpFormulae && finalImpFormulae.length > 0)) {
      const updateEvent = new CustomEvent('updateConceptSummary', {
        detail: {
          pageNumber: pageNumber,
          keyConcepts: keyConcepts || [],
          impFormulae: finalImpFormulae || []
        }
      });
      window.dispatchEvent(updateEvent);
      console.log('🔍 [FillBlanks] Dispatched updateConceptSummary event:', updateEvent.detail);
    }
  }, [componentId, keyConcepts, impFormulae, filledBlanks, getFillableBlankIds]);
  
  const checkAnswers = (filledBlanksToCheck = filledBlanks) => {
    // Check if all fillable blanks are filled (only blanks referenced in options)
    const allFillableBlanksFilled = getFillableBlankIds.every(blankId => filledBlanksToCheck[blankId]);
    if (allFillableBlanksFilled) {
      // Check if each fillable blank has the correct option
      const allCorrect = getFillableBlankIds.every(blankId => {
        const optionId = filledBlanksToCheck[blankId];
        const option = Array.isArray(options) ? options.find(opt => opt.id === optionId) : null;
        if (!option) return false;
        
        // Normalize blankID to array of objects with bid and text
        const blankIDArray = normalizeBlankID(option.blankID);
        
        // Option is correct if blank.id matches any bid in the blankID array
        return blankIDArray.length > 0 && blankIDArray.some(obj => obj.bid === blankId);
      });
      
      if (allCorrect) {
        // Find the first correct option's feedback text, or use default
        const firstCorrectOption = getFillableBlankIds
          .map(blankId => {
            const optionId = filledBlanksToCheck[blankId];
            return options.find(opt => opt.id === optionId);
          })
          .find(option => option && option.feedbackText);
        
        if (showFeedback) {
        setFeedbackState('correct');
        if (firstCorrectOption && firstCorrectOption.feedbackText) {
          setFeedbackText(firstCorrectOption.feedbackText);
        } else {
          setFeedbackText('Correct! All blanks filled correctly.');
          }
        }
        // Play correct sound if available
        if (typeof window !== 'undefined' && window.playCarClickSound) {
          window.playCarClickSound('correct');
        }
        
        // Dispatch quizCompleted event to enable next button
        if (typeof window !== 'undefined') {
          const enableNextEvent = new CustomEvent('quizCompleted', {
            detail: {
              componentId: componentId,
              componentType: 'FillBlanksComponent',
              pageNumber: window.getCurrentPage?.() || null
            }
          });
          window.dispatchEvent(enableNextEvent);
          console.log('🔍 [FillBlanks] Dispatched quizCompleted event for componentId:', componentId);
        }
        
        // Update concept summary panel (same as QuizPanelComponent)
        updateConceptSummaryPanel();
      } else {
        if (showFeedback) {
        setFeedbackState('incorrect');
        }
        // Find incorrect blanks and show their feedback
        const incorrectBlanks = blanks.filter(blank => {
          const optionId = filledBlanksToCheck[blank.id];
          const option = Array.isArray(options) ? options.find(opt => opt.id === optionId) : null;
          if (!option) return false;
          
          // Normalize blankID to array of objects with bid and text
          const blankIDArray = normalizeBlankID(option.blankID);
          
          // Check if option doesn't match (blankID array doesn't have bid matching blank.id) and has feedback
          return blankIDArray.length === 0 || !blankIDArray.some(obj => obj.bid === blank.id);
        });
        
        if (incorrectBlanks.length > 0) {
          // Use the first incorrect option's feedback text
          const firstIncorrectBlank = incorrectBlanks[0];
          const optionId = filledBlanksToCheck[firstIncorrectBlank.id];
          const option = Array.isArray(options) ? options.find(opt => opt.id === optionId) : null;
          if (showFeedback) {
          if (option && option.feedbackText) {
            setFeedbackText(option.feedbackText);
          } else {
            const feedbackMessages = incorrectBlanks.map(blank => {
              const optId = filledBlanksToCheck[blank.id];
              const opt = Array.isArray(options) ? options.find(o => o.id === optId) : null;
              return opt?.feedbackText;
            }).filter(Boolean);
            
            setFeedbackText(feedbackMessages.join(' ') || 'Not quite right. Please try again.');
            }
          }
        } else {
          if (showFeedback) {
          setFeedbackText('Not quite right. Please try again.');
          }
        }
        
        // Play wrong sound if available
        if (typeof window !== 'undefined' && window.playCarClickSound) {
          window.playCarClickSound('wrong');
        }
      }
    }
  };
  
  // Helper function to get i18n text
  const getI18nText = (key, fallback) => {
    if (typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function') {
      return window.i18n.t(key, {}) || fallback;
    }
    return fallback;
  };
  
  // Render blank tiles
  const renderBlankTiles = () => {
    // Add wiggle animation keyframes if any blanks are wiggling
    const hasWigglingBlanks = wigglingUnfilledBlanks.size > 0;
    const wiggleKeyframes = hasWigglingBlanks ? `
      @keyframes wiggle-blank {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
    ` : '';
    
    // Check if any blank has borderBlink or bgBlink enabled
    const hasBlinkingBorders = blanks.some(blank => blank.borderBlink === true);
    const hasBlinkingBackgrounds = blanks.some(blank => blank.bgBlink === true);
    const blinkBorderKeyframes = hasBlinkingBorders ? `
      @keyframes blink-border {
        0%, 100% { border-color: var(--blink-border-start, #ffffff); }
        50% { border-color: var(--blink-border-end, #ff0000); }
      }
    ` : '';
    const blinkBgKeyframes = hasBlinkingBackgrounds ? `
      @keyframes blink-bg {
        0%, 100% { background-color: var(--blink-bg-start, #ffffff); }
        50% { background-color: var(--blink-bg-end, #ff0000); }
      }
    ` : '';
    
    const blankTiles = blanks.map(blank => {
      const blankPosition = getBlankTilePosition(blank.coordinate);
      const filledOptionId = filledBlanks[blank.id];
      const filledOption = (filledOptionId && Array.isArray(options)) ? options.find(opt => opt.id === filledOptionId) : null;
      const isDragOver = draggedOverBlankId === blank.id;
      const isUnfilled = !filledBlanks[blank.id];
      const isWiggling = wigglingUnfilledBlanks.has(blank.id);
      
      // Debug: Log blank text for troubleshooting
      if (blank.id === 'blank1') {
        console.log('🔍 Blank1 debug:', {
          blankId: blank.id,
          blankText: blank.text,
          hasText: blank.text !== undefined && blank.text !== null && blank.text !== '',
          isUnfilled: isUnfilled,
          filledOptionId: filledOptionId
        });
      }
      
      // Check if the filled option is correct for this blank
      // Normalize blankID to array of objects with bid and text
      const blankIDArray = normalizeBlankID(filledOption?.blankID);
      const matchingBlankIDObj = blankIDArray.find(obj => obj.bid === blank.id);
      const isCorrectlyFilled = filledOption && matchingBlankIDObj !== undefined;
      
      // Check if blank is droppable
      const isDroppable = blank.isDroppable !== false; // Default to true if not specified
      
      // Use per-blank border color if provided, otherwise use global
      const finalBlankBorderColor = blank.borderColor || blankBorderColor;
      const blankBorderStyle = `${blankBorderType} ${processedBlankBorderWidth} ${finalBlankBorderColor}`;
      
      // Determine background color - use per-blank bgColor if provided
      let backgroundColor = blank.bgColor || blank.backgroundColor || blankBackgroundColor;
      if (mode === 'DND' && isDragOver && isDroppable) {
        backgroundColor = 'rgba(255, 255, 255, 0.2)';
      } else if (isCorrectlyFilled) {
        backgroundColor = '#10b981'; // Green background when correctly filled
      } else if (isUnfilled && isWiggling) {
        backgroundColor = '#fa8072'; // Salmon background for wiggling unfilled blanks
      } else if (!isDroppable && !(blank.bgColor || blank.backgroundColor)) {
        // Only apply gray background for non-droppable blanks if they don't have a custom bgColor
        backgroundColor = 'rgba(128, 128, 128, 0.3)'; // Gray background for non-droppable blanks
      }
      
      // Determine what to display
      let displayContent = null;
      
      if (isCorrectlyFilled && matchingBlankIDObj) {
        // If correctly filled, display the text from the matching blankID object or the option's text
        if (blank.image) {
          displayContent = React.createElement('img', {
            src: blank.image,
            alt: matchingBlankIDObj.text || filledOption?.text || '',
            style: {
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              pointerEvents: 'none'
            }
          });
        } else {
          // Use text from blankID object if available, otherwise use option's text
          const textToDisplay = matchingBlankIDObj.text || filledOption?.text || '';
          if (textToDisplay) {
            // For filled blanks, always use global blankFontColor to ensure consistent black text
            // Only use per-blank fontColor for unfilled blanks
            const textColor = isCorrectlyFilled ? blankFontColor : (blank.fontColor || blank.color || blankFontColor);
            // Convert LaTeX fractions to HTML if needed
            let convertedText = convertLatexFractions(textToDisplay);
            const containsHTML = convertedText !== textToDisplay || /<[^>]+>/.test(convertedText);
            
            // Remove any inline color/styles from HTML content to ensure our color is used
            if (containsHTML) {
              // Remove color from style attributes
              convertedText = convertedText.replace(/style="([^"]*)"/gi, (match, styleContent) => {
                const cleanedStyle = styleContent.replace(/color\s*:\s*[^;]+;?/gi, '').trim();
                return cleanedStyle ? `style="${cleanedStyle}"` : '';
              });
              convertedText = convertedText.replace(/style='([^']*)'/gi, (match, styleContent) => {
                const cleanedStyle = styleContent.replace(/color\s*:\s*[^;]+;?/gi, '').trim();
                return cleanedStyle ? `style="${cleanedStyle}"` : '';
              });
              // Wrap content in a span with our color style
              convertedText = `<span style="color: ${textColor} !important;">${convertedText}</span>`;
            }
            
            displayContent = containsHTML ? 
              React.createElement('span', {
                style: {
                  color: textColor,
                  textAlign: 'center',
                  display: 'block',
                  width: '100%'
                },
                dangerouslySetInnerHTML: { __html: convertedText }
              }) : 
              React.createElement('span', {
                style: {
                  color: textColor,
                  textAlign: 'center',
                  display: 'block',
                  width: '100%'
                }
              }, convertedText);
          }
        }
      } else if (mode === 'DND' && isDragOver) {
        // Show "Drop here" when dragging over in DND mode
        displayContent = getI18nText('common.labels.dropHere', 'Drop here');
      } else if (isUnfilled) {
        // If not filled, check for default text or image
        if (blank.text !== undefined && blank.text !== null && blank.text !== '') {
          // Display default text
          displayContent = blank.text;
        } else if (blank.image) {
          // Display default image
          displayContent = React.createElement('img', {
            src: blank.image,
            alt: blank.text || '',
            style: {
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              pointerEvents: 'none'
            }
          });
        }
      }
      // Otherwise show nothing
      
      // Add wiggle animation style if wiggling (use longhand properties to avoid React warnings)
      const wiggleStyle = isWiggling ? {
        animationName: 'wiggle-blank',
        animationDuration: `${unfilledBlankWiggleDuration}ms`,
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 1
      } : {};
      
      // Use per-blank font color if provided, otherwise use global
      const finalBlankFontColor = blank.fontColor || blank.color || blankFontColor;
      
      // Add border blink animation if enabled
      // When blinking, we need to use borderColor instead of border to allow animation
      // Use longhand properties to avoid React warnings
      const borderBlinkStyle = blank.borderBlink === true ? {
        animationName: 'blink-border',
        animationDuration: '1s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
        '--blink-border-start': finalBlankBorderColor,
        '--blink-border-end': finalBlankBorderColor === '#ffffff' ? '#ff0000' : '#ffffff',
        borderStyle: blankBorderType,
        borderWidth: processedBlankBorderWidth,
        borderColor: finalBlankBorderColor
      } : {};
      
      // Add background blink animation if enabled
      // Use longhand properties to avoid React warnings
      const bgBlinkStyle = blank.bgBlink === true ? {
        animationName: 'blink-bg',
        animationDuration: '1s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
        '--blink-bg-start': backgroundColor,
        '--blink-bg-end': backgroundColor === '#ffffff' || backgroundColor === 'transparent' ? '#ff0000' : '#ffffff'
      } : {};
      
      return React.createElement('div', {
        key: `blank-${blank.id}`,
        'data-blank-id': blank.id, // Add for mouse-based drag detection
        onClick: () => handleBlankClick(blank.id),
        style: {
          ...blankPosition,
          ...(blank.borderBlink === true ? {} : { border: blankBorderStyle }),
          ...(blank.bgBlink === true ? {} : { backgroundColor: backgroundColor }),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: !isDroppable ? 'not-allowed' : (isCorrectlyFilled ? 'pointer' : (mode === 'DND' && draggedOptionId ? 'copy' : 'default')),
          fontSize: processedBlankFontSize,
          color: finalBlankFontColor,
          boxSizing: 'border-box',
          padding: processedOptionMargin,
          transition: 'background-color 0.2s ease',
          opacity: mode === 'DND' && isDragOver ? 0.8 : 1,
          transform: mode === 'DND' && isDragOver ? 'scale(1.05)' : 'scale(1)',
          ...wiggleStyle,
          ...borderBlinkStyle,
          ...bgBlinkStyle
        }
      }, displayContent);
    });
    
    // Return blank tiles with animation styles if needed
    const animationStyles = [];
    if (hasWigglingBlanks && wiggleKeyframes) {
      animationStyles.push(
        React.createElement('style', {
          key: 'wiggle-blank-keyframes',
          dangerouslySetInnerHTML: { __html: wiggleKeyframes }
        })
      );
    }
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
      return [...animationStyles, ...blankTiles];
    }
    
    return blankTiles;
  };
  
  // Render option tiles as buttons in a grid
  const renderOptionTiles = () => {
    const optionsContainerPos = getOptionsContainerPosition();
    if (!optionsContainerPos) return null;
    
    // Build border style based on showOptionsContainerBorder prop
    const optionBorderStyle = showOptionsContainerBorder 
      ? `${optionsBorderType} ${processedOptionsBorderWidth} ${optionsBorderColor}`
      : 'none';
    
    // Check if manual layout mode is enabled
    const isManualLayout = optionButtonLayoutMode === 'manual';
    
    // Calculate total grid cells needed (only for auto mode)
    const totalGridCells = isManualLayout ? 0 : optionsRows * optionsColumns;
    
    // Create grid cells - fill with options first, then empty cells
    const gridCells = [];
    
    // Add options to grid cells
    if (Array.isArray(options)) {
      options.forEach((option, index) => {
        if (isManualLayout || index < totalGridCells) {
        const isSelected = selectedOptions.has(option.id);
        const isDragging = draggedOptionId === option.id;
        const isCorrectlyPlaced = correctlyPlacedOptions.has(option.id);
        const isIncorrectlyClicked = incorrectlyClickedOptions.has(option.id);
        const isWiggling = wigglingOptions.has(option.id);
        // Check if all blanks are filled
        const allFillableBlanksFilled = getFillableBlankIds.every(blankId => filledBlanks[blankId]);
        const isDisabled = isCorrectlyPlaced || isIncorrectlyClicked || allFillableBlanksFilled;
        
        // Determine background color
        let backgroundColor = optionButtonColor; // Use prop as base color
        if (isCorrectlyPlaced) {
          backgroundColor = '#10b981'; // green
        } else if (isIncorrectlyClicked) {
          backgroundColor = '#fa8072'; // salmon
        } else if (isWiggling) {
          backgroundColor = '#fa8072'; // salmon
        } else if (isSelected) {
          backgroundColor = '#4a5568';
        } else if (isDragging) {
          backgroundColor = '#3a4f6f';
        }
        
        // Wiggle animation keyframes
        const wiggleKeyframes = `
          @keyframes wiggle-${option.id} {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
        `;
        
        // Add wiggle animation style if wiggling
        // Animation iteration is 0.5s (500ms), so calculate iterations based on wiggleDuration
        // Use longhand properties to avoid React warnings
        const animationIterations = (wiggleDuration / 500).toFixed(1);
        const wiggleAnimation = isWiggling ? {
          animationName: `wiggle-${option.id}`,
          animationDuration: '0.5s',
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: animationIterations
        } : {};
        
        // Determine if this option should be draggable
        const shouldBeDraggable = mode === 'DND' && !isDisabled;
        console.log(`🎯 [FillBlanks] Option ${option.id}: mode=${mode}, isCorrectlyPlaced=${isCorrectlyPlaced}, isIncorrectlyClicked=${isIncorrectlyClicked}, shouldBeDraggable=${shouldBeDraggable}`);
        
        // Create option button element - use 3-layer structure for MCQ mode, simple div for DND mode
        let optionElement;
        
        if (mode === 'MCQ') {
          // MCQ mode: Use 3-layer button structure like Next button
          
          optionElement = React.createElement('div', {
            key: `option-${option.id}`,
            ref: (element) => {
              if (element) {
                optionRefs.current[option.id] = element;
              } else {
                delete optionRefs.current[option.id];
              }
            },
            className: `applet-button-container fill-blank-option-container ${option.id}-container${isDisabled ? ' disabled' : ''}`,
            'data-option-id': option.id,
            'data-mode': mode,
            onClick: !isDisabled ? () => handleOptionClick(option.id, option) : undefined,
            style: {
              backgroundColor: backgroundColor,
              borderRadius: 'var(--border-radius-xl)',
              border: 'none', // No border for MCQ buttons
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isDisabled ? 0.8 : 1,
              pointerEvents: isDisabled ? 'none' : 'auto',
              width: '100%',
              height: '100%',
              minHeight: processedOptionMinHeight,
              boxSizing: 'border-box',
              transition: 'all 0.2s ease',
              position: 'relative',
              ...wiggleAnimation
            }
          }, [
            // Frame layer
            React.createElement('div', {
              key: 'frame',
              className: `applet-button-frame ${option.id}-frame`,
              style: {
                position: 'absolute',
                top: processedFrameGap,
                left: processedFrameGap,
                right: processedFrameGap,
                bottom: processedFrameGap,
                borderRadius: 'inherit',
                pointerEvents: 'none',
                zIndex: 1,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(0, 0, 0, 0.1) 100%)',
                boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.3), inset 0 -1px 3px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }
            }),
            // Content layer
            React.createElement('div', {
              key: 'content',
              className: `applet-button-content ${option.id}-content`,
              style: {
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: processedOptionButtonFontSize,
                color: optionButtonFontColor,
                fontWeight: 'bold',
                textAlign: 'center',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                width: '100%',
                height: '100%',
                padding: processedOptionPadding,
                boxSizing: 'border-box'
              }
            }, [
              option.image && React.createElement('img', {
                key: `option-image-${option.id}`,
                src: option.image,
                alt: option.text || '',
                style: {
                  maxWidth: '80%',
                  maxHeight: '60%',
                  objectFit: 'contain',
                  marginBottom: option.text ? processedOptionMargin : '0',
                  pointerEvents: 'none',
                  userSelect: 'none'
                }
              }),
              option.text && (() => {
                // Convert LaTeX fractions to HTML
                const convertedText = convertLatexFractions(option.text);
                // Check if text contains HTML (fractions or other HTML tags)
                const containsHTML = convertedText !== option.text || /<[^>]+>/.test(convertedText);
                
                return React.createElement('span', {
                  key: `option-text-${option.id}`,
                  style: {
                    pointerEvents: 'none',
                    userSelect: 'none'
                  },
                  ...(containsHTML ? { dangerouslySetInnerHTML: { __html: convertedText } } : {})
                }, containsHTML ? null : convertedText);
              })()
            ])
          ]);
        } else {
          // DND mode: Use Draggable component with same UI structure as MCQ mode
          const Draggable = window.DraggableComponent?.Draggable;
          
          if (!Draggable) {
            console.warn('⚠️ [FillBlanks] Draggable component not found, falling back to div');
            const convertedText = convertLatexFractions(option.text || '');
            const containsHTML = convertedText !== (option.text || '') || /<[^>]+>/.test(convertedText);
            optionElement = React.createElement('div', {
            key: `option-${option.id}`,
            style: {
              border: `${blankBorderType} ${processedBlankBorderWidth} ${blankBorderColor}`,
              backgroundColor: backgroundColor,
              borderRadius: processedOptionBorderRadius,
                padding: processedOptionPadding,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            fontSize: processedOptionButtonFontSize,
                color: optionButtonFontColor
              },
              ...(containsHTML ? { dangerouslySetInnerHTML: { __html: convertedText } } : {})
            }, containsHTML ? null : convertedText);
          } else {
            // Check if option should be disabled from dragging
            const isCorrectlyPlaced = correctlyPlacedOptions.has(option.id);
            const isIncorrectlyClicked = incorrectlyClickedOptions.has(option.id);
            const allFillableBlanksFilled = getFillableBlankIds.every(blankId => filledBlanks[blankId]);
            const shouldBeDisabled = isDisabled || isCorrectlyPlaced || isIncorrectlyClicked || allFillableBlanksFilled;
            
            // Use Draggable component with same UI structure as MCQ mode
            optionElement = React.createElement(Draggable, {
              key: `option-${option.id}`,
              draggableId: option.id,
              isDisabled: shouldBeDisabled,
              isAnimating: isWiggling,
              isAnyDragging: isDragging,
              currentDraggingId: draggedOptionId,
              onDragStart: (id, position) => {
                // Clear previous feedback when drag starts (to show new feedback on drop)
                if (feedbackState === 'incorrect' || feedbackState === 'correct') {
                  setFeedbackState(null);
                  setFeedbackText('');
                }
                setDraggedOptionId(id);
                console.log('🚀 [FillBlanks] Drag started via Draggable:', id);
              },
              onDragMove: (id, position) => {
                // Detect which blank is under cursor
                const elementsAtPoint = document.elementsFromPoint(position.x, position.y);
                let foundBlank = null;
                
                for (const elem of elementsAtPoint) {
                  const blankId = elem.getAttribute('data-blank-id');
                  if (blankId) {
                    // Check if this blank is droppable
                    const blank = blanks.find(b => b.id === blankId);
                    const isDroppable = blank?.isDroppable !== false; // Default to true if not specified
                    if (isDroppable) {
                      foundBlank = blankId;
                      break;
                    }
                  }
                }
                
                setDraggedOverBlankId(foundBlank);
              },
              onDragEnd: (id, position) => {
                const blankId = draggedOverBlankId;
                
                // Reset drag state
                setDraggedOptionId(null);
                setDraggedOverBlankId(null);
                
                // Handle drop if over a blank
                if (blankId) {
                  const option = Array.isArray(options) ? options.find(opt => opt.id === id) : null;
                  const blank = blanks.find(b => b.id === blankId);
                  
                  // Check if blank is droppable
                  const isDroppable = blank?.isDroppable !== false; // Default to true if not specified
                  if (!isDroppable) {
                    // Blank is not droppable, do nothing
                    return;
                  }
                  
                  // Check if this is the correct blank for this option
                  const blankIDArray = normalizeBlankID(option?.blankID);
                  const isCorrect = option && blankIDArray.length > 0 && blankIDArray.some(obj => obj.bid === blankId);
                  
                  if (isCorrect && blank) {
                    // Correct drop - fill blank, mark option as correctly placed
                    setFilledBlanks(prev => {
                      const newFilled = { ...prev };
                      // Remove from any blank that has this option
                      Object.keys(newFilled).forEach(bId => {
                        if (newFilled[bId] === id) {
                          delete newFilled[bId];
                        }
                      });
                      // Add to current blank
                      newFilled[blankId] = id;
                      
                      // Check if all blanks are filled using the updated state
                      const allFilled = getFillableBlankIds.every(bId => newFilled[bId]);
                      
                      if (allFilled) {
                        // Dispatch quizCompleted event to enable next button
                        setTimeout(() => {
                          if (typeof window !== 'undefined') {
                            const enableNextEvent = new CustomEvent('quizCompleted', {
                              detail: {
                                componentId: componentId,
                                componentType: 'FillBlanksComponent',
                                pageNumber: window.getCurrentPage?.() || null
                              }
                            });
                            window.dispatchEvent(enableNextEvent);
                            console.log('🔍 [FillBlanks] Dispatched quizCompleted event for componentId:', componentId);
                          }
                          
                          // Update concept summary panel
                          updateConceptSummaryPanel();
                        }, 0);
                      }
                      
                      return newFilled;
                    });
                    
                    setCorrectlyPlacedOptions(prev => new Set(prev).add(id));
                    
                    const feedbackMessage = option.feedbackText || 'Correct!';
                    if (showFeedback) {
                    setFeedbackText(feedbackMessage);
                    setFeedbackState('correct');
                    }
                    
                    // Dispatch event to update calculation steps for pages 11 and 12
                    if (pageId === 'page11' || pageId === 'page12') {
                      const updateStepEvent = new CustomEvent('updateCalculationStep', {
                        detail: {
                          stepIndex: 1,
                          newText: '<span style="white-space: nowrap; display: inline-block;">\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0= <span style="display: inline-block; vertical-align: middle; text-align: center; line-height: 1.2;"><span style="display: block; border-bottom: 1px solid currentColor; padding: 0 2px;">112 ÷ \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0</span><span style="display: block; padding: 0 2px;">20 ÷ \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0</span></span> = $\\frac{28}{5}$</span>'
                        }
                      });
                      window.dispatchEvent(updateStepEvent);
                      console.log('🔍 [FillBlanks] Dispatched updateCalculationStep event for', pageId);
                    }
                    
                    if (typeof window !== 'undefined' && window.playCarClickSound) {
                      window.playCarClickSound('correct');
                    }
                    
                    // Check if all blanks are filled (using current state for event dispatch)
                    const currentFilledBlanks = { ...filledBlanks };
                    // Remove from any blank that has this option
                    Object.keys(currentFilledBlanks).forEach(bId => {
                      if (currentFilledBlanks[bId] === id) {
                        delete currentFilledBlanks[bId];
                      }
                    });
                    // Add to current blank
                    currentFilledBlanks[blankId] = id;
                    const allFilled = getFillableBlankIds.every(bId => currentFilledBlanks[bId]);
                    
                    // Don't override feedback text when all blanks are filled
                    // Just show the option's feedback text
                    // The quizCompleted event will still be dispatched in the state update function
                    
                    // Feedback persists until next event (no setTimeout)
                  } else {
                    // Incorrect drop - wiggle animation
                    setWigglingOptions(prev => new Set(prev).add(id));
                    setTimeout(() => {
                      setWigglingOptions(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(id);
                        return newSet;
                      });
                    }, wiggleDuration);
                    
                    // Use option's feedbackText if available, otherwise use default
                    const feedbackMessage = option && option.feedbackText ? option.feedbackText : 'Try a different blank';
                    if (showFeedback) {
                    setFeedbackText(feedbackMessage);
                    setFeedbackState('incorrect');
                    }
                    
                    if (typeof window !== 'undefined' && window.playCarClickSound) {
                      window.playCarClickSound('wrong');
                    }
                    
                    // Feedback persists until next event (no setTimeout)
                  }
                }
              },
              className: `applet-button-container fill-blank-option-container ${option.id}-container${shouldBeDisabled ? ' disabled' : ''}`,
              'data-option-id': option.id,
              'data-mode': mode,
              style: {
                backgroundColor: backgroundColor,
                borderRadius: 'var(--border-radius-xl)',
                border: 'none', // Same as MCQ mode
                cursor: shouldBeDisabled ? 'not-allowed' : (isDragging && draggedOptionId === option.id ? 'grabbing' : 'grab'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: shouldBeDisabled ? 0.8 : 1,
                pointerEvents: shouldBeDisabled ? 'none' : 'auto',
            width: '100%',
            height: '100%',
            minHeight: processedOptionMinHeight,
                boxSizing: 'border-box',
                transition: isWiggling ? 'none' : 'all 0.2s ease',
                position: 'relative',
              ...wiggleAnimation
              }
            }, [
              // Frame layer (same as MCQ mode)
              React.createElement('div', {
                key: 'frame',
                className: `applet-button-frame ${option.id}-frame`,
                style: {
                  position: 'absolute',
                  top: processedFrameGap,
                  left: processedFrameGap,
                  right: processedFrameGap,
                  bottom: processedFrameGap,
                  borderRadius: 'inherit',
                  pointerEvents: 'none',
                  zIndex: 1,
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(0, 0, 0, 0.1) 100%)',
                  boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.3), inset 0 -1px 3px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease'
                }
              }),
              // Content layer (same as MCQ mode)
              React.createElement('div', {
                key: 'content',
                className: `applet-button-content ${option.id}-content`,
                style: {
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: processedOptionButtonFontSize,
                  color: optionButtonFontColor,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                width: '100%',
                height: '100%',
                padding: processedOptionPadding,
                boxSizing: 'border-box'
            }
          }, [
            option.image && React.createElement('img', {
              key: `option-image-${option.id}`,
              src: option.image,
              alt: option.text || '',
              draggable: false,
              onDragStart: (e) => e.preventDefault(),
              style: {
                maxWidth: '80%',
                maxHeight: '60%',
                objectFit: 'contain',
                marginBottom: option.text ? processedOptionMargin : '0',
                pointerEvents: 'none',
                userSelect: 'none'
              }
            }),
            option.text && (() => {
                // Convert LaTeX fractions to HTML
                const convertedText = convertLatexFractions(option.text);
                // Check if text contains HTML (fractions or other HTML tags)
                const containsHTML = convertedText !== option.text || /<[^>]+>/.test(convertedText);
                
                return React.createElement('span', {
                  key: `option-text-${option.id}`,
                  draggable: false,
                  onDragStart: (e) => e.preventDefault(),
                  style: {
                    pointerEvents: 'none',
                    userSelect: 'none'
                  },
                  ...(containsHTML ? { dangerouslySetInnerHTML: { __html: convertedText } } : {})
                }, containsHTML ? null : convertedText);
              })()
              ])
          ]);
          }
        }
        
        // In manual layout mode, wrap option element with absolute positioning
        let finalOptionElement = optionElement;
        if (isManualLayout && option.coordinate && Array.isArray(option.coordinate) && option.coordinate.length === 4) {
          const [x1, y1, x2, y2] = option.coordinate;
          
          // Debug: Log coordinate for all options to verify it's being read
          if (option.id === 'opt4') {
            console.log(`🔍 [FillBlanks] opt4 - Reading coordinate:`, option.coordinate, 'Full option:', option);
          }
          
          // Button coordinates are relative to the options container, not the page
          // Convert to percentages relative to the options container
          if (optionsContainerCoordinates && optionsContainerCoordinates.length === 4) {
            const [containerX1, containerY1, containerX2, containerY2] = optionsContainerCoordinates;
            
            // Calculate container dimensions
            const containerWidth = containerX2 - containerX1;
            const containerHeight = containerY2 - containerY1;
            
            // Convert button coordinates to be relative to container
            const relativeX1 = x1 - containerX1;
            const relativeY1 = y1 - containerY1;
            const relativeX2 = x2 - containerX1;
            const relativeY2 = y2 - containerY1;
            
            // Convert to percentages within the container
            // Coordinates are absolute page coordinates, so we convert them relative to the container
            const left = (relativeX1 / containerWidth) * 100;
            const top = (relativeY1 / containerHeight) * 100;
            const width = ((relativeX2 - relativeX1) / containerWidth) * 100;
            const height = ((relativeY2 - relativeY1) / containerHeight) * 100;
            
            // Debug logging for opt4
            if (option.id === 'opt4') {
              console.log(`🔍 [FillBlanks] opt4 coordinate transformation:`, {
                original: [x1, y1, x2, y2],
                container: [containerX1, containerY1, containerX2, containerY2],
                containerDimensions: { width: containerWidth, height: containerHeight },
                relative: [relativeX1, relativeY1, relativeX2, relativeY2],
                percentages: { 
                  left: `${left.toFixed(2)}%`, 
                  top: `${top.toFixed(2)}%`, 
                  width: `${width.toFixed(2)}%`, 
                  height: `${height.toFixed(2)}%` 
                },
                calculatedWidth: `${((relativeX2 - relativeX1) / containerWidth) * 100}%`,
                calculatedHeight: `${((relativeY2 - relativeY1) / containerHeight) * 100}%`
              });
            }
            
            // Wrap option element in absolutely positioned container
            // Include coordinate in key to force re-render when coordinates change
            const coordinateKey = option.coordinate.join(',');
            const wrapperStyle = {
              position: 'absolute',
              left: `${left.toFixed(2)}%`,
              top: `${top.toFixed(2)}%`,
              width: `${width.toFixed(2)}%`,
              height: `${height.toFixed(2)}%`,
              zIndex: isDragging ? 1000 : 'auto',
              boxSizing: 'border-box'
            };
            
            // Debug logging for opt4
            if (option.id === 'opt4') {
              console.log(`🔍 [FillBlanks] opt4 wrapper style:`, wrapperStyle);
            }
            
            finalOptionElement = React.createElement('div', {
              key: `manual-wrapper-${option.id}-${coordinateKey}`,
              style: wrapperStyle
            }, optionElement);
          }
        }
        
        // Add wiggle style and option element to grid cells
        if (isWiggling) {
          gridCells.push(
            React.createElement('style', {
              key: `wiggle-style-${option.id}`,
              dangerouslySetInnerHTML: { __html: wiggleKeyframes }
            }),
            finalOptionElement
          );
        } else {
          // In DND mode, if this option is being dragged, add a placeholder to maintain grid layout
          if (mode === 'DND' && isDragging && draggedOptionId === option.id && !isManualLayout) {
            // Add placeholder to maintain grid position while dragging (only in auto mode)
            gridCells.push(
              React.createElement('div', {
                key: `placeholder-${option.id}`,
                style: {
                  width: '100%',
                  height: '100%',
                  opacity: 0, // Invisible placeholder
                  pointerEvents: 'none',
                  minHeight: processedOptionMinHeight
                }
              }),
              finalOptionElement // The actual draggable element (position: fixed)
          );
        } else {
          gridCells.push(finalOptionElement);
          }
        }
      }
      });
    }
    
    // Fill remaining grid cells with empty divs to maintain grid structure (only in auto mode)
    if (!isManualLayout) {
    const optionsLength = Array.isArray(options) ? options.length : 0;
    for (let i = optionsLength; i < totalGridCells; i++) {
      gridCells.push(
        React.createElement('div', {
          key: `empty-cell-${i}`,
          style: {
            width: '100%',
            height: '100%'
          }
        })
      );
      }
    }
    
    // Calculate height percentages
    const instructionRowHeight = `${optionContainerInstructionHeight}%`;
    const optionTrayRowHeight = `${100 - optionContainerInstructionHeight}%`;
    
    // Create instruction row
    const instructionRow = React.createElement('div', {
      key: 'instruction-row',
      style: {
        width: '100%',
        height: instructionRowHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5%',
        boxSizing: 'border-box',
        borderBottom: showOptionsRowBorders 
          ? `${optionsBorderType} ${processedOptionsBorderWidth} ${optionsBorderColor}` 
          : 'none',
        fontSize: processedOptionButtonFontSize || '18px',
        color: optionContainerInstructionTextColor || '#ffffff',
        textAlign: 'center',
        fontWeight: '500'
      }
    }, optionContainerInstructionText);
    
    // Create option tray row with the existing grid or absolute positioning
    const optionTrayRow = React.createElement('div', {
      key: 'option-tray-row',
      style: {
        width: '100%',
        height: optionTrayRowHeight,
        ...(isManualLayout ? {
          position: 'relative',
          boxSizing: 'border-box',
          overflow: 'visible'
        } : {
        display: 'grid',
        gridTemplateRows: `repeat(${optionsRows}, 1fr)`,
        gridTemplateColumns: `repeat(${optionsColumns}, 1fr)`,
        gap: processedOptionGap,
        padding: processedOptionPadding,
        boxSizing: 'border-box',
        overflow: 'hidden'
        })
      }
    }, gridCells);
    
    // Return container with two rows
    return React.createElement('div', {
      key: 'options-container',
      style: {
        ...optionsContainerPos,
        border: optionBorderStyle,
        backgroundColor: optionsBackgroundColor,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }
    }, [instructionRow, optionTrayRow]);
  };
  
  // Update global feedback state for feedback textbox component
  React.useEffect(() => {
    // Initialize global feedback state if it doesn't exist
    if (!window[feedbackStateKey]) {
      window[feedbackStateKey] = {
        text: '',
        mode: 'normal'
      };
    }
    
    // Don't override if state is already in summary mode (preserve initial summary state)
    const existingState = window[feedbackStateKey];
    if (existingState && existingState.mode === 'summary' && existingState.text) {
      // Preserve summary state - don't override with empty/normal
      return;
    }
    
    // Update global feedback state
    if (feedbackText && feedbackState) {
      window[feedbackStateKey].text = feedbackText;
      window[feedbackStateKey].mode = feedbackState === 'correct' ? 'correct' : 'incorrect';
    } else {
      // Only set to normal if not already in summary mode
      if (existingState && existingState.mode !== 'summary') {
      window[feedbackStateKey].text = '';
      window[feedbackStateKey].mode = 'normal';
      }
    }
    
    // Dispatch custom event to notify feedback textbox
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(feedbackEventName, {
        detail: {
          text: window[feedbackStateKey].text,
          mode: window[feedbackStateKey].mode
        }
      }));
    }
  }, [feedbackState, feedbackText, feedbackStateKey, feedbackEventName]);
  
  // Container style
  const containerStyle = {
    ...(position?.css || {}),
    ...(processedStyles || {}),
    zIndex: elementZIndex,
    position: 'absolute'
  };
  
  return React.createElement('div', {
    id: elementId,
    'data-component-type': 'FillBlanksComponent',
    'data-component-id': componentId,
    style: containerStyle
  }, [
    ...renderBlankTiles(),
    showOptionsContainer ? renderOptionTiles() : null
  ]);
});

// Fill Blanks Element Configuration
const FillBlanksElement = {
  fillBlanks: {
    type: 'fill-blanks',
    coordinates: [0, 0, 1600, 900],
    zIndex: 'var(--z-content)',
    props: {
      blanks: [
        { id: 'blank1', coordinate: [100, 100, 200, 200], text: "", image: "" },
        { id: 'blank2', coordinate: [300, 100, 400, 200], text: "", image: "" }
      ],
      blankBorderWidth: '2gc',
      blankBorderColor: '#ffffff',
      blankBorderType: 'solid',
      blankBackgroundColor: 'transparent',
      blankFontSize: '24gc',
      blankFontColor: '#ffffff',
      optionsContainerCoordinates: [500, 100, 1000, 400],
      optionsBorderWidth: '2gc',
      optionsBorderColor: '#ffffff',
      optionsBorderType: 'dashed',
      optionsBackgroundColor: 'transparent',
      showOptionsContainer: true,
      optionButtonColor: '#2a3f5f',
      optionButtonFontSize: '24gc',
      optionButtonFontColor: '#ffffff',
      optionsRows: 2,
      optionsColumns: 2,
      options: [
        { id: 'opt1', text: 'Option 1', image: '', blankID: 'blank1', feedbackText: 'Correct!' },
        { id: 'opt2', text: 'Option 2', image: '', blankID: null, feedbackText: 'Try again.' }
      ]
    },
    
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('fill-blanks', (props, elementId) => {
      return React.createElement(FillBlanksComponent, props);
    })
  }
};

// Export component and configuration
window.FillBlanksComponent = {
  FillBlanksComponent,
  FillBlanksElement
};

console.log('✅ Fill Blanks component loaded successfully');
