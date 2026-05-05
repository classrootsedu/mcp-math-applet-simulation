/**
 * Multiplication Grid Component
 * 
 * A fully interactive React component for visualizing and solving long multiplication
 * with carries, partial products, and step-by-step validation.
 */

(function() {
  'use strict';
  
  // Check if React is available
  if (typeof React === 'undefined') {
    console.error('❌ MultiplicationGrid: React is not loaded. Please load React before this component.');
    return;
  }
  
  console.log('🔍 [MultiplicationGrid] Component file loading - VERSION 2.0 - Using React.useState directly');
  
  // Use React hooks directly to avoid conflicts with other files
  // const { useState, useEffect, useCallback, useRef } = React;
  
  // ===== HELPER FUNCTIONS =====
  
  /**
   * Convert a number to an array of digits (right-to-left for calculation)
   */
  const numberToDigits = (num) => {
    return String(Math.abs(num)).split('').map(Number);
  };
  
  /**
   * Calculate partial product for a multiplier digit
   * Returns { digits: [], carries: [] }
   */
  const calculatePartialProduct = (multiplicand, multiplierDigit, shift = 0) => {
    const multiplicandDigits = numberToDigits(multiplicand);
    const result = [];
    const carries = [];
    let carry = 0;
    
    // Multiply each digit from right to left
    for (let i = multiplicandDigits.length - 1; i >= 0; i--) {
      const product = multiplicandDigits[i] * multiplierDigit + carry;
      result.unshift(product % 10);
      carries.unshift(Math.floor(product / 10));
      carry = Math.floor(product / 10);
    }
    
    // Add final carry if present
    if (carry > 0) {
      result.unshift(carry);
      carries.unshift(0);
    }
    
    // Add null for positional shift (will be rendered as blank spaces)
    for (let i = 0; i < shift; i++) {
      result.push(null);
      carries.push(null);
    }
    
    return { digits: result, carries };
  };
  
  /**
   * Calculate the final sum of all partial products
   */
  const calculateSum = (partialProducts) => {
    const maxLength = Math.max(...partialProducts.map(pp => pp.length));
    const result = [];
    const carries = [];
    let carry = 0;
    
    // Add from right to left
    for (let col = maxLength - 1; col >= 0; col--) {
      let sum = carry;
      
      partialProducts.forEach(pp => {
        const index = pp.length - (maxLength - col);
        if (index >= 0) {
          sum += pp[index];
        }
      });
      
      result.unshift(sum % 10);
      carries.unshift(Math.floor(sum / 10));
      carry = Math.floor(sum / 10);
    }
    
    // Add final carry if present
    if (carry > 0) {
      result.unshift(carry);
      carries.unshift(0);
    }
    
    return { digits: result, carries };
  };
  
  /**
   * Calculate all multiplication data
   */
  const calculateMultiplication = (multiplicand, multiplier) => {
    const multiplierDigits = numberToDigits(multiplier);
    const partialProducts = [];
    const partialProductCarries = [];
    
    // Calculate each partial product
    // Process from right to left (units digit first)
    for (let i = multiplierDigits.length - 1; i >= 0; i--) {
      const digit = multiplierDigits[i];
      const shift = multiplierDigits.length - 1 - i;
      const pp = calculatePartialProduct(multiplicand, digit, shift);
      partialProducts.push(pp.digits);
      partialProductCarries.push(pp.carries);
    }
    
    // Calculate final sum
    const sum = calculateSum(partialProducts);
    
    // Calculate total columns needed
    const totalColumns = Math.max(
      numberToDigits(multiplicand).length,
      sum.digits.length
    );
    
    return {
      multiplicandDigits: numberToDigits(multiplicand),
      multiplierDigits: numberToDigits(multiplier),
      partialProducts,
      partialProductCarries,
      sumDigits: sum.digits,
      sumCarries: sum.carries,
      totalColumns,
      finalAnswer: multiplicand * multiplier
    };
  };
  
  // ===== MAIN COMPONENT =====
  
  const MultiplicationGrid = ({
    multiplicand = 23,
    multiplier = 47,
    showCarries = true,
    interactive = false,
    onComplete = null,
    cellSize = '30gc',
    showStepHighlight = true,
    backgroundColor = '#f9f9f9',
    fontSize = '24gc',
    cellBackgroundColor = 'white',
    containerBorder = '2px solid #ddd',
    // Separator line styling
    lineColor = 'white',
    lineThickness = '4gc',
    // Cell border styling
    cellBorderColor = '#ddd',
    cellBorderWidth = '1px',
    cellBorderStyle = 'solid',
    // Multiplication symbol position
    multiplicationSymbolPosition = 'default', // 'default' or 'indonesia'
    // Grid alignment
    gridAlignment = 'center', // 'left', 'center', or 'right'
    // Incorrect values
    incorrectCount = 0, // Number of cells to make incorrect
    // Spot incorrect mode
    mode = 'default', // 'default', 'spotIncorrect', 'input', 'practice', 'guided', 'animation', 'dragDrop'
    onCheck = null,   // Callback when check is triggered externally
    onReset = null,   // Callback when reset is triggered externally
    onSelectionChange = null, // Callback with current selection state
    // Input mode - cells that should be input tiles
    inputCells = [], // Array of cell keys that should be input tiles, e.g., ['partial-0-0', 'partial-1-1', 'sum-0']
    onInputChange = null, // Callback when input values change
    onInputValidation = null, // Callback for input validation results
    // Hint text for default mode
    hintText = '', // Optional hint text shown in default mode
    // Practice mode configuration
    practiceConfig: practiceConfigProp = {},
    onPracticeValidate = null,    // Callback when practice validation occurs
    onPracticeComplete = null,    // Callback when all practice cells are correct
    // Guided mode configuration
    guidedConfig: guidedConfigProp = {},
    onStepComplete = null,        // Callback when a guided step is completed
    onGuidedComplete = null,      // Callback when all guided steps are completed
    // Animation mode configuration
    animationConfig: animationConfigProp = {},
    onAnimationStep = null,       // Callback for each animation step
    onAnimationComplete = null,   // Callback when animation completes
    // DragDrop mode configuration
    dragDropConfig: dragDropConfigProp = {},
    onDragDropValidate = null,    // Callback when drag-drop validation occurs
    onDragDropComplete = null,    // Callback when all drag-drop cells are correct
    // Theme system
    theme = 'coloured-theme', // 'coloured-theme', 'white-theme', 'button-theme', 'input-theme', 'override-theme'
    // Button theme disabled state
    disabled = false, // When true, all buttons are disabled (button-theme only)
    // Minimal mode - disable all borders and backgrounds
    minimalMode = false, // When true, removes all borders and backgrounds for clean appearance
    // Input mode - cells to hide (make transparent)
    hiddenCells = [], // Array of cell keys to hide, e.g., ['partial-0-0', 'partial-1-1', 'sum-0']
    // Grouped styling for each section (only used when theme = 'override-theme')
    carryStyle = {},
    multiplicandStyle = {},
    multiplierStyle = {},
    partialProductStyle = {},
    answerStyle = {},
    operatorStyle = {}
  }) => {
    
    // Debug props received
    console.log('🔍 [MultiplicationGrid] Component created with props:', {
      theme,
      hiddenCells,
      multiplicand,
      multiplier,
      mode
    });
    console.log('🔍 [MultiplicationGrid] Global state at component creation:', {
      multiplicationGridInputAllCorrect: window.multiplicationGridInputAllCorrect,
      multiplicationGridFeedbackState: window.multiplicationGridFeedbackState
    });
    
    // Merge config props with defaults
    const practiceConfig = {
      validateOnChange: false,
      showAllErrors: true,
      editableTypes: ['partial', 'sum', 'carry'],
      prefillCells: [],
      ...practiceConfigProp
    };
    
    const guidedConfig = {
      autoAdvance: true,
      showHints: true,
      hintPosition: 'bottom',
      stepOrder: 'rtl',
      allowSkip: false,
      ...guidedConfigProp
    };
    
    const animationConfig = {
      autoPlay: false,
      speed: 1000,
      showControls: true,
      highlightDuration: 500,
      carryAnimation: 'fly',
      digitAnimation: 'scale',
      ...animationConfigProp
    };
    
    const dragDropConfig = {
      validateOnDrop: true,       // Validate immediately on drop
      showDigitBank: true,        // Show digit bank (0-9 tiles)
      digitBankPosition: 'right', // 'left', 'right', 'top', 'bottom'
      allowedDigits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // Which digits to show
      editableTypes: ['partial', 'sum', 'carry'], // Which cell types are editable
      ...dragDropConfigProp
    };
    
    // Convert gc units to pixels if needed
    const convertGc = (value) => {
      if (typeof value === 'string' && value.includes('gc')) {
        if (typeof GridCellFontUtils !== 'undefined' && GridCellFontUtils.convertGcToPixels) {
          return GridCellFontUtils.convertGcToPixels(value);
        }
        // Fallback conversion
        const gcValue = parseFloat(value);
        const rowHeight = typeof window !== 'undefined' ? window.innerHeight / 900 : 1;
        return `${gcValue * rowHeight}px`;
      }
      return typeof value === 'number' ? `${value}px` : value;
    };
    
    const [carryVisible, setCarryVisible] = React.useState(showCarries);
    const [userInputs, setUserInputs] = React.useState({});
    const [currentStep, setCurrentStep] = React.useState({ row: 0, col: 0, type: 'partial' });
    const [completedSteps, setCompletedSteps] = React.useState(new Set());
    const [incorrectCells, setIncorrectCells] = React.useState(new Set());
    
    // Input mode state
      const [inputValues, setInputValues] = React.useState({});
      const [inputValidation, setInputValidation] = React.useState({});
      const [focusedCell, setFocusedCell] = React.useState(null); // Track which cell is currently focused
      const [relatedCells, setRelatedCells] = React.useState(new Set()); // Track related multiplicand/multiplier cells to highlight
      const [checkPerformed, setCheckPerformed] = React.useState(false); // Track if check has been performed
    
    // Spot incorrect mode state
    const [selectedCells, setSelectedCells] = React.useState(new Set());
    const [checkResult, setCheckResult] = React.useState(null);
    const [allCorrect, setAllCorrect] = React.useState(() => {
      // Initialize from global state if available
      return window.multiplicationGridAllCorrect || false;
    });
    // Use global state to persist theme changes across component recreations
    const [currentTheme, setCurrentTheme] = React.useState(() => {
      // For input mode, always use the theme prop, ignore global state
      if (mode === 'input') {
        return theme;
      }
      // For spotIncorrect mode, check global state but fallback to theme prop
      return window.multiplicationGridCurrentTheme || theme;
    });
    
    // Practice mode state
    const [practiceValues, setPracticeValues] = React.useState({});
    const [practiceValidation, setPracticeValidation] = React.useState({});
    const [practiceComplete, setPracticeComplete] = React.useState(false);
    
    // Guided mode state
    const [guidedStepIndex, setGuidedStepIndex] = React.useState(0);
    const [guidedSteps, setGuidedSteps] = React.useState([]);
    const [guidedComplete, setGuidedComplete] = React.useState(false);
    const [guidedValues, setGuidedValues] = React.useState({});
    const [guidedValidation, setGuidedValidation] = React.useState({});
    
    // Animation mode state
    const [animationStepIndex, setAnimationStepIndex] = React.useState(0);
    const [animationPlaying, setAnimationPlaying] = React.useState(false);
    const [animationSteps, setAnimationSteps] = React.useState([]);
    const [animationComplete, setAnimationComplete] = React.useState(false);
    const [visibleCells, setVisibleCells] = React.useState(new Set());
    const [highlightedCell, setHighlightedCell] = React.useState(null);
    const [flyingCarry, setFlyingCarry] = React.useState(null);
    const animationTimerRef = React.useRef(null);
    
    // DragDrop mode state
    const [draggedDigit, setDraggedDigit] = React.useState(null);
    const [dragPosition, setDragPosition] = React.useState({ x: 0, y: 0 });
    const [dragStartPos, setDragStartPos] = React.useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragOverCell, setDragOverCell] = React.useState(null);
    const [dragDropValues, setDragDropValues] = React.useState({});
    const [dragDropValidation, setDragDropValidation] = React.useState({});
    const [dragDropComplete, setDragDropComplete] = React.useState(false);
    const dragElementRef = React.useRef(null);
    
    // Debug theme initialization
    console.log('🎨 [MultiplicationGrid] Theme initialization:', {
      originalTheme: theme,
      currentTheme: currentTheme,
      allCorrect: allCorrect,
      globalTheme: window.multiplicationGridCurrentTheme
    });
    
    // Calculate multiplication data - memoized to prevent recalculation on every render
    const data = React.useMemo(() => calculateMultiplication(multiplicand, multiplier), [multiplicand, multiplier]);
    
    // Pre-compute dragDrop cell keys for renderCell access
    const dragDropCellKeysRef = React.useRef([]);
    
    // Calculate total number of rows for dynamic sizing (excluding separator lines)
    const calculateTotalRows = () => {
      let totalRows = 2; // multiplicand + multiplier
      
      // Add carry rows if visible
      if (carryVisible) {
        totalRows += data.partialProductCarries.length;
      }
      
      // Add partial product rows if multiplier has more than one digit
      if (data.multiplierDigits.length > 1) {
        totalRows += data.partialProducts.length;
      }
      
      // Add sum row
      totalRows += 1;
      
      return totalRows;
    };
    
    const totalRows = calculateTotalRows();
    
    // Dynamic sizing based on number of rows using configuration table
    const calculateDynamicSizing = () => {
      // Use the configuration table from constants.js
      if (typeof window !== 'undefined' && window.DYNAMIC_SIZING_CONFIG) {
        const sizing = window.DYNAMIC_SIZING_CONFIG.getSizingForRows(totalRows);
        return {
          cellSize: sizing.cellSize,
          fontSize: sizing.fontSize
        };
      }
      
      // Fallback to simple calculation if config not available
      const baseCellSize = 60; // Base cell size in gc
      const baseFontSize = 40; // Base font size in gc
      const maxRows = 7; // Maximum rows for reference
      
      const scaleFactor = Math.min(1, maxRows / totalRows);
      const dynamicCellSize = Math.max(30, baseCellSize * scaleFactor);
      const dynamicFontSize = Math.max(20, baseFontSize * scaleFactor);
      
      return {
        cellSize: `${dynamicCellSize}gc`,
        fontSize: `${dynamicFontSize}gc`
      };
    };
    
    const dynamicSizing = calculateDynamicSizing();
    
    // Override cellSize and fontSize with dynamic values if not explicitly set
    const finalCellSize = cellSize === '30gc' ? dynamicSizing.cellSize : cellSize;
    const finalFontSize = fontSize === '24gc' ? dynamicSizing.fontSize : fontSize;
    
    
    // Theme-based styling
    const getThemeStyles = () => {
      console.log('🎨 [getThemeStyles] Called with currentTheme:', currentTheme);
      const baseStyles = {
        carry: { color: '#FF6B6B', backgroundColor: 'white', borderColor: '#ddd', borderWidth: '1px', borderStyle: 'solid' },
        multiplicand: { color: '#333', backgroundColor: 'white', borderColor: '#ddd', borderWidth: '1px', borderStyle: 'solid' },
        multiplier: { color: '#333', backgroundColor: 'white', borderColor: '#ddd', borderWidth: '1px', borderStyle: 'solid' },
        partial: { color: '#333', backgroundColor: 'white', borderColor: '#ddd', borderWidth: '1px', borderStyle: 'solid' },
        answer: { color: '#333', backgroundColor: 'white', borderColor: '#ddd', borderWidth: '1px', borderStyle: 'solid' },
        operator: { color: 'white', fontSize: finalFontSize }
      };
      
      switch (currentTheme) {
        case 'coloured-theme':
          console.log('🎨 [getThemeStyles] Applying coloured-theme');
          return {
            carry: { 
              ...baseStyles.carry, 
              color: '#FF6B6B', 
              backgroundColor: 'rgba(255, 107, 107, 0.1)',
              borderColor: '#FF6B6B',
              borderWidth: '2px',
              borderStyle: 'dashed'
            },
            multiplicand: { 
              ...baseStyles.multiplicand, 
              color: '#4ECDC4',
              backgroundColor: 'rgba(78, 205, 196, 0.1)',
              borderColor: '#4ECDC4',
              borderWidth: '2px',
              borderStyle: 'solid'
            },
            multiplier: { 
              ...baseStyles.multiplier, 
              color: '#45B7D1',
              backgroundColor: 'rgba(69, 183, 209, 0.1)',
              borderColor: '#45B7D1',
              borderWidth: '2px',
              borderStyle: 'solid'
            },
            partial: { 
              ...baseStyles.partial, 
              color: '#96CEB4',
              backgroundColor: 'rgba(150, 206, 180, 0.1)',
              borderColor: '#96CEB4',
              borderWidth: '2px',
              borderStyle: 'solid'
            },
            answer: { 
              ...baseStyles.answer, 
              color: '#2E7D32',
              backgroundColor: 'rgba(46, 125, 50, 0.15)',
              borderColor: '#2E7D32',
              borderWidth: '2px',
              borderStyle: 'solid',
              fontWeight: 'bold'
            },
            operator: { 
              ...baseStyles.operator, 
              color: 'white',
              fontSize: finalFontSize
            }
          };
          
        case 'white-theme':
          return {
            carry: { ...baseStyles.carry, color: 'black', borderColor: 'white' },
            multiplicand: { ...baseStyles.multiplicand, color: 'black', borderColor: 'white' },
            multiplier: { ...baseStyles.multiplier, color: 'black', borderColor: 'white' },
            partial: { ...baseStyles.partial, color: 'black', borderColor: 'white' },
            answer: { ...baseStyles.answer, color: 'black', borderColor: 'white', fontWeight: 'bold' },
            operator: { ...baseStyles.operator, color: 'white', fontSize: finalFontSize }
          };
          
        case 'button-theme':
          return {
            carry: { 
              ...baseStyles.carry, 
              color: '#CC0000',  // Darker red for contrast
              cursor: 'pointer' 
            },
            multiplicand: { 
              ...baseStyles.multiplicand, 
              color: '#1B5E20',  // Darker green for contrast
              cursor: 'pointer' 
            },
            multiplier: { 
              ...baseStyles.multiplier, 
              color: '#0D47A1',  // Darker blue for contrast
              cursor: 'pointer' 
            },
            partial: { 
              ...baseStyles.partial, 
              color: '#4A148C',  // Darker purple for contrast
              cursor: 'pointer' 
            },
            answer: { 
              ...baseStyles.answer, 
              color: '#1B5E20',  // Darker green for contrast
              cursor: 'pointer', 
              fontWeight: 'bold' 
            },
            operator: { 
              ...baseStyles.operator, 
              color: 'white',
              fontSize: finalFontSize
            }
          };
          
        case 'input-theme':
          console.log('🎨 [getThemeStyles] Applying input-theme');
          return {
            carry: { 
              ...baseStyles.carry, 
              color: '#FF6B6B',  // Same as coloured theme
              backgroundColor: 'white',
              borderColor: '#FF6B6B',
              borderWidth: '2gc',
              borderStyle: 'dashed'
            },
            multiplicand: { 
              ...baseStyles.multiplicand, 
              color: '#4ECDC4',  // Same as coloured theme
              backgroundColor: 'white',
              borderColor: '#4ECDC4',
              borderWidth: '2gc',
              borderStyle: 'solid'
            },
            multiplier: { 
              ...baseStyles.multiplier, 
              color: '#45B7D1',  // Same as coloured theme
              backgroundColor: 'white',
              borderColor: '#45B7D1',
              borderWidth: '2gc',
              borderStyle: 'solid'
            },
            partial: { 
              ...baseStyles.partial, 
              color: '#96CEB4',  // Same as coloured theme
              backgroundColor: 'white',
              borderColor: '#96CEB4',
              borderWidth: '2gc',
              borderStyle: 'solid'
            },
            answer: { 
              ...baseStyles.answer, 
              color: '#2E7D32',  // Same as coloured theme
              backgroundColor: 'white',
              borderColor: '#2E7D32',
              borderWidth: '2gc',
              borderStyle: 'solid',
              fontWeight: 'bold'
            },
            operator: { 
              ...baseStyles.operator, 
              color: 'white',
              fontSize: finalFontSize
            }
          };
          
        case 'override-theme':
          return {
            carry: { ...baseStyles.carry, ...carryStyle },
            multiplicand: { ...baseStyles.multiplicand, ...multiplicandStyle },
            multiplier: { ...baseStyles.multiplier, ...multiplierStyle },
            partial: { ...baseStyles.partial, ...partialProductStyle },
            answer: { ...baseStyles.answer, ...answerStyle },
            operator: { ...baseStyles.operator, ...operatorStyle }
          };
          
        default:
          console.log('🎨 [getThemeStyles] Applying default theme for:', currentTheme);
          return baseStyles;
      }
    };
    
    const themeStyles = getThemeStyles();
    
    // Debug theme state changes
    console.log('🎨 [MultiplicationGrid] Component render with theme state:', {
      currentTheme: currentTheme,
      allCorrect: allCorrect,
      themeStylesApplied: Object.keys(themeStyles)
    });
    
    
    // Debug hidden cells for input theme
    if (currentTheme === 'input-theme') {
      console.log('🔍 [Input Theme] Hidden cells:', hiddenCells);
      console.log('🔍 [Input Theme] Theme:', currentTheme);
      console.log('🔍 [Input Theme] Hidden cells type:', typeof hiddenCells, 'Array?', Array.isArray(hiddenCells));
    }
    
    const cellSizePx = convertGc(finalCellSize);
    const fontSizePx = convertGc(finalFontSize);
    
    // Apply defaults to grouped styles
    const carry = {
      color: '#888',
      bgColor: '#f5f5f5',
      borderColor: cellBorderColor,
      borderWidth: cellBorderWidth,
      borderStyle: cellBorderStyle,
      ...carryStyle
    };
    
    const multiplicandStyling = {
      color: '#000',
      bgColor: 'white',
      borderColor: cellBorderColor,
      borderWidth: cellBorderWidth,
      borderStyle: cellBorderStyle,
      ...multiplicandStyle
    };
    
    const multiplierStyling = {
      color: '#000',
      bgColor: 'white',
      borderColor: cellBorderColor,
      borderWidth: cellBorderWidth,
      borderStyle: cellBorderStyle,
      ...multiplierStyle
    };
    
    const partialProduct = {
      color: '#000',
      bgColor: 'white',
      borderColor: cellBorderColor,
      borderWidth: cellBorderWidth,
      borderStyle: cellBorderStyle,
      ...partialProductStyle
    };
    
    const answer = {
      color: '#000',
      bgColor: '#fff3cd',
      borderColor: cellBorderColor,
      borderWidth: cellBorderWidth,
      borderStyle: cellBorderStyle,
      ...answerStyle
    };
    
    const operator = {
      color: themeStyles.operator.color || '#333',
      fontSize: themeStyles.operator.fontSize || finalFontSize,
      ...operatorStyle
    };
    
    // Generate incorrect values if incorrectCount > 0
    const [incorrectValues] = React.useState(() => {
      if (incorrectCount <= 0) return {};
      
      const incorrectMap = {};
      const allRows = [];
      
      // Store question info for debugging
      const questionInfo = {
        multiplicand,
        multiplier,
        incorrectCount,
        timestamp: new Date().toISOString()
      };
      
      // Collect all available cells (carry, multiplicand, multiplier, partial products, and sum)
      // Each row type with its data
      
      // Add carry rows (use same order as rendering - reversed)
      data.partialProductCarries.slice().reverse().forEach((carryRow, carryRowIdx) => {
        // Create padded carries array for this specific partial product (same as rendering logic)
        const paddedCarries = new Array(data.totalColumns).fill(null);
        
        // Process carries for this partial product (same as rendering logic)
        carryRow.forEach((carry, idx) => {
          if (carry > 0 && carry !== null) {
            // Shift carry one position to the LEFT
            const basePosition = data.totalColumns - carryRow.length + idx;
            const shiftedPosition = basePosition - 1;
            
            // Only place carry if position is valid (>= 0)
            if (shiftedPosition >= 0) {
              paddedCarries[shiftedPosition] = carry;
            }
          }
        });
        
        // Now add to allRows using the padded data (same as rendering)
        paddedCarries.forEach((carry, colIdx) => {
          if (carry !== null) { // Skip blank cells - hard constraint
            allRows.push({
              type: 'carry',
              rowIdx: carryRowIdx, // Use carryRowIdx from reversed array
              colIdx,
              correctValue: carry,
              rowId: `carry-${carryRowIdx}`
            });
          }
        });
      });
      
      // Add multiplicand row
      data.multiplicandDigits.forEach((digit, colIdx) => {
        if (digit !== null) { // Skip blank cells - hard constraint
          allRows.push({
            type: 'multiplicand',
            rowIdx: 0,
            colIdx,
            correctValue: digit,
            rowId: 'multiplicand-0'
          });
        }
      });
      
      // Add multiplier row
      data.multiplierDigits.forEach((digit, colIdx) => {
        if (digit !== null) { // Skip blank cells - hard constraint
          allRows.push({
            type: 'multiplier',
            rowIdx: 0,
            colIdx,
            correctValue: digit,
            rowId: 'multiplier-0'
          });
        }
      });
      
      if (data.multiplierDigits.length > 1) {
        // Only include partial products for multi-digit multipliers
        data.partialProducts.forEach((pp, rowIdx) => {
          pp.forEach((digit, colIdx) => {
            if (digit !== null) { // Skip blank cells - hard constraint
              allRows.push({
                type: 'partial',
                rowIdx,
                colIdx,
                correctValue: digit,
                rowId: `partial-${rowIdx}`
              });
            }
          });
        });
      }
      
      data.sumDigits.forEach((digit, colIdx) => {
        if (digit !== null) { // Skip blank cells - hard constraint
          allRows.push({
            type: 'sum',
            rowIdx: 0,
            colIdx,
            correctValue: digit,
            rowId: 'sum-0'
          });
        }
      });
      
      // Strategy: Distribute errors across rows
      // Count all available rows: carry rows + multiplicand + multiplier + partial products + sum
      let totalRows = 0;
      totalRows += data.partialProductCarries.length; // carry rows
      totalRows += 1; // multiplicand row
      totalRows += 1; // multiplier row
      if (data.multiplierDigits.length > 1) {
        totalRows += data.partialProducts.length; // partial product rows
      }
      totalRows += 1; // sum row
      
      const cellsPerRow = Math.floor(incorrectCount / totalRows);
      const remainingCells = incorrectCount % totalRows;
      
      // Group cells by row
      const rowGroups = {};
      allRows.forEach(cell => {
        if (!rowGroups[cell.rowId]) {
          rowGroups[cell.rowId] = [];
        }
        rowGroups[cell.rowId].push(cell);
      });
      
      const selectedCells = [];
      const rowIds = Object.keys(rowGroups);
      
      // First pass: Select cellsPerRow from each row
      if (cellsPerRow > 0) {
        rowIds.forEach(rowId => {
          const rowCells = rowGroups[rowId];
          const shuffled = [...rowCells].sort(() => Math.random() - 0.5);
          const toSelect = Math.min(cellsPerRow, shuffled.length);
          selectedCells.push(...shuffled.slice(0, toSelect));
        });
      }
      
      // Second pass: Select remaining cells
      if (remainingCells > 0) {
        const remaining = allRows.filter(cell => 
          !selectedCells.some(sc => 
            sc.type === cell.type && sc.rowIdx === cell.rowIdx && sc.colIdx === cell.colIdx
          )
        );
        const shuffled = remaining.sort(() => Math.random() - 0.5);
        selectedCells.push(...shuffled.slice(0, remainingCells));
      }
      
      // Limit to incorrectCount
      const finalSelection = selectedCells.slice(0, incorrectCount);
      
      // Generate incorrect values
      console.log('🔴 [Multiplication Grid] Generating incorrect values:');
      console.log('🔴 [Multiplication Grid] Total cells available:', allRows.length);
      console.log('🔴 [Multiplication Grid] Incorrect count requested:', incorrectCount);
      console.log('🔴 [Multiplication Grid] Final selection count:', finalSelection.length);
      console.log('🔴 [Multiplication Grid] Selected cells:', finalSelection.map(c => `${c.type}-${c.rowIdx}-${c.colIdx}`));
      
      finalSelection.forEach(cell => {
        const key = `${cell.type}-${cell.rowIdx}-${cell.colIdx}`;
        
        // Generate a different wrong digit (0-9, but not the correct one)
        let wrongValue;
        do {
          wrongValue = Math.floor(Math.random() * 10);
        } while (wrongValue === cell.correctValue);
        
        incorrectMap[key] = wrongValue;
        
        console.log(`  Cell: ${key}`);
        console.log(`    Correct Answer: ${cell.correctValue}`);
        console.log(`    Wrong Answer: ${wrongValue}`);
      });
      
      console.log('🔴 [Multiplication Grid] Final incorrect map:', incorrectMap);
      
      // Store incorrect cells with their correct values for this question
      const incorrectCellsWithCorrectValues = {};
      finalSelection.forEach(cell => {
        const key = `${cell.type}-${cell.rowIdx}-${cell.colIdx}`;
        incorrectCellsWithCorrectValues[key] = {
          correctValue: cell.correctValue,
          incorrectValue: incorrectMap[key],
          cellType: cell.type,
          rowIndex: cell.rowIdx,
          colIndex: cell.colIdx
        };
      });
      
      // Store in global scope for persistence across questions
      if (typeof window !== 'undefined') {
        if (!window.questionIncorrectCells) {
          window.questionIncorrectCells = {};
        }
        const questionKey = `${multiplicand}x${multiplier}`;
        window.questionIncorrectCells[questionKey] = {
          questionInfo,
          incorrectCells: incorrectCellsWithCorrectValues,
          totalIncorrect: finalSelection.length
        };
        
        // Display on console
        console.log('📊 [Question Data] Incorrect cells for this question:');
        console.log('📊 [Question Data] Question:', questionKey);
        console.log('📊 [Question Data] Incorrect Count:', incorrectCount);
        console.log('📊 [Question Data] Incorrect Cells with Correct Values:', incorrectCellsWithCorrectValues);
        console.log('📊 [Question Data] All Questions Data:', window.questionIncorrectCells);
      }
      
      return incorrectMap;
    });
    
    // Debug incorrect values state
    console.log('🔍 [MultiplicationGrid] Incorrect values state:', {
      incorrectValues,
      incorrectValuesKeys: Object.keys(incorrectValues),
      incorrectCount
    });
    
    // Initialize refs for input focus management
    const inputRefs = React.useRef({});
    
    // Display question data on component mount
    React.useEffect(() => {
      if (typeof window !== 'undefined' && window.questionIncorrectCells) {
        const questionKey = `${multiplicand}x${multiplier}`;
        const questionData = window.questionIncorrectCells[questionKey];
        
        if (questionData) {
          console.log('📊 [Question Load] Displaying data for question:', questionKey);
          console.log('📊 [Question Load] Question Info:', questionData.questionInfo);
          console.log('📊 [Question Load] Incorrect Cells:', questionData.incorrectCells);
          console.log('📊 [Question Load] Total Incorrect:', questionData.totalIncorrect);
        }
      }
    }, [multiplicand, multiplier]);
    
    /**
     * Handle check in spot incorrect mode - Two-phase validation
     */
    const handleCheck = React.useCallback(() => {
      const results = {};
      selectedCells.forEach(key => {
        results[key] = incorrectValues[key] !== undefined;
      });
      setCheckResult(results);
      
      // Update global feedback state
      const hasSelections = selectedCells.size > 0;
      const totalIncorrectCells = Object.keys(incorrectValues).length;
      const selectedIncorrectCells = Object.values(results).filter(v => v === true).length;
      const selectedCorrectCells = Object.values(results).filter(v => v === false).length;
      
      console.log('🔍 [MultiplicationGrid] Page 1 Check logic:', {
        hasSelections,
        selectedCellsSize: selectedCells.size,
        totalIncorrectCells,
        selectedIncorrectCells,
        selectedCorrectCells,
        resultsKeys: Object.keys(results),
        resultsValues: Object.values(results)
      });
      
      // Phase 1: Check if all incorrect cells are selected
      if (selectedCells.size < totalIncorrectCells) {
        console.log('⚠️ [MultiplicationGrid] Not all incorrect cells selected - incomplete phase');
        window.multiplicationGridFeedbackState = 'incorrect';
        window.multiplicationGridCorrectnessPhase = false; // Incomplete phase
        window.multiplicationGridCheckResult = results;
        window.multiplicationGridTotalIncorrectCells = totalIncorrectCells;
        window.multiplicationGridSelectedCells = selectedCells;
        return;
      }
      
      // Phase 2: All incorrect cells are selected, check correctness
      console.log('✅ [MultiplicationGrid] All incorrect cells selected, checking correctness...');
      window.multiplicationGridCorrectnessPhase = true; // Correctness phase
      
      const allCorrect = hasSelections && selectedIncorrectCells === totalIncorrectCells && selectedCorrectCells === 0;
      const hasIncorrect = Object.values(results).some(v => v === false);
      
      if (allCorrect) {
        console.log('✅ [MultiplicationGrid] Setting feedback state to: correct');
        console.log('🎨 [MultiplicationGrid] Keeping current theme:', {
          currentTheme: currentTheme,
          allCorrect: allCorrect,
          originalTheme: theme
        });
        setAllCorrect(true);
        // Keep current theme - do not change to coloured-theme
        window.multiplicationGridFeedbackState = 'correct';
        console.log('🌍 [MultiplicationGrid] Setting global allCorrect to true');
        window.multiplicationGridAllCorrect = true;
        
        // Trigger re-render for page 1 next button
        window.multiplicationGridAllCorrectTrigger = (window.multiplicationGridAllCorrectTrigger || 0) + 1;
        console.log('🔄 [MultiplicationGrid] Triggered page 1 re-render:', window.multiplicationGridAllCorrectTrigger);
      } else if (hasIncorrect) {
        console.log('❌ [MultiplicationGrid] Setting feedback state to: incorrect (has incorrect)');
        window.multiplicationGridFeedbackState = 'incorrect';
      } else if (hasSelections) {
        // Has selections but not all correct (some might be correct, some wrong)
        console.log('❌ [MultiplicationGrid] Setting feedback state to: incorrect (has selections but not all correct)');
        window.multiplicationGridFeedbackState = 'incorrect';
      } else {
        // No selections made - show as incorrect mode
        console.log('⚠️ [MultiplicationGrid] Setting feedback state to: incorrect (no selections)');
        window.multiplicationGridFeedbackState = 'incorrect';
      }
      
      // Set up global state for feedback textbox
      window.multiplicationGridCheckResult = results;
      window.multiplicationGridTotalIncorrectCells = totalIncorrectCells;
      window.multiplicationGridSelectedCells = selectedCells;
      
      console.log('🔍 [MultiplicationGrid] Final feedback state:', window.multiplicationGridFeedbackState);
      
      if (onCheck) {
        onCheck(results);
      }
    }, [selectedCells, incorrectValues, onCheck]);
    
    /**
     * Handle reset in spot incorrect mode
     */
    const handleReset = React.useCallback(() => {
      console.log('🔄 [MultiplicationGrid] Reset called:', {
        currentTheme: currentTheme,
        originalTheme: theme,
        allCorrect: allCorrect
      });
      setSelectedCells(new Set());
      setCheckResult(null);
      setAllCorrect(false);
      setCurrentTheme(theme); // Reset to original theme
      window.multiplicationGridCurrentTheme = theme; // Reset global state
      console.log('🎨 [MultiplicationGrid] Theme reset to original:', theme);
      
      // Reset global feedback state
      window.multiplicationGridFeedbackState = 'default';
      console.log('🌍 [MultiplicationGrid] Setting global allCorrect to false');
      window.multiplicationGridAllCorrect = false;
      
      // Reset input mode states
      window.multiplicationGridInputAllCorrect = false;
      window.multiplicationGridCorrectnessPhase = 'input';
      window.multiplicationGridInputAllCorrectTrigger = 0;
      window.multiplicationGridNumberPadInput = {};
      window.multiplicationGridFocusedCell = null;
      window.multiplicationGridCheckInputs = false;
      
      if (onReset) {
        onReset();
      }
    }, [onReset, theme]);
    
    /**
     * Check input mode - validate all input cells and return detailed results
     */
    const checkInputMode = React.useCallback(() => {
      console.log('🔍 [Input Check] Starting input validation...');
      
      if (inputCells.length === 0) {
        console.log('⚠️ [Input Check] No input cells specified');
        return {
          allCorrect: true,
          totalCells: 0,
          correctCells: 0,
          incorrectCells: 0,
          emptyCells: 0,
          results: {},
          message: 'No input cells to validate'
        };
      }
      
      const results = {};
      let correctCount = 0;
      let incorrectCount = 0;
      let emptyCount = 0;
      
      // Check each input cell
      inputCells.forEach(key => {
        const validation = inputValidation[key];
        const inputValue = inputValues[key];
        
        if (!validation && inputValue === undefined) {
          // Empty cell
          results[key] = {
            status: 'empty',
            userValue: undefined,
            correctValue: null,
            isCorrect: false
          };
          emptyCount++;
        } else if (validation) {
          // Cell has been validated
          results[key] = {
            status: validation.isCorrect ? 'correct' : 'incorrect',
            userValue: validation.userValue,
            correctValue: validation.correctValue,
            isCorrect: validation.isCorrect
          };
          
          if (validation.isCorrect) {
            correctCount++;
          } else {
            incorrectCount++;
          }
        } else {
          // Cell has input but no validation (shouldn't happen)
          results[key] = {
            status: 'invalid',
            userValue: inputValue,
            correctValue: null,
            isCorrect: false
          };
          incorrectCount++;
        }
      });
      
      const allCorrect = correctCount === inputCells.length && emptyCount === 0;
      
      const checkResult = {
        allCorrect,
        totalCells: inputCells.length,
        correctCells: correctCount,
        incorrectCells: incorrectCount,
        emptyCells: emptyCount,
        results,
        message: allCorrect 
          ? `🎉 All ${correctCount} input cells are correct!`
          : `❌ ${correctCount} correct, ${incorrectCount} incorrect, ${emptyCount} empty out of ${inputCells.length} total cells`
      };
      
      console.log('✅ [Input Check] Results:', checkResult);
      
      // Update global state for external access
      window.multiplicationGridInputCheckResult = checkResult;
      window.multiplicationGridInputAllCorrect = allCorrect;
      
      // Call external callback if provided
      if (onInputValidation) {
        onInputValidation('check', checkResult);
      }
      
      return checkResult;
    }, [inputCells, inputValidation, inputValues, onInputValidation]);
    
    /**
     * Check if all input cells are filled and correct
     */
    const checkInputCompletion = React.useCallback(() => {
      if (inputCells.length === 0) return true;
      
      return inputCells.every(key => {
        const validation = inputValidation[key];
        return validation && validation.isCorrect;
      });
    }, [inputCells, inputValidation]);

    // ===== PRACTICE MODE FUNCTIONS =====
    
    /**
     * Generate all editable cells for practice mode
     */
    const generatePracticeCells = React.useCallback(() => {
      const cells = [];
      const editableTypes = practiceConfig.editableTypes || ['partial', 'sum', 'carry'];
      
      // Add carry cells if editable
      if (editableTypes.includes('carry') && showCarries) {
        data.partialProductCarries.slice().reverse().forEach((carries, carryRowIdx) => {
          const paddedCarries = new Array(data.totalColumns).fill(null);
          carries.forEach((carry, idx) => {
            if (carry > 0 && carry !== null) {
              const basePosition = data.totalColumns - carries.length + idx;
              const shiftedPosition = basePosition - 1;
              if (shiftedPosition >= 0) {
                paddedCarries[shiftedPosition] = carry;
              }
            }
          });
          paddedCarries.forEach((val, colIdx) => {
            if (val !== null) {
              cells.push({
                key: `carry-${carryRowIdx}-${colIdx}`,
                type: 'carry',
                row: carryRowIdx,
                col: colIdx,
                correctValue: val
              });
            }
          });
        });
      }
      
      // Add partial product cells if editable (only for multi-digit multipliers)
      if (editableTypes.includes('partial') && data.multiplierDigits.length > 1) {
        data.partialProducts.forEach((pp, rowIdx) => {
          pp.forEach((digit, colIdx) => {
            if (digit !== null) {
              cells.push({
                key: `partial-${rowIdx}-${colIdx}`,
                type: 'partial',
                row: rowIdx,
                col: colIdx,
                correctValue: digit
              });
            }
          });
        });
      }
      
      // Add sum cells if editable
      if (editableTypes.includes('sum')) {
        data.sumDigits.forEach((digit, colIdx) => {
          if (digit !== null) {
            cells.push({
              key: `sum-0-${colIdx}`,
              type: 'sum',
              row: 0,
              col: colIdx,
              correctValue: digit
            });
          }
        });
      }
      
      return cells;
    }, [data, practiceConfig.editableTypes, showCarries]);
    
    /**
     * Get practice cell keys
     */
    const getPracticeCellKeys = React.useCallback(() => {
      return generatePracticeCells().map(cell => cell.key);
    }, [generatePracticeCells]);
    
    /**
     * Validate all practice cells
     */
    const validatePractice = React.useCallback(() => {
      const cells = generatePracticeCells();
      const results = {};
      let correctCount = 0;
      let incorrectCount = 0;
      let emptyCount = 0;
      
      cells.forEach(cell => {
        const userValue = practiceValues[cell.key];
        if (userValue === undefined || userValue === '' || userValue === '?') {
          results[cell.key] = { status: 'empty', isCorrect: false, correctValue: cell.correctValue };
          emptyCount++;
        } else {
          const isCorrect = parseInt(userValue, 10) === cell.correctValue;
          results[cell.key] = { 
            status: isCorrect ? 'correct' : 'incorrect', 
            isCorrect, 
            correctValue: cell.correctValue,
            userValue: parseInt(userValue, 10)
          };
          if (isCorrect) correctCount++;
          else incorrectCount++;
        }
      });
      
      setPracticeValidation(results);
      
      const allCorrect = correctCount === cells.length && emptyCount === 0;
      if (allCorrect && !practiceComplete) {
        setPracticeComplete(true);
        if (onPracticeComplete) onPracticeComplete();
      }
      
      if (onPracticeValidate) {
        onPracticeValidate({
          allCorrect,
          totalCells: cells.length,
          correctCells: correctCount,
          incorrectCells: incorrectCount,
          emptyCells: emptyCount,
          results
        });
      }
      
      return { allCorrect, results };
    }, [generatePracticeCells, practiceValues, practiceComplete, onPracticeComplete, onPracticeValidate]);
    
    /**
     * Handle practice value change
     */
    const handlePracticeValueChange = React.useCallback((key, value) => {
      const numValue = parseInt(value, 10);
      
      if (isNaN(numValue) || value === '') {
        setPracticeValues(prev => {
          const newValues = { ...prev };
          delete newValues[key];
          return newValues;
        });
        // Clear validation for this cell
        setPracticeValidation(prev => {
          const newValidation = { ...prev };
          delete newValidation[key];
          return newValidation;
        });
        return;
      }
      
      if (numValue < 0 || numValue > 9) return;
      
      setPracticeValues(prev => ({ ...prev, [key]: numValue }));
      
      // Real-time validation if enabled
      if (practiceConfig.validateOnChange) {
        const cells = generatePracticeCells();
        const cell = cells.find(c => c.key === key);
        if (cell) {
          const isCorrect = numValue === cell.correctValue;
          setPracticeValidation(prev => ({
            ...prev,
            [key]: { status: isCorrect ? 'correct' : 'incorrect', isCorrect, correctValue: cell.correctValue, userValue: numValue }
          }));
        }
      }
    }, [practiceConfig.validateOnChange, generatePracticeCells]);
    
    /**
     * Reset practice mode
     */
    const resetPractice = React.useCallback(() => {
      setPracticeValues({});
      setPracticeValidation({});
      setPracticeComplete(false);
    }, []);

    // ===== GUIDED MODE FUNCTIONS =====
    
    /**
     * Generate guided steps for step-by-step multiplication
     */
    const generateGuidedSteps = React.useCallback(() => {
      const steps = [];
      const multiplierDigits = data.multiplierDigits;
      const multiplicandDigits = data.multiplicandDigits;
      
      // For each multiplier digit (right to left)
      multiplierDigits.slice().reverse().forEach((multiplierDigit, ppIndex) => {
        const shift = ppIndex;
        let carry = 0;
        
        // For each multiplicand digit (right to left)
        for (let i = multiplicandDigits.length - 1; i >= 0; i--) {
          const multiplicandDigit = multiplicandDigits[i];
          const product = multiplicandDigit * multiplierDigit + carry;
          const resultDigit = product % 10;
          const newCarry = Math.floor(product / 10);
          
          // Determine the column position
          const colIdx = i + shift;
          
          // Add step for this calculation
          steps.push({
            type: 'partial',
            key: `partial-${ppIndex}-${colIdx}`,
            row: ppIndex,
            col: colIdx,
            correctValue: resultDigit,
            hint: `${multiplicandDigit} × ${multiplierDigit}${carry > 0 ? ` + ${carry}` : ''} = ${product}`,
            hintDetail: `Write ${resultDigit}${newCarry > 0 ? `, carry ${newCarry}` : ''}`,
            multiplicandDigit,
            multiplierDigit,
            carry,
            product
          });
          
          // Add carry step if there's a carry
          if (newCarry > 0 && i > 0) {
            steps.push({
              type: 'carry',
              key: `carry-${ppIndex}-${i - 1 + shift}`,
              row: ppIndex,
              col: i - 1 + shift,
              correctValue: newCarry,
              hint: `Carry ${newCarry} to the next column`,
              isCarry: true
            });
          }
          
          carry = newCarry;
        }
        
        // Handle final carry if present
        if (carry > 0) {
          steps.push({
            type: 'partial',
            key: `partial-${ppIndex}-${shift}`,
            row: ppIndex,
            col: shift,
            correctValue: carry,
            hint: `Write the final carry ${carry}`,
            isFinalCarry: true
          });
        }
      });
      
      // Add sum steps if there are multiple partial products
      if (multiplierDigits.length > 1) {
        for (let i = data.sumDigits.length - 1; i >= 0; i--) {
          steps.push({
            type: 'sum',
            key: `sum-0-${i}`,
            row: 0,
            col: i,
            correctValue: data.sumDigits[i],
            hint: `Add the column to get ${data.sumDigits[i]}`,
            isSum: true
          });
        }
      }
      
      return steps;
    }, [data]);
    
    /**
     * Get current guided step
     */
    const getCurrentGuidedStep = React.useCallback(() => {
      if (guidedSteps.length === 0) return null;
      return guidedSteps[guidedStepIndex] || null;
    }, [guidedSteps, guidedStepIndex]);
    
    /**
     * Handle guided value input
     */
    const handleGuidedValueChange = React.useCallback((value) => {
      const currentStep = getCurrentGuidedStep();
      if (!currentStep) return;
      
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < 0 || numValue > 9) return;
      
      setGuidedValues(prev => ({ ...prev, [currentStep.key]: numValue }));
      
      // Validate immediately
      const isCorrect = numValue === currentStep.correctValue;
      setGuidedValidation(prev => ({
        ...prev,
        [currentStep.key]: { isCorrect, correctValue: currentStep.correctValue, userValue: numValue }
      }));
      
      if (isCorrect) {
        if (onStepComplete) {
          onStepComplete({
            stepIndex: guidedStepIndex,
            totalSteps: guidedSteps.length,
            step: currentStep
          });
        }
        
        // Auto-advance if enabled
        if (guidedConfig.autoAdvance) {
          setTimeout(() => {
            if (guidedStepIndex < guidedSteps.length - 1) {
              setGuidedStepIndex(prev => prev + 1);
            } else {
              setGuidedComplete(true);
              if (onGuidedComplete) onGuidedComplete();
            }
          }, 500);
        }
      }
    }, [getCurrentGuidedStep, guidedStepIndex, guidedSteps.length, guidedConfig.autoAdvance, onStepComplete, onGuidedComplete]);
    
    /**
     * Advance to next guided step manually
     */
    const advanceGuidedStep = React.useCallback(() => {
      if (guidedStepIndex < guidedSteps.length - 1) {
        setGuidedStepIndex(prev => prev + 1);
      } else {
        setGuidedComplete(true);
        if (onGuidedComplete) onGuidedComplete();
      }
    }, [guidedStepIndex, guidedSteps.length, onGuidedComplete]);
    
    /**
     * Skip current guided step
     */
    const skipGuidedStep = React.useCallback(() => {
      if (!guidedConfig.allowSkip) return;
      const currentStep = getCurrentGuidedStep();
      if (currentStep) {
        setGuidedValues(prev => ({ ...prev, [currentStep.key]: currentStep.correctValue }));
        setGuidedValidation(prev => ({
          ...prev,
          [currentStep.key]: { isCorrect: true, correctValue: currentStep.correctValue, userValue: currentStep.correctValue, skipped: true }
        }));
        advanceGuidedStep();
      }
    }, [guidedConfig.allowSkip, getCurrentGuidedStep, advanceGuidedStep]);
    
    /**
     * Reset guided mode
     */
    const resetGuided = React.useCallback(() => {
      setGuidedStepIndex(0);
      setGuidedComplete(false);
      setGuidedValues({});
      setGuidedValidation({});
    }, []);

    // ===== ANIMATION MODE FUNCTIONS =====
    
    /**
     * Generate animation steps
     */
    const generateAnimationSteps = React.useCallback(() => {
      const steps = [];
      const multiplierDigits = data.multiplierDigits;
      const multiplicandDigits = data.multiplicandDigits;
      const isSingleDigitMultiplier = multiplierDigits.length === 1;
      
      // Step 0: Show multiplicand
      steps.push({
        type: 'show',
        cells: multiplicandDigits.map((d, i) => ({ key: `multiplicand-0-${i}`, value: d })),
        description: `Show multiplicand: ${multiplicand}`
      });
      
      // Step 1: Show multiplier
      steps.push({
        type: 'show',
        cells: multiplierDigits.map((d, i) => ({ key: `multiplier-0-${i}`, value: d })),
        description: `Show multiplier: ${multiplier}`
      });
      
      // For single-digit multiplier, results go directly to sum row
      // For multi-digit multiplier, results go to partial product rows first
      
      if (isSingleDigitMultiplier) {
        // Single digit multiplier - calculate and show directly in sum row
        // But still show carries in the carry row above
        const multiplierDigit = multiplierDigits[0];
        let carry = 0;
        
        // Process from right to left
        for (let i = multiplicandDigits.length - 1; i >= 0; i--) {
          const multiplicandDigit = multiplicandDigits[i];
          const product = multiplicandDigit * multiplierDigit + carry;
          const resultDigit = product % 10;
          const newCarry = Math.floor(product / 10);
          
          // Highlight multiplicand and multiplier digits
          steps.push({
            type: 'highlight',
            cells: [
              { key: `multiplicand-0-${i}`, value: multiplicandDigit },
              { key: `multiplier-0-0`, value: multiplierDigit }
            ],
            description: `Multiply ${multiplicandDigit} × ${multiplierDigit}${carry > 0 ? ` + ${carry}` : ''} = ${product}`
          });
          
          // Show result digit in sum row (for single digit multiplier)
          steps.push({
            type: 'show',
            cells: [{ key: `sum-0-${i}`, value: resultDigit }],
            description: `Write ${resultDigit}`
          });
          
          // Show carry if present - display in carry row
          if (newCarry > 0 && i > 0) {
            // Calculate carry position (shifted left by 1)
            const carryCol = i - 1;
            if (carryCol >= 0) {
              // First show the carry cell
              steps.push({
                type: 'show',
                cells: [{ key: `carry-0-${carryCol}`, value: newCarry }],
                description: `Carry ${newCarry}`
              });
            }
          }
          
          carry = newCarry;
        }
        
        // Final carry becomes leftmost digit in sum row
        if (carry > 0) {
          steps.push({
            type: 'show',
            cells: [{ key: `sum-0-0`, value: carry }],
            description: `Write final carry ${carry}`
          });
        }
      } else {
        // Multi-digit multiplier - use partial product rows
        multiplierDigits.slice().reverse().forEach((multiplierDigit, ppIndex) => {
          const shift = ppIndex;
          let carry = 0;
          
          // For each multiplicand digit
          for (let i = multiplicandDigits.length - 1; i >= 0; i--) {
            const multiplicandDigit = multiplicandDigits[i];
            const product = multiplicandDigit * multiplierDigit + carry;
            const resultDigit = product % 10;
            const newCarry = Math.floor(product / 10);
            const colIdx = i + shift;
            
            // Highlight multiplicand and multiplier digits
            steps.push({
              type: 'highlight',
              cells: [
                { key: `multiplicand-0-${i}`, value: multiplicandDigit },
                { key: `multiplier-0-${multiplierDigits.length - 1 - ppIndex}`, value: multiplierDigit }
              ],
              description: `Multiply ${multiplicandDigit} × ${multiplierDigit}${carry > 0 ? ` + ${carry}` : ''} = ${product}`
            });
            
            // Show result digit in partial product row
            steps.push({
              type: 'show',
              cells: [{ key: `partial-${ppIndex}-${colIdx}`, value: resultDigit }],
              description: `Write ${resultDigit}`
            });
            
            // Show carry if present
            if (newCarry > 0 && i > 0) {
              steps.push({
                type: 'carry',
                from: { key: `partial-${ppIndex}-${colIdx}`, value: resultDigit },
                to: { key: `carry-${ppIndex}-${i - 1 + shift}`, value: newCarry },
                description: `Carry ${newCarry}`
              });
            }
            
            carry = newCarry;
          }
          
          // Final carry
          if (carry > 0) {
            steps.push({
              type: 'show',
              cells: [{ key: `partial-${ppIndex}-${shift}`, value: carry }],
              description: `Write final carry ${carry}`
            });
          }
        });
        
        // Sum steps for multi-digit multiplier
        steps.push({
          type: 'highlight',
          cells: data.partialProducts.flatMap((pp, rowIdx) => 
            pp.map((d, colIdx) => d !== null ? { key: `partial-${rowIdx}-${colIdx}`, value: d } : null).filter(Boolean)
          ),
          description: 'Add all partial products'
        });
        
        for (let i = data.sumDigits.length - 1; i >= 0; i--) {
          steps.push({
            type: 'show',
            cells: [{ key: `sum-0-${i}`, value: data.sumDigits[i] }],
            description: `Sum column ${data.sumDigits.length - i}: ${data.sumDigits[i]}`
          });
        }
      }
      
      // Final step: show complete
      steps.push({
        type: 'complete',
        description: `${multiplicand} × ${multiplier} = ${data.finalAnswer}`
      });
      
      return steps;
    }, [data, multiplicand, multiplier]);
    
    /**
     * Play animation step
     */
    const playAnimationStep = React.useCallback((stepIndex) => {
      if (stepIndex >= animationSteps.length) {
        setAnimationComplete(true);
        setAnimationPlaying(false);
        setHighlightedCell(null);
        if (onAnimationComplete) onAnimationComplete();
        return;
      }
      
      const step = animationSteps[stepIndex];
      
      if (onAnimationStep) {
        onAnimationStep(stepIndex, animationSteps.length);
      }
      
      // Handle different step types
      if (step.type === 'show') {
        step.cells.forEach(cell => {
          setVisibleCells(prev => new Set([...prev, cell.key]));
        });
        setHighlightedCell(step.cells[step.cells.length - 1]?.key || null);
      } else if (step.type === 'highlight') {
        setHighlightedCell(step.cells[0]?.key || null);
      } else if (step.type === 'carry') {
        setFlyingCarry(step);
        setVisibleCells(prev => new Set([...prev, step.to.key]));
        setTimeout(() => setFlyingCarry(null), animationConfig.highlightDuration);
      } else if (step.type === 'complete') {
        setHighlightedCell(null);
      }
      
      setAnimationStepIndex(stepIndex);
    }, [animationSteps, animationConfig.highlightDuration, onAnimationStep, onAnimationComplete]);
    
    /**
     * Start/resume animation
     */
    const playAnimation = React.useCallback(() => {
      if (animationComplete) {
        // Reset and play from beginning
        setAnimationStepIndex(0);
        setVisibleCells(new Set());
        setAnimationComplete(false);
      }
      setAnimationPlaying(true);
    }, [animationComplete]);
    
    /**
     * Pause animation
     */
    const pauseAnimation = React.useCallback(() => {
      setAnimationPlaying(false);
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    }, []);
    
    /**
     * Step forward in animation
     */
    const stepForwardAnimation = React.useCallback(() => {
      if (animationStepIndex < animationSteps.length - 1) {
        playAnimationStep(animationStepIndex + 1);
      }
    }, [animationStepIndex, animationSteps.length, playAnimationStep]);
    
    /**
     * Step backward in animation
     */
    const stepBackwardAnimation = React.useCallback(() => {
      if (animationStepIndex > 0) {
        // Rebuild visible cells up to previous step
        const newVisibleCells = new Set();
        for (let i = 0; i < animationStepIndex; i++) {
          const step = animationSteps[i];
          if (step.type === 'show' || step.type === 'carry') {
            step.cells?.forEach(cell => newVisibleCells.add(cell.key));
            if (step.to) newVisibleCells.add(step.to.key);
          }
        }
        setVisibleCells(newVisibleCells);
        setAnimationStepIndex(animationStepIndex - 1);
        setHighlightedCell(null);
      }
    }, [animationStepIndex, animationSteps]);
    
    /**
     * Reset animation
     */
    const resetAnimation = React.useCallback(() => {
      pauseAnimation();
      setAnimationStepIndex(0);
      setVisibleCells(new Set());
      setAnimationComplete(false);
      setHighlightedCell(null);
      setFlyingCarry(null);
    }, [pauseAnimation]);
    
    // Animation playback effect
    React.useEffect(() => {
      if (mode === 'animation' && animationPlaying && !animationComplete) {
        animationTimerRef.current = setTimeout(() => {
          playAnimationStep(animationStepIndex + 1);
        }, animationConfig.speed);
        
        return () => {
          if (animationTimerRef.current) {
            clearTimeout(animationTimerRef.current);
          }
        };
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, animationPlaying, animationComplete, animationStepIndex, animationConfig.speed]);
    
    // Initialize guided steps - only when mode or multiplicand/multiplier changes
    React.useEffect(() => {
      if (mode === 'guided') {
        const steps = generateGuidedSteps();
        setGuidedSteps(steps);
        console.log('🎯 [Guided Mode] Generated steps:', steps.length);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, multiplicand, multiplier]);
    
    // Initialize animation steps - only when mode or multiplicand/multiplier changes
    React.useEffect(() => {
      if (mode === 'animation') {
        const steps = generateAnimationSteps();
        setAnimationSteps(steps);
        console.log('🎬 [Animation Mode] Generated steps:', steps.length);
        
        // Auto-play if configured
        if (animationConfig.autoPlay) {
          setTimeout(() => {
            playAnimationStep(0);
            setAnimationPlaying(true);
          }, 500);
        }
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, multiplicand, multiplier, animationConfig.autoPlay]);

    // ===== DRAGDROP MODE FUNCTIONS =====
    
    /**
     * Generate editable cells for dragDrop mode
     */
    const generateDragDropCells = React.useCallback(() => {
      const cells = [];
      const editableTypes = dragDropConfig.editableTypes || ['partial', 'sum', 'carry'];
      
      // Add carry cells if editable
      if (editableTypes.includes('carry') && showCarries) {
        data.partialProductCarries.slice().reverse().forEach((carries, carryRowIdx) => {
          const paddedCarries = new Array(data.totalColumns).fill(null);
          carries.forEach((carry, idx) => {
            if (carry > 0 && carry !== null) {
              const basePosition = data.totalColumns - carries.length + idx;
              const shiftedPosition = basePosition - 1;
              if (shiftedPosition >= 0) {
                paddedCarries[shiftedPosition] = carry;
              }
            }
          });
          paddedCarries.forEach((val, colIdx) => {
            if (val !== null) {
              cells.push({
                key: `carry-${carryRowIdx}-${colIdx}`,
                type: 'carry',
                row: carryRowIdx,
                col: colIdx,
                correctValue: val
              });
            }
          });
        });
      }
      
      // Add partial product cells if editable
      if (editableTypes.includes('partial') && data.multiplierDigits.length > 1) {
        data.partialProducts.forEach((pp, rowIdx) => {
          pp.forEach((digit, colIdx) => {
            if (digit !== null) {
              cells.push({
                key: `partial-${rowIdx}-${colIdx}`,
                type: 'partial',
                row: rowIdx,
                col: colIdx,
                correctValue: digit
              });
            }
          });
        });
      }
      
      // Add sum cells if editable
      if (editableTypes.includes('sum')) {
        data.sumDigits.forEach((digit, colIdx) => {
          if (digit !== null) {
            cells.push({
              key: `sum-0-${colIdx}`,
              type: 'sum',
              row: 0,
              col: colIdx,
              correctValue: digit
            });
          }
        });
      }
      
      return cells;
    }, [data, dragDropConfig.editableTypes, showCarries]);
    
    /**
     * Get dragDrop cell keys
     */
    const getDragDropCellKeys = React.useCallback(() => {
      return generateDragDropCells().map(cell => cell.key);
    }, [generateDragDropCells]);
    
    // Update dragDrop cell keys ref when mode or data changes
    React.useEffect(() => {
      if (mode === 'dragDrop') {
        dragDropCellKeysRef.current = getDragDropCellKeys();
      }
    }, [mode, getDragDropCellKeys]);
    
    /**
     * Handle drag start for digit tile
     */
    const handleDragStart = React.useCallback((digit, e) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      
      setDraggedDigit(digit);
      setDragStartPos({
        x: e.clientX || e.touches?.[0]?.clientX || 0,
        y: e.clientY || e.touches?.[0]?.clientY || 0
      });
      setDragPosition({
        x: e.clientX || e.touches?.[0]?.clientX || 0,
        y: e.clientY || e.touches?.[0]?.clientY || 0
      });
      setIsDragging(true);
      
      // Store element reference for positioning
      if (e.currentTarget) {
        dragElementRef.current = e.currentTarget;
      }
    }, []);
    
    /**
     * Handle drag move
     */
    const handleDragMove = React.useCallback((e) => {
      if (!isDragging || draggedDigit === null) return;
      
      const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
      const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
      
      setDragPosition({ x: clientX, y: clientY });
      
      // Check which cell is being dragged over
      const elementBelow = document.elementFromPoint(clientX, clientY);
      if (elementBelow) {
        const cellElement = elementBelow.closest('.mult-cell-dragdrop');
        if (cellElement) {
          const cellKey = cellElement.dataset.cellKey;
          if (cellKey) {
            setDragOverCell(cellKey);
          }
        } else {
          setDragOverCell(null);
        }
      }
    }, [isDragging, draggedDigit]);
    
    /**
     * Handle drag end / drop
     */
    const handleDragEnd = React.useCallback((e) => {
      if (!isDragging || draggedDigit === null) return;
      
      const clientX = e.clientX || e.changedTouches?.[0]?.clientX || 0;
      const clientY = e.clientY || e.changedTouches?.[0]?.clientY || 0;
      
      // Find the cell being dropped on
      const elementBelow = document.elementFromPoint(clientX, clientY);
      if (elementBelow) {
        const cellElement = elementBelow.closest('.mult-cell-dragdrop');
        if (cellElement) {
          const cellKey = cellElement.dataset.cellKey;
          if (cellKey && dragDropCellKeysRef.current.includes(cellKey)) {
            // Drop the digit
            handleDragDrop(cellKey, draggedDigit);
          }
        }
      }
      
      // Reset drag state
      setIsDragging(false);
      setDraggedDigit(null);
      setDragOverCell(null);
      setDragPosition({ x: 0, y: 0 });
      dragElementRef.current = null;
    }, [isDragging, draggedDigit, getDragDropCellKeys]);
    
    /**
     * Handle drop on cell
     */
    const handleDragDrop = React.useCallback((cellKey, digit) => {
      const cells = generateDragDropCells();
      const cell = cells.find(c => c.key === cellKey);
      
      if (!cell) return;
      
      // Update value
      setDragDropValues(prev => {
        const newValues = { ...prev, [cellKey]: digit };
        
        // Validate if configured
        if (dragDropConfig.validateOnDrop) {
          const isCorrect = digit === cell.correctValue;
          
          setDragDropValidation(prevValidation => {
            const newValidation = {
              ...prevValidation,
              [cellKey]: { isCorrect, correctValue: cell.correctValue, userValue: digit }
            };
            
            // Check completion
            const allCells = generateDragDropCells();
            const allCorrect = allCells.every(c => {
              const value = newValues[c.key];
              const validation = newValidation[c.key];
              return value !== undefined && validation?.isCorrect === true;
            });
            
            if (allCorrect) {
              setDragDropComplete(true);
              if (onDragDropComplete) onDragDropComplete();
            }
            
            return newValidation;
          });
          
          if (onDragDropValidate) {
            onDragDropValidate(cellKey, isCorrect, cell.correctValue, digit);
          }
        }
        
        return newValues;
      });
    }, [generateDragDropCells, dragDropConfig.validateOnDrop, onDragDropComplete, onDragDropValidate]);
    
    /**
     * Validate all dragDrop cells
     */
    const validateDragDrop = React.useCallback(() => {
      const cells = generateDragDropCells();
      const results = {};
      let correctCount = 0;
      let incorrectCount = 0;
      let emptyCount = 0;
      
      cells.forEach(cell => {
        const userValue = dragDropValues[cell.key];
        if (userValue === undefined) {
          results[cell.key] = { status: 'empty', isCorrect: false, correctValue: cell.correctValue };
          emptyCount++;
        } else {
          const isCorrect = userValue === cell.correctValue;
          results[cell.key] = { 
            status: isCorrect ? 'correct' : 'incorrect', 
            isCorrect, 
            correctValue: cell.correctValue,
            userValue
          };
          if (isCorrect) correctCount++;
          else incorrectCount++;
        }
      });
      
      setDragDropValidation(results);
      
      const allCorrect = correctCount === cells.length && emptyCount === 0;
      if (allCorrect && !dragDropComplete) {
        setDragDropComplete(true);
        if (onDragDropComplete) onDragDropComplete();
      }
      
      return { allCorrect, results, correctCount, incorrectCount, emptyCount };
    }, [generateDragDropCells, dragDropValues, dragDropComplete, onDragDropComplete]);
    
    /**
     * Reset dragDrop mode
     */
    const resetDragDrop = React.useCallback(() => {
      setDragDropValues({});
      setDragDropValidation({});
      setDragDropComplete(false);
      setIsDragging(false);
      setDraggedDigit(null);
      setDragOverCell(null);
    }, []);
    
    // Global drag event listeners
    React.useEffect(() => {
      if (mode === 'dragDrop' && isDragging) {
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('touchmove', handleDragMove, { passive: false });
        window.addEventListener('touchend', handleDragEnd);
        
        return () => {
          window.removeEventListener('mousemove', handleDragMove);
          window.removeEventListener('mouseup', handleDragEnd);
          window.removeEventListener('touchmove', handleDragMove);
          window.removeEventListener('touchend', handleDragEnd);
        };
      }
    }, [mode, isDragging, handleDragMove, handleDragEnd]);
    
    // Initialize global theme state on mount - only for spotIncorrect mode
    React.useEffect(() => {
      if (mode === 'spotIncorrect') {
        window.multiplicationGridCurrentTheme = currentTheme;
        console.log('🎨 [MultiplicationGrid] Global theme state initialized to:', currentTheme);
      }
    }, [currentTheme, mode]);
    
    // Cleanup global state on unmount
    React.useEffect(() => {
      return () => {
        console.log('🧹 [MultiplicationGrid] Component unmounting, clearing global state');
        // Clear global state when component unmounts
        window.multiplicationGridAllCorrect = null;
        window.multiplicationGridCurrentTheme = null;
        window.multiplicationGridFeedbackState = null;
        window.multiplicationGridSelectedCells = null;
        window.multiplicationGridCheckResult = null;
        window.multiplicationGridTotalIncorrectCells = null;
      };
    }, []);
    
    // Note: Removed problematic sync effect that was overriding global state
    // The global state is now managed directly in handleCheck and handleReset
    
    /**
     * Get cell key for tracking
     */
    const getCellKey = (type, row, col) => `${type}-${row}-${col}`;
    
    /**
     * Handle user input
     */
    const handleInput = React.useCallback((type, row, col, value) => {
      const key = getCellKey(type, row, col);
      const numValue = parseInt(value, 10);
      
      if (isNaN(numValue) || value === '') {
        const newInputs = { ...userInputs };
        delete newInputs[key];
        setUserInputs(newInputs);
        return;
      }
      
      // Get correct value for validation
      let correctValue;
      if (type === 'partial-carry') {
        correctValue = data.partialProductCarries[row][col];
      } else if (type === 'partial') {
        correctValue = data.partialProducts[row][col];
      } else if (type === 'sum-carry') {
        correctValue = data.sumCarries[col];
      } else if (type === 'sum') {
        correctValue = data.sumDigits[col];
      }
      
      // Update inputs
      setUserInputs(prev => ({ ...prev, [key]: numValue }));
      
      // Validate
      if (numValue === correctValue) {
        setCompletedSteps(prev => new Set([...prev, key]));
        setIncorrectCells(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        
        // Check if all completed
        checkCompletion();
      } else {
        setIncorrectCells(prev => new Set([...prev, key]));
      }
    }, [userInputs, data]);
    
    /**
     * Check if multiplication is complete
     */
    const checkCompletion = React.useCallback(() => {
      // Count required cells
      let requiredCells = 0;
      let filledCorrectly = 0;
      
      // Partial products
      data.partialProducts.forEach((pp, rowIdx) => {
        pp.forEach((digit, colIdx) => {
          requiredCells++;
          const key = getCellKey('partial', rowIdx, colIdx);
          if (completedSteps.has(key)) filledCorrectly++;
        });
      });
      
      // Sum
      data.sumDigits.forEach((digit, colIdx) => {
        requiredCells++;
        const key = getCellKey('sum', 0, colIdx);
        if (completedSteps.has(key)) filledCorrectly++;
      });
      
      if (filledCorrectly === requiredCells && onComplete) {
        setTimeout(() => onComplete(), 300);
      }
    }, [completedSteps, data, onComplete]);
    
    /**
     * Handle input value change for input mode
     */
    const handleInputValueChange = React.useCallback((key, value) => {
      const numValue = parseInt(value, 10);
      
      if (isNaN(numValue) || value === '') {
        // Clear the input
        setInputValues(prev => {
          const newValues = { ...prev };
          delete newValues[key];
          return newValues;
        });
        setInputValidation(prev => {
          const newValidation = { ...prev };
          delete newValidation[key];
          return newValidation;
        });
        return;
      }
      
      // Validate single digit
      if (numValue < 0 || numValue > 9) {
        return; // Invalid input, ignore
      }
      
      // Update input value (no validation yet - that happens on check)
      setInputValues(prev => ({
        ...prev,
        [key]: numValue
      }));
      
      // Reset check performed state when new value is entered after check
      if (checkPerformed) {
        setCheckPerformed(false);
        window.multiplicationGridInputAllCorrect = false; // Re-enable number pad when new values are entered
        // Clear validation state when user starts editing
        setInputValidation(prev => {
          const newValidation = { ...prev };
          delete newValidation[key];
          return newValidation;
        });
      }
      
      // Call input change callback (without validation)
      if (onInputChange) {
        onInputChange(key, numValue, null, null);
      }
    }, [data, onInputChange, onInputValidation, inputCells, focusedCell]);

    /**
     * Get the correct value for a given cell key
     */
    const getCorrectValueForCell = React.useCallback((key) => {
      const [type, rowStr, colStr] = key.split('-');
      const row = parseInt(rowStr, 10);
      const col = parseInt(colStr, 10);
      
      if (type === 'carry') {
        // Find the correct carry value from the padded carries
        const paddedCarries = new Array(data.totalColumns).fill(null);
        const carryRow = data.partialProductCarries[data.partialProductCarries.length - 1 - row];
        carryRow.forEach((carry, idx) => {
          if (carry > 0 && carry !== null) {
            const basePosition = data.totalColumns - carryRow.length + idx;
            const shiftedPosition = basePosition - 1;
            if (shiftedPosition >= 0) {
              paddedCarries[shiftedPosition] = carry;
            }
          }
        });
        return paddedCarries[col];
      } else if (type === 'multiplicand') {
        return data.multiplicandDigits[col];
      } else if (type === 'multiplier') {
        return data.multiplierDigits[col];
      } else if (type === 'partial') {
        return data.partialProducts[row][col];
      } else if (type === 'sum') {
        return data.sumDigits[col];
      }
      
      return null;
    }, [data]);

    /**
     * Handle number pad input for focused cell
     */
    const handleNumberPadInput = React.useCallback((number) => {
      if (focusedCell && inputCells.includes(focusedCell)) {
        console.log('🔢 [NumberPad Input] Updating focused cell:', { focusedCell, number });
        // Clear previous feedback and validation when user starts typing new input
        if (checkPerformed) {
          if (typeof window !== 'undefined' && window.updateNumberPadFeedback) {
            window.updateNumberPadFeedback('', 'default');
          }
        }
        handleInputValueChange(focusedCell, number.toString());
      } else {
        console.log('⚠️ [NumberPad Input] No focused cell or cell not in inputCells:', { focusedCell, inputCells });
      }
    }, [focusedCell, inputCells, handleInputValueChange, checkPerformed]);

    /**
     * Handle backspace for focused cell - clears the cell value
     */
    const handleNumberPadBackspace = React.useCallback(() => {
      if (focusedCell && inputCells.includes(focusedCell)) {
        console.log('⌫ [NumberPad Backspace] Clearing focused cell:', { focusedCell });
        handleInputValueChange(focusedCell, '');
      } else {
        console.log('⚠️ [NumberPad Backspace] No focused cell or cell not in inputCells:', { focusedCell, inputCells });
      }
    }, [focusedCell, inputCells, handleInputValueChange]);

    /**
     * Handle clear all - clears all input cell values
     */
    const handleNumberPadClear = React.useCallback(() => {
      console.log('🗑️ [NumberPad Clear] Clearing all input cells');
      inputCells.forEach(cellKey => {
        handleInputValueChange(cellKey, '');
      });
      // Reset check state
      setCheckPerformed(false);
      window.multiplicationGridFeedbackState = 'default';
    }, [inputCells, handleInputValueChange]);

    /**
     * Check the currently focused input cell and provide feedback
     */
    const checkInputs = React.useCallback(() => {
      console.log('🔍 [Check Inputs] Starting validation for focused cell...');
      
      // Check if there's a focused cell
      if (!focusedCell || !inputCells.includes(focusedCell)) {
        console.log('⚠️ [Check Inputs] No focused cell to check');
        if (typeof window !== 'undefined' && window.updateNumberPadFeedback) {
          window.updateNumberPadFeedback('Please click on a cell to enter a digit.', 'incorrect');
        }
        return false;
      }
      
      // Check if the focused cell has a value
      const userValue = inputValues[focusedCell];
      if (userValue === undefined || userValue === '?' || userValue === '') {
        console.log('❌ [Check Inputs] Focused cell is empty:', focusedCell);
        if (typeof window !== 'undefined' && window.updateNumberPadFeedback) {
          window.updateNumberPadFeedback('Please enter a digit first.', 'incorrect');
        }
        return false;
      }
      
      // Validate only the focused cell
      const correctValue = getCorrectValueForCell(focusedCell);
      const isCorrect = userValue === correctValue;
      
      console.log(`🔍 [Check Inputs] Cell ${focusedCell}: user=${userValue}, correct=${correctValue}, isCorrect=${isCorrect}`);
      
      // Create updated validation state including current cell
      const updatedValidation = {
        ...inputValidation,
        [focusedCell]: {
          isCorrect,
          correctValue,
          userValue
        }
      };
      
      // Update validation state for this cell only
      setInputValidation(updatedValidation);
      
      // Mark that check has been performed (this will enable validation colors)
      setCheckPerformed(true);
      
      // Call validation callback for this cell
      if (onInputValidation) {
        onInputValidation(focusedCell, isCorrect, correctValue, userValue);
      }
      
      // Provide feedback and handle auto-advance
      if (isCorrect) {
        console.log('✅ [Check Inputs] Correct answer!');
        window.multiplicationGridFeedbackState = 'correct';
        
        // Auto-advance focus to next cell (leftward, since we enter right-to-left)
        const currentIndex = inputCells.indexOf(focusedCell);
        
        // Check if all input cells are correct (using updated validation state)
        const allCellsCorrect = inputCells.every(cellKey => {
          const validation = cellKey === focusedCell 
            ? { isCorrect, correctValue, userValue } // Use current validation
            : updatedValidation[cellKey]; // Use existing validation
          return validation && validation.isCorrect === true;
        });
        
        console.log('🔍 [Check Inputs] Checking completion:', {
          currentIndex,
          totalCells: inputCells.length,
          allCellsCorrect,
          validations: inputCells.map(key => ({
            key,
            validated: !!updatedValidation[key],
            isCorrect: updatedValidation[key]?.isCorrect
          }))
        });
        
        if (currentIndex > 0) {
          // Not the last cell - move to next
          if (typeof window !== 'undefined' && window.updateNumberPadFeedback) {
            window.updateNumberPadFeedback('Correct! Moving to the next digit.', 'correct');
          }
          
          // Move to the previous cell (leftward)
          const nextCell = inputCells[currentIndex - 1];
          setTimeout(() => {
            setFocusedCell(nextCell);
            window.multiplicationGridFocusedCell = nextCell;
            console.log('➡️ [MultiplicationGrid] Correct answer confirmed, moving focus to next cell:', nextCell);
            // Clear feedback after a moment to prepare for next input
            setTimeout(() => {
              if (typeof window !== 'undefined' && window.updateNumberPadFeedback) {
                window.updateNumberPadFeedback('', 'default');
              }
            }, 1500);
          }, 500); // Delay for visual feedback
        } else {
          // Last cell completed
          console.log('🎉 [Check Inputs] Last cell completed!');
          
          if (typeof window !== 'undefined' && window.updateNumberPadFeedback) {
            window.updateNumberPadFeedback('Excellent! All digits are correct!', 'correct');
          }
        }
        
        // If all cells are correct, disable number pad and dispatch event
        if (allCellsCorrect) {
          console.log('✅ [Check Inputs] All input cells are correct! Disabling number pad and dispatching quizCompleted event.');
          
          // Disable the number pad
          if (typeof window !== 'undefined') {
            window.multiplicationGridInputAllCorrect = true;
            window.multiplicationGridNumberPadDisabled = true;
            console.log('🔒 [MultiplicationGrid] Number pad disabled, flag set to:', window.multiplicationGridNumberPadDisabled);
            
            // Dispatch a custom event to notify number pad to update
            const numberPadDisabledEvent = new CustomEvent('numberPadDisabled', {
              detail: { disabled: true }
            });
            window.dispatchEvent(numberPadDisabledEvent);
            console.log('🔔 [MultiplicationGrid] Dispatched numberPadDisabled event');
            
            // Dispatch quizCompleted event to enable next button
            const quizCompletedEvent = new CustomEvent('quizCompleted', {
              detail: {
                componentId: `multiplication-grid-${multiplicand}-${multiplier}`,
                componentType: 'MultiplicationGrid',
                mode: 'input',
                pageNumber: window.getCurrentPage?.() || null,
                allCorrect: true
              }
            });
            window.dispatchEvent(quizCompletedEvent);
            console.log('✅ [MultiplicationGrid] Dispatched quizCompleted event');
            
            // Update concept summary for page 7 with "12 x 3 = 36"
            const currentPage = window.getCurrentPage?.() || null;
            if (currentPage === 7 || currentPage === '7') {
              const result = multiplicand * multiplier;
              const formulaText = `${multiplicand} × ${multiplier} = ${result}`;
              
              const updateEvent = new CustomEvent('updateConceptSummary', {
                detail: {
                  pageNumber: '7',
                  keyConcepts: [],
                  impFormulae: [{ text: formulaText, color: '#70ACC7' }]
                }
              });
              window.dispatchEvent(updateEvent);
              console.log('✅ [MultiplicationGrid] Dispatched updateConceptSummary event with:', formulaText);
            }
          }
        } else {
          console.log('⚠️ [Check Inputs] Not all cells are correct yet. Some cells may need to be checked again.');
        }
        
        return true;
      } else {
        // Incorrect answer
        console.log('❌ [Check Inputs] Incorrect answer');
        window.multiplicationGridFeedbackState = 'incorrect';
        
        // Provide feedback to number pad
        if (typeof window !== 'undefined' && window.updateNumberPadFeedback) {
          window.updateNumberPadFeedback('Incorrect. Try again!', 'incorrect');
        }
        
        return false;
      }
    }, [inputCells, inputValues, getCorrectValueForCell, focusedCell, onInputValidation, inputValidation, multiplicand, multiplier, setInputValidation]);

    /**
     * Expose check and reset functions globally when in spotIncorrect mode
     */
    React.useEffect(() => {
      if (mode === 'spotIncorrect') {
        window.multiplicationGridCheck = handleCheck;
        window.multiplicationGridReset = handleReset;
        window.multiplicationGridSelectedCells = selectedCells;
        window.multiplicationGridCheckResult = checkResult;
        window.multiplicationGridAllCorrect = allCorrect;
        window.multiplicationGridTotalIncorrectCells = Object.keys(incorrectValues).length;
      } else if (mode === 'input') {
          window.multiplicationGridInputCheck = checkInputMode;
          window.multiplicationGridInputValues = inputValues;
          window.multiplicationGridInputValidation = inputValidation;
          // Only set to false if not already true (don't override successful completion)
          console.log('🔍 [useEffect] Checking global state before setting:', {
            currentValue: window.multiplicationGridInputAllCorrect,
            willSetToFalse: window.multiplicationGridInputAllCorrect !== true
          });
          
          // Use a more robust check - check both the global state and the local state
          const isCurrentlySuccessful = window.multiplicationGridInputAllCorrect === true || 
                                      window.multiplicationGridFeedbackState === 'correct';
          
          if (!isCurrentlySuccessful) {
            window.multiplicationGridInputAllCorrect = false; // Only set to true after check button confirms
            console.log('🔧 [useEffect] Set window.multiplicationGridInputAllCorrect = false');
          } else {
            console.log('✅ [useEffect] Preserving successful state - not setting to false');
          }
          window.multiplicationGridInputCheckResult = window.multiplicationGridInputCheckResult || null;
          window.multiplicationGridNumberPadInput = handleNumberPadInput;
          window.multiplicationGridNumberPadBackspace = handleNumberPadBackspace;
          window.multiplicationGridNumberPadClear = handleNumberPadClear;
          window.multiplicationGridFocusedCell = focusedCell;
          window.multiplicationGridCheckInputs = checkInputs;
        } else if (mode === 'practice') {
          // Expose practice mode functions globally
          window.multiplicationGridPracticeValidate = validatePractice;
          window.multiplicationGridPracticeReset = resetPractice;
          window.multiplicationGridPracticeValues = practiceValues;
          window.multiplicationGridPracticeValidation = practiceValidation;
          window.multiplicationGridPracticeComplete = practiceComplete;
        } else if (mode === 'guided') {
          // Expose guided mode functions globally
          window.multiplicationGridGuidedStep = guidedStepIndex;
          window.multiplicationGridGuidedSteps = guidedSteps;
          window.multiplicationGridGuidedComplete = guidedComplete;
          window.multiplicationGridGuidedAdvance = advanceGuidedStep;
          window.multiplicationGridGuidedSkip = skipGuidedStep;
          window.multiplicationGridGuidedReset = resetGuided;
        } else if (mode === 'animation') {
          // Expose animation mode functions globally
          window.multiplicationGridAnimationPlay = playAnimation;
          window.multiplicationGridAnimationPause = pauseAnimation;
          window.multiplicationGridAnimationStepForward = stepForwardAnimation;
          window.multiplicationGridAnimationStepBackward = stepBackwardAnimation;
          window.multiplicationGridAnimationReset = resetAnimation;
          window.multiplicationGridAnimationStep = animationStepIndex;
          window.multiplicationGridAnimationPlaying = animationPlaying;
          window.multiplicationGridAnimationComplete = animationComplete;
        } else if (mode === 'dragDrop') {
          // Expose dragDrop mode functions globally
          window.multiplicationGridDragDropValidate = validateDragDrop;
          window.multiplicationGridDragDropReset = resetDragDrop;
          window.multiplicationGridDragDropValues = dragDropValues;
          window.multiplicationGridDragDropValidation = dragDropValidation;
          window.multiplicationGridDragDropComplete = dragDropComplete;
        }
      return () => {
        if (mode === 'spotIncorrect') {
          window.multiplicationGridCheck = null;
          window.multiplicationGridReset = null;
          window.multiplicationGridSelectedCells = null;
          window.multiplicationGridCheckResult = null;
          window.multiplicationGridAllCorrect = null;
          window.multiplicationGridTotalIncorrectCells = null;
        } else if (mode === 'input') {
          window.multiplicationGridInputCheck = null;
          window.multiplicationGridInputValues = null;
          window.multiplicationGridInputValidation = null;
          // Don't reset successful completion state during cleanup
          if (window.multiplicationGridInputAllCorrect !== true) {
            window.multiplicationGridInputAllCorrect = null;
          }
          window.multiplicationGridInputCheckResult = null;
          window.multiplicationGridNumberPadInput = null;
          window.multiplicationGridNumberPadBackspace = null;
          window.multiplicationGridNumberPadClear = null;
          window.multiplicationGridFocusedCell = null;
          window.multiplicationGridCheckInputs = null;
        } else if (mode === 'practice') {
          window.multiplicationGridPracticeValidate = null;
          window.multiplicationGridPracticeReset = null;
          window.multiplicationGridPracticeValues = null;
          window.multiplicationGridPracticeValidation = null;
          window.multiplicationGridPracticeComplete = null;
        } else if (mode === 'guided') {
          window.multiplicationGridGuidedStep = null;
          window.multiplicationGridGuidedSteps = null;
          window.multiplicationGridGuidedComplete = null;
          window.multiplicationGridGuidedAdvance = null;
          window.multiplicationGridGuidedSkip = null;
          window.multiplicationGridGuidedReset = null;
        } else if (mode === 'animation') {
          window.multiplicationGridAnimationPlay = null;
          window.multiplicationGridAnimationPause = null;
          window.multiplicationGridAnimationStepForward = null;
          window.multiplicationGridAnimationStepBackward = null;
          window.multiplicationGridAnimationReset = null;
          window.multiplicationGridAnimationStep = null;
          window.multiplicationGridAnimationPlaying = null;
          window.multiplicationGridAnimationComplete = null;
        } else if (mode === 'dragDrop') {
          window.multiplicationGridDragDropValidate = null;
          window.multiplicationGridDragDropReset = null;
          window.multiplicationGridDragDropValues = null;
          window.multiplicationGridDragDropValidation = null;
          window.multiplicationGridDragDropComplete = null;
        }
      };
    }, [mode, handleCheck, handleReset, selectedCells, checkResult, allCorrect, incorrectValues, checkInputMode, inputValues, inputValidation, checkInputCompletion, handleNumberPadInput, handleNumberPadBackspace, handleNumberPadClear, focusedCell, checkInputs, validatePractice, resetPractice, practiceValues, practiceValidation, practiceComplete, guidedStepIndex, guidedSteps, guidedComplete, advanceGuidedStep, skipGuidedStep, resetGuided, playAnimation, pauseAnimation, stepForwardAnimation, stepBackwardAnimation, resetAnimation, animationStepIndex, animationPlaying, animationComplete, validateDragDrop, resetDragDrop, dragDropValues, dragDropValidation, dragDropComplete]);
    
    /**
     * Auto-focus the last input cell when in input mode (rightmost digit for multiplication)
     */
    React.useEffect(() => {
      if (mode === 'input' && inputCells.length > 0 && !focusedCell) {
        // Small delay to ensure component is fully rendered
        const timer = setTimeout(() => {
          // Focus the last cell (rightmost digit) since multiplication is entered right-to-left
          const lastCell = inputCells[inputCells.length - 1];
          setFocusedCell(lastCell);
          window.multiplicationGridFocusedCell = lastCell;
          console.log('🎯 [MultiplicationGrid] Auto-focused last input cell (units digit):', lastCell);
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [mode, inputCells, focusedCell]);
    
    /**
     * Calculate which multiplicand and multiplier cells should be highlighted
     * when a sum input cell is focused
     */
    React.useEffect(() => {
      if (mode === 'input' && focusedCell && focusedCell.startsWith('sum-')) {
        // Parse the sum cell key: sum-{row}-{col}
        const parts = focusedCell.split('-');
        if (parts.length === 3) {
          const sumCol = parseInt(parts[2], 10);
          const related = new Set();
          
          // Calculate multiplicand and multiplier digits (same as data calculation)
          const multiplicandDigits = String(Math.abs(multiplicand)).split('').map(Number);
          const multiplierDigits = String(Math.abs(multiplier)).split('').map(Number);
          
          // For single-digit multiplier, each sum column corresponds to one multiplicand column
          // Highlight the multiplicand digit at the same column position
          if (sumCol < multiplicandDigits.length) {
            const multiplicandKey = `multiplicand-0-${sumCol}`;
            related.add(multiplicandKey);
          }
          
          // Always highlight the multiplier (single digit at column 0)
          if (multiplierDigits.length === 1) {
            related.add('multiplier-0-0');
          } else {
            // For multi-digit multipliers, we'd need to calculate which multiplier digit
            // contributes to this sum position - for now, just highlight all multiplier digits
            multiplierDigits.forEach((_, idx) => {
              related.add(`multiplier-0-${idx}`);
            });
          }
          
          setRelatedCells(related);
          console.log('🔍 [MultiplicationGrid] Related cells for', focusedCell, ':', Array.from(related));
        }
      } else {
        setRelatedCells(new Set());
      }
    }, [mode, focusedCell, multiplicand, multiplier]);
    
    /**
     * Render a single cell
     */
    const renderCell = (value, key, type, isEditable = false) => {
      // Check if this cell should display an incorrect value
      const displayValue = incorrectValues[key] !== undefined ? incorrectValues[key] : value;
      
      // If displayValue is null, render as empty cell
      if (displayValue === null) {
        return React.createElement('div', {
          key,
          className: 'mult-cell mult-cell-empty',
          style: { width: cellSizePx, height: cellSizePx }
        });
      }
      
      // Debug logging for incorrect values
      if (key === 'partial-0-1' || key === 'carry-1-0' || key === 'carry-0-2') {
        console.log('🔍 [renderCell] Debug incorrect values:', {
          key,
          originalValue: value,
          incorrectValue: incorrectValues[key],
          displayValue,
          incorrectValuesKeys: Object.keys(incorrectValues),
          incorrectValuesMap: incorrectValues
        });
      }
      
      const isCompleted = completedSteps.has(key);
      const isIncorrect = incorrectCells.has(key);
      const userValue = userInputs[key];
      
      // Spot incorrect mode state
      const isSelected = selectedCells.has(key);
      const feedbackState = checkResult?.[key];
      
      // Handle cell click for spot incorrect mode
      const handleCellClick = () => {
        if (mode !== 'spotIncorrect') return;
        if (value === null) return; // Skip empty cells
        if (disabled || allCorrect) return; // Skip if disabled or all correct
        
        // If there was a previous check result (incorrect), clear it when new cell is clicked
        if (checkResult !== null) {
          console.log('🔄 [MultiplicationGrid] Clearing previous check result and selections for fresh start');
          setCheckResult(null);
          window.multiplicationGridCheckResult = null;
          window.multiplicationGridFeedbackState = 'default';
          
          // Clear all previous selections and start fresh with just this cell
          const newSelection = new Set([key]);
          setSelectedCells(newSelection);
          if (onSelectionChange) {
            onSelectionChange(Array.from(newSelection));
          }
          return;
        }
        
        // Normal selection toggle when no previous check result
        setSelectedCells(prev => {
          const newSet = new Set(prev);
          if (newSet.has(key)) {
            newSet.delete(key);
          } else {
            newSet.add(key);
          }
          if (onSelectionChange) {
            onSelectionChange(Array.from(newSet));
          }
          return newSet;
        });
      };
      
      // Check if this cell is related to the focused sum cell (for blinking border)
      const isRelated = relatedCells.has(key);
      
      const cellClasses = [
        'mult-cell',
        type === 'carry' || type.includes('carry') ? 'mult-carry' : '',
        isEditable && showStepHighlight ? 'mult-cell-editable' : '',
        isCompleted ? 'mult-cell-correct' : '',
        isIncorrect ? 'mult-cell-incorrect' : '',
        feedbackState === false ? 'mult-cell-wiggle' : '',
        // Add blinking border class for related cells
        isRelated && mode === 'input' && focusedCell ? 'mult-cell-border-blink' : '',
        // Add 3D button theme classes (only if not in minimal mode)
        currentTheme === 'button-theme' && !minimalMode ? 'mult-cell-button-theme' : '',
        currentTheme === 'button-theme' && !minimalMode && isSelected ? 'selected' : '',
        currentTheme === 'button-theme' && !minimalMode && feedbackState === true ? 'correct' : '',
        currentTheme === 'button-theme' && !minimalMode && feedbackState === false ? 'incorrect' : '',
        // Don't add disabled class for button theme - keep original appearance
      ].filter(Boolean).join(' ');
      
      // Debug cell classes
      if (key === 'multiplicand-0-0' || key === 'partial-1-1') {
        console.log('🎨 [Cell Classes Debug]', {
          key,
          currentTheme,
          cellClasses,
          type
        });
      }
      
      // Get theme-based styling for this cell type
      let cellThemeStyle = {};
      if (type === 'carry' || type.includes('carry')) {
        cellThemeStyle = themeStyles.carry;
      } else if (type === 'multiplicand') {
        cellThemeStyle = themeStyles.multiplicand;
      } else if (type === 'multiplier') {
        cellThemeStyle = themeStyles.multiplier;
      } else if (type === 'partial') {
        cellThemeStyle = themeStyles.partial;
      } else if (type === 'sum') {
        cellThemeStyle = themeStyles.answer;
      }
      
      // Extract styling properties
      let color = cellThemeStyle.color || '#000';
      let bgColor = cellThemeStyle.backgroundColor || 'white';
      let borderColor = cellThemeStyle.borderColor || '#ddd';
      let borderWidth = cellThemeStyle.borderWidth || '1px';
      let borderStyle = cellThemeStyle.borderStyle || 'solid';
      let cursor = 'default';
      if (mode === 'spotIncorrect' && !disabled && !allCorrect) {
        cursor = 'pointer';
      } else if (disabled || allCorrect) {
        cursor = 'not-allowed';
      } else {
        cursor = cellThemeStyle.cursor || 'default';
      }
      
      // Check if this cell should be hidden (input-theme only)
      if (currentTheme === 'input-theme') {
        console.log('🔍 [Input Theme] Checking cell:', key, 'Value:', value, 'Hidden cells:', hiddenCells);
        if (hiddenCells.includes(key)) {
          console.log('🔍 [Input Theme] Hiding cell:', key, 'Value:', value);
          color = 'transparent';  // Hide the number by making text transparent
        }
      }
      
      // Debug cell styling
      if (key === 'multiplicand-0-0' || key === 'partial-1-1') {
        console.log('🎨 [Cell Debug]', {
          key,
          currentTheme,
          cellThemeStyle,
          color,
          bgColor,
          borderColor,
          type
        });
      }
      
      // Apply spot incorrect mode styling (only if not in minimal mode)
      if (mode === 'spotIncorrect' && isSelected && !minimalMode) {
        if (feedbackState === true) {
          bgColor = 'var(--color-green, #4CAF50)';
        } else if (feedbackState === false) {
          bgColor = 'salmon';
        } else {
          // Selected but not checked yet
          bgColor = 'rgba(255, 215, 0, 0.3)'; // Light gold
        }
      }
      
      // Check if this cell is related to the focused sum cell (should be highlighted)
      // Apply this AFTER other styling so it takes precedence
      // Note: isRelated is already checked above for cellClasses
      if (isRelated && mode === 'input' && focusedCell) {
        // Apply highlight styling for related multiplicand/multiplier cells with blinking border
        // Don't set border inline - let CSS animation handle it via mult-cell-border-blink class
        bgColor = 'rgba(255, 171, 64, 0.2)'; // Light orange background
        // Blinking border animation is handled via CSS class 'mult-cell-border-blink'
        // Skip setting border inline to allow CSS animation to work
      }
      
      // Make carry row font size 10% smaller than the rest and top-aligned
      const isCarryCell = type === 'carry' || type.includes('carry');
      
      // Calculate carry font size (10% smaller)
      let cellFontSize = fontSizePx;
      if (isCarryCell) {
        // Handle both string (e.g., "24px") and number cases
        if (typeof fontSizePx === 'string') {
          const numericValue = parseFloat(fontSizePx);
          if (!isNaN(numericValue)) {
            cellFontSize = `${numericValue * 0.8}px`;
          }
        } else if (typeof fontSizePx === 'number') {
          cellFontSize = fontSizePx * 0.8;
        }
      }
      
      const cellStyle = {
        width: cellSizePx,
        height: cellSizePx,
        fontSize: cellFontSize,
        color: color,
        cursor: cursor
      };
      
      // Top-align carry cells
      if (isCarryCell) {
        cellStyle.display = 'flex'; // Ensure flex display
        cellStyle.alignItems = 'flex-start'; // Top align
        cellStyle.justifyContent = 'center'; // Keep horizontal centering
        cellStyle.paddingTop = '2px'; // Small padding from top
        cellStyle.lineHeight = '1'; // Tight line height to prevent extra space
      }
      
      // Apply background and border styles based on theme and minimal mode
      if (minimalMode) {
        // Minimal mode: transparent background, no borders
        cellStyle.backgroundColor = 'transparent';
        cellStyle.border = 'none';
      } else if (currentTheme !== 'button-theme') {
        // Normal mode: apply theme-based styling
        cellStyle.backgroundColor = bgColor;
        // Don't set border inline for related cells - CSS animation will handle it
        const shouldSkipBorder = isRelated && mode === 'input' && focusedCell;
        if (shouldSkipBorder) {
          // Debug: Log when we're skipping border for related cells
          if (key === 'multiplicand-0-1' || key === 'multiplier-0-0') {
            console.log('🎯 [Border Skip] Skipping inline border for related cell:', key, { isRelated, mode, focusedCell });
          }
          // Explicitly remove border from style object - CSS will handle it via mult-cell-border-blink class
          delete cellStyle.border;
        } else {
          cellStyle.border = `${borderWidth} ${borderStyle} ${borderColor}`;
        }
        // For related cells, border is handled by CSS class mult-cell-border-blink
      }
      
      // Override cursor for spot incorrect mode clickable cells
      if (mode === 'spotIncorrect' && displayValue !== null) {
        if (disabled || allCorrect) {
          cellStyle.cursor = 'not-allowed';
        } else {
          cellStyle.cursor = 'pointer';
        }
      }
      
      // Final check: Remove border for any cell with mult-cell-border-blink class
      // This ensures the CSS animation can control the border
      if (cellClasses.includes('mult-cell-border-blink') && cellStyle.border) {
        delete cellStyle.border;
        console.log('🗑️ [Final Check] Removed border from cell with blink class:', key);
      }
      
      // Debug final cell style
      if (key === 'multiplicand-0-0' || key === 'partial-1-1') {
        console.log('🎨 [Final Cell Style Debug]', {
          key,
          currentTheme,
          cellStyle,
          type
        });
      }
      
      // Input mode - render input field for specified cells
      if (mode === 'input' && inputCells.includes(key)) {
        const inputValue = inputValues[key] !== undefined ? inputValues[key] : '?';
        const validation = inputValidation[key];
        const isSelected = focusedCell === key; // Check if this cell is focused
        
        // Apply input-specific styling
        const inputStyle = {
          ...cellStyle,
          backgroundColor: isSelected ? '#FFEB3B' : 'white', // Yellow background when focused
          border: '2px solid #FFC107', // Yellow/amber border
          color: '#000',
          textAlign: 'center',
          cursor: 'pointer', // Pointer cursor instead of text cursor
          outline: 'none',
          caretColor: 'transparent', // Hide text cursor
          userSelect: 'none', // Disable text selection
          boxShadow: isSelected ? '0 0 10px rgba(255, 235, 59, 0.6)' : 'none',
          animation: isSelected ? 'inputBlink 1s ease-in-out infinite' : 'none', // Blinking animation when focused
          transition: 'background-color 0.3s ease, border-color 0.3s ease' // Smooth transitions
        };
        
        // Apply validation-based background colors only after check is performed
        if (checkPerformed && validation) {
          if (validation.isCorrect) {
            inputStyle.backgroundColor = 'var(--color-green, #4CAF50)';
            inputStyle.color = 'white';
            inputStyle.animation = 'none'; // Stop blinking when validated
          } else if (validation.userValue !== undefined) {
            inputStyle.backgroundColor = 'var(--color-salmon, #FF6B6B)';
            inputStyle.color = 'white';
            inputStyle.animation = 'none'; // Stop blinking when validated
          }
        }
        
        return React.createElement('input', {
          key,
          type: 'text',
          className: cellClasses,
          style: inputStyle,
          maxLength: 1,
          value: inputValue,
          onChange: (e) => {
            // Handle normal input changes
            const newValue = e.target.value;
            // Only allow single digit numbers
            if (newValue === '' || (newValue.length === 1 && /[0-9]/.test(newValue))) {
              handleInputValueChange(key, newValue === '' ? '?' : newValue);
            }
          },
          onFocus: (e) => {
            // Focus without showing cursor
            e.target.blur(); // Immediately blur to hide cursor
            // Set this cell as focused
            setFocusedCell(key);
            console.log('🔢 [Input Cell] Focused cell set to:', key);
          },
          onClick: (e) => {
            e.preventDefault();
            // Set this cell as focused
            setFocusedCell(key);
            console.log('🔢 [Input Cell] Clicked and focused cell set to:', key);
            // Focus the input
            e.target.focus();
            // Immediately blur to hide cursor but keep visual focus
            setTimeout(() => e.target.blur(), 0);
          },
          placeholder: '?',
          autoComplete: 'off',
          inputMode: 'numeric',
          pattern: '[0-9]',
          tabIndex: 0 // Allow tab navigation
        });
      }
      
      // Practice mode - render input field for all editable cells
      if (mode === 'practice') {
        const practiceCellKeys = getPracticeCellKeys();
        if (practiceCellKeys.includes(key)) {
          const practiceValue = practiceValues[key] !== undefined ? practiceValues[key] : '?';
          const validation = practiceValidation[key];
          const isSelected = focusedCell === key;
          
          const practiceInputStyle = {
            ...cellStyle,
            backgroundColor: isSelected ? '#E3F2FD' : 'white',
            border: '2px solid #2196F3',
            color: '#000',
            textAlign: 'center',
            cursor: 'text',
            outline: 'none',
            boxShadow: isSelected ? '0 0 10px rgba(33, 150, 243, 0.4)' : 'none',
            transition: 'all 0.2s ease'
          };
          
          // Apply validation colors
          if (validation) {
            if (validation.isCorrect) {
              practiceInputStyle.backgroundColor = '#C8E6C9';
              practiceInputStyle.borderColor = '#4CAF50';
            } else if (validation.status === 'incorrect') {
              practiceInputStyle.backgroundColor = '#FFCDD2';
              practiceInputStyle.borderColor = '#F44336';
            }
          }
          
          return React.createElement('input', {
            key,
            type: 'text',
            className: `${cellClasses} mult-cell-practice`,
            style: practiceInputStyle,
            maxLength: 1,
            value: practiceValue === '?' ? '' : practiceValue,
            onChange: (e) => {
              const newValue = e.target.value;
              if (newValue === '' || (newValue.length === 1 && /[0-9]/.test(newValue))) {
                handlePracticeValueChange(key, newValue);
              }
            },
            onFocus: () => setFocusedCell(key),
            onBlur: () => setFocusedCell(null),
            placeholder: '?',
            autoComplete: 'off',
            inputMode: 'numeric',
            pattern: '[0-9]'
          });
        }
      }
      
      // Guided mode - render input for current step only
      if (mode === 'guided') {
        const currentStep = getCurrentGuidedStep();
        const isCurrentStep = currentStep && currentStep.key === key;
        const validation = guidedValidation[key];
        const guidedValue = guidedValues[key];
        
        // If this cell has been completed, show it
        if (validation && validation.isCorrect) {
          const completedStyle = {
            ...cellStyle,
            backgroundColor: '#C8E6C9',
            borderColor: '#4CAF50',
            border: '2px solid #4CAF50'
          };
          return React.createElement('div', {
            key,
            className: `${cellClasses} mult-cell-guided-complete`,
            style: completedStyle
          }, guidedValue);
        }
        
        // If this is the current step, show input
        if (isCurrentStep) {
          const guidedInputStyle = {
            ...cellStyle,
            backgroundColor: '#FFF9C4',
            border: '3px solid #FFC107',
            color: '#000',
            textAlign: 'center',
            cursor: 'text',
            outline: 'none',
            boxShadow: '0 0 15px rgba(255, 193, 7, 0.6)',
            animation: 'guidedPulse 1.5s ease-in-out infinite'
          };
          
          return React.createElement('input', {
            key,
            type: 'text',
            className: `${cellClasses} mult-cell-guided-active`,
            style: guidedInputStyle,
            maxLength: 1,
            value: guidedValue !== undefined ? guidedValue : '',
            onChange: (e) => {
              const newValue = e.target.value;
              if (newValue.length === 1 && /[0-9]/.test(newValue)) {
                handleGuidedValueChange(newValue);
              }
            },
            autoFocus: true,
            placeholder: '?',
            autoComplete: 'off',
            inputMode: 'numeric',
            pattern: '[0-9]'
          });
        }
        
        // For future steps, show empty placeholder
        const futureStepKeys = guidedSteps.slice(guidedStepIndex + 1).map(s => s.key);
        if (futureStepKeys.includes(key)) {
          const futureStyle = {
            ...cellStyle,
            backgroundColor: '#F5F5F5',
            borderColor: '#E0E0E0',
            border: '2px dashed #E0E0E0',
            color: '#BDBDBD'
          };
          return React.createElement('div', {
            key,
            className: `${cellClasses} mult-cell-guided-future`,
            style: futureStyle
          }, '?');
        }
      }
      
      // Animation mode - show/hide cells based on animation progress
      if (mode === 'animation') {
        const isVisible = visibleCells.has(key);
        const isHighlighted = highlightedCell === key;
        
        // Check if this is a cell that should be animated
        const isAnimatableCell = key.startsWith('partial-') || key.startsWith('sum-') || key.startsWith('carry-');
        
        if (isAnimatableCell && !isVisible) {
          // Hidden cell - show placeholder
          const hiddenStyle = {
            ...cellStyle,
            backgroundColor: 'transparent',
            border: '2px dashed #E0E0E0',
            color: 'transparent'
          };
          return React.createElement('div', {
            key,
            className: `${cellClasses} mult-cell-animation-hidden`,
            style: hiddenStyle
          }, '');
        }
        
        // Visible cell with potential highlight
        if (isHighlighted) {
          cellStyle.backgroundColor = '#FFEB3B';
          cellStyle.border = '3px solid #FFC107';
          cellStyle.boxShadow = '0 0 15px rgba(255, 193, 7, 0.6)';
          cellStyle.animation = animationConfig.digitAnimation === 'scale' ? 'digitAppear 0.3s ease-out' : 
                               animationConfig.digitAnimation === 'fade' ? 'digitFade 0.3s ease-out' : 'none';
        }
      }
      
      // DragDrop mode - render drop zone for editable cells
      if (mode === 'dragDrop') {
        if (dragDropCellKeysRef.current.includes(key)) {
          const dragDropValue = dragDropValues[key];
          const validation = dragDropValidation[key];
          const isDragOver = dragOverCell === key;
          
          const dragDropStyle = {
            ...cellStyle,
            backgroundColor: isDragOver ? '#E1F5FE' : (dragDropValue !== undefined ? 'white' : '#F5F5F5'),
            border: isDragOver ? '3px dashed #0288D1' : '2px dashed #BDBDBD',
            minHeight: cellSizePx,
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          };
          
          // Apply validation colors
          if (validation) {
            if (validation.isCorrect) {
              dragDropStyle.backgroundColor = '#C8E6C9';
              dragDropStyle.border = '2px solid #4CAF50';
            } else if (validation.status === 'incorrect') {
              dragDropStyle.backgroundColor = '#FFCDD2';
              dragDropStyle.border = '2px solid #F44336';
            }
          }
          
          return React.createElement('div', {
            key,
            className: `${cellClasses} mult-cell-dragdrop`,
            'data-cell-key': key,
            style: dragDropStyle,
            onMouseEnter: () => {
              if (isDragging) setDragOverCell(key);
            },
            onMouseLeave: () => {
              if (isDragging) setDragOverCell(null);
            }
          }, dragDropValue !== undefined ? dragDropValue : '?');
        }
      }
      
      if (isEditable && interactive) {
        return React.createElement('input', {
          key,
          type: 'text',
          className: cellClasses,
          style: cellStyle,
          maxLength: 1,
          value: userValue !== undefined ? userValue : '',
          onChange: (e) => {
            const match = key.match(/^(.+)-(\d+)-(\d+)$/);
            if (match) {
              handleInput(match[1], parseInt(match[2]), parseInt(match[3]), e.target.value);
            }
          },
          ref: el => inputRefs.current[key] = el
        });
      }
      
      // Display mode or non-editable cell
      return React.createElement('div', {
        key,
        className: cellClasses,
        style: cellStyle,
        onClick: handleCellClick
      }, displayValue !== null && displayValue !== undefined ? displayValue : '');
    };
    
    /**
     * Render a row with proper alignment
     */
    const renderRow = (digits, rowType, rowIndex = 0, showOperator = false, operatorSymbol = '') => {
      const cells = [];
      const isIndonesiaMode = multiplicationSymbolPosition === 'indonesia';
      
      // Calculate padding needed for alignment
      // In Indonesia mode, all rows need space for the extra operator column
      const paddingNeeded = data.totalColumns - digits.length;
      
      // Convert operator font size
      const operatorFontSize = convertGc(operator.fontSize);
      
      // Default mode: Add operator in padding (before digits)
      if (!isIndonesiaMode) {
        for (let i = 0; i < paddingNeeded; i++) {
          if (showOperator && i === paddingNeeded - 1) {
            cells.push(
              React.createElement('div', {
                key: `op-${rowIndex}`,
                className: 'mult-cell mult-operator',
                style: { 
                  width: cellSizePx, 
                  height: cellSizePx, 
                  fontSize: operatorFontSize,
                  color: operator.color
                }
              }, operatorSymbol)
            );
          } else {
            cells.push(
              React.createElement('div', {
                key: `pad-${i}`,
                className: 'mult-cell mult-cell-empty',
                style: { width: cellSizePx, height: cellSizePx }
              })
            );
          }
        }
      } else {
        // Indonesia mode: Just add padding (no operator in padding)
        for (let i = 0; i < paddingNeeded; i++) {
          cells.push(
            React.createElement('div', {
              key: `pad-${i}`,
              className: 'mult-cell mult-cell-empty',
              style: { width: cellSizePx, height: cellSizePx }
            })
          );
        }
      }
      
      // Add digit cells
      digits.forEach((digit, idx) => {
        const key = getCellKey(rowType, rowIndex, idx);
        console.log('🔍 [MultiplicationGrid] Creating cell:', { rowType, rowIndex, idx, key, digit });
        const isEditable = interactive && (
          rowType === 'partial' || 
          rowType === 'sum' ||
          (rowType.includes('carry') && carryVisible)
        );
        cells.push(renderCell(digit, key, rowType, isEditable));
      });
      
      // Indonesia mode: Add operator or empty cell to keep alignment
      if (isIndonesiaMode) {
        if (showOperator) {
          // Add operator cell for multiplier row
          cells.push(
            React.createElement('div', {
              key: `op-${rowIndex}`,
              className: 'mult-cell mult-operator',
              style: { 
                width: cellSizePx, 
                height: cellSizePx, 
                fontSize: operatorFontSize,
                color: operator.color
              }
            }, operatorSymbol)
          );
        } else {
          // Add empty cell for other rows to maintain alignment
          cells.push(
            React.createElement('div', {
              key: `empty-end-${rowIndex}`,
              className: 'mult-cell mult-cell-empty',
              style: { width: cellSizePx, height: cellSizePx }
            })
          );
        }
      }
      
      return React.createElement('div', {
        className: 'mult-row',
        key: `${rowType}-${rowIndex}`
      }, cells);
    };
    
    /**
     * Render horizontal line
     */
    const renderLine = (key) => {
      const cellSizeNum = parseFloat(cellSizePx);
      const lineThicknessPx = convertGc(lineThickness);
      
      // Line should only span the digit columns, not the operator column
      // So we always use data.totalColumns regardless of mode
      const totalColumnsForLine = data.totalColumns;
      
      return React.createElement('div', {
        key,
        className: 'mult-line',
        style: { 
          width: `${totalColumnsForLine * cellSizeNum}px`,
          height: lineThicknessPx,
          backgroundColor: lineColor,
          border: 'none'
        }
      });
    };
    
    // ===== RENDER =====
    
    const rows = [];
    
    // Carry rows (show separate carry row for each partial product)
    // Order: highest place value digit (top) to units digit (bottom)
    console.log('🔍 [MultiplicationGrid] Carry rendering check:', {
      carryVisible,
      partialProductCarries: data.partialProductCarries,
      partialProductCarriesLength: data.partialProductCarries.length
    });
    
    if (carryVisible) {
      data.partialProductCarries.slice().reverse().forEach((carries, carryRowIdx) => {
        console.log('🔍 [MultiplicationGrid] Rendering carry row:', {
          carryRowIdx,
          carries,
          carriesLength: carries.length
        });
        // Create padded carries array for this specific partial product
        const paddedCarries = new Array(data.totalColumns).fill(null);
        
        // Process carries for this partial product
        carries.forEach((carry, idx) => {
          if (carry > 0 && carry !== null) {
            // Shift carry one position to the LEFT
            // The carry at index idx should be displayed at idx-1 position
            const basePosition = data.totalColumns - carries.length + idx;
            const shiftedPosition = basePosition - 1;
            
            // Only place carry if position is valid (>= 0)
            if (shiftedPosition >= 0) {
              paddedCarries[shiftedPosition] = carry;
            }
          }
        });
        
        const carryCells = paddedCarries.map((val, idx) => {
          console.log('🔍 [MultiplicationGrid] Creating carry cell:', {
            val,
            idx,
            key: `carry-${carryRowIdx}-${idx}`,
            carryRowIdx
          });
          const cell = renderCell(val, `carry-${carryRowIdx}-${idx}`, 'carry', false);
          // Clone element and add key
          return React.cloneElement(cell, { key: `carry-cell-${carryRowIdx}-${idx}` });
        });
        
        // In Indonesia mode, add an extra empty cell at the end for alignment
        if (multiplicationSymbolPosition === 'indonesia') {
          carryCells.push(
            React.createElement('div', {
              key: `carry-empty-end-${carryRowIdx}`,
              className: 'mult-cell mult-cell-empty',
              style: { width: cellSizePx, height: cellSizePx }
            })
          );
        }
        
        rows.push(
          React.createElement('div', {
            key: `carry-row-${carryRowIdx}`,
            className: 'mult-row mult-carry-row'
          }, carryCells)
        );
      });
    }
    
    // Multiplicand row
    rows.push(renderRow(data.multiplicandDigits, 'multiplicand', 0, false));
    
    // Multiplier row (with × operator)
    rows.push(renderRow(data.multiplierDigits, 'multiplier', 0, true, '×'));
    
    // Line separator
    rows.push(renderLine('line-1'));
    
    // Partial product rows (only show if multiplier has more than one digit)
    // Order: units digit (top) to highest place value digit (bottom)
    if (data.multiplierDigits.length > 1) {
      console.log('🔍 [MultiplicationGrid] Rendering partial products:', data.partialProducts);
      data.partialProducts.forEach((pp, idx) => {
        console.log('🔍 [MultiplicationGrid] Rendering partial product row', idx, 'with digits:', pp);
        rows.push(renderRow(pp, 'partial', idx, false));
      });
      
      // Second line separator (only show if there are partial products)
      rows.push(renderLine('line-2'));
    }
    
    // Sum row
    rows.push(renderRow(data.sumDigits, 'sum', 0, false));
    
    // Control buttons
    const controls = React.createElement('div', {
      key: 'controls',
      className: 'mult-controls',
      style: { marginTop: '20px', display: 'none' }
    }, [
      interactive && React.createElement('button', {
        key: 'reset',
        onClick: () => {
          setUserInputs({});
          setCompletedSteps(new Set());
          setIncorrectCells(new Set());
        },
        className: 'mult-control-btn'
      }, 'Reset')
    ]);
    
    // Determine alignment styles
    const getAlignmentStyle = () => {
      switch(gridAlignment) {
        case 'left':
          return 'flex-start';
        case 'right':
          return 'flex-end';
        case 'center':
        default:
          return 'center';
      }
    };
    
    // Render guided mode hint
    const renderGuidedHint = () => {
      if (mode !== 'guided' || !guidedConfig.showHints) return null;
      
      const currentStep = getCurrentGuidedStep();
      if (!currentStep || guidedComplete) return null;
      
      const hintStyle = {
        padding: '12px 20px',
        backgroundColor: '#FFF9C4',
        border: '2px solid #FFC107',
        borderRadius: '8px',
        marginTop: '15px',
        textAlign: 'center',
        fontSize: fontSizePx,
        color: '#5D4037',
        fontWeight: '500'
      };
      
      const progressStyle = {
        fontSize: '12px',
        color: '#8D6E63',
        marginTop: '8px'
      };
      
      return React.createElement('div', {
        key: 'guided-hint',
        className: 'mult-guided-hint',
        style: hintStyle
      }, [
        React.createElement('div', { key: 'hint-text' }, currentStep.hint),
        currentStep.hintDetail && React.createElement('div', { 
          key: 'hint-detail',
          style: { fontSize: '14px', marginTop: '4px', color: '#795548' }
        }, currentStep.hintDetail),
        React.createElement('div', { key: 'progress', style: progressStyle }, 
          `Step ${guidedStepIndex + 1} of ${guidedSteps.length}`
        ),
        guidedConfig.allowSkip && React.createElement('button', {
          key: 'skip-btn',
          onClick: skipGuidedStep,
          style: {
            marginTop: '10px',
            padding: '6px 16px',
            backgroundColor: '#E0E0E0',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }
        }, 'Skip')
      ]);
    };
    
    // Render guided complete message
    const renderGuidedComplete = () => {
      if (mode !== 'guided' || !guidedComplete) return null;
      
      return React.createElement('div', {
        key: 'guided-complete',
        className: 'mult-guided-complete',
        style: {
          padding: '20px',
          backgroundColor: '#C8E6C9',
          border: '2px solid #4CAF50',
          borderRadius: '8px',
          marginTop: '15px',
          textAlign: 'center',
          color: '#2E7D32'
        }
      }, [
        React.createElement('div', { 
          key: 'complete-text',
          style: { fontSize: '18px', fontWeight: 'bold' }
        }, '🎉 Excellent! You completed the multiplication!'),
        React.createElement('div', { 
          key: 'answer',
          style: { fontSize: '24px', marginTop: '10px' }
        }, `${multiplicand} × ${multiplier} = ${data.finalAnswer}`),
        React.createElement('button', {
          key: 'reset-btn',
          onClick: resetGuided,
          style: {
            marginTop: '15px',
            padding: '10px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }
        }, 'Try Again')
      ]);
    };
    
    // Render practice mode controls
    const renderPracticeControls = () => {
      if (mode !== 'practice') return null;
      
      return React.createElement('div', {
        key: 'practice-controls',
        className: 'mult-practice-controls',
        style: {
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          marginTop: '15px'
        }
      }, [
        React.createElement('button', {
          key: 'check-btn',
          onClick: validatePractice,
          style: {
            padding: '10px 24px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }
        }, 'Check Answers'),
        React.createElement('button', {
          key: 'reset-btn',
          onClick: resetPractice,
          style: {
            padding: '10px 24px',
            backgroundColor: '#757575',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }
        }, 'Reset')
      ]);
    };
    
    // Render practice complete message
    const renderPracticeComplete = () => {
      if (mode !== 'practice' || !practiceComplete) return null;
      
      return React.createElement('div', {
        key: 'practice-complete',
        className: 'mult-practice-complete',
        style: {
          padding: '15px 20px',
          backgroundColor: '#C8E6C9',
          border: '2px solid #4CAF50',
          borderRadius: '8px',
          marginTop: '15px',
          textAlign: 'center',
          color: '#2E7D32',
          fontWeight: '500'
        }
      }, '🎉 All answers are correct!');
    };
    
    // Render animation controls
    const renderAnimationControls = () => {
      if (mode !== 'animation' || !animationConfig.showControls) return null;
      
      const buttonStyle = {
        padding: '8px 16px',
        backgroundColor: '#673AB7',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      };
      
      const disabledStyle = {
        ...buttonStyle,
        backgroundColor: '#BDBDBD',
        cursor: 'not-allowed'
      };
      
      return React.createElement('div', {
        key: 'animation-controls',
        className: 'mult-animation-controls',
        style: {
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          marginTop: '15px',
          flexWrap: 'wrap'
        }
      }, [
        // Play/Pause button
        React.createElement('button', {
          key: 'play-pause-btn',
          onClick: animationPlaying ? pauseAnimation : playAnimation,
          style: buttonStyle
        }, animationPlaying ? '⏸ Pause' : '▶ Play'),
        
        // Step backward
        React.createElement('button', {
          key: 'step-back-btn',
          onClick: stepBackwardAnimation,
          disabled: animationStepIndex === 0,
          style: animationStepIndex === 0 ? disabledStyle : buttonStyle
        }, '⏮ Back'),
        
        // Step forward
        React.createElement('button', {
          key: 'step-forward-btn',
          onClick: stepForwardAnimation,
          disabled: animationStepIndex >= animationSteps.length - 1,
          style: animationStepIndex >= animationSteps.length - 1 ? disabledStyle : buttonStyle
        }, 'Next ⏭'),
        
        // Reset
        React.createElement('button', {
          key: 'reset-btn',
          onClick: resetAnimation,
          style: { ...buttonStyle, backgroundColor: '#757575' }
        }, '↺ Reset')
      ]);
    };
    
    // Render animation step info
    const renderAnimationInfo = () => {
      if (mode !== 'animation') return null;
      
      const currentStep = animationSteps[animationStepIndex];
      
      return React.createElement('div', {
        key: 'animation-info',
        className: 'mult-animation-info',
        style: {
          padding: '12px 20px',
          backgroundColor: '#EDE7F6',
          border: '2px solid #673AB7',
          borderRadius: '8px',
          marginTop: '15px',
          textAlign: 'center'
        }
      }, [
        React.createElement('div', {
          key: 'step-description',
          style: { fontSize: '16px', color: '#4527A0', fontWeight: '500' }
        }, currentStep?.description || 'Ready to start'),
        React.createElement('div', {
          key: 'step-progress',
          style: { fontSize: '12px', color: '#7E57C2', marginTop: '6px' }
        }, `Step ${animationStepIndex + 1} of ${animationSteps.length}`)
      ]);
    };
    
    // Render dragDrop digit bank
    const renderDragDropDigitBank = () => {
      if (mode !== 'dragDrop' || !dragDropConfig.showDigitBank) return null;
      
      const digitBankStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '15px',
        backgroundColor: '#F5F5F5',
        border: '2px solid #9E9E9E',
        borderRadius: '8px',
        marginTop: '15px',
        alignItems: 'center'
      };
      
      const digitTileStyle = {
        width: cellSizePx,
        height: cellSizePx,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E3F2FD',
        border: '2px solid #2196F3',
        borderRadius: '6px',
        fontSize: fontSizePx,
        fontWeight: 'bold',
        color: '#1976D2',
        cursor: isDragging ? 'not-allowed' : 'grab',
        userSelect: 'none',
        transition: 'all 0.2s ease',
        opacity: isDragging && draggedDigit !== null ? 0.5 : 1
      };
      
      const digits = dragDropConfig.allowedDigits || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      
      return React.createElement('div', {
        key: 'dragdrop-digit-bank',
        className: 'mult-dragdrop-digit-bank',
        style: digitBankStyle
      }, [
        React.createElement('div', {
          key: 'bank-label',
          style: { fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#424242' }
        }, 'Drag digits here:'),
        React.createElement('div', {
          key: 'digits-container',
          style: { display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }
        }, digits.map(digit => 
          React.createElement('div', {
            key: `digit-${digit}`,
            className: 'mult-digit-tile',
            style: {
              ...digitTileStyle,
              cursor: isDragging ? 'not-allowed' : 'grab'
            },
            onMouseDown: (e) => !isDragging && handleDragStart(digit, e),
            onTouchStart: (e) => !isDragging && handleDragStart(digit, e)
          }, digit)
        ))
      ]);
    };
    
    // Render dragged digit overlay
    const renderDraggedDigitOverlay = () => {
      if (mode !== 'dragDrop' || !isDragging || draggedDigit === null) return null;
      
      return React.createElement('div', {
        key: 'dragged-digit-overlay',
        className: 'mult-dragged-digit-overlay',
        style: {
          position: 'fixed',
          left: `${dragPosition.x - 20}px`,
          top: `${dragPosition.y - 20}px`,
          width: cellSizePx,
          height: cellSizePx,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#2196F3',
          border: '3px solid #1976D2',
          borderRadius: '8px',
          fontSize: fontSizePx,
          fontWeight: 'bold',
          color: 'white',
          pointerEvents: 'none',
          zIndex: 10000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          transform: 'scale(1.2)',
          opacity: 0.9
        }
      }, draggedDigit);
    };
    
    // Render dragDrop controls
    const renderDragDropControls = () => {
      if (mode !== 'dragDrop') return null;
      
      return React.createElement('div', {
        key: 'dragdrop-controls',
        className: 'mult-dragdrop-controls',
        style: {
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          marginTop: '15px'
        }
      }, [
        React.createElement('button', {
          key: 'check-btn',
          onClick: validateDragDrop,
          style: {
            padding: '10px 24px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }
        }, 'Check Answers'),
        React.createElement('button', {
          key: 'reset-btn',
          onClick: resetDragDrop,
          style: {
            padding: '10px 24px',
            backgroundColor: '#757575',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }
        }, 'Reset')
      ]);
    };
    
    // Render dragDrop complete message
    const renderDragDropComplete = () => {
      if (mode !== 'dragDrop' || !dragDropComplete) return null;
      
      return React.createElement('div', {
        key: 'dragdrop-complete',
        className: 'mult-dragdrop-complete',
        style: {
          padding: '15px 20px',
          backgroundColor: '#C8E6C9',
          border: '2px solid #4CAF50',
          borderRadius: '8px',
          marginTop: '15px',
          textAlign: 'center',
          color: '#2E7D32',
          fontWeight: '500'
        }
      }, '🎉 All answers are correct!');
    };
    
    // Main container
    return React.createElement('div', {
      className: 'multiplication-grid',
      'data-component-type': 'MultiplicationGrid',
      'data-mode': mode,
      style: { 
        display: 'block',
        width: '100%',
        height: '100%',
        padding: minimalMode ? '0px' : '20px',
        fontFamily: 'monospace',
        backgroundColor: minimalMode ? 'transparent' : backgroundColor,
        borderRadius: minimalMode ? '0px' : '8px',
        boxShadow: minimalMode ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: 'none', // Remove border for all themes
        boxSizing: 'border-box',
        overflow: 'auto'
      }
    }, [
      // Guided hint at top if configured
      guidedConfig.hintPosition === 'top' && renderGuidedHint(),
      
      React.createElement('div', {
        key: 'grid-container',
        className: 'mult-grid-container',
        style: {
          alignItems: getAlignmentStyle()
        }
      }, rows),
      
      // Mode-specific controls and info
      controls,
      renderPracticeControls(),
      renderPracticeComplete(),
      guidedConfig.hintPosition !== 'top' && renderGuidedHint(),
      renderGuidedComplete(),
      renderAnimationInfo(),
      renderAnimationControls(),
      renderDragDropDigitBank(),
      renderDraggedDigitOverlay(),
      renderDragDropControls(),
      renderDragDropComplete()
    ]);
  };
  
  // ===== EXPORT =====
  
  // Export to global scope
  if (typeof window !== 'undefined') {
    window.MultiplicationGrid = MultiplicationGrid;
    window.MultiplicationGridUtils = {
      numberToDigits,
      calculatePartialProduct,
      calculateSum,
      calculateMultiplication
    };
    console.log('✅ MultiplicationGrid component loaded');
    console.log('🔍 [MultiplicationGrid] Exported to window.MultiplicationGrid');
    console.log('🔍 [MultiplicationGrid] Component type:', typeof MultiplicationGrid);
  }
  
  // Export for module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      MultiplicationGrid,
      MultiplicationGridUtils: {
        numberToDigits,
        calculatePartialProduct,
        calculateSum,
        calculateMultiplication
      }
    };
  }
  
})();

