/**
 * Arrange Steps Component - React 18 Optimized
 * 
 * This component displays shuffled steps as draggable buttons that users can reorder.
 * Auto-validates after each move and triggers quiz completion when correctly arranged.
 */

// Dependencies: React, Draggable component should be loaded before this file

/**
 * Arrange Steps Component
 */
const ArrangeStepsComponent = React.memo((props) => {
  const elementId = React.useId();
  const componentId = props.id || elementId;
  
  // Extract page number from component ID (e.g., 'page8-arrange-steps' -> 'page8')
  const pageMatch = componentId.match(/page(\d+)/);
  const pageId = pageMatch ? `page${pageMatch[1]}` : 'page1';
  const feedbackStateKey = `${pageId}FeedbackState`;
  const feedbackEventName = `${pageId}FeedbackUpdate`;
  
  const {
    position,
    processedStyles,
    elementZIndex,
    // Steps array (correct order)
    steps = [],
    // Layout orientation
    orientation = 'vertical', // 'vertical' or 'horizontal'
    // Button styling
    initialButtonColor = '#FFA500', // Default orange color (--color-orange)
    buttonColor, // Deprecated, use initialButtonColor
    buttonFontColor = '#000000',
    buttonFontSize = '24gc',
    buttonBorderRadius = '8gc',
    buttonPadding = '12gc',
    gap = '10gc',
    // Feedback colors
    correctColor = '#10b981',
    incorrectColor = '#ef4444',
    // Feedback settings
    showFeedback = true,
    feedbackText = { correct: 'Correct! Steps are in the right order.', incorrect: 'Not quite. Try rearranging the steps.' },
    // Sound settings
    playDropSound = true, // Play click sound when item is dropped
    // Instruction text
    instructionText = 'Drag to arrange in correct order',
    instructionFontSize = '20gc',
    instructionFontColor = '#ffffff',
    // Container styling
    containerBackgroundColor = 'transparent',
    containerBorderWidth = '0gc',
    containerBorderColor = 'transparent',
    containerBorderType = 'solid',
    // Panel update props (similar to FillBlanksComponent)
    keyConcepts = [],
    impFormulae = []
  } = props;
  
  // Process gc units using GridCellFontUtils
  const processGcProperty = (value, propertyType = 'fontSize') => {
    if (value && typeof value === 'string' && value.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
      return window.GridCellFontUtils.processGcProperty(value, propertyType);
    }
    return value;
  };
  
  const processedButtonFontSize = processGcProperty(buttonFontSize, 'fontSize');
  const processedButtonBorderRadius = processGcProperty(buttonBorderRadius, 'borderRadius');
  const processedButtonPadding = processGcProperty(buttonPadding, 'padding');
  const processedGap = processGcProperty(gap, 'gap');
  const processedInstructionFontSize = processGcProperty(instructionFontSize, 'fontSize');
  const processedContainerBorderWidth = processGcProperty(containerBorderWidth, 'borderWidth');
  
  // Use initialButtonColor or fallback to buttonColor for backwards compatibility
  const activeButtonColor = initialButtonColor || buttonColor || '#FFA500';
  
  // Fisher-Yates shuffle algorithm
  const shuffleArray = React.useCallback((array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);
  
  // Create initial shuffled indices
  const createShuffledIndices = React.useCallback(() => {
    const indices = steps.map((_, index) => index);
    // Keep shuffling until order is different from original (if more than 1 step)
    if (steps.length > 1) {
      let shuffled = shuffleArray(indices);
      // Ensure it's not already in correct order
      let attempts = 0;
      while (shuffled.every((val, idx) => val === idx) && attempts < 100) {
        shuffled = shuffleArray(indices);
        attempts++;
      }
      console.log('🔀 [ArrangeSteps] Shuffled order:', shuffled, 'from indices:', indices);
      return shuffled;
    }
    return indices;
  }, [steps, shuffleArray]);
  
  // Track if initial shuffle has been done for this component
  const initialShuffleRef = React.useRef(null);
  // Track if we just initialized to skip sync effect
  const justInitializedRef = React.useRef(false);
  
  // State for current order (array of indices into steps array)
  const [currentOrder, setCurrentOrder] = React.useState([]);
  // Visual order during drag (for preview, doesn't affect actual order until drop)
  const [visualOrder, setVisualOrder] = React.useState([]);
  const [isComplete, setIsComplete] = React.useState(false);
  const [feedbackState, setFeedbackState] = React.useState(null); // null, 'correct', 'incorrect'
  const [currentFeedbackText, setCurrentFeedbackText] = React.useState('');
  const [draggedIndex, setDraggedIndex] = React.useState(null); // Position in currentOrder
  const [draggedStepIndex, setDraggedStepIndex] = React.useState(null); // The actual stepIndex being dragged
  const [dropTargetIndex, setDropTargetIndex] = React.useState(null);
  
  // Ref for container (used for querying draggable items)
  const containerRef = React.useRef(null);
  // Ref to track previous target index to prevent unnecessary updates
  const previousTargetIndexRef = React.useRef(null);
  
  // Initialize global state store if it doesn't exist
  if (typeof window !== 'undefined' && !window.arrangeStepsStateStore) {
    window.arrangeStepsStateStore = {};
  }
  
  // Restore or initialize state when componentId changes (page navigation)
  React.useEffect(() => {
    const stateKey = componentId;
    const savedState = window.arrangeStepsStateStore?.[stateKey];
    
    if (savedState && savedState.currentOrder && savedState.currentOrder.length > 0) {
      console.log('🔄 [ArrangeSteps] Restoring saved state for:', componentId, savedState.currentOrder);
      justInitializedRef.current = true;
      setCurrentOrder(savedState.currentOrder);
      setVisualOrder(savedState.currentOrder); // Initialize visual order same as current order
      setIsComplete(savedState.isComplete || false);
      setFeedbackState(savedState.feedbackState || null);
      setCurrentFeedbackText(savedState.feedbackText || '');
      initialShuffleRef.current = componentId;
      // Reset flag after a tick
      setTimeout(() => { justInitializedRef.current = false; }, 0);
    } else if (steps.length > 0 && initialShuffleRef.current !== componentId) {
      console.log('🆕 [ArrangeSteps] Initializing new state for:', componentId);
      justInitializedRef.current = true;
      const newOrder = createShuffledIndices();
      console.log('🔀 [ArrangeSteps] New shuffled order:', newOrder);
      setCurrentOrder(newOrder);
      setVisualOrder(newOrder); // Initialize visual order same as current order
      setIsComplete(false);
      setFeedbackState(null);
      setCurrentFeedbackText('');
      initialShuffleRef.current = componentId;
      // Reset flag after a tick
      setTimeout(() => { justInitializedRef.current = false; }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId, steps.length]); // Only depend on componentId and steps.length to avoid recreating on every steps change
  
  // Sync visual order with current order when current order changes (but not during drag)
  React.useEffect(() => {
    // Skip sync if we just initialized (to avoid double update)
    if (justInitializedRef.current) {
      return;
    }
    // Only sync if not dragging and currentOrder has content
    if (draggedIndex === null && draggedStepIndex === null && currentOrder.length > 0) {
      setVisualOrder(prevVisualOrder => {
        // Check if arrays are actually different before updating
        if (prevVisualOrder.length !== currentOrder.length) {
          return currentOrder;
        }
        // Deep comparison
        const isDifferent = prevVisualOrder.some((val, idx) => val !== currentOrder[idx]);
        return isDifferent ? currentOrder : prevVisualOrder;
      });
    }
  }, [currentOrder, draggedIndex, draggedStepIndex]);
  
  // Save state to global store whenever it changes
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.arrangeStepsStateStore) {
      window.arrangeStepsStateStore[componentId] = {
        currentOrder,
        isComplete,
        feedbackState,
        feedbackText: currentFeedbackText
      };
    }
  }, [componentId, currentOrder, isComplete, feedbackState, currentFeedbackText]);
  
  // Check if current order matches correct order
  const checkCorrectOrder = (order) => {
    return order.every((stepIndex, position) => stepIndex === position);
  };
  
  // Update concept summary panel (similar to FillBlanksComponent)
  const updateConceptSummaryPanel = () => {
    if (typeof window !== 'undefined') {
      // Update key concepts
      if (keyConcepts && keyConcepts.length > 0) {
        const updateKeyConceptsEvent = new CustomEvent('updateKeyConcepts', {
          detail: { keyConcepts }
        });
        window.dispatchEvent(updateKeyConceptsEvent);
      }
      
      // Update important formulae
      if (impFormulae && impFormulae.length > 0) {
        const updateFormulaeEvent = new CustomEvent('updateImpFormulae', {
          detail: { impFormulae }
        });
        window.dispatchEvent(updateFormulaeEvent);
      }
    }
  };
  
  // Handle drag start
  const handleDragStart = (draggableId, position) => {
    const displayIndex = parseInt(draggableId.replace('step-', ''), 10);
    // Find the actual stepIndex at this position in currentOrder
    const stepIndex = currentOrder[displayIndex];
    setDraggedIndex(displayIndex);
    setDraggedStepIndex(stepIndex);
    // Initialize visual order to current order when drag starts
    setVisualOrder(currentOrder);
    previousTargetIndexRef.current = null; // Reset previous target
    console.log('🎯 [ArrangeSteps] Drag started for displayIndex:', displayIndex, 'stepIndex:', stepIndex);
  };
  
  // Get draggable items from DOM
  const getDraggableItems = () => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll('[data-draggable-id^="step-"]'));
  };
  
  // Handle drag move - calculate drop target and update visual order (preview only)
  const handleDragMove = (draggableId, mousePosition) => {
    if (draggedIndex === null || draggedStepIndex === null || !containerRef.current) return;
    
    const items = getDraggableItems();
    
    // Find current visual position of dragged item
    const draggedVisualPos = visualOrder.findIndex(stepIdx => stepIdx === draggedStepIndex);
    
    let targetIndex = visualOrder.length; // Default to end, use visualOrder for calculation
    
    for (let i = 0; i < items.length; i++) {
      if (i === draggedVisualPos) continue; // Skip the dragged item
      
      const itemRect = items[i].getBoundingClientRect();
      
      if (orientation === 'vertical') {
        const itemMiddle = itemRect.top + itemRect.height / 2;
        if (mousePosition.y < itemMiddle) {
          targetIndex = i;
          break;
        }
      } else {
        const itemMiddle = itemRect.left + itemRect.width / 2;
        if (mousePosition.x < itemMiddle) {
          targetIndex = i;
          break;
        }
      }
    }
    
    // Only update if target index actually changed
    if (targetIndex !== previousTargetIndexRef.current) {
      previousTargetIndexRef.current = targetIndex;
      setDropTargetIndex(targetIndex);
      
      // Update visual order for preview (but don't update actual currentOrder until drop)
      if (targetIndex !== draggedVisualPos) {
        setVisualOrder(prevVisualOrder => {
          const newVisualOrder = [...prevVisualOrder];
          const draggedItemIndex = newVisualOrder.findIndex(stepIdx => stepIdx === draggedStepIndex);
          
          // Only update if position actually changed
          if (draggedItemIndex !== -1) {
            const [removed] = newVisualOrder.splice(draggedItemIndex, 1);
            
            // Adjust insert index if we removed from before the insert position
            const adjustedInsertIndex = draggedItemIndex < targetIndex ? targetIndex - 1 : targetIndex;
            newVisualOrder.splice(adjustedInsertIndex, 0, removed);
          }
          
          return newVisualOrder;
        });
      }
    }
  };
  
  // Handle drag end - reorder items
  const handleDragEnd = (draggableId, position) => {
    if (draggedIndex === null || draggedStepIndex === null || isComplete) {
      setDraggedIndex(null);
      setDraggedStepIndex(null);
      setDropTargetIndex(null);
      return;
    }
    
    // Use the final visual order position as the drop target
    const finalVisualPos = visualOrder.findIndex(stepIdx => stepIdx === draggedStepIndex);
    const originalPos = currentOrder.findIndex(stepIdx => stepIdx === draggedStepIndex);
    
    // Reorder the array (only update actual order on drop)
    if (finalVisualPos !== originalPos) {
      setCurrentOrder(prevOrder => {
        const newOrder = [...prevOrder];
        const [removed] = newOrder.splice(originalPos, 1);
        
        // Adjust insert index if we removed from before the insert position
        const adjustedInsertIndex = originalPos < finalVisualPos ? finalVisualPos - 1 : finalVisualPos;
        newOrder.splice(adjustedInsertIndex, 0, removed);
        
        console.log('🔄 [ArrangeSteps] Reordered:', prevOrder, '->', newOrder);
        
        // Play drop sound if enabled
        if (playDropSound && typeof window !== 'undefined' && window.playCarClickSound) {
          window.playCarClickSound('click');
        }
        
        // Check if correct
        const isCorrect = checkCorrectOrder(newOrder);
        
        if (isCorrect && !isComplete) {
          setIsComplete(true);
          if (showFeedback) {
            setFeedbackState('correct');
            setCurrentFeedbackText(feedbackText.correct || 'Correct! Steps are in the right order.');
          }
          
          // Play correct sound
          if (typeof window !== 'undefined' && window.playCarClickSound) {
            window.playCarClickSound('correct');
          }
          
          // Dispatch quizCompleted event
          if (typeof window !== 'undefined') {
            const enableNextEvent = new CustomEvent('quizCompleted', {
              detail: {
                componentId: componentId,
                componentType: 'ArrangeStepsComponent',
                pageNumber: window.getCurrentPage?.() || null
              }
            });
            window.dispatchEvent(enableNextEvent);
            console.log('✅ [ArrangeSteps] Dispatched quizCompleted event for componentId:', componentId);
          }
          
          // Update concept summary panel
          updateConceptSummaryPanel();
        } else if (!isCorrect && showFeedback) {
          setFeedbackState('incorrect');
          setCurrentFeedbackText(feedbackText.incorrect || 'Not quite. Try rearranging the steps.');
          
          // Clear incorrect feedback after a delay
          setTimeout(() => {
            setFeedbackState(null);
            setCurrentFeedbackText('');
          }, 2000);
        }
        
        return newOrder;
      });
    } else {
      // If dropped in same position, just reset visual order
      setVisualOrder(currentOrder);
    }
    
    setDraggedIndex(null);
    setDraggedStepIndex(null);
    setDropTargetIndex(null);
    previousTargetIndexRef.current = null; // Reset previous target
  };
  
  // Update global feedback state for feedback textbox component
  React.useEffect(() => {
    if (!window[feedbackStateKey]) {
      window[feedbackStateKey] = {
        text: '',
        mode: 'normal'
      };
    }
    
    if (currentFeedbackText && feedbackState) {
      window[feedbackStateKey].text = currentFeedbackText;
      window[feedbackStateKey].mode = feedbackState === 'correct' ? 'correct' : 'incorrect';
    } else {
      const existingState = window[feedbackStateKey];
      if (existingState && existingState.mode !== 'summary') {
        window[feedbackStateKey].text = '';
        window[feedbackStateKey].mode = 'normal';
      }
    }
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(feedbackEventName, {
        detail: {
          text: window[feedbackStateKey].text,
          mode: window[feedbackStateKey].mode
        }
      }));
    }
  }, [feedbackState, currentFeedbackText, feedbackStateKey, feedbackEventName]);
  
  // Get Draggable component
  const Draggable = window.DraggableComponent?.Draggable;
  
  if (!Draggable) {
    console.error('❌ [ArrangeSteps] Draggable component not found!');
    return React.createElement('div', {
      style: { color: 'red', padding: '20px' }
    }, 'Error: Draggable component not loaded');
  }
  
  // Don't render if order not yet initialized
  if (!currentOrder || currentOrder.length === 0) {
    return React.createElement('div', {
      style: { color: '#ffffff', padding: '20px' }
    }, 'Loading...');
  }
  
  // Render step buttons (use visualOrder for display during drag, currentOrder otherwise)
  const renderSteps = () => {
    const orderToRender = draggedIndex !== null ? visualOrder : currentOrder;
    // Find the visual position of the dragged item
    const draggedVisualIndex = draggedStepIndex !== null ? visualOrder.findIndex(stepIdx => stepIdx === draggedStepIndex) : null;
    
    const elements = [];
    
    // Track if we've added placeholder for this drop target
    let placeholderAdded = false;
    
    orderToRender.forEach((stepIndex, displayIndex) => {
      const stepText = steps[stepIndex];
      const isCorrectPosition = stepIndex === displayIndex;
      const isDragging = draggedVisualIndex !== null && draggedVisualIndex === displayIndex;
      const isDropTarget = dropTargetIndex === displayIndex;
      
      // Add placeholder before this position if it's the drop target and we haven't added it yet
      // Only show placeholder if drop target is valid and different from dragged position
      if (dropTargetIndex !== null && dropTargetIndex === displayIndex && draggedVisualIndex !== null && draggedVisualIndex !== displayIndex && !placeholderAdded) {
        const placeholderStyle = {
          minHeight: orientation === 'vertical' ? '60px' : 'auto',
          minWidth: orientation === 'horizontal' ? '200px' : 'auto',
          border: '3px dashed rgba(255, 255, 255, 0.8)',
          borderRadius: processedButtonBorderRadius,
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          margin: orientation === 'vertical' ? `0 0 ${processedGap} 0` : `0 ${processedGap} 0 0`,
          transition: 'all 0.2s ease',
          position: 'relative',
          boxShadow: '0 0 20px rgba(255, 255, 255, 0.4)'
        };
        
        elements.push(React.createElement('div', {
          key: `placeholder-${displayIndex}`,
          style: placeholderStyle,
          'data-placeholder': true
        }, React.createElement('div', {
          style: {
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '16px',
            fontWeight: 'bold',
            textShadow: '0 0 5px rgba(255, 255, 255, 0.5)'
          }
        }, '↓ Drop here ↓')));
        placeholderAdded = true;
      }
      
      // Determine background color
      let bgColor = activeButtonColor;
      if (isComplete) {
        bgColor = correctColor;
      } else if (showFeedback && feedbackState === 'incorrect' && !isCorrectPosition) {
        // Optionally highlight incorrect positions
      }
      
      const buttonStyle = {
        backgroundColor: bgColor,
        color: buttonFontColor,
        fontSize: processedButtonFontSize,
        borderRadius: processedButtonBorderRadius,
        padding: processedButtonPadding,
        cursor: isComplete ? 'default' : 'grab',
        opacity: isDragging ? 0.3 : (isDropTarget && draggedVisualIndex !== displayIndex ? 0.8 : 1),
        border: isDropTarget && draggedVisualIndex !== displayIndex ? '3px solid rgba(255, 255, 255, 0.9)' : (isDragging ? '3px solid rgba(255, 255, 255, 0.5)' : '2px solid transparent'),
        boxShadow: isDropTarget && draggedVisualIndex !== displayIndex ? '0 0 15px rgba(255, 255, 255, 0.6)' : (isDragging ? '0 0 20px rgba(255, 255, 255, 0.4)' : 'none'),
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minWidth: orientation === 'horizontal' ? '100px' : 'auto',
        minHeight: '40px',
        boxSizing: 'border-box',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transform: isDragging ? 'scale(1.1) rotate(2deg)' : 'scale(1)',
        zIndex: isDragging ? 1000 : 'auto',
        filter: isDragging ? 'brightness(1.2)' : 'none'
      };
      
      // Check if text contains HTML (like <br>)
      const containsHTML = stepText && typeof stepText === 'string' && /<[^>]+>/.test(stepText);
      
      const buttonContent = containsHTML ?
        React.createElement('span', {
          dangerouslySetInnerHTML: { __html: stepText },
          style: { pointerEvents: 'none' }
        }) :
        stepText;
      
      elements.push(React.createElement(Draggable, {
        key: `step-${displayIndex}`,
        draggableId: `step-${displayIndex}`,
        onDragStart: handleDragStart,
        onDragMove: handleDragMove,
        onDragEnd: handleDragEnd,
        isDisabled: isComplete,
        isAnyDragging: draggedIndex !== null,
        currentDraggingId: draggedIndex !== null ? `step-${draggedIndex}` : null,
        style: buttonStyle,
        'data-step-index': displayIndex
      }, buttonContent));
    });
    
    // Add placeholder at the end if drop target is at the end
    if (dropTargetIndex === orderToRender.length && draggedVisualIndex !== null && !placeholderAdded) {
      const placeholderStyle = {
        minHeight: orientation === 'vertical' ? '60px' : 'auto',
        minWidth: orientation === 'horizontal' ? '200px' : 'auto',
        border: '3px dashed rgba(255, 255, 255, 0.8)',
        borderRadius: processedButtonBorderRadius,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        margin: orientation === 'vertical' ? `${processedGap} 0 0 0` : `0 0 0 ${processedGap}`,
        transition: 'all 0.2s ease',
        position: 'relative',
        animation: 'pulse 1.5s ease-in-out infinite'
      };
      
      elements.push(React.createElement('div', {
        key: 'placeholder-end',
        style: placeholderStyle,
        'data-placeholder': true
      }, React.createElement('div', {
        style: {
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '16px',
          fontWeight: 'bold',
          textShadow: '0 0 5px rgba(255, 255, 255, 0.5)'
        }
      }, '↓ Drop here ↓')));
    }
    
    return elements;
  };
  
  // Container style
  const containerStyle = {
    ...(position?.css || {}),
    ...(processedStyles || {}),
    zIndex: elementZIndex,
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: containerBackgroundColor,
    border: `${processedContainerBorderWidth} ${containerBorderType} ${containerBorderColor}`,
    boxSizing: 'border-box'
  };
  
  // Steps container style
  const stepsContainerStyle = {
    display: 'flex',
    flexDirection: orientation === 'vertical' ? 'column' : 'row',
    gap: processedGap,
    padding: processedGap,
    flexWrap: orientation === 'horizontal' ? 'wrap' : 'nowrap',
    alignItems: orientation === 'horizontal' ? 'center' : 'stretch',
    justifyContent: 'flex-start',
    flex: 1
  };
  
  // Instruction style
  const instructionStyle = {
    fontSize: processedInstructionFontSize,
    color: instructionFontColor,
    textAlign: 'center',
    padding: processedGap,
    marginBottom: '0'
  };
  
  return React.createElement('div', {
    id: elementId,
    ref: containerRef,
    'data-component-type': 'ArrangeStepsComponent',
    'data-component-id': componentId,
    style: containerStyle
  }, [
    // Instruction text
    instructionText && React.createElement('div', {
      key: 'instruction',
      style: instructionStyle
    }, instructionText),
    
    // Steps container
    React.createElement('div', {
      key: 'steps-container',
      style: stepsContainerStyle
    }, renderSteps())
  ]);
});

// Arrange Steps Element Configuration
const ArrangeStepsElement = {
  arrangeSteps: {
    type: 'arrange-steps',
    coordinates: [0, 0, 600, 400],
    zIndex: 'var(--z-content)',
    props: {
      steps: ['Step 1', 'Step 2', 'Step 3'],
      orientation: 'vertical',
      buttonColor: '#2a3f5f',
      buttonFontColor: '#ffffff',
      buttonFontSize: '24gc',
      buttonBorderRadius: '8gc',
      buttonPadding: '12gc',
      gap: '10gc',
      correctColor: '#10b981',
      incorrectColor: '#ef4444',
      showFeedback: true,
      feedbackText: { correct: 'Correct!', incorrect: 'Try again.' },
      instructionText: 'Drag to arrange in correct order'
    }
  }
};

// Export component and configuration
window.ArrangeStepsComponent = {
  ArrangeStepsComponent,
  ArrangeStepsElement
};

console.log('✅ Arrange Steps component loaded successfully');

