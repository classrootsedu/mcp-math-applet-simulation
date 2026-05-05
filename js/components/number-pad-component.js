/**
 * Number Pad Component - React 18 Optimized
 * 
 * This file contains the number pad panel component with all its functionality
 */

// Dependencies: SharedUtilities, GridCellFontUtils, gridPositions, GridPrecisionConfig should be loaded before this file

/**
 * Number Pad Panel Component with correct layout and positioning
 */
const NumberPadPanelComponent = React.memo((props) => {
  const { currentPage, elementName, coordinates, elementProps, zIndex } = props;
  
  // Use the elementProps passed from the ElementRenderer
  console.log('🔢 [NumberPad] Received props:', { currentPage, elementName, elementProps });
  
  // Use a persistent ref stored on window to track previous values across re-mounts
  // This ensures state persists even if component is unmounted and remounted
  const componentKey = `numberPad_${elementName || 'default'}_${currentPage}`;
  if (!window.numberPadInstanceRefs) {
    window.numberPadInstanceRefs = {};
  }
  if (!window.numberPadInstanceRefs[componentKey]) {
    window.numberPadInstanceRefs[componentKey] = {
      mountTime: Date.now(),
      prevPage: currentPage,
      prevDestinationsLength: elementProps?.destinations?.length,
      prevDestinationIndex: elementProps?.destinationIndex,
      initialized: false
    };
  }
  const instanceRef = window.numberPadInstanceRefs[componentKey];
  
  const defaultConfig = {
    backgroundColor: 'transparent',
    borderRadius: '15gc',
    border: '4px solid #FFAB40',
    padding: '15gc',
    layout: 'vertical',            // Layout type: 'vertical' (4 rows, 3 cols) or 'horizontal' (3 rows, 4 cols)
    buttonConfig: 1,               // Button configuration: 1 (numbers only), 2 (numbers + C + ⌫), 3 (numbers + + - . + C + ⌫), 4 (numbers + × ÷ . + C + ⌫)
    enableClickSound: true,        // Enable click sound for number pad buttons (default: true)
    inputMode: 'append',           // Input mode: 'replace' (each click replaces text) or 'append' (each click appends to text)
    maxNumber: null,               // Maximum number allowed in append mode (if exceeded, plays wrong sound and prevents input)
    feedbackMode: 'feedback',       // Feedback mode: 'instruction' (text doesn't change on check) or 'feedback' (text changes on check)
    feedbackComponentId: null,     // ID of external feedback component to update when check is pressed (e.g., 'page2-feedback-textbox')
    setFocusOnLoad: false,         // If true, set destination cell to 'focus' mode on component load
    destinations: [],              // Array of destination objects: [{destinationId, correctValue, correctFeedback, incorrectFeedback}, ...]
    destinationIndex: 0,           // Current index in destinations array (starts at 0)
    // Height percentages for layout sections
    feedbackRowHeight: '35%',      // Height percentage for feedback text area
    buttonGridHeight: '51%',       // Height percentage for number pad grid
    checkButtonHeight: '10%',      // Height percentage for check button
    showButton: {
      backgroundColor: '#FFD700',
      color: '#000000',
      fontSize: '35gc',         // Hint button text size
      fontWeight: 'bold',
      text: 'show 💡'
    },
    numberButtons: {
      backgroundColor: '#FFAB40',
      color: '#000000',
      fontSize: '30gc',          // Text size inside buttons
      fontWeight: 'bold',
      borderRadius: '6gc',
      border: '2px solid #FF9900',
      margin: '3gc',
      // New customizable props
      buttonSize: '50gc',        // Overall button size (width & height) - deprecated, use buttonWidthPercent/buttonHeightPercent
      buttonWidthPercent: '90%', // Width percentage of grid cell (default: 90%)
      buttonHeightPercent: '90%', // Height percentage of grid cell (default: 90%)
      rowGap: '3gc',            // Gap between button rows
      columnGap: '3gc'          // Gap between button columns
    },
    checkButton: {
      backgroundColor: '#FF8C00',
      color: '#000000',
      fontSize: '25gc',         // Check button font size
      fontWeight: 'bold',
      borderRadius: '8gc',
      border: '3px solid #FF6347',
      get text() {
        return typeof i18n !== 'undefined' ? i18n.t('buttons.check') : 'CHECK';
      },
      height: '60gc',
      marginTop: '10gc'
    },
    feedbackTextArea: {
      backgroundColor: 'transparent',
      color: '#ffffff',
      fontSize: '30gc',         // Feedback text size (increased by 20% from 25gc)
      fontWeight: 'bold',
      borderRadius: '8gc',
      border: '2px dashed #ffffff',
      padding: '10gc',
      textAlign: 'center',
      display: 'flex',
      height: '60gc',
      defaultText: ''           // Default text to display in feedback area
    }
  };
  
  // Merge defaultConfig with elementProps (elementProps takes precedence)
  const config = { ...defaultConfig, ...(elementProps || {}) };
  
  // Log initial config to debug destinationId
  React.useEffect(() => {
    console.log(`🔍 [NumberPad] Component initialized with config:`, {
      destinationId: config.destinationId,
      elementPropsDestinationId: elementProps?.destinationId,
      allConfigKeys: Object.keys(config || {}),
      elementPropsKeys: Object.keys(elementProps || {})
    });
  }, []);
  
  // State for user input value (what they're typing)
  const [inputValue, setInputValue] = React.useState('');
  // State for feedback message (shown when check is pressed)
  const [feedbackMessage, setFeedbackMessage] = React.useState('');
  // Default text to show when there's no feedback and no input
  const defaultFeedbackText = config.feedbackTextArea?.defaultText || '';
  // State for current destination index (starts at 0 on app load)
  const [currentDestinationIndex, setCurrentDestinationIndex] = React.useState(() => {
    // Initialize from config, default to 0
    return config.destinationIndex !== undefined ? config.destinationIndex : 0;
  });
  // State to track if last check was incorrect (used to set focus mode on next number click)
  const [lastCheckWasIncorrect, setLastCheckWasIncorrect] = React.useState(false);
  
  // Helper function to update table cell mode (shared between handleNumberClick and handleCheckClick)
  const updateDestinationCellMode = React.useCallback((destinationId, mode) => {
    if (!destinationId) {
      console.warn(`⚠️ [NumberPad] No destinationId provided for cell mode update`);
      return;
    }
    
    try {
      // Extract table component ID from destinationId (e.g., 'page2-map-table-R1C1' -> 'page2-map-table')
      const cellIdMatch = destinationId.match(/^(.+?)-R\d+C\d+$/);
      if (!cellIdMatch) {
        console.warn(`⚠️ [NumberPad] Could not extract table component ID from destinationId: ${destinationId}`);
        return;
      }
      
      const tableComponentId = cellIdMatch[1];
      console.log(`🔍 [NumberPad] Extracted table component ID: ${tableComponentId} from destinationId: ${destinationId}`);
      
      // Get the cell mode update callback for this table component
      if (typeof window !== 'undefined' && window.tableGridModeCallbacks && window.tableGridModeCallbacks[tableComponentId]) {
        window.tableGridModeCallbacks[tableComponentId](destinationId, mode);
        console.log(`✅ [NumberPad] Updated cell mode for ${destinationId} to ${mode}`);
      } else {
        console.warn(`⚠️ [NumberPad] No cell mode callback found for table component: ${tableComponentId}`);
        console.log(`🔍 [NumberPad] Available table mode callbacks:`, Object.keys(window.tableGridModeCallbacks || {}));
      }
      
      // Also update the destination element directly with data attribute
      try {
        const destinationElement = document.getElementById(destinationId);
        if (destinationElement) {
          destinationElement.setAttribute('data-cell-mode', mode);
          console.log(`✅ [NumberPad] Set data-cell-mode="${mode}" on destination element ${destinationId}`);
          
          // Dispatch custom event to notify the destination element
          destinationElement.dispatchEvent(new CustomEvent('cellModeUpdated', {
            detail: { mode, destinationId },
            bubbles: true
          }));
          console.log(`✅ [NumberPad] Dispatched cellModeUpdated event to ${destinationId}`);
        } else {
          console.warn(`⚠️ [NumberPad] Destination element not found: ${destinationId}`);
        }
      } catch (domError) {
        console.error(`❌ [NumberPad] Error updating destination element ${destinationId}:`, domError);
      }
    } catch (error) {
      console.error(`❌ [NumberPad] Error updating cell mode for ${destinationId}:`, error);
    }
  }, []);
  
  // Set destination cell to focus mode on load if setFocusOnLoad is enabled
  React.useEffect(() => {
    if (config.setFocusOnLoad) {
      const destinations = config.destinations || [];
      if (destinations.length > 0) {
        const initialDestinationIndex = config.destinationIndex !== undefined ? config.destinationIndex : 0;
        const initialDestination = destinations[initialDestinationIndex];
        if (initialDestination?.destinationId) {
          // Small delay to ensure table component is ready
          setTimeout(() => {
            updateDestinationCellMode(initialDestination.destinationId, 'focus');
            console.log(`🎯 [NumberPad] Set destination cell to focus mode on load: ${initialDestination.destinationId}`);
          }, 100);
        }
      }
    }
  }, []); // Run only once on mount
  
  // Reset destination index when page changes or destinations array changes
  // Use window-stored instanceRef to track previous values (persists across re-mounts)
  React.useEffect(() => {
    // On first initialization, just set the refs and don't clear input
    if (!instanceRef.initialized) {
      instanceRef.initialized = true;
      instanceRef.prevPage = currentPage;
      instanceRef.prevDestinationsLength = config.destinations?.length;
      instanceRef.prevDestinationIndex = config.destinationIndex;
      console.log(`🔄 [NumberPad] Initial mount - Set refs:`, {
        page: currentPage,
        destinationsLength: config.destinations?.length,
        destinationIndex: config.destinationIndex
      });
      return; // Don't reset on initial mount
    }
    
    // Check if page, destinations length, or destinationIndex actually changed
    const pageChanged = instanceRef.prevPage !== currentPage;
    const destinationsLengthChanged = instanceRef.prevDestinationsLength !== config.destinations?.length;
    const destinationIndexChanged = instanceRef.prevDestinationIndex !== config.destinationIndex;
    
    if (pageChanged || destinationsLengthChanged || destinationIndexChanged) {
      setCurrentDestinationIndex(config.destinationIndex !== undefined ? config.destinationIndex : 0);
      setInputValue(''); // Clear input only when page/destinations actually change
      console.log(`🔄 [NumberPad] Reset destination index to: ${config.destinationIndex !== undefined ? config.destinationIndex : 0}`, {
        pageChanged,
        destinationsLengthChanged,
        destinationIndexChanged,
        prevPage: instanceRef.prevPage,
        currentPage,
        prevDestinationsLength: instanceRef.prevDestinationsLength,
        currentDestinationsLength: config.destinations?.length
      });
      
      // Update instance refs
      instanceRef.prevPage = currentPage;
      instanceRef.prevDestinationsLength = config.destinations?.length;
      instanceRef.prevDestinationIndex = config.destinationIndex;
    }
  }, [currentPage, config.destinationIndex, config.destinations?.length]);
  const [textAreaColors, setTextAreaColors] = React.useState(() => {
    // Initialize with config colors if provided, otherwise use CSS variables
    const rootStyles = getComputedStyle(document.documentElement);
    return {
      color: config.feedbackTextArea?.color || rootStyles.getPropertyValue('--textarea-hint-color').trim() || '#FFFFFF',
      backgroundColor: config.feedbackTextArea?.backgroundColor || rootStyles.getPropertyValue('--textarea-hint-bg').trim() || 'transparent',
      borderColor: config.feedbackTextArea?.borderColor || rootStyles.getPropertyValue('--textarea-hint-border').trim() || '#FFFFFF'
    };
  });
  
  // Check if number pad is disabled (all inputs correct) - make it reactive
  const [isNumberPadDisabled, setIsNumberPadDisabled] = React.useState(() => {
    return typeof window !== 'undefined' && window.multiplicationGridNumberPadDisabled === true;
  });
  
  // Listen for changes to the disabled flag
  React.useEffect(() => {
    const checkDisabled = () => {
      const disabled = typeof window !== 'undefined' && window.multiplicationGridNumberPadDisabled === true;
      if (disabled !== isNumberPadDisabled) {
        console.log('🔄 [NumberPad] Disabled state changed:', disabled);
        setIsNumberPadDisabled(disabled);
      }
    };
    
    // Check on mount
    checkDisabled();
    
    // Check periodically to catch changes
    const interval = setInterval(checkDisabled, 100);
    
    // Listen for custom events
    const handleNumberPadDisabled = (event) => {
      console.log('🔔 [NumberPad] Received numberPadDisabled event:', event.detail);
      checkDisabled();
    };
    
    const handleQuizCompleted = () => {
      console.log('🔔 [NumberPad] Received quizCompleted event');
      checkDisabled();
    };
    
    window.addEventListener('numberPadDisabled', handleNumberPadDisabled);
    window.addEventListener('quizCompleted', handleQuizCompleted);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('numberPadDisabled', handleNumberPadDisabled);
      window.removeEventListener('quizCompleted', handleQuizCompleted);
    };
  }, [isNumberPadDisabled]);
  
  // Handle number button clicks
  const handleNumberClick = (number) => {
    // Don't allow clicks if number pad is disabled
    if (isNumberPadDisabled) {
      console.log('🔒 [NumberPad] Number pad is disabled - all inputs are correct');
      return;
    }
    
    console.log(`🔢 [NumberPad] Number ${number} clicked`);
    
    // Try multiple ways to call the number click handler
    if (elementProps?.onNumberClick) {
      elementProps.onNumberClick(number);
    } else if (config?.onNumberClick) {
      config.onNumberClick(number);
    } else {
      // Fallback: Call the PageConfig handler directly
      console.log('🔄 [NumberPad] Using fallback number click handler');
      
      // Play click sound for number pad (if enabled)
      if (config.enableClickSound !== false && typeof window !== 'undefined' && window.playCarClickSound) {
        window.playCarClickSound('numberpad');
      }
      
      // Check if multiplication grid is expecting input
      if (typeof window !== 'undefined' && window.multiplicationGridNumberPadInput && window.multiplicationGridFocusedCell) {
        console.log('🔢 [NumberPad] Routing to multiplication grid input:', { number, focusedCell: window.multiplicationGridFocusedCell });
        window.multiplicationGridNumberPadInput(number);
        return; // Don't process further - multiplication grid handles it
      }
      
      // If last check was incorrect, set destination cell mode to 'focus' when user starts typing again
      if (lastCheckWasIncorrect) {
        const destinations = config.destinations || [];
        const currentDestination = destinations[currentDestinationIndex];
        if (currentDestination?.destinationId) {
          updateDestinationCellMode(currentDestination.destinationId, 'focus');
          setLastCheckWasIncorrect(false); // Reset the flag
          console.log(`🎯 [NumberPad] Set destination cell to focus mode after incorrect check`);
        }
      }
      
      // Update input value with the number based on input mode (clear feedback message)
      setFeedbackMessage(''); // Clear any feedback message when user starts typing
      
      const inputMode = config.inputMode || 'append';
      const maxNumber = config.maxNumber;
      
      // Check maxNumber limit in append mode
      if (inputMode === 'append' && maxNumber !== null && maxNumber !== undefined) {
        const currentText = typeof inputValue === 'string' ? inputValue : '';
        const newText = currentText + number.toString();
        const newNumber = parseFloat(newText);
        
        // Check if the new number would exceed maxNumber
        if (!isNaN(newNumber) && newNumber > maxNumber) {
          console.log(`⚠️ [NumberPad] Number ${newNumber} exceeds maxNumber ${maxNumber}, preventing input`);
          
          // Play wrong sound
          if (typeof window !== 'undefined' && window.playAnswerSound) {
            window.playAnswerSound(false);
          }
          
          // Don't update input value
          return;
        }
      }
      
      setInputValue(prev => {
        const currentText = typeof prev === 'string' ? prev : '';
        let newText;
        
        if (inputMode === 'replace') {
          // Replace mode: each click replaces the current text
          newText = number.toString();
          console.log(`📝 [NumberPad] Replace mode: "${currentText}" -> "${newText}"`);
        } else {
          // Append mode: each click appends to the existing text (default)
          newText = currentText + number.toString();
          console.log(`📝 [NumberPad] Append mode: "${currentText}" -> "${newText}"`);
        }
        
        return newText;
      });
      
             // Update the answer state - simplified without state management
       if (typeof window !== 'undefined') {
         const currentIndex = window.currentQuestionIndex || 0;
         const currentQuestion = { missing: 'subtrahend' };
         
         // State management removed - direct DOM updates only
         console.log(`📝 [NumberPad] Number ${number} entered for minuend`);
         
         // Update answer container by updating DOM directly (no re-render needed)
         const answerContainer = document.querySelector('[data-element-name="answer-container-page2"]');
         if (answerContainer) {
           const currentIndex = window.currentQuestionIndex || 0;
           const minuend = 5;
           const subtrahend = 3;
           // Get user answer directly from DOM or use entered number
           const userAnswer = number.toString();
           
           // Create the display text with tile format (15% bigger)
           const tileWidth = Math.round(60 * 1.15); // 69px
           const tileHeight = Math.round(60 * 1.15); // 69px
           const fontSize = Math.round(35 * 1.15); // 40px
           const lineHeight = tileHeight - 6; // Adjust for border
           
           let displayText = '';
           const equationText = typeof i18n !== 'undefined' ? 
             i18n.t('subtraction.page2.answerEquation', { subtrahend, minuend }) : 
             `Subtracting ${subtrahend} from ${minuend} gives`;
           
           if (userAnswer === '') {
             // Show equation with empty answer box
             displayText = `${equationText} <span style="display: inline-block; width: ${tileWidth}px; height: ${tileHeight}px; border: 3px solid #2196F3; background-color: #F5F5F5; margin: 0 10px; vertical-align: middle; line-height: ${lineHeight}px; border-radius: 8px; font-size: ${fontSize}px;"></span>`;
           } else {
             // Show equation with user's answer in the box
             displayText = `${equationText} <span style="display: inline-block; width: ${tileWidth}px; height: ${tileHeight}px; border: 3px solid #2196F3; background-color: #FFFFFF; margin: 0 10px; vertical-align: middle; line-height: ${lineHeight}px; border-radius: 8px; font-size: ${fontSize}px; font-weight: bold; color: #000000;">${userAnswer}</span>`;
           }
           
           answerContainer.innerHTML = displayText;
           console.log('📝 [NumberPad] Answer container updated directly:', displayText);
         }
         
         // Single React re-render to update equation tiles (consolidated)
         if (typeof window.forceAppUpdate === 'function') {
           window.forceAppUpdate();
           console.log('✅ [NumberPad] Triggered single React re-render for equation tiles');
         }
      }
    }
  };
  
  // Handle check button click - Compare entered value with correctValue prop
  const handleCheckClick = () => {
    // Don't allow check if number pad is disabled
    if (isNumberPadDisabled) {
      console.log('🔒 [NumberPad] Number pad is disabled - all inputs are correct');
      return;
    }
    
    console.log('🔄 [NumberPad] Check button clicked');
    
    if (elementProps?.onCheckClick) {
      elementProps.onCheckClick();
    } else if (config?.onCheckClick) {
      config.onCheckClick();
    } else {
      // Fallback: Compare entered value with correctValue prop
      console.log('🔄 [NumberPad] Using correctValue comparison logic');
      
      // Play click sound
      if (typeof window !== 'undefined' && window.playCarClickSound) {
        window.playCarClickSound('check');
      }
      
      // Get user's entered value from input value (not feedback message)
      const userEnteredValue = inputValue?.trim() || '';
      
      // Check if multiplication grid is integrated - if so, use its check function
      if (typeof window !== 'undefined' && window.multiplicationGridCheckInputs) {
        console.log('✅ [NumberPad] Routing check to multiplication grid');
        window.multiplicationGridCheckInputs();
        return;
      }
      
      // Get current destination from destinations array
      const destinations = config.destinations || [];
      if (destinations.length === 0) {
        console.warn('⚠️ [NumberPad] No destinations configured, skipping validation');
        return;
      }
      
      const currentDestination = destinations[currentDestinationIndex];
      if (!currentDestination) {
        console.warn(`⚠️ [NumberPad] No destination at index ${currentDestinationIndex}, skipping validation`);
        return;
      }
      
      const correctValue = currentDestination.correctValue;
      const correctFeedback = currentDestination.correctFeedback || (typeof i18n !== 'undefined' ? i18n.t('numberPad.feedback.correct') : 'Correct! Well done!');
      const incorrectFeedback = currentDestination.incorrectFeedback || (typeof i18n !== 'undefined' ? i18n.t('numberPad.feedback.incorrect') : 'Incorrect. Please try again.');
      
      console.log(`🔍 [NumberPad] User entered: "${userEnteredValue}" (type: ${typeof userEnteredValue})`);
      console.log(`🔍 [NumberPad] Current destination index: ${currentDestinationIndex}`);
      console.log(`🔍 [NumberPad] Correct value: ${correctValue} (type: ${typeof correctValue})`);
      
      // If no correctValue is set, skip validation
      if (correctValue === null || correctValue === undefined) {
        console.warn(`⚠️ [NumberPad] No correctValue configured for destination at index ${currentDestinationIndex}, skipping validation`);
        return;
      }
      
      // If user hasn't entered anything, show error
      if (!userEnteredValue) {
        const feedbackText = typeof i18n !== 'undefined' ? 
          i18n.t('numberPad.feedback.empty') : 
          'Please enter a value';
        console.log('❌ [NumberPad] No value entered');
        
        // Play error sound
        if (typeof window !== 'undefined' && window.playAnswerSound) {
          window.playAnswerSound(false);
        }
        
        // Update feedback in number pad text area only if feedbackMode is 'feedback'
        const feedbackMode = config.feedbackMode || 'feedback';
        if (feedbackMode === 'feedback' && typeof window !== 'undefined' && window.updateNumberPadFeedback) {
          window.updateNumberPadFeedback(feedbackText, 'incorrect');
        }
        
        // Update external feedback component
        const feedbackComponentId = config.feedbackComponentId || elementProps?.feedbackComponentId;
        if (feedbackComponentId) {
          try {
            const pageMatch = feedbackComponentId.match(/page(\d+)/);
            const pageId = pageMatch ? `page${pageMatch[1]}` : null;
            
            if (pageId) {
              const feedbackStateKey = `${pageId}FeedbackState`;
              const feedbackEventName = `${pageId}FeedbackUpdate`;
              
              if (!window[feedbackStateKey]) {
                window[feedbackStateKey] = { text: '', mode: 'normal' };
              }
              
              window[feedbackStateKey].text = feedbackText;
              window[feedbackStateKey].mode = 'incorrect';
              
              window.dispatchEvent(new CustomEvent(feedbackEventName, {
                detail: { text: feedbackText, mode: 'incorrect' }
              }));
              
              console.log(`✅ [NumberPad] Updated external feedback component ${feedbackComponentId}:`, { text: feedbackText, mode: 'incorrect' });
            }
          } catch (error) {
            console.error(`❌ [NumberPad] Error updating external feedback component:`, error);
          }
        }
        
        return;
      }
      
      // Compare values (handle both string and number comparisons)
      let isCorrect = false;
      
      // Try numeric comparison first
      const userNum = parseFloat(userEnteredValue);
      const correctNum = parseFloat(correctValue);
      
      if (!isNaN(userNum) && !isNaN(correctNum)) {
        // Both are numbers - compare numerically
        isCorrect = userNum === correctNum;
        console.log(`🔍 [NumberPad] Numeric comparison: ${userNum} === ${correctNum} ? ${isCorrect}`);
      } else {
        // String comparison (case-insensitive, trimmed)
        isCorrect = String(userEnteredValue).trim().toLowerCase() === String(correctValue).trim().toLowerCase();
        console.log(`🔍 [NumberPad] String comparison: "${userEnteredValue}" === "${correctValue}" ? ${isCorrect}`);
      }
      
      // Only update feedback message if feedbackMode is 'feedback'
      const feedbackMode = config.feedbackMode || 'feedback';
      
      // Helper function to update external feedback component
      const updateExternalFeedback = (text, mode) => {
        const feedbackComponentId = config.feedbackComponentId || elementProps?.feedbackComponentId;
        if (feedbackComponentId) {
          try {
            // Extract page number from feedbackComponentId (e.g., 'page2-feedback-textbox' -> 'page2')
            const pageMatch = feedbackComponentId.match(/page(\d+)/);
            const pageId = pageMatch ? `page${pageMatch[1]}` : null;
            
            if (pageId) {
              // Use the same pattern as FillBlanksComponent - update global state and dispatch event
              const feedbackStateKey = `${pageId}FeedbackState`;
              const feedbackEventName = `${pageId}FeedbackUpdate`;
              
              // Initialize or update global feedback state
              if (!window[feedbackStateKey]) {
                window[feedbackStateKey] = {
                  text: '',
                  mode: 'normal'
                };
              }
              
              window[feedbackStateKey].text = text;
              window[feedbackStateKey].mode = mode;
              
              // Dispatch custom event to notify feedback textbox
              window.dispatchEvent(new CustomEvent(feedbackEventName, {
                detail: {
                  text: text,
                  mode: mode
                }
              }));
              
              console.log(`✅ [NumberPad] Updated external feedback component ${feedbackComponentId}:`, { text, mode });
            } else {
              console.warn(`⚠️ [NumberPad] Could not extract page number from feedbackComponentId: ${feedbackComponentId}`);
            }
          } catch (error) {
            console.error(`❌ [NumberPad] Error updating external feedback component:`, error);
          }
        }
      };
      
      if (isCorrect) {
        // Correct answer
        console.log('✅ [NumberPad] Correct answer!');
        
        // Reset incorrect flag
        setLastCheckWasIncorrect(false);
        
        // Play success sound
        if (typeof window !== 'undefined' && window.playAnswerSound) {
          window.playAnswerSound(true);
        }
        
        // Update feedback in number pad text area only if feedbackMode is 'feedback'
        if (feedbackMode === 'feedback' && typeof window !== 'undefined' && window.updateNumberPadFeedback) {
          window.updateNumberPadFeedback(correctFeedback, 'correct');
        }
        
        // Update external feedback component
        updateExternalFeedback(correctFeedback, 'correct');
        
        // Update destination cell mode to 'correct'
        updateDestinationCellMode(currentDestination.destinationId, 'correct');
        
        // Move to next destination if available
        if (currentDestinationIndex < destinations.length - 1) {
          setCurrentDestinationIndex(prev => prev + 1);
          setInputValue(''); // Clear input for next destination
          console.log(`➡️ [NumberPad] Moving to next destination: index ${currentDestinationIndex + 1}`);
        } else {
          console.log(`✅ [NumberPad] All destinations completed!`);
        }
      } else {
        // Incorrect answer
        console.log('❌ [NumberPad] Incorrect answer');
        
        // Set flag to indicate last check was incorrect
        setLastCheckWasIncorrect(true);
        
        // Play error sound
        if (typeof window !== 'undefined' && window.playAnswerSound) {
          window.playAnswerSound(false);
        }
        
        // Update feedback in number pad text area only if feedbackMode is 'feedback'
        if (feedbackMode === 'feedback' && typeof window !== 'undefined' && window.updateNumberPadFeedback) {
          window.updateNumberPadFeedback(incorrectFeedback, 'incorrect');
        }
        
        // Update external feedback component
        updateExternalFeedback(incorrectFeedback, 'incorrect');
        
        // Update destination cell mode to 'incorrect'
        updateDestinationCellMode(currentDestination.destinationId, 'incorrect');
      }
    }
  };
  
  
  // Convert gc units to CSS using the grid positioning system
  const gcToCSS = (value) => {
    if (typeof value === 'string' && value.includes('gc')) {
      const gcValue = parseFloat(value.replace('gc', ''));
      
      // Use the existing grid positioning system to convert gc to CSS
      if (typeof gridPositions !== 'undefined') {
        // Create a mock coordinate that represents the gc size
        // For size values, we create a 1x1 grid cell at position [1,1] and scale it by gcValue
        const mockCoordinates = [1, 1, 1 + gcValue, 1 + gcValue];
        const result = gridPositions.convertToCSS(mockCoordinates, 'gc-conversion', 'custom', 'size');
        
        // Extract the width percentage (which equals height for square elements)
        const widthMatch = result.css.width.match(/(\d+\.?\d*)%/);
        const convertedValue = widthMatch ? widthMatch[1] + '%' : `${gcValue * 0.0625}%`; // fallback
        
        console.log(`🔢 [gcToCSS] Converting ${value}: gcValue=${gcValue}, mockCoords=${mockCoordinates}, result=${convertedValue}`);
        
        return convertedValue;
      } else {
        // Fallback if gridPositions is not available
        const currentPrecision = typeof GridPrecisionConfig !== 'undefined' ? 
          GridPrecisionConfig.currentPrecision : 100;
        const precisionSettings = typeof GridPrecisionConfig !== 'undefined' ? 
          GridPrecisionConfig.precisionSettings[currentPrecision] : { cols: 1600, rows: 900 };
        
        const widthPercent = (gcValue / precisionSettings.cols) * 100;
        const heightPercent = (gcValue / precisionSettings.rows) * 100;
        const percentValue = Math.min(widthPercent, heightPercent);
        
        console.log(`🔢 [gcToCSS] Fallback conversion ${value}: result=${percentValue}%`);
        return `${percentValue}%`;
      }
    }
    return value;
  };
  
  // Process styles to convert gc units using the existing grid system
  const processStyle = (styleObj) => {
    // Use the existing GridCellFontUtils.processGcStyles if available
    if (typeof GridCellFontUtils !== 'undefined' && GridCellFontUtils.processGcStyles) {
      return GridCellFontUtils.processGcStyles(styleObj);
    }
    
    // Fallback: manual processing
    const processed = {};
    for (const [key, value] of Object.entries(styleObj)) {
      // Only convert string values that contain 'gc', leave other values as-is
      if (typeof value === 'string' && value.includes('gc')) {
        // For font-related properties, we need pixel values, not percentages
        if (key === 'fontSize' || key === 'lineHeight' || key.includes('font')) {
          // Use GridCellFontUtils if available for font properties
          if (typeof GridCellFontUtils !== 'undefined' && GridCellFontUtils.convertGcToPixels) {
            processed[key] = GridCellFontUtils.convertGcToPixels(value, key);
          } else {
            processed[key] = gcToCSS(value); // fallback
          }
        } else {
          // For other properties, use percentage-based conversion
          processed[key] = gcToCSS(value);
        }
      } else {
        processed[key] = value;
      }
    }
    return processed;
  };
  
  // Calculate proper positioning using grid coordinate system
  const getPositionFromCoordinates = () => {
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 4) {
      // Use the grid positioning utility if available
      if (typeof GridPositionUtils !== 'undefined' && GridPositionUtils.coordinatesToCSS) {
        return GridPositionUtils.coordinatesToCSS(coordinates);
      }
      
      // Fallback: manual calculation based on current grid system
      const [x1, y1, x2, y2] = coordinates;
      const gridRows = typeof GridPrecisionConfig !== 'undefined' ? 
        GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].rows : 72;
      const gridCols = typeof GridPrecisionConfig !== 'undefined' ? 
        GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].cols : 128;
      
      const left = ((x1 - 1) / gridCols) * 100;
      const top = ((y1 - 1) / gridRows) * 100;
      const width = ((x2 - x1 + 1) / gridCols) * 100;
      const height = ((y2 - y1 + 1) / gridRows) * 100;
      
      return {
        position: 'absolute',
        left: `${left.toFixed(2)}%`,
        top: `${top.toFixed(2)}%`,
        width: `${width.toFixed(2)}%`,
        height: `${height.toFixed(2)}%`
      };
    }
    
    return {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: '290px',
      height: '290px'
    };
  };
  
  // Get container dimensions for percentage calculations
  const containerPosition = getPositionFromCoordinates();
  
  // Debug logging for number pad positioning
  console.log(`🔢 [NumberPad] Positioning for ${elementName}:`, {
    coordinates,
    containerPosition,
    gridRows: typeof GridPrecisionConfig !== 'undefined' ? 
      GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].rows : 72,
    gridCols: typeof GridPrecisionConfig !== 'undefined' ? 
      GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].cols : 128
  });
  
  
  // 2. Text area - use configurable height percentage
  const feedbackRowHeight = config.feedbackRowHeight || '35%';
  
  // Extract color-related props from feedbackTextArea to avoid conflicts
  const { defaultText, color: configColor, backgroundColor: configBgColor, borderColor: configBorderColor, ...feedbackTextAreaProps } = config.feedbackTextArea || {};
  
  const textAreaStyle = typeof GridCellFontUtils !== 'undefined' && GridCellFontUtils.processGcStyles
    ? GridCellFontUtils.processGcStyles({
        ...feedbackTextAreaProps,
        width: '100%',
        height: feedbackRowHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '3%',
        // Use textAreaColors state (which includes config colors if provided)
        color: textAreaColors.color,
        backgroundColor: textAreaColors.backgroundColor,
        borderColor: textAreaColors.borderColor
      })
    : processStyle({
        ...feedbackTextAreaProps,
        width: '100%',
        height: feedbackRowHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '3%',
        // Use textAreaColors state (which includes config colors if provided)
        color: textAreaColors.color,
        backgroundColor: textAreaColors.backgroundColor,
        borderColor: textAreaColors.borderColor
      });
  
  // Get text area content - show feedback message if present, otherwise show default text
  // Never show input value in feedback area
  const getTextAreaContent = () => {
    if (feedbackMessage) {
      return feedbackMessage;
    }
    // Show default text when there's no feedback message
    return defaultFeedbackText;
  };
  
  // Helper function to update destination element text when number pad input changes
  const updateDestinationText = React.useCallback((text) => {
    // Check if multiplication grid is integrated - if so, skip destination handling
    if (typeof window !== 'undefined' && window.multiplicationGridNumberPadInput) {
      return; // Multiplication grid handles input directly, no need for destinations
    }
    
    const destinations = config.destinations || [];
    if (destinations.length === 0) {
      // Silently return - no destinations needed if using multiplication grid or other integrations
      return;
    }
    
    const currentDestination = destinations[currentDestinationIndex];
    if (!currentDestination) {
      console.warn(`⚠️ [NumberPad] No destination at index ${currentDestinationIndex}`);
      return;
    }
    
    const destId = currentDestination.destinationId;
    console.log(`🔍 [NumberPad] updateDestinationText called:`, { 
      text, 
      destinationIndex: currentDestinationIndex,
      destinationId: destId,
      totalDestinations: destinations.length
    });
    
    if (destId) {
      try {
        // Extract table component ID and cell key from destinationId
        // Format: 'page2-map-table-R1C1' -> componentId: 'page2-map-table', cellKey: '0-0' (row 1 = index 0, col 1 = index 0)
        const cellIdMatch = destId.match(/^(.+?)-R(\d+)C(\d+)$/);
        if (cellIdMatch) {
          const tableComponentId = cellIdMatch[1];
          const rowNum = parseInt(cellIdMatch[2], 10);
          const colNum = parseInt(cellIdMatch[3], 10);
          
          // Convert cell ID format to cellKey format (R1C1 -> '0-0' for data rows, R0C0 -> 'header-0' for headers)
          let cellKey;
          if (rowNum === 0) {
            // Header row
            cellKey = `header-${colNum}`;
          } else {
            // Data row (rowNum is 1-indexed, cellKey is 0-indexed)
            cellKey = `${rowNum - 1}-${colNum}`;
          }
          
          console.log(`🔍 [NumberPad] Extracted table info:`, { 
            tableComponentId, 
            rowNum, 
            colNum, 
            cellKey 
          });
          
          // Use table component's callback to update cell text via React state
          // Add retry mechanism in case callback isn't ready yet
          const maxRetries = 10;
          const retryDelay = 50; // ms
          
          const tryUpdateCell = (attempt = 0) => {
            if (typeof window !== 'undefined' && window.tableGridCallbacks && window.tableGridCallbacks[tableComponentId]) {
              try {
                window.tableGridCallbacks[tableComponentId](cellKey, { text });
                console.log(`✅ [NumberPad] Updated cell text via table callback: ${cellKey} -> "${text}"`);
                return true; // Success
              } catch (error) {
                console.error(`❌ [NumberPad] Error calling table callback:`, error);
                return false; // Failed
              }
            }
            return false; // Callback not available
          };
          
          // Try immediate update
          if (!tryUpdateCell(0)) {
            // Callback not ready - retry with delay
            console.warn(`⚠️ [NumberPad] Table callback not ready for ${tableComponentId}, retrying...`);
            let retryCount = 0;
            const retryInterval = setInterval(() => {
              retryCount++;
              if (tryUpdateCell(retryCount)) {
                clearInterval(retryInterval);
              } else if (retryCount >= maxRetries) {
                clearInterval(retryInterval);
                console.error(`❌ [NumberPad] Max retries reached. Table callback for ${tableComponentId} not available.`);
              }
            }, retryDelay);
          }
        } else {
          console.warn(`⚠️ [NumberPad] Could not parse destinationId format: ${destId}. Expected format: 'componentId-R<row>C<col>'`);
        }
      } catch (error) {
        console.error(`❌ [NumberPad] Error updating destination ${destId}:`, error);
      }
    } else {
      console.warn(`⚠️ [NumberPad] No destinationId in destination at index ${currentDestinationIndex}`);
    }
  }, [config.destinations, currentDestinationIndex]);
  
  // Update destination element whenever input value changes (not feedback message)
  React.useEffect(() => {
    console.log(`🔄 [NumberPad] inputValue changed:`, inputValue);
    updateDestinationText(inputValue);
  }, [inputValue, updateDestinationText]);


  // Store subscription removed - using React state only

  const textArea = React.createElement('div', {
    key: 'text-area',
    id: `${elementName}-text-area`,
    className: 'numberpad-text-area',
    style: textAreaStyle,
    'data-feedback': 'area'
  }, getTextAreaContent());
  
  // Expose methods to update text area from external code
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const componentId = elementName || elementProps?.id || `numberpad-${currentPage}`;
      
      // Function to update feedback in the text area
      window.updateNumberPadFeedback = (message, type = 'default') => {
        setFeedbackMessage(message);
        
        // Get CSS variables for consistent styling
        const rootStyles = getComputedStyle(document.documentElement);
        
        switch (type) {
          case 'correct':
            setTextAreaColors({ 
              color: rootStyles.getPropertyValue('--textarea-correct-color').trim() || '#FFFFFF',
              backgroundColor: rootStyles.getPropertyValue('--textarea-correct-bg').trim() || '#0B803D',
              borderColor: rootStyles.getPropertyValue('--textarea-correct-border').trim() || '#219150'
            });
            break;
          case 'error':
          case 'incorrect':
            setTextAreaColors({ 
              color: rootStyles.getPropertyValue('--textarea-incorrect-color').trim() || '#FFFFFF',
              backgroundColor: rootStyles.getPropertyValue('--textarea-incorrect-bg').trim() || '#D9D9D9',
              borderColor: rootStyles.getPropertyValue('--textarea-incorrect-border').trim() || '#FF6B61'
            });
            break;
          case 'hint':
            setTextAreaColors({ 
              color: rootStyles.getPropertyValue('--textarea-hint-color').trim() || '#FFFFFF',
              backgroundColor: rootStyles.getPropertyValue('--textarea-hint-bg').trim() || 'transparent',
              borderColor: rootStyles.getPropertyValue('--textarea-hint-border').trim() || '#FFFFFF'
            });
            break;
          default:
            setTextAreaColors({ 
              color: rootStyles.getPropertyValue('--textarea-hint-color').trim() || '#FFFFFF',
              backgroundColor: rootStyles.getPropertyValue('--textarea-hint-bg').trim() || 'transparent',
              borderColor: rootStyles.getPropertyValue('--textarea-hint-border').trim() || '#FFFFFF'
            });
            break;
        }
      };
      
      // Function to clear feedback
      window.clearNumberPadFeedback = () => {
        setFeedbackMessage('');
        setInputValue('');
        const rootStyles = getComputedStyle(document.documentElement);
        setTextAreaColors({ 
          color: rootStyles.getPropertyValue('--textarea-hint-color').trim() || '#FFFFFF',
          backgroundColor: rootStyles.getPropertyValue('--textarea-hint-bg').trim() || 'transparent',
          borderColor: rootStyles.getPropertyValue('--textarea-hint-border').trim() || '#FFFFFF'
        });
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        const componentId = elementName || elementProps?.id || `numberpad-${currentPage}`;
        delete window.updateNumberPadFeedback;
        delete window.clearNumberPadFeedback;
      }
    };
  }, [elementName, currentPage, elementProps?.id]);
  
  // 3. Number pad - use configurable height percentage
  const buttonGridHeight = config.buttonGridHeight || '51%';
  const numberButtons = [];
  
  // Get button size percentages (default to 90% for both)
  const buttonWidthPercent = config.numberButtons?.buttonWidthPercent || '90%';
  const buttonHeightPercent = config.numberButtons?.buttonHeightPercent || '90%';
  
  // Legacy support: if buttonSize is provided but percentages are not, calculate approximate percentage
  // This is for backward compatibility
  const buttonSize = config.numberButtons?.buttonSize ? gcToCSS(config.numberButtons.buttonSize) : null;
  
  console.log('🔢 [NumberPad] Button sizing:', {
    buttonSize: config.numberButtons?.buttonSize,
    fontSize: config.numberButtons?.fontSize,
    rowGap: config.numberButtons?.rowGap,
    columnGap: config.numberButtons?.columnGap,
    calculatedButtonSize: buttonSize,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    gridCols: typeof GridPrecisionConfig !== 'undefined' ? GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].cols : 'undefined',
    gridRows: typeof GridPrecisionConfig !== 'undefined' ? GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].rows : 'undefined'
  });
  
  for (let i = 0; i <= 9; i++) {
    // Extract only button-specific properties, excluding grid properties and size properties
    const { rowGap, columnGap, buttonSize: configButtonSize, buttonWidthPercent: btnWidthPct, buttonHeightPercent: btnHeightPct, width, height, ...buttonProps } = config.numberButtons;
    
    // Use percentage-based sizing relative to grid cell
    const buttonStyle = typeof GridCellFontUtils !== 'undefined' && GridCellFontUtils.processGcStyles
      ? GridCellFontUtils.processGcStyles({
          ...buttonProps,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: buttonWidthPercent,
          height: buttonHeightPercent
        })
      : processStyle({
          ...buttonProps,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: buttonWidthPercent,
          height: buttonHeightPercent
        });
    
    if (i === 0) { // Only log for first button to avoid spam
      console.log('🔢 [NumberPad] First button style:', buttonStyle);
    }
    
    numberButtons.push(
      React.createElement('button', {
        key: `number-${i}`,
        className: `number-pad-button number-${i}`,
        style: {
          ...buttonStyle,
          opacity: isNumberPadDisabled ? 0.5 : 1,
          cursor: isNumberPadDisabled ? 'not-allowed' : 'pointer',
          pointerEvents: isNumberPadDisabled ? 'none' : 'auto'
        },
        onClick: () => handleNumberClick(i),
        disabled: isNumberPadDisabled,
        onMouseOver: (e) => {
          if (!isNumberPadDisabled) {
            e.target.classList.add('hovered');
          }
        },
        onMouseOut: (e) => {
          e.target.classList.remove('hovered');
        },
        'data-number': i
      }, i.toString())
    );
  }
  
  // Determine layout type
  const layoutType = config.layout || 'vertical';
  const buttonConfig = config.buttonConfig || 1;
  
  // Define button configurations
  // All configs: 0 and . are always in the middle column (column 2 of 3)
  // Config 1: Numbers 0-9, 4 rows × 3 cols, 0 in last row middle
  // Config 2: Numbers 0-9 + C + ⌫, 4 rows × 3 cols, 0 in last row middle
  // Config 3: Numbers 0-9 + + - . + C + ⌫, 5 rows × 3 cols, 0 and . in middle column
  // Config 4: Numbers 0-9 + × ÷ . + C + ⌫, 5 rows × 3 cols, 0 and . in middle column
  const getButtonLayout = (configNum) => {
    switch(configNum) {
      case 1:
        // Numbers only: 1,2,3 / 4,5,6 / 7,8,9 / null,0,null
        // 0 is at index 10 (row 4, column 2 - middle) ✓
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, null];
      case 2:
        // Numbers + C + ⌫: 1,2,3 / 4,5,6 / 7,8,9 / C,0,⌫
        // 0 is at index 10 (row 4, column 2 - middle) ✓
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'];
      case 3:
        // Numbers + + - . + C + ⌫: 1,2,3 / 4,5,6 / 7,8,9 / +,0,- / C,.,⌫
        // 0 is at index 10 (row 4, column 2 - middle) ✓
        // . is at index 13 (row 5, column 2 - middle) ✓
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, '+', 0, '-', 'C', '.', '⌫'];
      case 4:
        // Numbers + × ÷ . + C + ⌫: 1,2,3 / 4,5,6 / 7,8,9 / ×,0,÷ / C,.,⌫
        // 0 is at index 10 (row 4, column 2 - middle) ✓
        // . is at index 13 (row 5, column 2 - middle) ✓
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, '\u00D7', 0, '\u00F7', 'C', '.', '⌫'];
      default:
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, null];
    }
  };
  
  const keypadLayout = getButtonLayout(buttonConfig);
  
  // Determine number of rows based on button config
  const getGridRows = (configNum) => {
    switch(configNum) {
      case 1:
      case 2:
        return 4; // 4 rows × 3 cols
      case 3:
      case 4:
        return 5; // 5 rows × 3 cols
      default:
        return 4;
    }
  };
  
  const gridRows = getGridRows(buttonConfig);
  
  // Create operator buttons (+, -, ×, ÷, .)
  const createOperatorButton = (operator, index) => {
    const { rowGap, columnGap, buttonSize: configButtonSize, buttonWidthPercent: btnWidthPct, buttonHeightPercent: btnHeightPct, width, height, ...buttonProps } = config.numberButtons;
    
    const buttonWidthPercent = btnWidthPct || config.numberButtons?.buttonWidthPercent || '90%';
    const buttonHeightPercent = btnHeightPct || config.numberButtons?.buttonHeightPercent || '90%';
    
    // Use percentage-based sizing relative to grid cell
    const buttonStyle = typeof GridCellFontUtils !== 'undefined' && GridCellFontUtils.processGcStyles
      ? GridCellFontUtils.processGcStyles({
          ...buttonProps,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: buttonWidthPercent,
          height: buttonHeightPercent
        })
      : processStyle({
          ...buttonProps,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: buttonWidthPercent,
          height: buttonHeightPercent
        });
    
    const handleOperatorClick = () => {
      // Don't allow clicks if number pad is disabled
      if (isNumberPadDisabled) {
        console.log('🔒 [NumberPad] Number pad is disabled - all inputs are correct');
        return;
      }
      
      console.log(`🔢 [NumberPad] Operator ${operator} clicked`);
      
      // Play click sound (if enabled)
      if (config.enableClickSound !== false && typeof window !== 'undefined' && window.playCarClickSound) {
        window.playCarClickSound('numberpad');
      }
      
      if (elementProps?.onOperatorClick) {
        elementProps.onOperatorClick(operator);
      } else {
        // Default behavior: append operator to text area
        setFeedbackMessage(''); // Clear any feedback message when user starts typing
        setInputValue(prev => {
          const currentText = typeof prev === 'string' ? prev : '';
          const inputMode = config.inputMode || 'append';
          
          // Operators typically append even in replace mode (for expressions like "5+3")
          // But if replace mode is active and there's no existing content, just set the operator
          if (inputMode === 'replace' && currentText === '') {
            return operator;
          } else {
            // Append mode or replace mode with existing content - append operator
            return currentText + operator;
          }
        });
      }
    };
    
    return React.createElement('button', {
      key: `operator-${operator}-${index}`,
      className: `number-pad-button operator-${operator}`,
      style: {
        ...buttonStyle,
        opacity: isNumberPadDisabled ? 0.5 : 1,
        cursor: isNumberPadDisabled ? 'not-allowed' : 'pointer',
        pointerEvents: isNumberPadDisabled ? 'none' : 'auto'
      },
      onClick: handleOperatorClick,
      disabled: isNumberPadDisabled,
      onMouseOver: (e) => {
        if (!isNumberPadDisabled) {
          e.target.classList.add('hovered');
        }
      },
      onMouseOut: (e) => {
        e.target.classList.remove('hovered');
      },
      'data-operator': operator
    }, operator);
  };
  
  // Create clear and backspace buttons if needed
  const createActionButton = (label, action, index) => {
    const { rowGap, columnGap, buttonSize: configButtonSize, buttonWidthPercent: btnWidthPct, buttonHeightPercent: btnHeightPct, width, height, ...buttonProps } = config.numberButtons;
    
    // Use percentage-based sizing relative to grid cell
    const buttonStyle = typeof GridCellFontUtils !== 'undefined' && GridCellFontUtils.processGcStyles
      ? GridCellFontUtils.processGcStyles({
          ...buttonProps,
          cursor: isNumberPadDisabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: buttonWidthPercent,
          height: buttonHeightPercent,
          opacity: isNumberPadDisabled ? 0.5 : 1,
          pointerEvents: isNumberPadDisabled ? 'none' : 'auto'
        })
      : processStyle({
          ...buttonProps,
          cursor: isNumberPadDisabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: buttonWidthPercent,
          height: buttonHeightPercent,
          opacity: isNumberPadDisabled ? 0.5 : 1,
          pointerEvents: isNumberPadDisabled ? 'none' : 'auto'
        });
    
    return React.createElement('button', {
      key: `action-${label}-${index}`,
      className: `number-pad-button action-${label}`,
      style: buttonStyle,
      onClick: () => {
        if (!isNumberPadDisabled) {
          action();
        }
      },
      disabled: isNumberPadDisabled,
      onMouseOver: (e) => {
        if (!isNumberPadDisabled) {
          e.target.classList.add('hovered');
        }
      },
      onMouseOut: (e) => {
        e.target.classList.remove('hovered');
      },
      'data-action': label
    }, label);
  };
  
  const gridButtons = keypadLayout.map((item, index) => {
    // Handle null/empty cells - create empty placeholder div to maintain grid structure
    if (item === null || item === undefined) {
      return React.createElement('div', {
        key: `empty-${index}`,
        style: { display: 'block' } // Empty div to maintain grid cell
      });
    }
    
    // Handle numbers
    if (typeof item === 'number') {
      return numberButtons[item];
    }
    
    // Handle operators
    if (item === '+' || item === '-' || item === '\u00D7' || item === '\u00F7' || item === '.') {
      return createOperatorButton(item, index);
    }
    
    // Handle Clear button
    if (item === 'C') {
      return createActionButton('C', () => {
        console.log('🔢 [NumberPad] Clear button clicked');
        
        // Play click sound (if enabled)
        if (config.enableClickSound !== false && typeof window !== 'undefined' && window.playCarClickSound) {
          window.playCarClickSound('numberpad');
        }
        
        // Check if multiplication grid is expecting input
        if (typeof window !== 'undefined' && window.multiplicationGridNumberPadClear) {
          console.log('🗑️ [NumberPad] Routing clear to multiplication grid');
          window.multiplicationGridNumberPadClear();
          return;
        }
        
        if (elementProps?.onClear) {
          elementProps.onClear();
        } else {
          setFeedbackMessage(''); // Clear feedback when clearing input
          setInputValue('');
        }
      }, index);
    }
    
    // Handle Backspace button
    if (item === '⌫') {
      return createActionButton('⌫', () => {
        console.log('🔢 [NumberPad] Backspace button clicked');
        
        // Play click sound (if enabled)
        if (config.enableClickSound !== false && typeof window !== 'undefined' && window.playCarClickSound) {
          window.playCarClickSound('numberpad');
        }
        
        // Check if multiplication grid is expecting input
        if (typeof window !== 'undefined' && window.multiplicationGridNumberPadBackspace && window.multiplicationGridFocusedCell) {
          console.log('⌫ [NumberPad] Routing backspace to multiplication grid');
          window.multiplicationGridNumberPadBackspace();
          return;
        }
        
        if (elementProps?.onBackspace) {
          elementProps.onBackspace();
        } else {
          // Remove last character from text area
          setFeedbackMessage(''); // Clear feedback when backspacing
          setInputValue(prev => {
            if (typeof prev === 'string' && prev.length > 0) {
              return prev.slice(0, -1);
            }
            return prev;
          });
        }
      }, index);
    }
    
    // Fallback: return empty div
    return React.createElement('div', {
      key: `fallback-${index}`,
      style: { display: 'block' }
    });
  });
  
  const rowGapValue = gcToCSS(config.numberButtons?.rowGap || config.numberButtons?.margin || '3gc');
  const columnGapValue = gcToCSS(config.numberButtons?.columnGap || config.numberButtons?.margin || '3gc');
  
  console.log('🔢 [NumberPad] Grid gaps:', {
    rowGap: config.numberButtons?.rowGap,
    columnGap: config.numberButtons?.columnGap,
    margin: config.numberButtons?.margin,
    calculatedRowGap: rowGapValue,
    calculatedColumnGap: columnGapValue,
    gcToCSSTest: gcToCSS('3gc')
  });
  
  console.log('🔢 [NumberPad] Full config.numberButtons:', config.numberButtons);
  
  // Calculate rows for horizontal layout (count non-null items)
  const nonNullItems = keypadLayout.filter(item => item !== null && item !== undefined).length;
  const horizontalRows = Math.ceil(nonNullItems / 4);
  
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: layoutType === 'horizontal' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',  // 4 cols (horizontal) or 3 cols (vertical)
    gridTemplateRows: layoutType === 'horizontal' 
      ? `repeat(${horizontalRows}, 1fr)`  // Calculate rows for horizontal layout
      : `repeat(${gridRows}, 1fr)`,     // Dynamic rows based on buttonConfig for vertical layout
    rowGap: rowGapValue,
    columnGap: columnGapValue,
    width: '100%',
    height: buttonGridHeight,
    alignItems: 'center',
    justifyItems: 'center',
    marginBottom: '3%'
  };
  
  console.log('🔢 [NumberPad] Grid style object:', gridStyle);
  
  const numberPadGrid = React.createElement('div', {
    className: 'number-pad-grid',
    style: gridStyle
  }, ...gridButtons);
  
  // 4. Check button - use configurable height percentage
  const checkButtonHeight = config.checkButtonHeight || '10%';
  const checkButtonStyle = typeof GridCellFontUtils !== 'undefined' && GridCellFontUtils.processGcStyles
    ? GridCellFontUtils.processGcStyles({
        ...config.checkButton,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        width: '100%',
        height: checkButtonHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      })
    : processStyle({
        ...config.checkButton,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        width: '100%',
        height: checkButtonHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      });
  
  const checkButton = React.createElement('button', {
    key: 'check-button',
    className: 'number-pad-check-button',
    style: {
      ...checkButtonStyle,
      opacity: isNumberPadDisabled ? 0.5 : 1,
      cursor: isNumberPadDisabled ? 'not-allowed' : 'pointer',
      pointerEvents: isNumberPadDisabled ? 'none' : 'auto'
    },
    onClick: handleCheckClick,
    disabled: isNumberPadDisabled,
    onMouseOver: (e) => {
      if (!isNumberPadDisabled) {
        e.target.classList.add('hovered');
      }
    },
    onMouseOut: (e) => {
      e.target.classList.remove('hovered');
    },
    'data-action': 'check'
  }, config.checkButton?.text || 
    (typeof i18n !== 'undefined' ? i18n.t('buttons.check') : 'CHECK'));
  
  // Main container with proper grid positioning
  const containerStyle = {
    ...containerPosition,
    ...processStyle({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      backgroundColor: config.backgroundColor,
      borderRadius: config.borderRadius,
      border: config.border,
      padding: config.padding || '15px',
      boxSizing: 'border-box'
    }),
    zIndex: zIndex || 1000
  };
  
  // Layout order: text area -> number pad -> check button (hint button removed)
  const children = [
    textArea,      // Configurable height (default: 35%)
    numberPadGrid, // Configurable height (default: 51%)
    checkButton    // Configurable height (default: 10%)
  ];
  
  return React.createElement('div', {
    id: `${elementName}-${currentPage}`,
    className: 'number-pad-panel-container',
    style: containerStyle,
    'data-element-name': elementName,
    'data-page': currentPage
  }, ...children);
});

// Number Pad Element Configuration
const NumberPadElement = {
  numberPadPanel: {
    type: 'number-pad-panel',
    coordinates: [20, 20, 80, 80],
    zIndex: 'var(--z-elevated)',
    props: {
      backgroundColor: '#8B4513',
      borderRadius: '15gc',
      border: '4px solid #D2691E',
      padding: '20gc',
      layout: 'vertical',            // Layout type: 'vertical' (4 rows, 3 cols) or 'horizontal' (3 rows, 4 cols)
      buttonConfig: 1,               // Button configuration: 1 (numbers only), 2 (numbers + C + ⌫), 3 (numbers + + - . + C + ⌫), 4 (numbers + × ÷ . + C + ⌫)
      enableClickSound: true,        // Enable click sound for number pad buttons (default: true)
      inputMode: 'append',           // Input mode: 'replace' (each click replaces text) or 'append' (each click appends to text)
      maxNumber: null,               // Maximum number allowed in append mode (if exceeded, plays wrong sound and prevents input)
      feedbackMode: 'feedback',       // Feedback mode: 'instruction' (text doesn't change on check) or 'feedback' (text changes on check)
      feedbackComponentId: null,     // ID of external feedback component to update when check is pressed (e.g., 'page2-feedback-textbox')
      destinations: [],              // Array of destination objects: [{destinationId, correctValue, correctFeedback, incorrectFeedback}, ...]
      destinationIndex: 0,           // Current index in destinations array (starts at 0)
      feedbackRowHeight: '35%',      // Height percentage for feedback text area
      buttonGridHeight: '51%',       // Height percentage for number pad grid
      checkButtonHeight: '10%',      // Height percentage for check button
      
      showButton: {
        backgroundColor: '#FFD700',
        color: '#000000',
        fontSize: '35gc',
        fontWeight: 'bold',
        text: 'show 💡'
      },
      
      numberButtons: {
        backgroundColor: '#FFD700',
        color: '#000000',
        fontSize: '45gc',
        fontWeight: 'bold',
        buttonWidthPercent: '90%',  // Width percentage of grid cell
        buttonHeightPercent: '90%'  // Height percentage of grid cell
      },
      
      checkButton: {
        backgroundColor: '#FF8C00',
        color: '#000000',
        fontSize: '35gc',
        fontWeight: 'bold',
        text: 'CHECK'
      }
    },
    
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('number-pad', (props, elementId) => {
      return React.createElement(NumberPadPanelComponent, props);
    })
  }
};

// Export component and configuration
window.NumberPadComponent = {
  NumberPadPanelComponent,
  NumberPadElement
};

console.log('✅ Number pad component loaded successfully');
