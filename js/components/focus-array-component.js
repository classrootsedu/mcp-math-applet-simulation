/**
 * FocusArray Component
 * 
 * A reusable React component that manages sequential focus across interactive elements
 * using a focus array pattern. Perfect for guided step-by-step interactions.
 * 
 * @example
 * const focusConfig = [
 *   {
 *     targetID: "input-1",
 *     correctAnswer: 42,
 *     instruction: "Enter the first number",
 *     feedbackCorrect: "Great!",
 *     feedbackIncorrect: "Try again!"
 *   },
 *   {
 *     targetID: "input-2",
 *     correctAnswer: 10,
 *     instruction: "Enter the second number",
 *     feedbackCorrect: "Perfect!",
 *     feedbackIncorrect: "Not quite!"
 *   }
 * ];
 * 
 * <FocusArrayComponent 
 *   focusArray={focusConfig}
 *   onComplete={() => console.log("All steps completed!")}
 *   renderInput={(currentFocus, handlers) => <CustomInput {...handlers} />}
 * />
 */

const { useState, useEffect, useCallback, useMemo, useRef } = React;

/**
 * @typedef {Object} FocusItem
 * @property {string} targetID - ID of the element to focus
 * @property {any} correctAnswer - Expected correct answer
 * @property {string} instruction - Instruction text to display
 * @property {string} feedbackCorrect - Feedback for correct answer
 * @property {string} feedbackIncorrect - Feedback for incorrect answer
 * @property {Function} [validator] - Optional custom validation function
 * @property {Function} [onCorrect] - Optional callback when answer is correct
 * @property {Function} [onIncorrect] - Optional callback when answer is incorrect
 */

/**
 * FocusArray Component
 * Manages sequential focus through an array of interactive elements
 */
const FocusArrayComponent = ({
  focusArray = [],
  initialIndex = 0,
  onComplete = null,
  onFocusChange = null,
  renderElement = null,
  autoFocusFirst = true,
  visualFeedback = true,
  soundEnabled = true,
  // Styling options
  focusStyles = {
    border: '3px solid var(--color-blue)',
    boxShadow: '0 0 20px lime, 0 0 40px lime',
    transform: 'scale(1.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    animation: 'pulse 1.5s ease-in-out infinite'
  },
  unfocusedStyles = {
    border: '2px solid rgba(255, 255, 255, 0.3)',
    boxShadow: 'none',
    transform: 'scale(1)',
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    animation: 'none'
  },
  correctStyles = {
    backgroundColor: 'var(--color-green)'
  },
  incorrectStyles = {
    backgroundColor: 'var(--color-salmon)'
  }
}) => {
  // State management
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [lastAttemptIncorrect, setLastAttemptIncorrect] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [completedIndices, setCompletedIndices] = useState(new Set());
  
  // Refs
  const focusedElementRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);

  // Current focus item
  const currentFocus = useMemo(() => {
    return focusArray[currentIndex] || null;
  }, [focusArray, currentIndex]);

  // Is completed
  const isCompleted = useMemo(() => {
    return currentIndex >= focusArray.length;
  }, [currentIndex, focusArray.length]);

  /**
   * Apply visual styling to an element
   */
  const applyStyles = useCallback((element, styles) => {
    if (!element) return;
    
    Object.entries(styles).forEach(([property, value]) => {
      if (property === 'animation') {
        // Handle animation specially to trigger reflow
        element.style.animation = 'none';
        element.offsetHeight; // Force reflow
        element.style.animation = value;
      } else {
        element.style[property] = value;
      }
    });
  }, []);

  /**
   * Update focus styling for all elements
   */
  const updateFocusStyling = useCallback(() => {
    if (!visualFeedback || !currentFocus) return;

    // Remove focus from all elements
    focusArray.forEach(item => {
      const element = document.querySelector(`[data-focus-id="${item.targetID}"]`);
      if (element && !completedIndices.has(item.targetID)) {
        applyStyles(element, unfocusedStyles);
      }
    });

    // Apply focus to current element
    if (currentFocus.targetID !== 'complete') {
      const focusedElement = document.querySelector(`[data-focus-id="${currentFocus.targetID}"]`);
      if (focusedElement) {
        focusedElementRef.current = focusedElement;
        
        // Don't override correct/incorrect colors
        const computedBg = getComputedStyle(focusedElement).backgroundColor;
        const hasAnswerFeedback = 
          computedBg.includes('rgb(0, 128, 0)') || // Green
          computedBg.includes('rgb(0, 255, 0)') ||
          computedBg.includes('rgb(250, 128, 114)') || // Salmon
          computedBg.includes('salmon');
        
        if (!hasAnswerFeedback) {
          applyStyles(focusedElement, focusStyles);
        } else {
          // Apply focus styles but keep the answer feedback color
          const stylesToApply = { ...focusStyles };
          delete stylesToApply.backgroundColor;
          applyStyles(focusedElement, stylesToApply);
        }
      }
    }
  }, [focusArray, currentFocus, completedIndices, visualFeedback, focusStyles, unfocusedStyles, applyStyles]);

  /**
   * Get the currently focused element
   */
  const getFocusedElement = useCallback(() => {
    if (!currentFocus || currentFocus.targetID === 'complete') return null;
    return document.querySelector(`[data-focus-id="${currentFocus.targetID}"]`);
  }, [currentFocus]);

  /**
   * Update element text content
   */
  const updateFocusedText = useCallback((value) => {
    const element = getFocusedElement();
    if (!element) return;

    // If last attempt was incorrect, start fresh
    if (lastAttemptIncorrect) {
      element.textContent = value;
      setLastAttemptIncorrect(false);
      
      // Reset background to focused state
      if (visualFeedback) {
        applyStyles(element, { backgroundColor: focusStyles.backgroundColor });
      }
      return;
    }

    // Otherwise, append to existing content
    const currentText = element.textContent || '';
    const newText = currentText + value;
    
    // Validate max value (999)
    const newNumber = parseInt(newText);
    if (newNumber > 999) {
      console.log(`[FocusArray] Value ${newNumber} exceeds maximum of 999`);
      return;
    }
    
    element.textContent = newText;
  }, [getFocusedElement, lastAttemptIncorrect, visualFeedback, focusStyles, applyStyles]);

  /**
   * Clear focused element text
   */
  const clearFocusedText = useCallback(() => {
    const element = getFocusedElement();
    if (element) {
      element.textContent = '';
    }
  }, [getFocusedElement]);

  /**
   * Backspace on focused element text
   */
  const backspaceFocusedText = useCallback(() => {
    const element = getFocusedElement();
    if (element) {
      const currentText = element.textContent || '';
      element.textContent = currentText.slice(0, -1);
    }
  }, [getFocusedElement]);

  /**
   * Show feedback message
   */
  const showFeedback = useCallback((message, type) => {
    setFeedback({ message, type });

    // Clear previous timeout
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    // Auto-clear feedback after 2 seconds
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback({ message: '', type: '' });
    }, 2000);
  }, []);

  /**
   * Validate current answer
   */
  const validateAnswer = useCallback((userAnswer) => {
    if (!currentFocus) return false;

    // Use custom validator if provided
    const isCorrect = currentFocus.validator
      ? currentFocus.validator(userAnswer, currentFocus.correctAnswer)
      : userAnswer === currentFocus.correctAnswer;

    const element = getFocusedElement();

    if (isCorrect) {
      // Correct answer
      console.log(`[FocusArray] ✅ Correct answer: ${userAnswer}`);
      
      // Show feedback
      showFeedback(currentFocus.feedbackCorrect, 'correct');

      // Apply correct styling
      if (element && visualFeedback) {
        applyStyles(element, correctStyles);
      }

      // Play success sound
      if (soundEnabled && typeof window.playAnswerSound === 'function') {
        window.playAnswerSound(true);
      }

      // Call onCorrect callback
      if (currentFocus.onCorrect) {
        currentFocus.onCorrect(userAnswer);
      }

      // Mark as completed
      setCompletedIndices(prev => new Set([...prev, currentFocus.targetID]));

      // Advance to next focus
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setLastAttemptIncorrect(false);
      }, 500);

      return true;
    } else {
      // Incorrect answer
      console.log(`[FocusArray] ❌ Incorrect answer: ${userAnswer}`);
      
      // Show feedback
      showFeedback(currentFocus.feedbackIncorrect, 'incorrect');

      // Apply incorrect styling
      if (element && visualFeedback) {
        applyStyles(element, incorrectStyles);
      }

      // Play error sound
      if (soundEnabled && typeof window.playAnswerSound === 'function') {
        window.playAnswerSound(false);
      }

      // Call onIncorrect callback
      if (currentFocus.onIncorrect) {
        currentFocus.onIncorrect(userAnswer);
      }

      // Set flag for next input
      setLastAttemptIncorrect(true);

      return false;
    }
  }, [currentFocus, getFocusedElement, showFeedback, visualFeedback, soundEnabled, correctStyles, incorrectStyles, applyStyles]);

  /**
   * Reset the focus array
   */
  const reset = useCallback(() => {
    setCurrentIndex(0);
    setLastAttemptIncorrect(false);
    setFeedback({ message: '', type: '' });
    setCompletedIndices(new Set());
    
    // Clear all styling
    focusArray.forEach(item => {
      const element = document.querySelector(`[data-focus-id="${item.targetID}"]`);
      if (element) {
        applyStyles(element, unfocusedStyles);
      }
    });
  }, [focusArray, unfocusedStyles, applyStyles]);

  // Update focus styling when index changes
  useEffect(() => {
    updateFocusStyling();

    // Notify parent of focus change
    if (onFocusChange) {
      onFocusChange(currentIndex, currentFocus);
    }
  }, [currentIndex, currentFocus, updateFocusStyling, onFocusChange]);

  // Handle completion
  useEffect(() => {
    if (isCompleted && onComplete) {
      console.log('[FocusArray] All steps completed!');
      onComplete();
    }
  }, [isCompleted, onComplete]);

  // Auto-focus first element on mount
  useEffect(() => {
    if (autoFocusFirst && focusArray.length > 0) {
      updateFocusStyling();
    }
  }, [autoFocusFirst, focusArray.length, updateFocusStyling]);

  // Expose methods to parent component via window
  useEffect(() => {
    window.focusArrayMethods = {
      updateText: updateFocusedText,
      clearText: clearFocusedText,
      backspace: backspaceFocusedText,
      validate: validateAnswer,
      reset: reset,
      getCurrentFocus: () => currentFocus,
      getCurrentIndex: () => currentIndex,
      isCompleted: () => isCompleted
    };

    return () => {
      delete window.focusArrayMethods;
    };
  }, [updateFocusedText, clearFocusedText, backspaceFocusedText, validateAnswer, reset, currentFocus, currentIndex, isCompleted]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  // Render custom element if provided
  if (renderElement) {
    return renderElement({
      currentFocus,
      currentIndex,
      isCompleted,
      feedback,
      handlers: {
        updateText: updateFocusedText,
        clearText: clearFocusedText,
        backspace: backspaceFocusedText,
        validate: validateAnswer,
        reset
      }
    });
  }

  // Default render: instruction text and feedback
  return React.createElement('div', {
    className: 'focus-array-container'
  }, [
    currentFocus && currentFocus.instruction && React.createElement('div', {
      key: 'instruction',
      className: 'focus-array-instruction',
      style: {
        padding: '10px',
        fontSize: '16px',
        fontWeight: 'bold',
        textAlign: 'center'
      }
    }, currentFocus.instruction),
    
    feedback.message && React.createElement('div', {
      key: 'feedback',
      className: `focus-array-feedback focus-array-feedback-${feedback.type}`,
      style: {
        padding: '10px',
        margin: '10px 0',
        borderRadius: '5px',
        textAlign: 'center',
        backgroundColor: feedback.type === 'correct' ? 'var(--color-green)' : 'var(--color-salmon)',
        color: 'white',
        fontWeight: 'bold'
      }
    }, feedback.message),

    isCompleted && React.createElement('div', {
      key: 'complete',
      className: 'focus-array-complete',
      style: {
        padding: '20px',
        textAlign: 'center',
        fontSize: '18px',
        fontWeight: 'bold',
        color: 'var(--color-green)'
      }
    }, '✅ All steps completed!')
  ]);
};

// Export component
if (typeof window !== 'undefined') {
  window.FocusArrayComponent = FocusArrayComponent;
}

/**
 * Example Usage Helper
 * Creates a simple focus array setup for testing
 */
window.createSimpleFocusArray = (elements) => {
  return elements.map((el, index) => ({
    targetID: el.id || `element-${index}`,
    correctAnswer: el.answer,
    instruction: el.instruction || `Step ${index + 1}`,
    feedbackCorrect: el.correctMessage || "Correct!",
    feedbackIncorrect: el.incorrectMessage || "Try again!"
  }));
};

console.log('✅ FocusArrayComponent loaded successfully');


