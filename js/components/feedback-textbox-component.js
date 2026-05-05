/**
 * Feedback Textbox Component - React 18 Optimized
 * 
 * A textbox component with four modes for displaying feedback:
 * - normal: transparent background, white text, no border
 * - correct: green background, white text, dashed border
 * - incorrect: salmon background, white text, dashed border
 * - summary: #70ACC7 background, black text, white dashed border
 */

// Dependencies: SharedUtilities, GridCellFontUtils should be loaded before this file

/**
 * Feedback Textbox Component
 */
const FeedbackTextboxComponent = React.memo((props) => {
  const elementId = React.useId();
  const { 
    position, 
    processedStyles: processedStylesProp, 
    elementZIndex,
    text: textProp = '',
    mode: modeProp = 'normal',
    allowHTML = false,
    ...otherProps 
  } = props;
  
  // Read from global state if available (for pageN-feedback-textbox)
  const componentId = props.id || elementId;
  // Extract page number from component ID (e.g., 'page6-feedback-textbox' -> 'page6')
  const pageMatch = componentId.match(/page(\d+)/);
  const pageId = pageMatch ? `page${pageMatch[1]}` : null;
  const isPageFeedback = pageId && componentId === `${pageId}-feedback-textbox`;
  const feedbackStateKey = pageId ? `${pageId}FeedbackState` : null;
  const feedbackEventName = pageId ? `${pageId}FeedbackUpdate` : null;
  
  const [feedbackState, setFeedbackState] = React.useState(() => {
    if (isPageFeedback && feedbackStateKey && window[feedbackStateKey]) {
      return {
        text: window[feedbackStateKey].text || textProp,
        mode: window[feedbackStateKey].mode || modeProp
      };
    }
    return {
      text: textProp,
      mode: modeProp
    };
  });
  
  // Listen for feedback updates (for pageN-feedback-textbox)
  React.useEffect(() => {
    if (isPageFeedback && feedbackEventName) {
      const handleFeedbackUpdate = (event) => {
        setFeedbackState({
          text: event.detail.text || '',
          mode: event.detail.mode || 'normal'
        });
      };
      
      window.addEventListener(feedbackEventName, handleFeedbackUpdate);
      return () => {
        window.removeEventListener(feedbackEventName, handleFeedbackUpdate);
      };
    }
  }, [isPageFeedback, feedbackEventName]);
  
  // Use feedback state if this is pageN-feedback-textbox, otherwise use props
  const currentText = isPageFeedback ? feedbackState.text : textProp;
  const currentMode = isPageFeedback ? feedbackState.mode : modeProp;
  
  const [isPending, startTransition] = React.useTransition();
  const deferredText = React.useDeferredValue(currentText);
  const deferredMode = React.useDeferredValue(currentMode);
  
  // Handle text change callback
  const handleTextChange = React.useCallback((newText) => {
    if (props.onTextChange) {
      startTransition(() => {
        props.onTextChange(newText);
      });
    }
  }, [props.onTextChange]);
  
  // Handle mode change callback
  const handleModeChange = React.useCallback((newMode) => {
    if (props.onModeChange) {
      startTransition(() => {
        props.onModeChange(newMode);
      });
    }
  }, [props.onModeChange]);
  
  // Memoize mode-based styles
  const modeStyles = React.useMemo(() => {
    const borderRadius = props.borderRadius || '12gc';
    const borderWidth = '4gc';
    
    switch (deferredMode) {
      case 'correct':
        return {
          color: 'white',
          backgroundColor: 'var(--color-green)',
          borderWidth: borderWidth,
          borderStyle: 'dashed',
          borderColor: 'var(--color-green-dark)',
          borderRadius: borderRadius
        };
      case 'incorrect':
        return {
          color: 'white',
          backgroundColor: 'var(--color-salmon)',
          borderWidth: borderWidth,
          borderStyle: 'dashed',
          borderColor: 'var(--color-salmon-dark)',
          borderRadius: borderRadius
        };
      case 'summary':
        return {
          color: '#000000',
          backgroundColor: '#70ACC7',
          borderWidth: borderWidth,
          borderStyle: 'dashed',
          borderColor: '#ffffff',
          borderRadius: borderRadius
        };
      case 'normal':
      default:
        return {
          color: 'white',
          backgroundColor: 'transparent',
          borderWidth: '0gc',
          borderStyle: 'none',
          borderColor: 'transparent',
          borderRadius: borderRadius
        };
    }
  }, [deferredMode, props.borderRadius]);
  
  // Combine all styles and process GC units
  const processedStyles = React.useMemo(() => {
    const combinedStyles = {
      ...modeStyles,
      fontSize: props.fontSize || '32gc',
      ...otherProps
    };
    
    return GridCellFontUtils.processGcStyles(combinedStyles);
  }, [modeStyles, props.fontSize, otherProps]);
  
  // Combine position CSS with processed styles
  const containerStyle = {
    ...(position?.css || {}),
    ...processedStyles,
    zIndex: elementZIndex || props.zIndex || 402,
    position: 'absolute'
  };
  
  // Check if text contains HTML tags
  const containsHTML = allowHTML || (typeof deferredText === 'string' && /<[^>]+>/.test(deferredText));
  
  const divProps = {
    id: elementId,
    className: `feedback-textbox-container feedback-textbox-${deferredMode}${isPending ? ' pending' : ''}`,
    style: containerStyle,
    'data-element-type': 'feedback-textbox',
    'data-mode': deferredMode
  };
  
  // Use dangerouslySetInnerHTML if HTML is detected, otherwise render as text
  // Wrap HTML content in inline span to prevent flex container from splitting text
  if (containsHTML) {
    const wrappedText = `<span style="display: inline;">${deferredText}</span>`;
    divProps.dangerouslySetInnerHTML = { __html: wrappedText };
  }
  
  return React.createElement('div', divProps, containsHTML ? null : deferredText);
});

/**
 * Textbox Component (for backward compatibility with standard textbox type)
 */
const TextboxComponent = React.memo((props) => {
  const elementId = React.useId();
  const deferredText = React.useDeferredValue(props.text || '');
  const processedStyles = GridCellFontUtils.processGcStyles(props);
  
  return React.createElement('div', {
    id: elementId,
    className: 'textbox-container',
    style: processedStyles,
    'data-element-type': 'textbox'
  }, deferredText);
});

/**
 * Container Component (for general purpose containers)
 */
const ContainerComponent = React.memo((props) => {
  const elementId = React.useId();
  const processedStyles = GridCellFontUtils.processGcStyles(props);
  
  return React.createElement('div', {
    id: elementId,
    className: 'container-element',
    style: processedStyles,
    'data-element-type': 'container'
  }, props.children);
});

// Feedback Textbox Elements Configuration
const FeedbackTextboxElement = {
  'feedback-textbox': {
    type: 'feedback-textbox',
    coordinates: [1, 1, 128, 10],
    zIndex: 'var(--z-content)',
    props: {
      text: 'Feedback message',
      fontSize: '32gc',
      borderRadius: '12gc',
      mode: 'normal',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10gc',
      boxSizing: 'border-box'
    },
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('feedback-textbox', (props, elementId) => {
      return React.createElement(FeedbackTextboxComponent, props);
    })
  },
  
  // Also provide standard textbox and container if not already available
  textbox: {
    type: 'textbox',
    coordinates: [1, 1, 128, 10],
    zIndex: 'var(--z-content)',
    props: {
      text: 'Text content',
      fontSize: '32gc',
      textAlign: 'center',
      color: 'white',
      backgroundColor: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('textbox', (props, elementId) => {
      return React.createElement(TextboxComponent, props);
    })
  },
  
  container: {
    type: 'container',
    coordinates: [1, 1, 128, 72],
    zIndex: 'var(--z-content)',
    props: {
      backgroundColor: 'transparent',
      borderRadius: '0gc'
    },
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('container', (props, elementId) => {
      return React.createElement(ContainerComponent, props);
    })
  }
};

// Export components and configuration
window.FeedbackTextboxComponent = {
  FeedbackTextboxComponent,
  TextboxComponent,
  ContainerComponent,
  FeedbackTextboxElement
};

/**
 * Times4 Textbox Component - React component that updates text on quiz completion
 * Listens to quizCompleted event for page 7 and updates text from "×?" to "×4" with blinking animation
 * On page 8, it starts with "×4" directly
 */
const Times4TextboxComponent = React.memo((props) => {
  const elementId = React.useId();
  const componentId = props.id || elementId;
  
  // Extract page number from component ID (e.g., 'page7-times4-text' -> 7)
  const pageMatch = componentId.match(/page(\d+)/);
  const pageNumber = pageMatch ? parseInt(pageMatch[1], 10) : null;
  
  // Helper function to get i18n text
  const getI18nText = (key, fallback) => {
    if (typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function') {
      return window.i18n.t(key, {}) || fallback;
    }
    return fallback;
  };
  
  // Initialize text based on page: page 8, 10, and 11 start with "×4", others start with "×?"
  const initialText = (pageNumber === 8 || pageNumber === 10 || pageNumber === 11) 
    ? getI18nText('common.labels.times4', '×4')
    : getI18nText('common.labels.timesQuestion', '×?');
  
  // Initialize blinking: page 10 and 11 blink by default, others don't
  const initialBlinking = (pageNumber === 10 || pageNumber === 11) ? true : false;
  
  // State for text and blinking
  const [text, setText] = React.useState(initialText);
  const [isBlinking, setIsBlinking] = React.useState(initialBlinking);
  
  // Listen for quizCompleted event for page 7 and 8
  React.useEffect(() => {
    const handleQuizCompleted = (event) => {
      const eventPageNumber = event.detail?.pageNumber;
      if (eventPageNumber === 7 || eventPageNumber === 8) {
        console.log(`🔍 [Times4Textbox] Quiz completed for page ${eventPageNumber}, updating text to ×4`);
        setText(getI18nText('common.labels.times4', '×4'));
        setIsBlinking(true);
      }
    };
    
    window.addEventListener('quizCompleted', handleQuizCompleted);
    
    return () => {
      window.removeEventListener('quizCompleted', handleQuizCompleted);
    };
  }, []);
  
  // Process styles
  const processedStyles = GridCellFontUtils.processGcStyles(props);
  
  // Extract position and elementZIndex from props (they should be in otherProps from elements-registry)
  const position = props.position;
  const elementZIndex = props.elementZIndex || props.zIndex || 54;
  
  // Add blinking animation style
  const blinkKeyframes = `
    @keyframes blink-text {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `;
  
  const containerStyle = {
    ...processedStyles,
    ...(position?.css || {}),
    zIndex: elementZIndex,
    position: 'absolute',
    ...(isBlinking ? {
      animation: 'blink-text 1s ease-in-out infinite'
    } : {})
  };
  
  return React.createElement(React.Fragment, null,
    React.createElement('style', {
      key: 'blink-keyframes',
      dangerouslySetInnerHTML: { __html: blinkKeyframes }
    }),
    React.createElement('div', {
      key: 'times4-textbox',
      id: elementId,
      className: 'times4-textbox-container',
      style: containerStyle,
      'data-element-type': 'times4-textbox'
    }, text)
  );
});

// Export Times4TextboxComponent
window.FeedbackTextboxComponent.Times4TextboxComponent = Times4TextboxComponent;

console.log('✅ Feedback textbox component loaded successfully');

