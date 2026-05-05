/**
 * Stage Component - React 18 Optimized
 * 
 * This component manages multi-step stages with images, buttons, and descriptions.
 * Each stage displays one at a time, but previous stage images remain visible (layered effect).
 * 
 * Features:
 * - Sequential stage progression with button clicks
 * - Previous stage images remain visible with offset (stacking effect)
 * - Callbacks for stage completion and all stages complete
 * - Internal state management for current stage
 * - Grid positioning support with gc units
 * - Optional animations and customization
 */

// Dependencies: SharedUtilities, GridCellFontUtils, InteractionComponents should be loaded before this file

/**
 * StageComponent - Manages sequential stages with images, buttons, and text
 * 
 * @param {Object} props - Component properties
 * @param {Array} props.stageArray - Array of stage objects: [{ image: "", buttonText: "", descriptionText: "" }, ...]
 * @param {Object} props.image - Image configuration: { coordinates: {...}, ...styles }
 * @param {Object} props.button - Button configuration: { coordinates: {...}, ...styles }
 * @param {Object} props.text - Text configuration: { coordinates: {...}, ...styles }
 * @param {Function} props.onStageComplete - Callback when stage button clicked: (stageIndex, stageData) => void
 * @param {Function} props.onAllStagesComplete - Callback when all stages completed: () => void
 * @param {Number} props.initialStage - Starting stage index (default: 0)
 * @param {String} props.imageStackOffset - Offset for layering previous images (default: "2gc")
 * @param {Boolean} props.animateTransitions - Enable animations (default: true)
 * @param {Boolean} props.showImageNumbers - Show step numbers on images (default: false)
 * @param {Boolean} props.disabled - Disable component interactions
 * @param {String} props.className - Custom container class
 * @param {Object} props.style - Custom container styles
 */
const StageComponent = React.memo((props) => {
  const elementId = React.useId();
  const [currentStageIndex, setCurrentStageIndex] = React.useState(props.initialStage || 0);
  const [isPending, startTransition] = React.useTransition();
  const [imageLoadStates, setImageLoadStates] = React.useState({});
  const [preloadedImages, setPreloadedImages] = React.useState(new Set());
  const preloadedImagesRef = React.useRef(new Set());

  // Destructure props with defaults
  const {
    stageArray = [],
    image = {},
    button = {},
    text = {},
    header = {},
    line = {},
    tapGif = {}, // Add tap.gif configuration
    headerText = '',
    showTapGif = false, // Control whether tap.gif is shown
    keepPreviousImages = false, // NEW: Control whether to keep previous images visible (default: false)
    onStageComplete,
    onAllStagesComplete,
    initialStage = 0,
    imageStackOffset = '0gc', // Default to 0 (no offset)
    animateTransitions = true,
    showImageNumbers = false,
    disabled = false,
    className = '',
    style = {},
    position,
    processedStyles,
    elementZIndex,
    ...otherProps
  } = props;

  // Extract coordinates and styles from image, button, text, header, line, tapGif objects
  const { coordinates: imageCoordinates = [], ...imageStyles } = image;
  const { coordinates: buttonCoordinates = [], ...buttonStyles } = button;
  const { coordinates: textCoordinates = [], ...textStyles } = text;
  const { coordinates: headerCoordinates = [], ...headerStyles } = header;
  const { coordinates: lineCoordinates = [], ...lineStyles } = line;
  const { coordinates: tapGifCoordinates = [], imageSrc: tapGifSrc = 'assets/tap.gif', ...tapGifStyles } = tapGif;

  // Convert array coordinates [x1, y1, x2, y2] to percentage-based CSS
  // This matches the gridpositions.js conversion logic
  const convertCoordinatesToCSS = React.useCallback((coords) => {
    if (!coords || coords.length !== 4) return {};
    const [x1, y1, x2, y2] = coords;
    
    // Grid dimensions (standard for this applet)
    const gridWidth = 1600;
    const gridHeight = 900;
    
    // Calculate width and height
    const width = x2 - x1;
    const height = y2 - y1;
    
    // Convert to percentages (matching gridpositions.js logic)
    const leftPercent = (x1 / gridWidth) * 100;
    const topPercent = (y1 / gridHeight) * 100;
    const widthPercent = (width / gridWidth) * 100;
    const heightPercent = (height / gridHeight) * 100;
    
    return {
      position: 'absolute',
      left: `${leftPercent.toFixed(2)}%`,
      top: `${topPercent.toFixed(2)}%`,
      width: `${widthPercent.toFixed(2)}%`,
      height: `${heightPercent.toFixed(2)}%`
    };
  }, []);

  // Process gc units for coordinates and styles
  const processedImageCoordinates = React.useMemo(() => {
    const cssCoords = convertCoordinatesToCSS(imageCoordinates);
    return window.GridCellFontUtils?.processGcStyles ? 
      window.GridCellFontUtils.processGcStyles(cssCoords) : 
      cssCoords;
  }, [imageCoordinates, convertCoordinatesToCSS]);

  const processedButtonCoordinates = React.useMemo(() => {
    const cssCoords = convertCoordinatesToCSS(buttonCoordinates);
    return window.GridCellFontUtils?.processGcStyles ? 
      window.GridCellFontUtils.processGcStyles(cssCoords) : 
      cssCoords;
  }, [buttonCoordinates, convertCoordinatesToCSS]);

  const processedTextCoordinates = React.useMemo(() => {
    const cssCoords = convertCoordinatesToCSS(textCoordinates);
    return window.GridCellFontUtils?.processGcStyles ? 
      window.GridCellFontUtils.processGcStyles(cssCoords) : 
      cssCoords;
  }, [textCoordinates, convertCoordinatesToCSS]);

  const processedHeaderCoordinates = React.useMemo(() => {
    const cssCoords = convertCoordinatesToCSS(headerCoordinates);
    return window.GridCellFontUtils?.processGcStyles ? 
      window.GridCellFontUtils.processGcStyles(cssCoords) : 
      cssCoords;
  }, [headerCoordinates, convertCoordinatesToCSS]);

  const processedLineCoordinates = React.useMemo(() => {
    const cssCoords = convertCoordinatesToCSS(lineCoordinates);
    return window.GridCellFontUtils?.processGcStyles ? 
      window.GridCellFontUtils.processGcStyles(cssCoords) : 
      cssCoords;
  }, [lineCoordinates, convertCoordinatesToCSS]);

  const processedTapGifCoordinates = React.useMemo(() => {
    const cssCoords = convertCoordinatesToCSS(tapGifCoordinates);
    return window.GridCellFontUtils?.processGcStyles ? 
      window.GridCellFontUtils.processGcStyles(cssCoords) : 
      cssCoords;
  }, [tapGifCoordinates, convertCoordinatesToCSS]);

  const processedImageStyle = React.useMemo(() => {
    return window.GridCellFontUtils?.processGcStyles ? 
      window.GridCellFontUtils.processGcStyles(imageStyles) : 
      imageStyles;
  }, [imageStyles]);

  const processedButtonStyle = React.useMemo(() => {
    return window.GridCellFontUtils?.processGcStyles ? 
      window.GridCellFontUtils.processGcStyles(buttonStyles) : 
      buttonStyles;
  }, [buttonStyles]);

  const processedTextStyle = React.useMemo(() => {
    return window.GridCellFontUtils?.processGcStyles ? 
      window.GridCellFontUtils.processGcStyles(textStyles) : 
      textStyles;
  }, [textStyles]);

  const processedHeaderStyle = React.useMemo(() => {
    return window.GridCellFontUtils?.processGcStyles ? 
      window.GridCellFontUtils.processGcStyles(headerStyles) : 
      headerStyles;
  }, [headerStyles]);

  const processedLineStyle = React.useMemo(() => {
    return window.GridCellFontUtils?.processGcStyles ? 
      window.GridCellFontUtils.processGcStyles(lineStyles) : 
      lineStyles;
  }, [lineStyles]);

  const processedTapGifStyle = React.useMemo(() => {
    return window.GridCellFontUtils?.processGcStyles ? 
      window.GridCellFontUtils.processGcStyles(tapGifStyles) : 
      tapGifStyles;
  }, [tapGifStyles]);

  const processedStackOffset = React.useMemo(() => {
    if (!imageStackOffset) return 0;
    if (typeof imageStackOffset === 'string' && imageStackOffset.includes('gc')) {
      return window.GridCellFontUtils?.processGcProperty ? 
        window.GridCellFontUtils.processGcProperty(imageStackOffset, 'width') : 
        imageStackOffset;
    }
    return imageStackOffset;
  }, [imageStackOffset]);

  // Get current stage data
  const currentStage = React.useMemo(() => {
    return stageArray[currentStageIndex] || {};
  }, [stageArray, currentStageIndex]);

  // Deferred value for text (call at top level, not inside useMemo)
  const deferredDescriptionText = React.useDeferredValue(currentStage.descriptionText || '');

  // Check if this is the last stage
  const isLastStage = currentStageIndex >= stageArray.length - 1;

  // Handle stage button click
  const handleStageButtonClick = React.useCallback(() => {
    if (disabled) return;

    const stageData = stageArray[currentStageIndex];
    
    // Call onStageComplete callback
    if (onStageComplete) {
      onStageComplete(currentStageIndex, stageData);
    }

    console.log(`🎯 [StageComponent] Stage ${currentStageIndex} completed`, stageData);

    // Move to next stage
    if (!isLastStage) {
      startTransition(() => {
        setCurrentStageIndex(prev => prev + 1);
      });
      console.log(`➡️ [StageComponent] Moving to stage ${currentStageIndex + 1}`);
    }
  }, [disabled, currentStageIndex, stageArray, isLastStage, onStageComplete, onAllStagesComplete]);

  // Handle image load
  const handleImageLoad = React.useCallback((stageIndex) => {
    startTransition(() => {
      setImageLoadStates(prev => ({
        ...prev,
        [stageIndex]: true
      }));
    });
  }, []);

  // Handle appending data to InformationAnalysisComponent when stage changes
  React.useEffect(() => {
    const currentStageData = stageArray[currentStageIndex];
    
    // Check if current stage has informationAnalysisData to append
    if (currentStageData?.appendToInfoAnalysis) {
      const { facts = [], values = [], toFind = [] } = currentStageData.appendToInfoAnalysis;
      
      console.log(`📊 [StageComponent] Stage ${currentStageIndex} appending to InformationAnalysisComponent:`, {
        facts,
        values,
        toFind
      });
      
      // Dispatch custom event to update InformationAnalysisComponent
      // The InformationAnalysisComponent listens for 'updateInformationAnalysis' events
      const event = new CustomEvent('updateInformationAnalysis', {
        detail: {
          stageIndex: currentStageIndex,
          factsArray: facts,
          valueArray: values,
          toFindArray: toFind
        }
      });
      window.dispatchEvent(event);
    }
    
    // Dispatch highlights to QuestionComponent if current stage has highlights
    if (currentStageData?.highlights) {
      console.log(`🎨 [StageComponent] Stage ${currentStageIndex} updating question highlights:`, currentStageData.highlights);
      
      const highlightEvent = new CustomEvent('updateQuestionHighlights', {
        detail: {
          stageIndex: currentStageIndex,
          highlightsArray: currentStageData.highlights
        }
      });
      window.dispatchEvent(highlightEvent);
    } else {
      // Reset highlights to empty array if stage doesn't have highlights
      const resetEvent = new CustomEvent('updateQuestionHighlights', {
        detail: {
          stageIndex: currentStageIndex,
          highlightsArray: []
        }
      });
      window.dispatchEvent(resetEvent);
    }
    
    // Dispatch quizCompleted event when the last stage is reached
    if (isLastStage) {
      console.log(`✅ [StageComponent] Last stage reached (stage ${currentStageIndex + 1} of ${stageArray.length})`);
      
      // Call onAllStagesComplete callback
      if (onAllStagesComplete) {
        onAllStagesComplete();
      }
      
      // Dispatch quizCompleted event for page completion
      if (typeof window !== 'undefined') {
        const quizCompletedEvent = new CustomEvent('quizCompleted', {
          detail: {
            componentType: 'StageComponent',
            allStagesCompleted: true,
            currentStageIndex: currentStageIndex,
            totalStages: stageArray.length,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(quizCompletedEvent);
        console.log('✅ [StageComponent] Dispatched quizCompleted event (last stage reached)');
      }
    }
  }, [currentStageIndex, stageArray, isLastStage, onAllStagesComplete]);

  // Preload images for all stages to prevent flickering
  React.useEffect(() => {
    const preloadPromises = [];
    const imagesToPreload = [];
    
    stageArray.forEach((stage, index) => {
      if (stage.image) {
        // Check if already preloaded using ref (always current)
        if (preloadedImagesRef.current.has(stage.image)) {
          // Image already preloaded, mark as loaded immediately
          setImageLoadStates(prev => {
            if (prev[index]) return prev; // Already set
            return { ...prev, [index]: true };
          });
        } else {
          // Need to preload
          imagesToPreload.push({ image: stage.image, index });
        }
      }
    });
    
    // Preload images that haven't been loaded yet
    imagesToPreload.forEach(({ image, index }) => {
      const img = new Image();
      const loadPromise = new Promise((resolve, reject) => {
        img.onload = () => {
          preloadedImagesRef.current.add(image);
          setPreloadedImages(prev => {
            const newSet = new Set(prev);
            newSet.add(image);
            return newSet;
          });
          setImageLoadStates(prev => ({ ...prev, [index]: true }));
          resolve();
        };
        img.onerror = () => {
          // Even on error, mark as attempted to prevent infinite retries
          preloadedImagesRef.current.add(image);
          setPreloadedImages(prev => {
            const newSet = new Set(prev);
            newSet.add(image);
            return newSet;
          });
          reject(new Error(`Failed to load image: ${image}`));
        };
      });
      img.src = image;
      preloadPromises.push(loadPromise);
    });
    
    // Wait for all images to preload (don't block, just log)
    if (preloadPromises.length > 0) {
      Promise.all(preloadPromises).catch(err => {
        console.warn('⚠️ [StageComponent] Some images failed to preload:', err);
      });
    }
  }, [stageArray]); // Only depend on stageArray

  // Calculate offset for stacked images
  const calculateImageOffset = React.useCallback((index) => {
    const offset = processedStackOffset;
    const offsetValue = typeof offset === 'string' ? parseFloat(offset) : offset;
    return offsetValue * index;
  }, [processedStackOffset]);

  // Render all previous images with stacking effect
  const renderPreviousImages = React.useMemo(() => {
    if (currentStageIndex === 0) return null;

    // Check if current stage has showPreviousImages array
    const showPreviousImagesArray = currentStage.showPreviousImages;
    
    // If showPreviousImages array exists, use it to determine which images to show
    // Otherwise fall back to keepPreviousImages prop behavior
    if (Array.isArray(showPreviousImagesArray)) {
      // Only show images whose indices are in the showPreviousImages array
      const previousImages = [];
      
      // Sort the array to ensure lower indices render first (lower z-index)
      const sortedIndices = [...showPreviousImagesArray].sort((a, b) => a - b);
      
      sortedIndices.forEach((stageIndex) => {
        // Only render if the index is valid and less than current stage
        if (stageIndex >= 0 && stageIndex < currentStageIndex) {
          const stage = stageArray[stageIndex];
          if (!stage || !stage.image) return;

          const offset = calculateImageOffset(stageIndex);
          const imageStyle = {
            ...processedImageCoordinates,
            ...processedImageStyle,
            left: `calc(${processedImageCoordinates.left || 0} + ${offset}px)`,
            top: `calc(${processedImageCoordinates.top || 0} + ${offset}px)`,
            position: 'absolute',
            opacity: imageLoadStates[stageIndex] || preloadedImagesRef.current.has(stage.image) ? 0.7 : 0,
            transition: animateTransitions ? 'opacity 0.5s ease-in-out' : 'none',
            zIndex: (elementZIndex || 100) + stageIndex, // Lower stage number = lower z-index
            willChange: 'opacity'
          };

          previousImages.push(
            React.createElement('div', {
              key: `prev-image-${stageIndex}`,
              className: 'stage-image-container',
              style: imageStyle
            }, [
              React.createElement('img', {
                key: `img-${stageIndex}`,
                src: stage.image,
                alt: `Stage ${stageIndex + 1}`,
                className: 'stage-image',
                onLoad: () => handleImageLoad(stageIndex),
                style: {
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: imageLoadStates[stageIndex] || preloadedImagesRef.current.has(stage.image) ? 1 : 0,
                  transition: animateTransitions ? 'opacity 0.5s ease-in-out' : 'none'
                },
                loading: 'eager'
              }),
              showImageNumbers && React.createElement('div', {
                key: `number-${stageIndex}`,
                className: 'stage-image-number',
                style: {
                  position: 'absolute',
                  top: '5px',
                  left: '5px',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }
              }, stageIndex + 1)
            ])
          );
        }
      });

      return previousImages.length > 0 ? previousImages : null;
    }
    
    // Fallback to old behavior if no showPreviousImages array
    // If keepPreviousImages is false, don't render previous images
    if (!keepPreviousImages) return null;

    const previousImages = [];
    for (let i = 0; i < currentStageIndex; i++) {
      const stage = stageArray[i];
      if (!stage || !stage.image) continue;

      const offset = calculateImageOffset(i);
      const imageStyle = {
        ...processedImageCoordinates,
        ...processedImageStyle,
        left: `calc(${processedImageCoordinates.left || 0} + ${offset}px)`,
        top: `calc(${processedImageCoordinates.top || 0} + ${offset}px)`,
        position: 'absolute',
        opacity: imageLoadStates[i] || preloadedImagesRef.current.has(stage.image) ? 0.7 : 0,
        transition: animateTransitions ? 'opacity 0.5s ease-in-out' : 'none',
        willChange: 'opacity',
        zIndex: (elementZIndex || 100) + i
      };

      previousImages.push(
        React.createElement('div', {
          key: `prev-image-${i}`,
          className: 'stage-image-container',
          style: imageStyle
        }, [
          React.createElement('img', {
            key: `img-${i}`,
            src: stage.image,
            alt: `Stage ${i + 1}`,
            className: 'stage-image',
            onLoad: () => handleImageLoad(i),
            style: {
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }
          }),
          showImageNumbers && React.createElement('div', {
            key: `number-${i}`,
            className: 'stage-image-number',
            style: {
              position: 'absolute',
              top: '5px',
              left: '5px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }
          }, i + 1)
        ])
      );
    }

    return previousImages;
  }, [currentStage, keepPreviousImages, currentStageIndex, stageArray, calculateImageOffset, processedImageCoordinates, processedImageStyle, imageLoadStates, animateTransitions, elementZIndex, showImageNumbers, handleImageLoad]);

  // Process stage-specific image coordinates if they exist
  const processedStageImageCoordinates = React.useMemo(() => {
    if (!currentStage.imageCoordinates) return null;
    const cssCoords = convertCoordinatesToCSS(currentStage.imageCoordinates);
    return window.GridCellFontUtils?.processGcStyles ? 
      window.GridCellFontUtils.processGcStyles(cssCoords) : 
      cssCoords;
  }, [currentStage.imageCoordinates, convertCoordinatesToCSS]);

  // Render current image
  const renderCurrentImage = React.useMemo(() => {
    // If no image and no imageAlt, return null
    if (!currentStage.image && !currentStage.imageAlt) return null;

    // Use stage-specific coordinates if available, otherwise use default
    const finalImageCoordinates = processedStageImageCoordinates || processedImageCoordinates;

    // Only apply offset if keepPreviousImages is true, otherwise use same coordinates
    const offset = keepPreviousImages ? calculateImageOffset(currentStageIndex) : 0;
    const imageStyle = {
      ...finalImageCoordinates,
      ...processedImageStyle,
      left: `calc(${finalImageCoordinates.left || 0} + ${offset}px)`,
      top: `calc(${finalImageCoordinates.top || 0} + ${offset}px)`,
      position: 'absolute',
      opacity: currentStage.image ? (imageLoadStates[currentStageIndex] || preloadedImagesRef.current.has(currentStage.image) ? 1 : 0) : 1,
      transition: animateTransitions ? 'opacity 0.5s ease-in-out' : 'none',
      zIndex: (elementZIndex || 100) + currentStageIndex,
      willChange: 'opacity'
    };

    // If image is null but imageAlt exists, display text instead
    if (!currentStage.image && currentStage.imageAlt) {
      // Process fontSize for gc units
      let processedAltFontSize = '24gc';
      if (window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
        processedAltFontSize = window.GridCellFontUtils.processGcProperty('24gc', 'fontSize');
      }
      
      // Process padding for gc units
      let processedAltPadding = '20gc';
      if (window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
        processedAltPadding = window.GridCellFontUtils.processGcProperty('20gc', 'padding');
      }
      
      return React.createElement('div', {
        key: `current-image-${currentStageIndex}`,
        className: 'stage-image-container stage-current-image stage-image-alt',
        style: {
          ...imageStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          border: '2px dashed rgba(255, 255, 255, 0.3)',
          borderRadius: '8px',
          color: '#ffffff',
          fontSize: processedAltFontSize,
          fontWeight: '500',
          textAlign: 'center',
          padding: processedAltPadding
        }
      }, [
        React.createElement('span', {
          key: `alt-text-${currentStageIndex}`
        }, currentStage.imageAlt),
        showImageNumbers && React.createElement('div', {
          key: `number-${currentStageIndex}`,
          className: 'stage-image-number',
          style: {
            position: 'absolute',
            top: '5px',
            left: '5px',
            backgroundColor: 'rgba(255, 153, 0, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold'
          }
        }, currentStageIndex + 1)
      ].filter(Boolean));
    }

    // Render image normally
    // Check if blink animation is enabled
    const shouldBlink = currentStage.blink === true;
    const blinkDuration = currentStage.blinkDuration || '1s';
    
    // Build className for image with blink support
    const imageClassName = shouldBlink 
      ? 'stage-image image-stack-blink' 
      : 'stage-image';
    
    // Build style with blink duration CSS variable if blinking
    const imageStyleWithBlink = {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      ...(shouldBlink ? { '--blink-duration': blinkDuration } : {})
    };
    
    return React.createElement('div', {
      key: `current-image-${currentStageIndex}`,
      className: 'stage-image-container stage-current-image',
      style: imageStyle
    }, [
      React.createElement('img', {
        key: `img-${currentStageIndex}`,
        src: currentStage.image,
        alt: currentStage.imageAlt || `Stage ${currentStageIndex + 1}`,
        className: imageClassName,
        onLoad: () => handleImageLoad(currentStageIndex),
        style: {
          ...imageStyleWithBlink,
          opacity: imageLoadStates[currentStageIndex] || preloadedImagesRef.current.has(currentStage.image) ? 1 : 0,
          transition: animateTransitions ? 'opacity 0.5s ease-in-out' : 'none'
        },
        loading: 'eager' // Try to load immediately
      }),
      showImageNumbers && React.createElement('div', {
        key: `number-${currentStageIndex}`,
        className: 'stage-image-number',
        style: {
          position: 'absolute',
          top: '5px',
          left: '5px',
          backgroundColor: 'rgba(255, 153, 0, 0.9)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold'
        }
      }, currentStageIndex + 1)
    ].filter(Boolean));
  }, [keepPreviousImages, currentStage, currentStageIndex, calculateImageOffset, processedImageCoordinates, processedStageImageCoordinates, processedImageStyle, imageLoadStates, animateTransitions, elementZIndex, showImageNumbers, handleImageLoad]);

  // Render button using the existing button component
  const renderButton = React.useMemo(() => {
    if (!currentStage.buttonText) return null;

    // Gray out styling for last stage (but keep clickable to complete quiz)
    const lastStageButtonStyle = isLastStage ? {
      opacity: 0.6,
      filter: 'grayscale(70%)', // Gray out effect
    } : {};

    const NextButtonComponent = window.InteractionComponents?.NextButtonComponent;
    if (!NextButtonComponent) {
      console.warn('⚠️ [StageComponent] NextButtonComponent not found, rendering basic button');
      return React.createElement('button', {
        onClick: handleStageButtonClick,
        disabled: disabled, // Keep clickable on last stage to allow completion
        style: {
          ...processedButtonCoordinates,
          ...processedButtonStyle,
          ...lastStageButtonStyle,
          position: 'absolute',
          zIndex: (elementZIndex || 100) + 1000
        },
        className: 'stage-button'
      }, currentStage.buttonText);
    }

    return React.createElement(NextButtonComponent, {
      text: currentStage.buttonText,
      onClick: handleStageButtonClick,
      disabled: disabled, // Keep clickable on last stage to allow completion
      ignorePageCompletion: true, // Stage buttons should not be affected by page completion
      backgroundColor: processedButtonStyle?.backgroundColor || '#FF9900', // Extract backgroundColor from button styles
      fontSize: processedButtonStyle?.fontSize,
      style: {
        ...processedButtonCoordinates,
        ...processedButtonStyle,
        ...lastStageButtonStyle,
        position: 'absolute'
      },
      position: {
        css: processedButtonCoordinates
      },
      elementZIndex: (elementZIndex || 100) + 1000,
      className: 'stage-button'
    });
  }, [currentStage, handleStageButtonClick, disabled, isLastStage, processedButtonCoordinates, processedButtonStyle, elementZIndex]);

  // Function to convert LaTeX fractions to HTML fractions (same as QuestionComponent)
  const convertLatexFractions = React.useCallback((text) => {
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
  }, []);

  // Render description text
  const renderDescriptionText = React.useMemo(() => {
    if (!currentStage.descriptionText) return null;

    // Convert LaTeX fractions to HTML
    const textWithFractions = convertLatexFractions(deferredDescriptionText);
    
    // Check if text contains HTML tags (including the converted fraction spans)
    const hasHTML = textWithFractions && (
      textWithFractions.includes('<br>') || 
      textWithFractions.includes('<span') || 
      textWithFractions.includes('<div') || 
      textWithFractions.includes('<strong') || 
      textWithFractions.includes('<em') ||
      textWithFractions.includes('<p') ||
      textWithFractions.includes('<b') ||
      textWithFractions.includes('<i')
    );

    return React.createElement('div', {
      key: `text-${currentStageIndex}`,
      className: 'stage-description-text',
      style: {
        ...processedTextCoordinates,
        ...processedTextStyle,
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: processedTextStyle?.textAlign === 'center' ? 'center' : (processedTextStyle?.textAlign === 'right' ? 'flex-end' : 'flex-start'),
        opacity: animateTransitions ? 1 : 1,
        transition: animateTransitions ? 'opacity 0.3s ease-in-out' : 'none',
        zIndex: (elementZIndex || 100) + 500
      }
    }, hasHTML ? 
      React.createElement('span', {
        dangerouslySetInnerHTML: { __html: textWithFractions }
      }) : 
      textWithFractions);
  }, [currentStage, currentStageIndex, deferredDescriptionText, processedTextCoordinates, processedTextStyle, animateTransitions, elementZIndex, convertLatexFractions]);

  // Render header text
  const renderHeaderText = React.useMemo(() => {
    if (!headerText) return null;

    return React.createElement('div', {
      key: 'header-text',
      className: 'stage-header-text',
      style: {
        ...processedHeaderCoordinates,
        ...processedHeaderStyle,
        position: 'absolute',
        zIndex: (elementZIndex || 100) + 600
      }
    }, headerText);
  }, [headerText, processedHeaderCoordinates, processedHeaderStyle, elementZIndex]);

  // Render horizontal line
  const renderLine = React.useMemo(() => {
    if (!lineCoordinates || lineCoordinates.length === 0) {
      console.log('🔍 [StageComponent] No line coordinates provided');
      return null;
    }

    const [x1, y1, x2, y2] = lineCoordinates;
    
    console.log('🔍 [StageComponent] Line coordinates:', lineCoordinates);
    console.log('🔍 [StageComponent] Line styles:', processedLineStyle);
    console.log('🔍 [StageComponent] LineType:', y1 === y2 ? 'horizontal' : (x1 === x2 ? 'vertical' : 'slanted'));

    const LineComponent = window.LineComponent?.LineComponent;
    
    if (!LineComponent) {
      console.log('⚠️ [StageComponent] LineComponent not available, using fallback div');
      
      // Fallback to a simple div line if LineComponent not available
      // For horizontal lines (y1 === y2), use height explicitly
      const isHorizontal = y1 === y2;
      const thickness = processedLineStyle.thickness || processedLineStyle.strokeWidth || 3;
      
      // Convert coordinates to percentages manually for the line
      const gridWidth = 1600;
      const gridHeight = 900;
      const leftPercent = (x1 / gridWidth) * 100;
      const topPercent = (y1 / gridHeight) * 100;
      const widthPercent = ((x2 - x1) / gridWidth) * 100;
      
      const lineStyle = {
        position: 'absolute',
        left: `${leftPercent.toFixed(2)}%`,
        top: `${topPercent.toFixed(2)}%`,
        width: `${widthPercent.toFixed(2)}%`,
        height: isHorizontal ? `${thickness}px` : `${((y2 - y1) / gridHeight) * 100}%`,
        backgroundColor: processedLineStyle.color || processedLineStyle.backgroundColor || '#FF9900',
        zIndex: (elementZIndex || 100) + 550
      };
      
      console.log('✅ [StageComponent] Rendering fallback line with style:', lineStyle);
      
      return React.createElement('div', {
        key: 'header-line',
        className: 'stage-header-line',
        style: lineStyle
      });
    }

    console.log('✅ [StageComponent] Rendering LineComponent');
    // Use LineComponent for proper line rendering
    return React.createElement(LineComponent, {
      key: 'header-line',
      coordinates: [x1, y1, x2, y2],
      lineType: y1 === y2 ? 'horizontal' : (x1 === x2 ? 'vertical' : 'slanted'),
      borderColor: processedLineStyle.color || '#FF9900',
      borderWidth: `${processedLineStyle.thickness || 3}gc`,
      borderStyle: 'solid',
      zIndex: (elementZIndex || 100) + 550
    });
  }, [lineCoordinates, processedLineCoordinates, processedLineStyle, elementZIndex]);

  // Render tap.gif
  const renderTapGif = React.useMemo(() => {
    // Hide tapGif on last stage
    if (isLastStage || !showTapGif || !tapGifCoordinates || tapGifCoordinates.length === 0) {
      return null;
    }

    const tapGifStyle = {
      ...processedTapGifCoordinates,
      ...processedTapGifStyle,
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: (elementZIndex || 100) + 1100, // Above button
      pointerEvents: 'none' // Don't interfere with button clicks
    };

    console.log('🎯 [StageComponent] Rendering tap.gif with style:', tapGifStyle);

    return React.createElement('div', {
      key: 'tap-gif',
      className: 'stage-tap-gif',
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
  }, [isLastStage, showTapGif, tapGifCoordinates, processedTapGifCoordinates, processedTapGifStyle, tapGifSrc, elementZIndex]);

  // Container style
  const containerStyle = React.useMemo(() => {
    return {
      ...(position?.css || {}),
      ...processedStyles,
      ...style,
      position: 'relative',
      width: '100%',
      height: '100%'
    };
  }, [position, processedStyles, style]);

  console.log('🎬 [StageComponent] Render state:', {
    currentStageIndex,
    totalStages: stageArray.length,
    currentStage,
    isLastStage,
    disabled,
    imageLoadStates
  });

  // Main render
  return React.createElement('div', {
    id: elementId,
    className: `stage-component-container ${className}`,
    style: containerStyle,
    'data-element-type': 'StageComponent',
    'data-component-type': 'StageComponent', // For quiz detection
    'data-current-stage': currentStageIndex,
    'data-total-stages': stageArray.length
  }, [
    // Render header text
    renderHeaderText,
    
    // Render horizontal line
    renderLine,
    
    // Render all previous images (stacked) - already have keys from renderPreviousImages
    ...(renderPreviousImages || []),
    
    // Render current image
    renderCurrentImage ? React.cloneElement(renderCurrentImage, { key: `current-image-${currentStageIndex}` }) : null,
    
    // Render button
    renderButton ? React.cloneElement(renderButton, { key: `button-${currentStageIndex}` }) : null,
    
    // Render description text - already has key from renderDescriptionText
    renderDescriptionText,
    
    // Render tap.gif
    renderTapGif
  ].filter(Boolean)); // Remove null values
});

// Export for use in elements registry
const StageElement = {
  stage: StageComponent
};

// Export to global scope
window.StageComponent = {
  StageComponent: StageComponent,
  StageElement: StageElement
};

console.log('✅ StageComponent loaded successfully');

