/**
 * Drag and Drop Game Component - Equal/Unequal Parts Sorting
 * 
 * Interactive drag-and-drop game for sorting images into categories
 * with visual feedback and animations.
 */

// Dependencies: React, SharedUtilities should be loaded before this file

/**
 * DraggableImage Component
 * Individual draggable image with click-and-drag functionality
 */
const DraggableImage = React.memo(({ 
  imagePath, 
  category, 
  imageId, 
  onDragStart, 
  onDragEnd,
  isAnimating,
  animationType,
  isAnyImageDragging,
  currentDraggingId,
  style: externalStyle = {}
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragPosition, setDragPosition] = React.useState({ x: 0, y: 0 });
  const [originalSize, setOriginalSize] = React.useState({ width: 0, height: 0 });
  const imageRef = React.useRef(null);
  const dragStartPos = React.useRef({ x: 0, y: 0 });

  const handleMouseDown = React.useCallback((e) => {
    // Prevent dragging if animating or if another image is being dragged
    if (isAnimating || (isAnyImageDragging && currentDraggingId !== imageId)) return;
    
    e.preventDefault();
    const rect = imageRef.current.getBoundingClientRect();
    
    // Store original size
    setOriginalSize({ width: rect.width, height: rect.height });
    
    // Store where inside the image the user clicked
    dragStartPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    // Set initial position to current position to prevent jump
    setDragPosition({
      x: rect.left,
      y: rect.top
    });
    
    setIsDragging(true);
    onDragStart?.(imageId, { x: e.clientX, y: e.clientY });
  }, [imageId, onDragStart, isAnimating, isAnyImageDragging, currentDraggingId]);

  const handleMouseMove = React.useCallback((e) => {
    if (!isDragging) return;
    
    // Calculate new position based on mouse movement
    setDragPosition({
      x: e.clientX - dragStartPos.current.x,
      y: e.clientY - dragStartPos.current.y
    });
  }, [isDragging]);

  const handleMouseUp = React.useCallback((e) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    setDragPosition({ x: 0, y: 0 });
    onDragEnd?.(imageId, { x: e.clientX, y: e.clientY });
  }, [isDragging, imageId, onDragEnd]);

  // Touch event handlers for mobile support
  const handleTouchStart = React.useCallback((e) => {
    // Prevent dragging if animating or if another image is being dragged
    if (isAnimating || (isAnyImageDragging && currentDraggingId !== imageId)) return;
    
    const touch = e.touches[0];
    const rect = imageRef.current.getBoundingClientRect();
    
    // Store original size
    setOriginalSize({ width: rect.width, height: rect.height });
    
    // Store where inside the image the user touched
    dragStartPos.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
    
    // Set initial position to current position to prevent jump
    setDragPosition({
      x: rect.left,
      y: rect.top
    });
    
    setIsDragging(true);
    onDragStart?.(imageId, { x: touch.clientX, y: touch.clientY });
  }, [imageId, onDragStart, isAnimating, isAnyImageDragging, currentDraggingId]);

  const handleTouchMove = React.useCallback((e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    setDragPosition({
      x: touch.clientX - dragStartPos.current.x,
      y: touch.clientY - dragStartPos.current.y
    });
  }, [isDragging]);

  const handleTouchEnd = React.useCallback((e) => {
    if (!isDragging) return;
    
    const touch = e.changedTouches[0];
    setIsDragging(false);
    setDragPosition({ x: 0, y: 0 });
    onDragEnd?.(imageId, { x: touch.clientX, y: touch.clientY });
  }, [isDragging, imageId, onDragEnd]);

  // Global mouse move and up listeners
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const imageStyle = {
    ...externalStyle,
    position: isDragging ? 'fixed' : 'relative',
    left: isDragging ? `${dragPosition.x}px` : 'auto',
    top: isDragging ? `${dragPosition.y}px` : 'auto',
    width: isDragging ? `${originalSize.width}px` : '100%',
    height: isDragging ? `${originalSize.height}px` : '100%',
    opacity: isDragging ? 0.8 : ((isAnyImageDragging && currentDraggingId !== imageId) ? 0.5 : 1),
    transform: isDragging ? 'scale(1)' : 'scale(1)',
    cursor: isAnimating ? 'not-allowed' : ((isAnyImageDragging && currentDraggingId !== imageId) ? 'not-allowed' : (isDragging ? 'grabbing' : 'grab')),
    transition: isDragging ? 'none' : 'all 0.3s ease',
    zIndex: isDragging ? 999999 : 'auto',
    pointerEvents: isAnimating ? 'none' : ((isAnyImageDragging && currentDraggingId !== imageId) ? 'none' : 'auto'),
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none'
  };

  // Add animation classes
  const animationClass = animationType === 'incorrect' ? 'wiggle-animation' : '';

  return React.createElement('div', {
    ref: imageRef,
    className: `draggable-image ${animationClass} ${isDragging ? 'dragging' : ''}`,
    style: imageStyle,
    onMouseDown: handleMouseDown,
    onTouchStart: handleTouchStart,
    'data-image-id': imageId,
    'data-category': category
  }, React.createElement('img', {
    src: `assets/${imagePath}`,
    alt: `${category} parts`,
    draggable: false,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      pointerEvents: 'none',
      userSelect: 'none'
    }
  }));
});

/**
 * DropZone Component
 * Container for dropped images with visual feedback
 */
const DropZone = React.memo(({ 
  category, 
  label, 
  images, 
  isHovered,
  coordinates,
  zIndex,
  borderColor = 'rgba(255, 255, 255, 0.3)',
  borderWidth = '4gc',
  borderRadius = '12gc',
  borderStyle = 'dashed',
  padding = '2.5%',
  columns = 2,
  rows = 2
}) => {
  // Convert gc units to pixels (assuming 1gc = 1px for consistency)
  const convertGcToPx = (value) => {
    if (typeof value === 'string' && value.endsWith('gc')) {
      return value.replace('gc', 'px');
    }
    return value;
  };
  
  const borderWidthPx = convertGcToPx(borderWidth);
  const borderRadiusPx = convertGcToPx(borderRadius);
  
  const dropZoneStyle = {
    border: isHovered ? `4px solid #4A90E2` : `${borderWidthPx} ${borderStyle} ${borderColor}`,
    backgroundColor: isHovered ? 'rgba(74, 144, 226, 0.1)' : 'rgba(0, 0, 0, 0.2)',
    borderRadius: borderRadiusPx,
    transition: 'all 0.3s ease',
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    gap: '10px',
    padding: padding,
    alignContent: 'stretch',
    boxSizing: 'border-box',
    minHeight: '200px',
    width: '100%',
    height: '100%',
    overflow: 'hidden'
  };

  return React.createElement('div', {
    className: `drop-zone drop-zone-${category} ${isHovered ? 'hovered' : ''}`,
    style: dropZoneStyle,
    'data-zone-category': category
  }, images.length === 0 ? React.createElement('div', {
    style: {
      gridColumn: '1 / -1',
      textAlign: 'center',
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: '18px',
      padding: '40px 20px'
    }
  }, 'Drag images here') : images.map(img => 
    React.createElement('div', {
      key: img.id,
      style: {
        width: '100%',
        height: '100%',
        aspectRatio: '1',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, React.createElement('img', {
      src: `assets/${img.imagePath}`,
      alt: `${img.category} parts`,
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'contain'
      }
    }))
  ));
});

/**
 * UnsortedContainer Component
 * Displays unsorted images in a grid
 */
const UnsortedContainer = React.memo(({ 
  images, 
  onDragStart, 
  onDragEnd,
  animatingImages,
  borderColor = 'rgba(255, 255, 255, 0.2)',
  borderWidth = '4gc',
  borderRadius = '12gc',
  borderStyle = 'solid',
  backgroundColor = 'transparent',
  columns = 2,
  rows = 2,
  gravitate = 'up',
  isAnyImageDragging = false,
  currentDraggingId = null
}) => {
  // Convert gc units to pixels (assuming 1gc = 1px for consistency)
  const convertGcToPx = (value) => {
    if (typeof value === 'string' && value.endsWith('gc')) {
      return value.replace('gc', 'px');
    }
    return value;
  };
  
  // Map gravitate prop to CSS alignContent value
  const getAlignContent = () => {
    switch(gravitate) {
      case 'up':
        return 'start';
      case 'down':
        return 'end';
      case 'no':
        return 'start'; // Keep in place by maintaining grid structure
      default:
        return 'start';
    }
  };
  
  const borderWidthPx = convertGcToPx(borderWidth);
  const borderRadiusPx = convertGcToPx(borderRadius);
  
  return React.createElement('div', {
    className: 'unsorted-container',
    style: {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gap: '15px',
      padding: '15px',
      backgroundColor: backgroundColor,
      borderRadius: borderRadiusPx,
      border: `${borderWidthPx} ${borderStyle} ${borderColor}`,
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      alignContent: getAlignContent()
    }
  }, images.map((img, index) => {
    // Calculate grid position based on gravitate setting
    let gridPosition = {};
    
    if (gravitate === 'no') {
      // Keep in original position
      const originalIndex = parseInt(img.id.replace('img', '')) - 1;
      const row = Math.floor(originalIndex / columns) + 1;
      const col = (originalIndex % columns) + 1;
      gridPosition = {
        gridRow: row,
        gridColumn: col
      };
    } else if (gravitate === 'down') {
      // Stack from bottom - calculate position from the end
      const totalCells = rows * columns;
      const numImages = images.length;
      const startPosition = totalCells - numImages;
      const currentPosition = startPosition + index;
      const row = Math.floor(currentPosition / columns) + 1;
      const col = (currentPosition % columns) + 1;
      gridPosition = {
        gridRow: row,
        gridColumn: col
      };
    }
    // If gravitate === 'up', don't set gridPosition (use auto-placement)
    
    return React.createElement(DraggableImage, {
      key: img.id,
      imagePath: img.imagePath,
      category: img.category,
      imageId: img.id,
      onDragStart,
      onDragEnd,
      isAnimating: animatingImages.has(img.id),
      animationType: animatingImages.get(img.id),
      isAnyImageDragging: isAnyImageDragging,
      currentDraggingId: currentDraggingId,
      style: gridPosition
    });
  }));
});

/**
 * DragDropGame Component
 * Main game container managing all state and interactions
 */
const DragDropGame = React.memo(({ 
  questionIndex = 0,
  onComplete,
  onImageDropped,
  onDragStart: externalOnDragStart,
  unsortedCoordinates,
  dropZone1Coordinates,
  dropZone2Coordinates,
  // Border style props for unsorted container
  unsortedBorderColor = 'rgba(255, 255, 255, 0.2)',
  unsortedBorderWidth = '4gc',
  unsortedBorderRadius = '12gc',
  unsortedBorderStyle = 'solid',
  unsortedBackgroundColor = 'transparent',
  // Layout props for unsorted container
  unsortedColumns = 2,
  unsortedRows = 2,
  unsortedGravitate = 'up',
  // Border style props for drop zone 1 (equal)
  dropZone1BorderColor = 'rgba(255, 255, 255, 0.3)',
  dropZone1BorderWidth = '4gc',
  dropZone1BorderRadius = '12gc',
  dropZone1BorderStyle = 'dashed',
  dropZone1Padding = '2.5%',
  dropZone1Columns = 2,
  dropZone1Rows = 2,
  // Border style props for drop zone 2 (unequal)
  dropZone2BorderColor = 'rgba(255, 255, 255, 0.3)',
  dropZone2BorderWidth = '4gc',
  dropZone2BorderRadius = '12gc',
  dropZone2BorderStyle = 'dashed',
  dropZone2Padding = '2.5%',
  dropZone2Columns = 2,
  dropZone2Rows = 2
}) => {
  const [gameState, setGameState] = React.useState(() => {
    const question = window.Questions?.[questionIndex];
    if (!question) {
      console.error('Question not found at index:', questionIndex);
      return { unsorted: [], equal: [], unequal: [] };
    }
    
    return {
      unsorted: [
        { ...question.image1, id: 'img1' },
        { ...question.image2, id: 'img2' },
        { ...question.image3, id: 'img3' },
        { ...question.image4, id: 'img4' }
      ],
      equal: [],
      unequal: []
    };
  });

  const [draggedImage, setDraggedImage] = React.useState(null);
  const [hoverZone, setHoverZone] = React.useState(null);
  const [animatingImages, setAnimatingImages] = React.useState(new Map());
  const [draggingImageId, setDraggingImageId] = React.useState(null);
  const dropZonesRef = React.useRef({});

  // Reset game state when question index changes
  React.useEffect(() => {
    console.log('🔄 [DragDrop] Question index changed to:', questionIndex);
    
    const question = window.Questions?.[questionIndex];
    if (!question) {
      console.error('Question not found at index:', questionIndex);
      return;
    }
    
    // Reset game state with new question data
    setGameState({
      unsorted: [
        { ...question.image1, id: 'img1' },
        { ...question.image2, id: 'img2' },
        { ...question.image3, id: 'img3' },
        { ...question.image4, id: 'img4' }
      ],
      equal: [],
      unequal: []
    });
    
    // Reset other states
    setDraggedImage(null);
    setHoverZone(null);
    setAnimatingImages(new Map());
    setDraggingImageId(null);
    
    console.log('✅ [DragDrop] Game state reset for question:', questionIndex);
  }, [questionIndex]);

  // Helper to convert coordinates to CSS positioning
  const coordinatesToStyle = React.useMemo(() => {
    return (coords) => {
      if (!coords || coords.length !== 4) return {};
      
      const [x1, y1, x2, y2] = coords;
      const left = ((x1 - 1) / 1600 * 100);
      const top = ((y1 - 1) / 900 * 100);
      const width = ((x2 - x1 + 1) / 1600 * 100);
      const height = ((y2 - y1 + 1) / 900 * 100);
      
      return {
        position: 'absolute',
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`
      };
    };
  }, []);

  // Track mouse position for hover detection
  const handleDragStart = React.useCallback((imageId, position) => {
    const image = gameState.unsorted.find(img => img.id === imageId);
    setDraggedImage(image);
    setDraggingImageId(imageId);
    console.log('🎯 Drag started:', imageId, image?.category);
    // Call external onDragStart callback if provided
    if (externalOnDragStart) {
      externalOnDragStart();
    }
  }, [gameState.unsorted, externalOnDragStart]);

  const checkHoverZone = React.useCallback((x, y) => {
    let hoveredZone = null;
    
    Object.entries(dropZonesRef.current).forEach(([zone, element]) => {
      if (element) {
        const rect = element.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          hoveredZone = zone;
        }
      }
    });
    
    setHoverZone(hoveredZone);
  }, []);

  const handleDragEnd = React.useCallback((imageId, position) => {
    console.log('🎯 Drag ended:', imageId, 'at zone:', hoverZone);
    
    if (!hoverZone || !draggedImage) {
      setDraggedImage(null);
      setHoverZone(null);
      setDraggingImageId(null);
      return;
    }

    // Validate drop
    const isCorrect = draggedImage.category === hoverZone;
    
    if (isCorrect) {
      // Correct drop - move to zone
      setGameState(prev => ({
        ...prev,
        unsorted: prev.unsorted.filter(img => img.id !== imageId),
        [hoverZone]: [...prev[hoverZone], draggedImage]
      }));
      
      onImageDropped?.(true, draggedImage.category);
      console.log('✅ Correct drop!');
      
      // Play correct sound
      if (typeof window !== 'undefined' && window.playCorrectSound) {
        window.playCorrectSound();
      }
    } else {
      // Incorrect drop - animate and return
      setAnimatingImages(prev => new Map(prev).set(imageId, 'incorrect'));
      
      setTimeout(() => {
        setAnimatingImages(prev => {
          const newMap = new Map(prev);
          newMap.delete(imageId);
          return newMap;
        });
      }, 1000);
      
      onImageDropped?.(false, draggedImage.category);
      console.log('❌ Incorrect drop!');
      
      // Play wrong sound
      if (typeof window !== 'undefined' && window.playWrongSound) {
        window.playWrongSound();
      }
    }
    
    setDraggedImage(null);
    setHoverZone(null);
    setDraggingImageId(null);
  }, [hoverZone, draggedImage, onImageDropped]);

  // Track mouse position globally during drag
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (draggedImage) {
        checkHoverZone(e.clientX, e.clientY);
      }
    };
    
    const handleTouchMove = (e) => {
      if (draggedImage && e.touches[0]) {
        checkHoverZone(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    
    if (draggedImage) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, [draggedImage, checkHoverZone]);

  // Check win condition
  React.useEffect(() => {
    if (gameState.unsorted.length === 0 && gameState.equal.length > 0 && gameState.unequal.length > 0) {
      console.log('🎉 Game completed!');
      onComplete?.();
    }
  }, [gameState, onComplete]);

  return React.createElement('div', {
    className: 'drag-drop-game',
    style: {
      position: 'relative',
      width: '100%',
      height: '100%'
    }
  }, [
    // Unsorted Container
    React.createElement('div', {
      key: 'unsorted-wrapper',
      className: 'unsorted-wrapper',
      style: coordinatesToStyle(unsortedCoordinates)
    }, React.createElement(UnsortedContainer, {
      images: gameState.unsorted,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      animatingImages,
      borderColor: unsortedBorderColor,
      borderWidth: unsortedBorderWidth,
      borderRadius: unsortedBorderRadius,
      borderStyle: unsortedBorderStyle,
      backgroundColor: unsortedBackgroundColor,
      columns: unsortedColumns,
      rows: unsortedRows,
      gravitate: unsortedGravitate,
      isAnyImageDragging: draggingImageId !== null,
      currentDraggingId: draggingImageId
    })),
    
    // Equal Drop Zone
    React.createElement('div', {
      key: 'equal-zone-wrapper',
      ref: el => dropZonesRef.current.equal = el,
      className: 'drop-zone-wrapper equal-zone-wrapper',
      style: coordinatesToStyle(dropZone1Coordinates)
    }, React.createElement(DropZone, {
      category: 'equal',
      label: 'Equal Parts',
      images: gameState.equal,
      isHovered: hoverZone === 'equal',
      borderColor: dropZone1BorderColor,
      borderWidth: dropZone1BorderWidth,
      borderRadius: dropZone1BorderRadius,
      borderStyle: dropZone1BorderStyle,
      padding: dropZone1Padding,
      columns: dropZone1Columns,
      rows: dropZone1Rows
    })),
    
    // Unequal Drop Zone
    React.createElement('div', {
      key: 'unequal-zone-wrapper',
      ref: el => dropZonesRef.current.unequal = el,
      className: 'drop-zone-wrapper unequal-zone-wrapper',
      style: coordinatesToStyle(dropZone2Coordinates)
    }, React.createElement(DropZone, {
      category: 'unequal',
      label: 'Unequal Parts',
      images: gameState.unequal,
      isHovered: hoverZone === 'unequal',
      borderColor: dropZone2BorderColor,
      borderWidth: dropZone2BorderWidth,
      borderRadius: dropZone2BorderRadius,
      borderStyle: dropZone2BorderStyle,
      padding: dropZone2Padding,
      columns: dropZone2Columns,
      rows: dropZone2Rows
    }))
  ]);
});

// Export components
window.DragDropComponents = {
  DraggableImage,
  DropZone,
  UnsortedContainer,
  DragDropGame
};

// Export for element registry
window.DragDropGameComponent = {
  DragDropGame,
  DragDropElement: {
    'drag-drop-game': {
      type: 'drag-drop-game',
      createOptimized: window.SharedUtilities?.createOptimizedElementFactory('drag-drop-game', (props) => {
        return React.createElement(DragDropGame, props);
      })
    }
  }
};

console.log('✅ Drag-and-drop game component loaded successfully');

