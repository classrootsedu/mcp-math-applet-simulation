/**
 * Long Subtraction Grid Component
 * 
 * A fully interactive React component for visualizing and solving long subtraction
 * with borrowing/regrouping, step-by-step validation, and animated guided mode.
 */

(function() {
  'use strict';
  
  console.log('🔍 [LongSubtractionGrid] Component file loading - VERSION 1.0');
  
  // Temporarily export a placeholder to ensure the component is detected
  window.LongSubtractionGrid = window.LongSubtractionGrid || function() {
    console.warn('LongSubtractionGrid: Component still initializing...');
    return null;
  };
  
  // Check if React is available
  if (typeof React === 'undefined') {
    console.error('❌ LongSubtractionGrid: React is not loaded. Please load React before this component.');
    return;
  }
  
  // ===== HELPER FUNCTIONS =====
  
  const numberToDigits = (num) => {
    return String(Math.abs(Math.floor(num))).split('').map(Number);
  };
  
  const padLeft = (arr, targetLength, fillValue = null) => {
    const padding = new Array(Math.max(0, targetLength - arr.length)).fill(fillValue);
    return [...padding, ...arr];
  };
  
  /**
   * Calculate long subtraction with borrowing
   * @param {number} minuend - The number to subtract from (top number)
   * @param {number} subtrahend - The number being subtracted (bottom number)
   * @returns {Object} Calculation data for rendering
   */
  const calculateLongSubtraction = (minuend, subtrahend) => {
    if (minuend === undefined || subtrahend === undefined) {
      return {
        error: 'Missing minuend or subtrahend',
        minuendDigits: [],
        subtrahendDigits: [],
        differenceDigits: [],
        borrows: [],
        regroupedMinuend: [],
        totalColumns: 0,
        finalAnswer: 0
      };
    }
    
    // Ensure minuend >= subtrahend for standard subtraction
    const isNegative = minuend < subtrahend;
    const actualMinuend = isNegative ? subtrahend : minuend;
    const actualSubtrahend = isNegative ? minuend : subtrahend;
    
    // Convert to digits
    const minuendDigitArray = numberToDigits(actualMinuend);
    const subtrahendDigitArray = numberToDigits(actualSubtrahend);
    
    // Find the maximum number of digits
    const maxDigits = Math.max(minuendDigitArray.length, subtrahendDigitArray.length);
    
    // Pad arrays to same length
    const paddedMinuend = padLeft(minuendDigitArray, maxDigits, 0);
    const paddedSubtrahend = padLeft(subtrahendDigitArray, maxDigits, 0);
    
    // Calculate subtraction with borrowing (right to left)
    const borrows = new Array(maxDigits).fill(false);
    const regroupedMinuend = [...paddedMinuend];
    const differenceDigits = new Array(maxDigits).fill(0);
    
    // Track which columns need borrowing and from where
    const borrowDetails = [];
    
    for (let col = maxDigits - 1; col >= 0; col--) {
      let minuendDigit = regroupedMinuend[col];
      const subtrahendDigit = paddedSubtrahend[col];
      
      // Check if we need to borrow
      if (minuendDigit < subtrahendDigit) {
        // Find a column to borrow from (going left)
        let borrowCol = col - 1;
        while (borrowCol >= 0 && regroupedMinuend[borrowCol] === 0) {
          borrowCol--;
        }
        
        if (borrowCol >= 0) {
          // Mark the borrow
          borrows[col] = true;
          
          // Cascade the borrow if needed
          for (let i = borrowCol; i < col; i++) {
            if (i === borrowCol) {
              regroupedMinuend[i] -= 1;
            } else {
              regroupedMinuend[i] = 9; // Cascaded borrow
            }
          }
          
          // Add 10 to current column
          minuendDigit = regroupedMinuend[col] + 10;
          regroupedMinuend[col] = minuendDigit;
          
          borrowDetails.push({
            borrowFromCol: borrowCol,
            borrowToCol: col,
            cascadeThrough: borrowCol < col - 1 ? 
              Array.from({ length: col - borrowCol - 1 }, (_, i) => borrowCol + 1 + i) : []
          });
        }
      }
      
      // Calculate difference for this column
      differenceDigits[col] = minuendDigit - subtrahendDigit;
    }
    
    // Remove leading zeros from difference (but keep at least one digit)
    let firstNonZero = differenceDigits.findIndex(d => d !== 0);
    if (firstNonZero === -1) firstNonZero = differenceDigits.length - 1;
    const trimmedDifference = differenceDigits.slice(firstNonZero);
    
    const finalAnswer = actualMinuend - actualSubtrahend;
    
    return {
      minuendDigits: paddedMinuend,
      subtrahendDigits: paddedSubtrahend,
      differenceDigits: differenceDigits,
      trimmedDifference: trimmedDifference,
      borrows: borrows,
      regroupedMinuend: regroupedMinuend,
      borrowDetails: borrowDetails,
      totalColumns: maxDigits,
      finalAnswer: isNegative ? -finalAnswer : finalAnswer,
      isNegative: isNegative,
      minuend: actualMinuend,
      subtrahend: actualSubtrahend
    };
  };
  
  // ===== MAIN COMPONENT =====
  
  const LongSubtractionGrid = ({
    minuend = 543,
    subtrahend = 278,
    showBorrows = true,
    showWorkings = true,
    interactive = false,
    onComplete = null,
    cellSize = '15gc',
    showStepHighlight = true,
    backgroundColor = '#f9f9f9',
    fontSize = '12gc',
    cellBackgroundColor = 'white',
    containerBorder = '2px solid #ddd',
    showContainerBorder = false,
    lineColor = '#333',
    lineThickness = '2gc',
    cellBorderColor = '#ddd',
    cellBorderWidth = '1px',
    cellBorderStyle = 'solid',
    gridAlignment = 'center',
    minusSignPosition = 'default',
    incorrectCount = 0,
    mode = 'default',
    onCheck = null,
    onReset = null,
    onSelectionChange = null,
    inputCells = [],
    onInputChange = null,
    onInputValidation = null,
    hintText = '',
    practiceConfig: practiceConfigProp = {},
    onPracticeValidate = null,
    onPracticeComplete = null,
    guidedConfig: guidedConfigProp = {},
    onStepComplete = null,
    onGuidedComplete = null,
    animationConfig: animationConfigProp = {},
    onAnimationStep = null,
    onAnimationComplete = null,
    onBorrowOccur = null,
    dragDropConfig: dragDropConfigProp = {},
    onDragDropValidate = null,
    onDragDropComplete = null,
    theme = 'coloured-theme',
    disabled = false,
    minimalMode = false,
    hiddenCells = [],
    borrowStyle = {},
    minuendStyle = {},
    subtrahendStyle = {},
    differenceStyle = {},
    coordinates = null,
    position = null,
    showPlaceValueLabels = false,
    borrowColor = '#FF5722',
    minuendColor = '#4ECDC4',
    subtrahendColor = '#2196F3',
    differenceColor = '#E91E63'
  }) => {
    
    console.log('🔍 [LongSubtractionGrid] Component created with props:', {
      theme, hiddenCells, minuend, subtrahend, mode
    });
    
    // Merge config props with defaults
    const practiceConfig = {
      validateOnChange: false,
      showAllErrors: true,
      editableTypes: ['borrow', 'difference'],
      prefillCells: [],
      ...practiceConfigProp
    };
    
    const guidedConfig = {
      autoAdvance: true,
      showHints: true,
      hintPosition: 'bottom',
      hintCoordinates: null,
      stepOrder: 'rtl',
      allowSkip: false,
      showDigitPanel: true,
      digitPanelCoordinates: null,
      digitPanelOrientation: 'horizontal',
      allowedDigits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      editableTypes: ['borrow', 'difference'],
      highlightBorrowSource: true,
      ...guidedConfigProp
    };
    
    const animationConfig = {
      autoPlay: false,
      speed: 1000,
      showControls: true,
      highlightDuration: 500,
      digitAnimation: 'scale',
      delayBetweenSteps: 2000,
      delayAfterHighlight: 600,
      delayAfterBorrow: 800,
      delayAfterStrikethrough: 600,
      delayAfterRegroup: 800,
      delayAfterSubtract: null,
      delayAfterSettle: null,
      delayAfterComplete: null,
      borrowAnimationDuration: 1200,
      strikethroughDuration: 500,
      wiggleDuration: 1500,
      ...animationConfigProp
    };
    
    const dragDropConfig = {
      validateOnDrop: true,
      showDigitBank: true,
      digitBankPosition: 'right',
      allowedDigits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      editableTypes: ['borrow', 'difference'],
      ...dragDropConfigProp
    };
    
    // ===== STATE =====
    const [userInputs, setUserInputs] = React.useState({});
    const [completedSteps, setCompletedSteps] = React.useState(new Set());
    const [incorrectCells, setIncorrectCells] = React.useState(new Set());
    const [currentTheme, setCurrentTheme] = React.useState(theme);
    const [allCorrect, setAllCorrect] = React.useState(false);
    
    // SpotIncorrect mode state
    const [selectedCells, setSelectedCells] = React.useState(new Set());
    const [checkResult, setCheckResult] = React.useState(null);
    const [incorrectValues, setIncorrectValues] = React.useState({});
    
    // Input mode state
    const [inputValues, setInputValues] = React.useState({});
    const [inputValidation, setInputValidation] = React.useState({});
    const [focusedCell, setFocusedCell] = React.useState(null);
    const inputRefs = React.useRef({});
    
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
    const [selectedColumn, setSelectedColumn] = React.useState(null);
    
    // Guided mode drag state
    const [guidedDraggedDigit, setGuidedDraggedDigit] = React.useState(null);
    const [guidedDragPosition, setGuidedDragPosition] = React.useState({ x: 0, y: 0 });
    const [isGuidedDragging, setIsGuidedDragging] = React.useState(false);
    
    // Wiggling cells for incorrect input
    const [wigglingCells, setWigglingCells] = React.useState(new Set());
    
    // Strikethrough cells (for borrowing visualization)
    const [strikethroughCells, setStrikethroughCells] = React.useState(new Set());
    
    // Regrouped values display (showing +10 values)
    const [regroupedDisplayValues, setRegroupedDisplayValues] = React.useState(new Map());
    
    // Flying borrow animation state
    const [flyingBorrow, setFlyingBorrow] = React.useState(null);
    
    // Borrow indicator states (for showing -1 and +10 labels)
    const [borrowIndicators, setBorrowIndicators] = React.useState(null);
    
    // Cells currently being animated for borrow (source and target)
    const [borrowSourceCell, setBorrowSourceCell] = React.useState(null);
    const [borrowTargetCell, setBorrowTargetCell] = React.useState(null);
    
    // Bouncing digit animation state for subtraction
    const [bouncingDigit, setBouncingDigit] = React.useState(null);
    const [impactCell, setImpactCell] = React.useState(null);
    
    // Animation mode state
    const [animationStepIndex, setAnimationStepIndex] = React.useState(0);
    const [animationPlaying, setAnimationPlaying] = React.useState(false);
    const [animationSteps, setAnimationSteps] = React.useState([]);
    const [animationComplete, setAnimationComplete] = React.useState(false);
    const [visibleCells, setVisibleCells] = React.useState(new Set());
    const [highlightedCell, setHighlightedCell] = React.useState(null);
    const [highlightedCells, setHighlightedCells] = React.useState(new Set());
    const animationTimerRef = React.useRef(null);
    const animationStepsRef = React.useRef([]);
    
    // New animation states for improved visual communication
    const [wiggleCell, setWiggleCell] = React.useState(null);      // Cell to wiggle (can't subtract)
    const [checkingCell, setCheckingCell] = React.useState(null);  // Cell being checked (is it 0?)
    const [findingCell, setFindingCell] = React.useState(null);    // Cell found for borrowing
    
    // DragDrop mode state
    const [draggedDigit, setDraggedDigit] = React.useState(null);
    const [dragPosition, setDragPosition] = React.useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragOverCell, setDragOverCell] = React.useState(null);
    const [dragDropValues, setDragDropValues] = React.useState({});
    const [dragDropValidation, setDragDropValidation] = React.useState({});
    const [dragDropComplete, setDragDropComplete] = React.useState(false);
    
    const dragDropCellKeysRef = React.useRef([]);
    
    // State for dynamic operands (can be updated via callbacks)
    const [currentMinuend, setCurrentMinuend] = React.useState(minuend);
    const [currentSubtrahend, setCurrentSubtrahend] = React.useState(subtrahend);
    
    // Update state when props change
    React.useEffect(() => {
      setCurrentMinuend(minuend);
      setCurrentSubtrahend(subtrahend);
    }, [minuend, subtrahend]);
    
    // Reset guided mode when operands change
    React.useEffect(() => {
      if (mode === 'guided') {
        setGuidedStepIndex(0);
        setGuidedValues({});
        setGuidedValidation({});
        setGuidedComplete(false);
      }
      // Reset animation mode when operands change
      if (mode === 'animation') {
        setAnimationStepIndex(0);
        setAnimationPlaying(false);
        setAnimationComplete(false);
        setVisibleCells(new Set());
        setHighlightedCells(new Set());
        setStrikethroughCells(new Set());
        setRegroupedDisplayValues(new Map());
        setFlyingBorrow(null);
        setBouncingDigit(null);
        setImpactCell(null);
      }
    }, [currentMinuend, currentSubtrahend, mode]);
    
    // Expose update function via callbacks
    React.useEffect(() => {
      if (typeof window !== 'undefined') {
        window.longSubtractionGridUpdateOperands = (newMinuend, newSubtrahend) => {
          if (typeof newMinuend === 'number' && newMinuend >= 0 && 
              typeof newSubtrahend === 'number' && newSubtrahend >= 0) {
            setCurrentMinuend(newMinuend);
            setCurrentSubtrahend(newSubtrahend);
          }
        };
      }
      return () => {
        if (typeof window !== 'undefined') {
          window.longSubtractionGridUpdateOperands = null;
        }
      };
    }, []);
    
    // Calculate subtraction data
    const data = React.useMemo(() => calculateLongSubtraction(currentMinuend, currentSubtrahend), [currentMinuend, currentSubtrahend]);
    
    // Convert gc units to pixels
    const gcToPx = React.useCallback((gcValue) => {
      if (typeof gcValue === 'number') return gcValue;
      if (typeof gcValue === 'string') {
        const match = gcValue.match(/^([\d.]+)gc$/);
        if (match) {
          return parseFloat(match[1]) * 3;
        }
        return parseFloat(gcValue) || 30;
      }
      return 30;
    }, []);
    
    const cellSizePx = gcToPx(cellSize);
    const fontSizePx = gcToPx(fontSize);
    
    // ===== THEME STYLES =====
    const getThemeStyles = React.useCallback(() => {
      const themes = {
        'coloured-theme': {
          borrow: { color: borrowColor, backgroundColor: 'rgba(255, 87, 34, 0.1)' },
          minuend: { color: minuendColor, backgroundColor: 'rgba(78, 205, 196, 0.1)' },
          subtrahend: { color: subtrahendColor, backgroundColor: 'rgba(33, 150, 243, 0.1)' },
          difference: { color: differenceColor, backgroundColor: 'rgba(233, 30, 99, 0.1)' },
          minus: { color: '#333' }
        },
        'white-theme': {
          borrow: { color: '#333', backgroundColor: 'white' },
          minuend: { color: '#333', backgroundColor: 'white' },
          subtrahend: { color: '#333', backgroundColor: 'white' },
          difference: { color: '#333', backgroundColor: 'white' },
          minus: { color: '#333' }
        },
        'button-theme': {
          borrow: { color: '#333', backgroundColor: '#e0e0e0', cursor: 'pointer' },
          minuend: { color: '#333', backgroundColor: '#e0e0e0', cursor: 'pointer' },
          subtrahend: { color: '#333', backgroundColor: '#e0e0e0', cursor: 'pointer' },
          difference: { color: '#333', backgroundColor: '#e0e0e0', cursor: 'pointer' },
          minus: { color: '#333' }
        }
      };
      return themes[currentTheme] || themes['coloured-theme'];
    }, [currentTheme, borrowColor, minuendColor, subtrahendColor, differenceColor]);
    
    const themeStyles = getThemeStyles();
    
    // ===== GET CORRECT VALUE FOR CELL =====
    const getCorrectValueForCell = React.useCallback((key) => {
      const borrowMatch = key.match(/^borrow-(\d+)$/);
      if (borrowMatch) {
        const idx = parseInt(borrowMatch[1]);
        return data.borrows[idx] ? 1 : 0;
      }
      
      const minuendMatch = key.match(/^minuend-(\d+)$/);
      if (minuendMatch) {
        const idx = parseInt(minuendMatch[1]);
        return data.minuendDigits[idx] ?? null;
      }
      
      const subtrahendMatch = key.match(/^subtrahend-(\d+)$/);
      if (subtrahendMatch) {
        const idx = parseInt(subtrahendMatch[1]);
        return data.subtrahendDigits[idx] ?? null;
      }
      
      const differenceMatch = key.match(/^difference-(\d+)$/);
      if (differenceMatch) {
        const idx = parseInt(differenceMatch[1]);
        return data.differenceDigits[idx] ?? null;
      }
      
      const regroupedMatch = key.match(/^regrouped-(\d+)$/);
      if (regroupedMatch) {
        const idx = parseInt(regroupedMatch[1]);
        return data.regroupedMinuend[idx] ?? null;
      }
      
      return null;
    }, [data]);
    
    // ===== INCORRECT VALUES GENERATION =====
    React.useEffect(() => {
      if (mode === 'spotIncorrect' && incorrectCount > 0) {
        const newIncorrectValues = {};
        const allCellKeys = [];
        
        // Collect difference cells
        data.differenceDigits.forEach((_, idx) => {
          allCellKeys.push(`difference-${idx}`);
        });
        
        // Collect borrow indicators (only where borrowing occurred)
        data.borrows.forEach((hasBorrow, idx) => {
          if (hasBorrow) {
            allCellKeys.push(`borrow-${idx}`);
          }
        });
        
        // Randomly select cells to make incorrect
        const shuffled = [...allCellKeys].sort(() => Math.random() - 0.5);
        const selectedKeys = shuffled.slice(0, Math.min(incorrectCount, allCellKeys.length));
        
        selectedKeys.forEach(key => {
          const correctValue = getCorrectValueForCell(key);
          if (correctValue !== null) {
            let incorrectValue;
            do {
              incorrectValue = Math.floor(Math.random() * 10);
            } while (incorrectValue === correctValue);
            newIncorrectValues[key] = incorrectValue;
          }
        });
        
        setIncorrectValues(newIncorrectValues);
      }
    }, [mode, incorrectCount, data, getCorrectValueForCell]);
    
    // ===== SPOTINCORRECT MODE =====
    const handleCellClick = React.useCallback((key) => {
      if (mode !== 'spotIncorrect') return;
      if (checkResult) return;
      
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
    }, [mode, checkResult, onSelectionChange]);
    
    const handleCheck = React.useCallback(() => {
      if (mode !== 'spotIncorrect') return;
      
      const incorrectKeys = Object.keys(incorrectValues);
      const selectedArray = Array.from(selectedCells);
      
      const correctSelections = selectedArray.filter(key => incorrectKeys.includes(key));
      const incorrectSelections = selectedArray.filter(key => !incorrectKeys.includes(key));
      const missedIncorrect = incorrectKeys.filter(key => !selectedArray.includes(key));
      
      const isAllCorrect = correctSelections.length === incorrectKeys.length && incorrectSelections.length === 0;
      
      setCheckResult({
        correct: correctSelections,
        incorrect: incorrectSelections,
        missed: missedIncorrect,
        allCorrect: isAllCorrect
      });
      
      setAllCorrect(isAllCorrect);
      
      if (isAllCorrect) {
        setCurrentTheme('coloured-theme');
      }
      
      if (onCheck) {
        onCheck({
          correct: correctSelections,
          incorrect: incorrectSelections,
          missed: missedIncorrect,
          allCorrect: isAllCorrect
        });
      }
    }, [mode, incorrectValues, selectedCells, onCheck]);
    
    const handleReset = React.useCallback(() => {
      setSelectedCells(new Set());
      setCheckResult(null);
      setAllCorrect(false);
      setCurrentTheme(theme);
      
      if (onReset) {
        onReset();
      }
    }, [theme, onReset]);
    
    // ===== INPUT MODE =====
    const handleInput = React.useCallback((key, value) => {
      const numValue = value === '' ? null : parseInt(value);
      
      setInputValues(prev => ({
        ...prev,
        [key]: numValue
      }));
      
      const correctValue = getCorrectValueForCell(key);
      const isCorrect = numValue === correctValue;
      
      setInputValidation(prev => ({
        ...prev,
        [key]: { isCorrect, correctValue, userValue: numValue }
      }));
      
      if (onInputChange) {
        onInputChange(key, numValue);
      }
      
      if (onInputValidation) {
        onInputValidation(key, isCorrect, correctValue, numValue);
      }
    }, [getCorrectValueForCell, onInputChange, onInputValidation]);
    
    const checkInputs = React.useCallback(() => {
      const results = {};
      let allCorrect = true;
      
      inputCells.forEach(key => {
        const userValue = inputValues[key];
        const correctValue = getCorrectValueForCell(key);
        const isCorrect = userValue === correctValue;
        
        results[key] = { isCorrect, correctValue, userValue };
        if (!isCorrect) allCorrect = false;
      });
      
      setInputValidation(results);
      setAllCorrect(allCorrect);
      
      return { results, allCorrect };
    }, [inputCells, inputValues, getCorrectValueForCell]);
    
    // ===== PRACTICE MODE =====
    const generatePracticeCells = React.useCallback(() => {
      const cells = [];
      const editableTypes = practiceConfig.editableTypes || ['borrow', 'difference'];
      
      if (editableTypes.includes('borrow')) {
        data.borrows.forEach((hasBorrow, idx) => {
          if (hasBorrow) {
            cells.push({
              key: `borrow-${idx}`,
              type: 'borrow',
              correctValue: 1
            });
          }
        });
      }
      
      if (editableTypes.includes('difference')) {
        data.differenceDigits.forEach((digit, idx) => {
          cells.push({
            key: `difference-${idx}`,
            type: 'difference',
            correctValue: digit
          });
        });
      }
      
      return cells;
    }, [data, practiceConfig.editableTypes]);
    
    const validatePractice = React.useCallback(() => {
      const cells = generatePracticeCells();
      const results = {};
      let correctCount = 0;
      let incorrectCount = 0;
      let emptyCount = 0;
      
      cells.forEach(cell => {
        const userValue = practiceValues[cell.key];
        if (userValue === undefined || userValue === null) {
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
      
      setPracticeValidation(results);
      
      const isComplete = emptyCount === 0 && incorrectCount === 0;
      setPracticeComplete(isComplete);
      
      if (onPracticeValidate) {
        onPracticeValidate({
          results,
          correctCount,
          incorrectCount,
          emptyCount,
          isComplete
        });
      }
      
      if (isComplete && onPracticeComplete) {
        onPracticeComplete();
      }
      
      return { results, correctCount, incorrectCount, emptyCount, isComplete };
    }, [generatePracticeCells, practiceValues, onPracticeValidate, onPracticeComplete]);
    
    const resetPractice = React.useCallback(() => {
      setPracticeValues({});
      setPracticeValidation({});
      setPracticeComplete(false);
    }, []);
    
    // ===== GUIDED MODE =====
    const generateGuidedSteps = React.useCallback(() => {
      const steps = [];
      const editableTypes = guidedConfig.editableTypes || ['borrow', 'difference'];
      const totalColumns = data.totalColumns;
      
      // Step 0: Column selection (first step)
      steps.push({
        type: 'selectColumn',
        description: 'Select the column to subtract first',
        hint: 'Click on a column to start subtracting. Usually, we start with the ones column (rightmost).',
        columnName: null,
        availableColumns: Array.from({ length: totalColumns }, (_, i) => {
          const col = totalColumns - 1 - i; // Right to left: ones, tens, hundreds
          return {
            index: col,
            name: col === totalColumns - 1 ? 'ones' : 
                  col === totalColumns - 2 ? 'tens' : 
                  col === totalColumns - 3 ? 'hundreds' : `column ${totalColumns - col}`
          };
        })
      });
      
      // Process columns from right to left
      for (let col = totalColumns - 1; col >= 0; col--) {
        const columnName = col === totalColumns - 1 ? 'ones' : 
                          col === totalColumns - 2 ? 'tens' : 
                          col === totalColumns - 3 ? 'hundreds' : `column ${totalColumns - col}`;
        
        const minuendDigit = data.minuendDigits[col];
        const subtrahendDigit = data.subtrahendDigits[col];
        const needsBorrow = data.borrows[col];
        const regroupedValue = data.regroupedMinuend[col];
        const differenceDigit = data.differenceDigits[col];
        
        // Step 1: Highlight column
        const highlightCells = [
          { key: `minuend-${col}`, value: minuendDigit },
          { key: `subtrahend-${col}`, value: subtrahendDigit }
        ];
        
        steps.push({
          type: 'highlight',
          cells: highlightCells,
          description: `Step 1: Highlight ${columnName} digits`,
          columnName: columnName,
          columnIndex: col,
          minuendDigit: minuendDigit,
          subtrahendDigit: subtrahendDigit
        });
        
        // Step 2: If borrowing is needed
        if (needsBorrow) {
          // Find where we borrow from
          let borrowFromCol = col - 1;
          while (borrowFromCol >= 0 && data.minuendDigits[borrowFromCol] === 0) {
            borrowFromCol--;
          }
          
          if (borrowFromCol >= 0) {
            steps.push({
              type: 'borrow',
              borrowFromCol: borrowFromCol,
              borrowToCol: col,
              description: `Step 2: Borrow from ${borrowFromCol === totalColumns - 2 ? 'tens' : borrowFromCol === totalColumns - 3 ? 'hundreds' : 'left'} column`,
              hint: `${minuendDigit} is less than ${subtrahendDigit}, so we need to borrow. Take 1 from the ${borrowFromCol === totalColumns - 2 ? 'tens' : 'left'} column.`,
              columnIndex: col,
              originalValue: minuendDigit,
              regroupedValue: regroupedValue
            });
            
            // Step 2b: Show regrouped value
            steps.push({
              type: 'regroup',
              cellKey: `minuend-${col}`,
              originalValue: minuendDigit,
              regroupedValue: regroupedValue,
              description: `Step 2b: ${minuendDigit} becomes ${regroupedValue}`,
              hint: `After borrowing, ${minuendDigit} + 10 = ${regroupedValue}`,
              columnIndex: col
            });
          }
        }
        
        // Step 3: Enter difference digit
        if (editableTypes.includes('difference')) {
          const topValue = needsBorrow ? regroupedValue : minuendDigit;
          steps.push({
            type: 'difference',
            cellKey: `difference-${col}`,
            correctValue: differenceDigit,
            hint: `${topValue} - ${subtrahendDigit} = ${differenceDigit}`,
            description: `Step 3: Enter difference digit ${differenceDigit}`,
            columnIndex: col,
            calculation: `${topValue} - ${subtrahendDigit}`
          });
        }
      }
      
      return steps;
    }, [data, guidedConfig.editableTypes]);
    
    const getCurrentGuidedStep = React.useCallback(() => {
      if (guidedSteps[guidedStepIndex]?.type === 'selectColumn') {
        return guidedSteps[guidedStepIndex];
      }
      
      if (selectedColumn !== null) {
        const filteredSteps = guidedSteps.filter(step => 
          step.type === 'selectColumn' || step.columnIndex === selectedColumn
        );
        const selectColumnIndex = filteredSteps.findIndex(s => s.type === 'selectColumn');
        const adjustedIndex = guidedStepIndex > selectColumnIndex ? guidedStepIndex - 1 : guidedStepIndex;
        return filteredSteps[adjustedIndex] || null;
      }
      
      return guidedSteps[guidedStepIndex] || null;
    }, [guidedSteps, guidedStepIndex, selectedColumn]);
    
    const handleSelectColumn = React.useCallback((columnIndex) => {
      setSelectedColumn(columnIndex);
      if (guidedConfig.autoAdvance) {
        setTimeout(() => {
          advanceGuidedStep();
        }, 300);
      }
    }, [guidedConfig.autoAdvance]);
    
    const advanceGuidedStep = React.useCallback(() => {
      if (guidedStepIndex < guidedSteps.length - 1) {
        setGuidedStepIndex(prev => {
          const newIndex = prev + 1;
          if (onStepComplete) {
            onStepComplete(prev, guidedSteps.length);
          }
          return newIndex;
        });
      } else {
        setGuidedComplete(true);
        if (onGuidedComplete) onGuidedComplete();
      }
    }, [guidedStepIndex, guidedSteps.length, onStepComplete, onGuidedComplete]);
    
    const skipGuidedStep = React.useCallback(() => {
      if (!guidedConfig.allowSkip) return;
      
      const currentStep = getCurrentGuidedStep();
      if (currentStep) {
        setGuidedValues(prev => ({
          ...prev,
          [currentStep.cellKey]: currentStep.correctValue
        }));
        advanceGuidedStep();
      }
    }, [guidedConfig.allowSkip, getCurrentGuidedStep, advanceGuidedStep]);
    
    const resetGuided = React.useCallback(() => {
      setGuidedStepIndex(0);
      setGuidedComplete(false);
      setGuidedValues({});
      setGuidedValidation({});
      setSelectedColumn(null);
      setStrikethroughCells(new Set());
      setRegroupedDisplayValues(new Map());
    }, []);
    
    // Initialize guided steps
    React.useEffect(() => {
      if (mode === 'guided') {
        const steps = generateGuidedSteps();
        setGuidedSteps(steps);
        setGuidedStepIndex(0);
        setGuidedValues({});
        setGuidedValidation({});
        setGuidedComplete(false);
      }
    }, [mode, currentMinuend, currentSubtrahend]);
    
    // Auto-advance highlight steps
    React.useEffect(() => {
      if (mode === 'guided' && guidedSteps.length > 0 && guidedStepIndex < guidedSteps.length) {
        const currentStep = guidedSteps[guidedStepIndex];
        if (currentStep && currentStep.type === 'highlight' && guidedConfig.autoAdvance) {
          const highlightTimer = setTimeout(() => {
            if (guidedStepIndex < guidedSteps.length - 1) {
              advanceGuidedStep();
            }
          }, 1500);
          
          return () => clearTimeout(highlightTimer);
        }
      }
    }, [mode, guidedSteps, guidedStepIndex, guidedConfig.autoAdvance, advanceGuidedStep]);
    
    // ===== ANIMATION MODE =====
    const generateAnimationSteps = React.useCallback(() => {
      const steps = [];
      const totalColumns = data.totalColumns;
      
      console.log(`🎬 [generateAnimationSteps] totalColumns: ${totalColumns}`);
      console.log(`🎬 [generateAnimationSteps] data.borrows:`, data.borrows);
      console.log(`🎬 [generateAnimationSteps] data.borrowDetails:`, data.borrowDetails);
      
      // Helper to get column name
      const getColumnName = (col) => {
        if (col === totalColumns - 1) return 'ones';
        if (col === totalColumns - 2) return 'tens';
        if (col === totalColumns - 3) return 'hundreds';
        if (col === totalColumns - 4) return 'thousands';
        return `column ${totalColumns - col}`;
      };
      
      // Track the working values of minuend digits (changes as we borrow)
      const workingMinuend = [...data.minuendDigits];
      
      // Track which columns have been borrowed from
      const borrowedFromCols = new Set();
      
      // Process each column from right to left
      for (let col = totalColumns - 1; col >= 0; col--) {
        const columnName = getColumnName(col);
        
        console.log(`🎬 [generateAnimationSteps] Processing col ${col} (${columnName})`);
        
        const originalMinuendDigit = data.minuendDigits[col];
        const subtrahendDigit = data.subtrahendDigits[col];
        const needsBorrow = data.borrows[col];
        const finalRegroupedValue = data.regroupedMinuend[col];
        const differenceDigit = data.differenceDigits[col];
        
        // Step 1: Highlight column cells - "Let's look at this column"
        steps.push({
          type: 'highlight',
          cells: [
            { key: `minuend-${col}`, value: originalMinuendDigit },
            { key: `subtrahend-${col}`, value: subtrahendDigit }
          ],
          description: `📍 ${columnName.charAt(0).toUpperCase() + columnName.slice(1)} column: Can we subtract ${subtrahendDigit} from ${workingMinuend[col]}?`,
          columnName: columnName,
          columnIndex: col
        });
        
        // Step 2: If borrowing is needed
        if (needsBorrow) {
          // Step 2a: PROBLEM - Show that we CAN'T subtract (wiggle the top digit in red)
          steps.push({
            type: 'cantSubtract',
            cellKey: `minuend-${col}`,
            topValue: originalMinuendDigit,
            bottomValue: subtrahendDigit,
            description: `❌ Problem: ${originalMinuendDigit} is less than ${subtrahendDigit}. We cannot subtract! We need to borrow.`,
            columnIndex: col
          });
          
          // Find the borrow detail for this column
          const borrowDetail = data.borrowDetails.find(bd => bd.borrowToCol === col);
          
          if (borrowDetail) {
            const { borrowFromCol, cascadeThrough } = borrowDetail;
            
            // If there are cascade columns (borrowing through zeros)
            if (cascadeThrough && cascadeThrough.length > 0) {
              const adjacentCol = col - 1;
              const adjacentColumnName = getColumnName(adjacentCol);
              
              // Step 2b: Check adjacent column - it's 0!
              steps.push({
                type: 'checkZero',
                cellKey: `minuend-${adjacentCol}`,
                columnIndex: adjacentCol,
                description: `🔍 Look at ${adjacentColumnName}: It's 0! We can't borrow from 0.`,
                zeroColumnName: adjacentColumnName
              });
              
              // Step 2c: Look for next available column
              const sourceColumnName = getColumnName(borrowFromCol);
              steps.push({
                type: 'findSource',
                cellKey: `minuend-${borrowFromCol}`,
                columnIndex: borrowFromCol,
                sourceValue: data.minuendDigits[borrowFromCol],
                description: `🔎 Look further left: Found ${data.minuendDigits[borrowFromCol]} in ${sourceColumnName}! We can borrow from here.`,
                sourceColumnName: sourceColumnName
              });
              
              // Step 2d: Borrow from source to cascade column (hundreds → tens)
              steps.push({
                type: 'borrow',
                borrowFromCol: borrowFromCol,
                borrowToCol: cascadeThrough[0],
                borrowFromKey: `minuend-${borrowFromCol}`,
                borrowToKey: `minuend-${cascadeThrough[0]}`,
                description: `➡️ Borrow 1 from ${sourceColumnName} (${data.minuendDigits[borrowFromCol]}) to ${adjacentColumnName}`,
                columnIndex: col,
                isCascadeStart: true
              });
              
              // Step 2e: Strikethrough source digit
              steps.push({
                type: 'strikethrough',
                cellKey: `minuend-${borrowFromCol}`,
                columnIndex: borrowFromCol,
                originalValue: data.minuendDigits[borrowFromCol],
                newValue: data.regroupedMinuend[borrowFromCol],
                description: `✏️ Cross out ${data.minuendDigits[borrowFromCol]}, write ${data.regroupedMinuend[borrowFromCol]} above (${data.minuendDigits[borrowFromCol]} - 1 = ${data.regroupedMinuend[borrowFromCol]})`
              });
              
              // Step 2f: Show 10 in cascade column
              steps.push({
                type: 'regroup',
                cellKey: `minuend-${cascadeThrough[0]}`,
                columnIndex: cascadeThrough[0],
                originalValue: 0,
                regroupedValue: 10,
                description: `✨ The 0 in ${adjacentColumnName} becomes 10 (borrowed 1 ${sourceColumnName} = 10 ${adjacentColumnName})`
              });
              
              // Step 2g: Now borrow from cascade column to target
              steps.push({
                type: 'borrow',
                borrowFromCol: cascadeThrough[0],
                borrowToCol: col,
                borrowFromKey: `minuend-${cascadeThrough[0]}`,
                borrowToKey: `minuend-${col}`,
                description: `➡️ Now borrow 1 from ${adjacentColumnName} (10) to ${columnName}`,
                columnIndex: col,
                isCascadeContinue: true
              });
              
              // Step 2h: Strikethrough the 10
              steps.push({
                type: 'strikethrough',
                cellKey: `minuend-${cascadeThrough[0]}`,
                columnIndex: cascadeThrough[0],
                originalValue: 10,
                newValue: 9,
                description: `✏️ Cross out 10, write 9 above (10 - 1 = 9)`,
                isSecondStrikethrough: true
              });
              
              // Step 2i: Strikethrough the target digit (e.g., 3)
              steps.push({
                type: 'strikethrough',
                cellKey: `minuend-${col}`,
                columnIndex: col,
                originalValue: originalMinuendDigit,
                newValue: finalRegroupedValue,
                description: `✏️ Cross out ${originalMinuendDigit} in ${columnName}`,
                isTargetStrikethrough: true
              });
              
              // Step 2j: Show regrouped value in target column (e.g., 13)
              steps.push({
                type: 'regroup',
                cellKey: `minuend-${col}`,
                columnIndex: col,
                originalValue: originalMinuendDigit,
                regroupedValue: finalRegroupedValue,
                description: `✨ Write ${finalRegroupedValue} above (${originalMinuendDigit} + 10 = ${finalRegroupedValue})`
              });
              
            } else {
              // Simple borrow (no cascade through zeros)
              const sourceColumnName = getColumnName(borrowFromCol);
              
              // Step 2b: Look at adjacent column - we CAN borrow
              steps.push({
                type: 'findSource',
                cellKey: `minuend-${borrowFromCol}`,
                columnIndex: borrowFromCol,
                sourceValue: data.minuendDigits[borrowFromCol],
                description: `🔍 Look at ${sourceColumnName}: It has ${data.minuendDigits[borrowFromCol]}. We can borrow from here!`,
                sourceColumnName: sourceColumnName
              });
              
              // Step 2c: Flying borrow animation
              steps.push({
                type: 'borrow',
                borrowFromCol: borrowFromCol,
                borrowToCol: col,
                borrowFromKey: `minuend-${borrowFromCol}`,
                borrowToKey: `minuend-${col}`,
                description: `➡️ Borrow 1 from ${sourceColumnName} (${data.minuendDigits[borrowFromCol]}) to ${columnName}`,
                columnIndex: col
              });
              
              // Step 2d: Strikethrough original digit
              const sourceOriginal = borrowedFromCols.has(borrowFromCol) 
                ? workingMinuend[borrowFromCol] 
                : data.minuendDigits[borrowFromCol];
              const sourceNew = data.regroupedMinuend[borrowFromCol];
              
              steps.push({
                type: 'strikethrough',
                cellKey: `minuend-${borrowFromCol}`,
                columnIndex: borrowFromCol,
                originalValue: sourceOriginal,
                newValue: sourceNew,
                description: `✏️ Cross out ${sourceOriginal}, write ${sourceNew} above (${sourceOriginal} - 1 = ${sourceNew})`
              });
              
              // Update working value
              workingMinuend[borrowFromCol] = sourceNew;
              borrowedFromCols.add(borrowFromCol);
              
              // Step 2e: Strikethrough the target digit (e.g., 3)
              steps.push({
                type: 'strikethrough',
                cellKey: `minuend-${col}`,
                columnIndex: col,
                originalValue: originalMinuendDigit,
                newValue: finalRegroupedValue,
                description: `✏️ Cross out ${originalMinuendDigit} in ${columnName}`,
                isTargetStrikethrough: true
              });
              
              // Step 2f: Show regrouped value (e.g., 13)
              steps.push({
                type: 'regroup',
                cellKey: `minuend-${col}`,
                columnIndex: col,
                originalValue: originalMinuendDigit,
                regroupedValue: finalRegroupedValue,
                description: `✨ Write ${finalRegroupedValue} above (${originalMinuendDigit} + 10 = ${finalRegroupedValue})`
              });
            }
          }
        }
        
        // Step 3: Now we can subtract!
        const topValue = needsBorrow ? finalRegroupedValue : workingMinuend[col];
        steps.push({
          type: 'subtract',
          minuendKey: `minuend-${col}`,
          subtrahendKey: `subtrahend-${col}`,
          differenceKey: `difference-${col}`,
          topValue: topValue,
          bottomValue: subtrahendDigit,
          result: differenceDigit,
          description: `✅ Now subtract: ${topValue} - ${subtrahendDigit} = ${differenceDigit}`,
          columnIndex: col
        });
        
        // Step 4: Write the result
        steps.push({
          type: 'settle',
          cellKey: `difference-${col}`,
          value: differenceDigit,
          description: `📝 Write ${differenceDigit} in the ${columnName} place`,
          columnIndex: col
        });
      }
      
      // Add completion step
      steps.push({
        type: 'complete',
        description: `🎉 Done! ${currentMinuend} - ${currentSubtrahend} = ${data.finalAnswer}`
      });
      
      console.log(`🎬 [generateAnimationSteps] Total steps generated: ${steps.length}`);
      
      return steps;
    }, [data, currentMinuend, currentSubtrahend]);
    
    const playAnimationStep = React.useCallback((stepIndex) => {
      if (stepIndex >= animationSteps.length) {
        setAnimationComplete(true);
        setAnimationPlaying(false);
        setHighlightedCell(null);
        setHighlightedCells(new Set());
        if (onAnimationComplete) onAnimationComplete();
        return;
      }
      
      const step = animationSteps[stepIndex];
      
      console.log(`🎬 [LongSubtractionGrid] Playing step ${stepIndex}:`, {
        type: step.type,
        description: step.description
      });
      
      if (onAnimationStep) {
        onAnimationStep(stepIndex, animationSteps.length);
      }
      
      setAnimationStepIndex(stepIndex);
    }, [animationSteps, onAnimationStep, onAnimationComplete]);
    
    const playAnimation = React.useCallback(() => {
      if (animationComplete) {
        setAnimationStepIndex(0);
        setVisibleCells(new Set());
        setAnimationComplete(false);
        setStrikethroughCells(new Set());
        setRegroupedDisplayValues(new Map());
      }
      setAnimationPlaying(true);
    }, [animationComplete]);
    
    const pauseAnimation = React.useCallback(() => {
      setAnimationPlaying(false);
    }, []);
    
    const stepForwardAnimation = React.useCallback(() => {
      if (animationStepIndex < animationSteps.length - 1) {
        playAnimationStep(animationStepIndex + 1);
      }
    }, [animationStepIndex, animationSteps.length, playAnimationStep]);
    
    const stepBackwardAnimation = React.useCallback(() => {
      if (animationStepIndex > 0) {
        setAnimationStepIndex(animationStepIndex - 1);
      }
    }, [animationStepIndex]);
    
    const resetAnimation = React.useCallback(() => {
      setAnimationStepIndex(0);
      setAnimationPlaying(false);
      setAnimationComplete(false);
      setVisibleCells(new Set());
      setHighlightedCell(null);
      setHighlightedCells(new Set());
      setStrikethroughCells(new Set());
      setRegroupedDisplayValues(new Map());
      setFlyingBorrow(null);
      setBorrowIndicators(null);
      setBorrowSourceCell(null);
      setBorrowTargetCell(null);
      setBouncingDigit(null);
      setImpactCell(null);
      // Clear new animation states
      setWiggleCell(null);
      setCheckingCell(null);
      setFindingCell(null);
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
    }, []);
    
    // Animation playback effect
    React.useEffect(() => {
      if (mode === 'animation' && animationPlaying && !animationComplete) {
        const currentSteps = animationStepsRef.current;
        const currentStep = currentSteps[animationStepIndex];
        if (currentStep) {
          console.log(`🎬 [LongSubtractionGrid] Playing step ${animationStepIndex}:`, {
            type: currentStep.type,
            description: currentStep.description
          });
          
          if (onAnimationStep) {
            onAnimationStep(animationStepIndex, currentSteps.length);
          }
          
          if (currentStep.type === 'highlight') {
            const cellKeys = new Set(currentStep.cells.map(cell => cell.key));
            console.log(`🎬 [Highlight Animation] Highlighting cells:`, Array.from(cellKeys));
            setHighlightedCells(cellKeys);
            setHighlightedCell(null);
            // Clear any previous wiggle/error states
            setWiggleCell(null);
            setCheckingCell(null);
            setFindingCell(null);
          } else if (currentStep.type === 'cantSubtract') {
            // Show that we can't subtract - wiggle the top digit in red
            console.log(`🎬 [CantSubtract Animation] Wiggling ${currentStep.cellKey}`);
            setWiggleCell(currentStep.cellKey);
            setHighlightedCells(new Set([currentStep.cellKey]));
            
            // Clear wiggle after animation
            setTimeout(() => {
              setWiggleCell(null);
            }, 1200);
          } else if (currentStep.type === 'checkZero') {
            // Show checking the adjacent column (it's 0)
            console.log(`🎬 [CheckZero Animation] Checking ${currentStep.cellKey}`);
            setCheckingCell(currentStep.cellKey);
            setHighlightedCells(new Set([currentStep.cellKey]));
            
            // Clear after animation
            setTimeout(() => {
              setCheckingCell(null);
            }, 1000);
          } else if (currentStep.type === 'findSource') {
            // Show finding a valid source to borrow from
            console.log(`🎬 [FindSource Animation] Found ${currentStep.cellKey}`);
            setFindingCell(currentStep.cellKey);
            setHighlightedCells(new Set([currentStep.cellKey]));
            
            // Clear after animation
            setTimeout(() => {
              setFindingCell(null);
            }, 1000);
          } else if (currentStep.type === 'borrow') {
            // Flying borrow animation with visual indicators
            const { borrowFromKey, borrowToKey, borrowFromCol, borrowToCol } = currentStep;
            
            console.log(`🎬 [Borrow Animation] ${borrowFromKey} → ${borrowToKey}`);
            
            const sourceElement = document.querySelector(`[data-cell-key="${borrowFromKey}"]`);
            const targetElement = document.querySelector(`[data-cell-key="${borrowToKey}"]`);
            
            if (sourceElement && targetElement) {
              const sourceRect = sourceElement.getBoundingClientRect();
              const targetRect = targetElement.getBoundingClientRect();
              
              // Set cell highlight classes
              setBorrowSourceCell(borrowFromKey);
              setBorrowTargetCell(borrowToKey);
              
              // Create borrow indicators (-1 on source, +10 on target)
              setBorrowIndicators({
                source: {
                  x: sourceRect.left + sourceRect.width / 2,
                  y: sourceRect.top - 20,
                  text: '-1'
                },
                target: {
                  x: targetRect.left + targetRect.width / 2,
                  y: targetRect.top - 20,
                  text: '+10'
                }
              });
              
              // Start flying borrow animation
              setFlyingBorrow({
                value: 10,
                startX: sourceRect.left + sourceRect.width / 2,
                startY: sourceRect.top + sourceRect.height / 2,
                endX: targetRect.left + targetRect.width / 2,
                endY: targetRect.top + targetRect.height / 2
              });
              
              // Callback for borrow event
              if (onBorrowOccur) {
                onBorrowOccur(currentStep.columnIndex);
              }
              
              // Clean up after animation
              const borrowDuration = animationConfig.borrowAnimationDuration || 1200;
              setTimeout(() => {
                setFlyingBorrow(null);
                setBorrowIndicators(null);
                setBorrowSourceCell(null);
                setBorrowTargetCell(null);
              }, borrowDuration);
            }
          } else if (currentStep.type === 'strikethrough') {
            // Add strikethrough to the borrowed-from cell (original digit stays, just crossed out)
            setStrikethroughCells(prev => new Set([...prev, currentStep.cellKey]));
            
            // Reveal the regrouped value ABOVE the cell (in the regrouped row)
            const regroupedKey = `regrouped-${currentStep.columnIndex}`;
            setVisibleCells(prev => new Set([...prev, regroupedKey]));
            
            // Store the new value to display in the regrouped row
            setRegroupedDisplayValues(prev => {
              const newMap = new Map(prev);
              newMap.set(currentStep.cellKey, currentStep.newValue);
              return newMap;
            });
          } else if (currentStep.type === 'regroup') {
            // Show the regrouped value in the regrouped row above the minuend
            const regroupedKey = `regrouped-${currentStep.columnIndex}`;
            
            // Make the regrouped cell visible
            setVisibleCells(prev => new Set([...prev, regroupedKey]));
            
            // Store the regrouped display value
            setRegroupedDisplayValues(prev => {
              const newMap = new Map(prev);
              newMap.set(currentStep.cellKey, currentStep.regroupedValue);
              return newMap;
            });
            
            // Highlight both the original cell and the regrouped value
            setHighlightedCells(new Set([currentStep.cellKey, regroupedKey]));
          } else if (currentStep.type === 'subtract') {
            // Subtraction bounce animation
            const { minuendKey, subtrahendKey, differenceKey, result } = currentStep;
            
            console.log(`🎬 [Subtract Animation] ${minuendKey} - ${subtrahendKey} → ${differenceKey}`);
            
            const minuendElement = document.querySelector(`[data-cell-key="${minuendKey}"]`);
            const differenceElement = document.querySelector(`[data-cell-key="${differenceKey}"]`);
            
            if (minuendElement && differenceElement) {
              const startRect = minuendElement.getBoundingClientRect();
              const endRect = differenceElement.getBoundingClientRect();
              
              setBouncingDigit({
                value: result,
                startX: startRect.left + startRect.width / 2,
                startY: startRect.top + startRect.height / 2,
                endX: endRect.left + endRect.width / 2,
                endY: endRect.top + endRect.height / 2
              });
              
              // When bounce animation completes (800ms), make cell visible and show impact effect
              setTimeout(() => {
                setBouncingDigit(null);
                // Make difference cell visible exactly when bounce lands
                setVisibleCells(prev => new Set([...prev, differenceKey]));
                setImpactCell(differenceKey);
                setTimeout(() => setImpactCell(null), 400);
              }, 800);
            }
          } else if (currentStep.type === 'settle') {
            // Difference cell is already visible from subtract step, just ensure it's in the set
            setVisibleCells(prev => new Set([...prev, currentStep.cellKey]));
            setHighlightedCells(new Set());
            
            // Impact effect was already shown in subtract step, so just clear any lingering highlights
            // No need to show impact again since it was already shown when bounce landed
          } else if (currentStep.type === 'complete') {
            setHighlightedCell(null);
            setHighlightedCells(new Set());
          }
        }
      }
    }, [mode, animationPlaying, animationComplete, animationStepIndex, onAnimationStep, onBorrowOccur, animationConfig.borrowAnimationDuration]);
    
    // Animation playback interval
    React.useEffect(() => {
      if (mode === 'animation' && animationPlaying && !animationComplete) {
        const currentSteps = animationStepsRef.current;
        const currentStep = currentSteps[animationStepIndex];
        
        if (!currentStep) return;
        
        // Calculate delay based on step type
        let animationDuration = 0;
        let stepDelay = animationConfig.delayBetweenSteps || 2000;
        
        if (currentStep.type === 'highlight') {
          animationDuration = 400;
          stepDelay = animationConfig.delayAfterHighlight !== null ? animationConfig.delayAfterHighlight : stepDelay;
        } else if (currentStep.type === 'cantSubtract') {
          // Wiggle animation needs more time to show the problem
          animationDuration = animationConfig.wiggleDuration || 1500;
          stepDelay = 800; // Give time to read the message
        } else if (currentStep.type === 'checkZero') {
          // Checking a zero column
          animationDuration = 1000;
          stepDelay = 600;
        } else if (currentStep.type === 'findSource') {
          // Finding a valid source
          animationDuration = 1000;
          stepDelay = 600;
        } else if (currentStep.type === 'borrow') {
          animationDuration = animationConfig.borrowAnimationDuration || 1200;
          // No delay after borrow - strikethrough/regroup should follow immediately
          stepDelay = 0;
        } else if (currentStep.type === 'strikethrough') {
          animationDuration = animationConfig.strikethroughDuration || 500;
          // Check if previous step was borrow, strikethrough, or regroup (part of borrow sequence) - if so, no delay
          const prevStep = animationStepIndex > 0 ? currentSteps[animationStepIndex - 1] : null;
          if (prevStep && (prevStep.type === 'borrow' || prevStep.type === 'strikethrough' || prevStep.type === 'regroup')) {
            stepDelay = 0; // Immediate follow-up in borrow sequence
          } else {
            stepDelay = animationConfig.delayAfterStrikethrough !== null ? animationConfig.delayAfterStrikethrough : stepDelay;
          }
        } else if (currentStep.type === 'regroup') {
          animationDuration = 500;
          // Check if previous step was strikethrough, borrow, or regroup (part of borrow sequence) - if so, no delay
          const prevStep = animationStepIndex > 0 ? currentSteps[animationStepIndex - 1] : null;
          if (prevStep && (prevStep.type === 'strikethrough' || prevStep.type === 'borrow' || prevStep.type === 'regroup')) {
            stepDelay = 0; // Immediate follow-up in borrow sequence
          } else {
            stepDelay = animationConfig.delayAfterRegroup !== null ? animationConfig.delayAfterRegroup : stepDelay;
          }
        } else if (currentStep.type === 'subtract') {
          animationDuration = 800; // Bounce animation duration
          // No delay after subtract - settle should follow immediately
          stepDelay = 0;
        } else if (currentStep.type === 'settle') {
          animationDuration = 0; // Cell is already visible from subtract step, no animation needed
          // Check if previous step was subtract - if so, no delay (cell already visible)
          const prevStep = animationStepIndex > 0 ? currentSteps[animationStepIndex - 1] : null;
          if (prevStep && prevStep.type === 'subtract') {
            stepDelay = 0; // Immediate follow-up after subtract
          } else {
            stepDelay = animationConfig.delayAfterSettle !== null ? animationConfig.delayAfterSettle : stepDelay;
          }
        } else if (currentStep.type === 'complete') {
          animationDuration = 500;
          stepDelay = animationConfig.delayAfterComplete !== null ? animationConfig.delayAfterComplete : stepDelay;
        }
        
        const stepDuration = animationDuration + stepDelay;
        
        console.log(`🎬 [Animation Timing] Step ${animationStepIndex} (${currentStep.type}): ${animationDuration}ms animation + ${stepDelay}ms delay = ${stepDuration}ms total`);
        
        const timeoutId = setTimeout(() => {
          setAnimationStepIndex(prev => {
            const nextStep = prev + 1;
            if (nextStep >= currentSteps.length) {
              setAnimationPlaying(false);
              setAnimationComplete(true);
              if (onAnimationComplete) onAnimationComplete();
              return prev;
            }
            return nextStep;
          });
        }, stepDuration);
        
        return () => {
          clearTimeout(timeoutId);
        };
      }
    }, [mode, animationPlaying, animationComplete, animationStepIndex, animationConfig, onAnimationComplete]);
    
    // Initialize animation steps
    React.useEffect(() => {
      if (mode === 'animation') {
        const steps = generateAnimationSteps();
        console.log(`🎬 [LongSubtractionGrid] Generated ${steps.length} animation steps:`, steps.map((s, i) => `${i}: ${s.type} - ${s.description}`));
        setAnimationSteps(steps);
        animationStepsRef.current = steps;
        
        // Make all minuend and subtrahend cells visible immediately
        const allOperandCells = new Set();
        data.minuendDigits.forEach((d, i) => {
          if (d !== null) {
            allOperandCells.add(`minuend-${i}`);
          }
        });
        data.subtrahendDigits.forEach((d, i) => {
          if (d !== null) {
            allOperandCells.add(`subtrahend-${i}`);
          }
        });
        setVisibleCells(allOperandCells);
        
        if (animationConfig.autoPlay) {
          setTimeout(() => {
            console.log(`🎬 [LongSubtractionGrid] Auto-playing from step 0`);
            setAnimationStepIndex(0);
            setAnimationPlaying(true);
          }, 500);
        }
      }
    }, [mode, minuend, subtrahend, animationConfig.autoPlay]);
    
    // Update ref when animationSteps changes
    React.useEffect(() => {
      animationStepsRef.current = animationSteps;
    }, [animationSteps]);
    
    // ===== DRAGDROP MODE =====
    const generateDragDropCells = React.useCallback(() => {
      const cells = [];
      const editableTypes = dragDropConfig.editableTypes || ['borrow', 'difference'];
      
      if (editableTypes.includes('borrow')) {
        data.borrows.forEach((hasBorrow, idx) => {
          if (hasBorrow) {
            cells.push({
              key: `borrow-${idx}`,
              type: 'borrow',
              correctValue: 1
            });
          }
        });
      }
      
      if (editableTypes.includes('difference')) {
        data.differenceDigits.forEach((digit, idx) => {
          cells.push({
            key: `difference-${idx}`,
            type: 'difference',
            correctValue: digit
          });
        });
      }
      
      return cells;
    }, [data, dragDropConfig.editableTypes]);
    
    const getDragDropCellKeys = React.useCallback(() => {
      return generateDragDropCells().map(cell => cell.key);
    }, [generateDragDropCells]);
    
    React.useEffect(() => {
      if (mode === 'dragDrop') {
        dragDropCellKeysRef.current = getDragDropCellKeys();
      }
    }, [mode, minuend, subtrahend]);
    
    const handleDragStart = React.useCallback((digit, e) => {
      e.preventDefault();
      setDraggedDigit(digit);
      setDragPosition({
        x: e.clientX || e.touches?.[0]?.clientX || 0,
        y: e.clientY || e.touches?.[0]?.clientY || 0
      });
      setIsDragging(true);
    }, []);
    
    const handleDragMove = React.useCallback((e) => {
      if (!isDragging || draggedDigit === null) return;
      
      const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
      const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
      
      setDragPosition({ x: clientX, y: clientY });
      
      const elementBelow = document.elementFromPoint(clientX, clientY);
      if (elementBelow) {
        const cellElement = elementBelow.closest('.sub-cell-dragdrop');
        if (cellElement) {
          const cellKey = cellElement.dataset.cellKey;
          if (cellKey) {
            setDragOverCell(cellKey);
            return;
          }
        }
      }
      setDragOverCell(null);
    }, [isDragging, draggedDigit]);
    
    const handleDragEnd = React.useCallback(() => {
      if (dragOverCell && draggedDigit !== null) {
        const correctValue = getCorrectValueForCell(dragOverCell);
        const isCorrect = draggedDigit === correctValue;
        
        if (isCorrect || !dragDropConfig.validateOnDrop) {
          setDragDropValues(prev => ({
            ...prev,
            [dragOverCell]: draggedDigit
          }));
          
          if (dragDropConfig.validateOnDrop) {
            setDragDropValidation(prev => ({
              ...prev,
              [dragOverCell]: { isCorrect: true, correctValue, userValue: draggedDigit }
            }));
          }
        } else {
          // Wiggle animation for incorrect drop
          setWigglingCells(new Set([dragOverCell]));
          setTimeout(() => setWigglingCells(new Set()), 500);
          
          setDragDropValidation(prev => ({
            ...prev,
            [dragOverCell]: { isCorrect: false, correctValue, userValue: draggedDigit, status: 'incorrect' }
          }));
        }
      }
      
      setDraggedDigit(null);
      setIsDragging(false);
      setDragOverCell(null);
    }, [dragOverCell, draggedDigit, getCorrectValueForCell, dragDropConfig.validateOnDrop]);
    
    const validateDragDrop = React.useCallback(() => {
      const cells = generateDragDropCells();
      const results = {};
      let correctCount = 0;
      let incorrectCount = 0;
      let emptyCount = 0;
      
      cells.forEach(cell => {
        const userValue = dragDropValues[cell.key];
        if (userValue === undefined || userValue === null) {
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
      
      const isComplete = emptyCount === 0 && incorrectCount === 0;
      setDragDropComplete(isComplete);
      
      if (onDragDropValidate) {
        onDragDropValidate({ results, correctCount, incorrectCount, emptyCount, isComplete });
      }
      
      if (isComplete && onDragDropComplete) {
        onDragDropComplete();
      }
      
      return { results, correctCount, incorrectCount, emptyCount, isComplete };
    }, [generateDragDropCells, dragDropValues, onDragDropValidate, onDragDropComplete]);
    
    const resetDragDrop = React.useCallback(() => {
      setDragDropValues({});
      setDragDropValidation({});
      setDragDropComplete(false);
    }, []);
    
    // Global mouse/touch event handlers for drag
    React.useEffect(() => {
      if (mode === 'dragDrop' || mode === 'guided') {
        const handleGlobalMove = (e) => {
          handleDragMove(e);
        };
        
        const handleGlobalEnd = () => {
          handleDragEnd();
        };
        
        window.addEventListener('mousemove', handleGlobalMove);
        window.addEventListener('mouseup', handleGlobalEnd);
        window.addEventListener('touchmove', handleGlobalMove, { passive: false });
        window.addEventListener('touchend', handleGlobalEnd);
        
        return () => {
          window.removeEventListener('mousemove', handleGlobalMove);
          window.removeEventListener('mouseup', handleGlobalEnd);
          window.removeEventListener('touchmove', handleGlobalMove);
          window.removeEventListener('touchend', handleGlobalEnd);
        };
      }
    }, [mode, handleDragMove, handleDragEnd]);
    
    // ===== EXPOSE FUNCTIONS TO WINDOW =====
    React.useEffect(() => {
      if (typeof window !== 'undefined') {
        window.longSubtractionGridCheck = handleCheck;
        window.longSubtractionGridReset = handleReset;
        window.longSubtractionGridSelectedCells = selectedCells;
        window.longSubtractionGridCheckResult = checkResult;
        window.longSubtractionGridAllCorrect = allCorrect;
        window.longSubtractionGridIncorrectValues = incorrectValues;
        
        window.longSubtractionGridCheckInputs = checkInputs;
        window.longSubtractionGridInputValues = inputValues;
        window.longSubtractionGridInputValidation = inputValidation;
        
        window.longSubtractionGridValidatePractice = validatePractice;
        window.longSubtractionGridResetPractice = resetPractice;
        window.longSubtractionGridPracticeValues = practiceValues;
        window.longSubtractionGridPracticeValidation = practiceValidation;
        window.longSubtractionGridPracticeComplete = practiceComplete;
        
        window.longSubtractionGridAdvanceGuided = advanceGuidedStep;
        window.longSubtractionGridSkipGuided = skipGuidedStep;
        window.longSubtractionGridResetGuided = resetGuided;
        window.longSubtractionGridGuidedStepIndex = guidedStepIndex;
        window.longSubtractionGridGuidedSteps = guidedSteps;
        window.longSubtractionGridGuidedComplete = guidedComplete;
        
        window.longSubtractionGridAnimationPlay = playAnimation;
        window.longSubtractionGridAnimationPause = pauseAnimation;
        window.longSubtractionGridAnimationStepForward = stepForwardAnimation;
        window.longSubtractionGridAnimationStepBackward = stepBackwardAnimation;
        window.longSubtractionGridAnimationReset = resetAnimation;
        window.longSubtractionGridAnimationStep = animationStepIndex;
        window.longSubtractionGridAnimationPlaying = animationPlaying;
        window.longSubtractionGridAnimationComplete = animationComplete;
        
        window.longSubtractionGridDragDropValidate = validateDragDrop;
        window.longSubtractionGridDragDropReset = resetDragDrop;
        window.longSubtractionGridDragDropValues = dragDropValues;
        window.longSubtractionGridDragDropValidation = dragDropValidation;
        window.longSubtractionGridDragDropComplete = dragDropComplete;
      }
      
      return () => {
        if (typeof window !== 'undefined') {
          window.longSubtractionGridCheck = null;
          window.longSubtractionGridReset = null;
          window.longSubtractionGridCheckInputs = null;
          window.longSubtractionGridValidatePractice = null;
          window.longSubtractionGridResetPractice = null;
          window.longSubtractionGridAdvanceGuided = null;
          window.longSubtractionGridSkipGuided = null;
          window.longSubtractionGridResetGuided = null;
          window.longSubtractionGridAnimationPlay = null;
          window.longSubtractionGridAnimationPause = null;
          window.longSubtractionGridDragDropValidate = null;
          window.longSubtractionGridDragDropReset = null;
        }
      };
    }, [
      handleCheck, handleReset, selectedCells, checkResult, allCorrect, incorrectValues,
      checkInputs, inputValues, inputValidation,
      validatePractice, resetPractice, practiceValues, practiceValidation, practiceComplete,
      advanceGuidedStep, skipGuidedStep, resetGuided, guidedStepIndex, guidedSteps, guidedComplete,
      playAnimation, pauseAnimation, stepForwardAnimation, stepBackwardAnimation, resetAnimation,
      animationStepIndex, animationPlaying, animationComplete,
      validateDragDrop, resetDragDrop, dragDropValues, dragDropValidation, dragDropComplete
    ]);
    
    // ===== CELL RENDERING =====
    const renderCell = (value, key, type) => {
      let displayValue = value;
      let cellStyle = {
        width: cellSizePx,
        height: type === 'borrow' ? cellSizePx * 0.7 : cellSizePx,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: type === 'borrow' ? fontSizePx * 0.7 : fontSizePx,
        fontWeight: 'bold',
        borderRadius: '4px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxSizing: 'border-box'
      };
      
      // Apply theme styles
      if (themeStyles[type]) {
        cellStyle = { ...cellStyle, ...themeStyles[type] };
      }
      
      // Apply custom styles
      if (type === 'borrow' && borrowStyle) {
        cellStyle = { ...cellStyle, ...borrowStyle };
      } else if (type === 'minuend' && minuendStyle) {
        cellStyle = { ...cellStyle, ...minuendStyle };
      } else if (type === 'subtrahend' && subtrahendStyle) {
        cellStyle = { ...cellStyle, ...subtrahendStyle };
      } else if (type === 'difference' && differenceStyle) {
        cellStyle = { ...cellStyle, ...differenceStyle };
      }
      
      // Check if cell should be hidden
      if (hiddenCells.includes(key)) {
        cellStyle.backgroundColor = 'transparent';
        cellStyle.border = '2px dashed #E0E0E0';
        cellStyle.color = 'transparent';
      }
      
      let cellClasses = `sub-cell sub-cell-${type}`;
      
      // Handle strikethrough cells (borrowing visualization)
      // The original digit stays with a strikethrough - the new value appears ABOVE in regrouped row
      if (strikethroughCells.has(key)) {
        cellClasses += ' sub-cell-strikethrough';
        // Keep the original digit value - don't change displayValue
        // The regrouped value will be shown in the row above
      }
      
      // Handle highlighted cells
      if (highlightedCells.has(key)) {
        cellClasses += ' sub-cell-highlighted';
        cellStyle.boxShadow = '0 0 15px rgba(255, 193, 7, 0.8)';
        cellStyle.border = '3px solid #FFC107';
      }
      
      // Handle impact animation
      if (impactCell === key) {
        cellClasses += ' sub-cell-impact';
      }
      
      // Handle borrow source/target highlighting
      if (borrowSourceCell === key) {
        cellClasses += ' sub-cell-borrow-source';
      }
      if (borrowTargetCell === key) {
        cellClasses += ' sub-cell-borrow-target';
      }
      
      // Handle wiggling cells (from practice mode)
      if (wigglingCells.has(key)) {
        cellClasses += ' sub-cell-wiggling';
      }
      
      // Handle wiggle cell (can't subtract - animation mode)
      if (wiggleCell === key) {
        cellClasses += ' sub-cell-cant-subtract';
        cellStyle.color = '#F44336';
        cellStyle.border = '3px solid #F44336';
        cellStyle.backgroundColor = 'rgba(244, 67, 54, 0.1)';
      }
      
      // Handle checking cell (checking if it's 0)
      if (checkingCell === key) {
        cellClasses += ' sub-cell-checking';
        cellStyle.color = '#FF9800';
        cellStyle.border = '3px solid #FF9800';
        cellStyle.backgroundColor = 'rgba(255, 152, 0, 0.1)';
      }
      
      // Handle finding cell (found valid source for borrowing)
      if (findingCell === key) {
        cellClasses += ' sub-cell-found';
        cellStyle.color = '#4CAF50';
        cellStyle.border = '3px solid #4CAF50';
        cellStyle.backgroundColor = 'rgba(76, 175, 80, 0.15)';
      }
      
      // Animation mode: hide difference cells until revealed
      if (mode === 'animation' && type === 'difference' && !visibleCells.has(key)) {
        cellStyle.backgroundColor = 'transparent';
        cellStyle.border = '2px dashed #E0E0E0';
        cellStyle.color = 'transparent';
        cellClasses += ' sub-cell-animation-hidden';
      }
      
      // Animation mode: hide borrow indicators until revealed
      if (mode === 'animation' && type === 'borrow' && !visibleCells.has(key)) {
        cellStyle.backgroundColor = 'transparent';
        cellStyle.border = 'none';
        cellStyle.color = 'transparent';
        cellClasses += ' sub-cell-animation-hidden';
      }
      
      // SpotIncorrect mode
      if (mode === 'spotIncorrect') {
        // Show incorrect values
        if (incorrectValues[key] !== undefined) {
          displayValue = incorrectValues[key];
        }
        
        // Button theme for clickable cells
        if (currentTheme === 'button-theme') {
          cellClasses += ' sub-cell-button-theme';
        }
        
        // Selected state
        if (selectedCells.has(key)) {
          cellClasses += ' selected';
          cellStyle.boxShadow = '0 0 0 3px rgba(33, 150, 243, 0.8)';
        }
        
        // Check result styling
        if (checkResult) {
          if (checkResult.correct.includes(key)) {
            cellClasses += ' correct';
            cellStyle.backgroundColor = '#C8E6C9';
            cellStyle.borderColor = '#4CAF50';
          } else if (checkResult.incorrect.includes(key)) {
            cellClasses += ' incorrect';
            cellStyle.backgroundColor = '#FFCDD2';
            cellStyle.borderColor = '#F44336';
          } else if (checkResult.missed.includes(key)) {
            cellClasses += ' missed';
            cellStyle.backgroundColor = '#FFF9C4';
            cellStyle.borderColor = '#FFC107';
          }
        }
      }
      
      // Practice mode
      if (mode === 'practice') {
        const practiceCells = generatePracticeCells();
        const isPracticeCell = practiceCells.some(c => c.key === key);
        
        if (isPracticeCell) {
          const practiceValue = practiceValues[key];
          const validation = practiceValidation[key];
          
          displayValue = practiceValue !== undefined ? practiceValue : '?';
          cellStyle.backgroundColor = '#F5F5F5';
          cellStyle.border = '2px dashed #9E9E9E';
          cellStyle.cursor = 'pointer';
          
          if (validation) {
            if (validation.isCorrect) {
              cellStyle.backgroundColor = '#C8E6C9';
              cellStyle.border = '2px solid #4CAF50';
            } else if (validation.status === 'incorrect') {
              cellStyle.backgroundColor = '#FFCDD2';
              cellStyle.border = '2px solid #F44336';
            }
          }
          
          cellClasses += ' sub-cell-practice';
        }
      }
      
      // Guided mode
      if (mode === 'guided') {
        const currentStep = getCurrentGuidedStep();
        
        if (currentStep && currentStep.cellKey === key) {
          cellClasses += ' sub-cell-guided-active';
          cellStyle.backgroundColor = '#FFF9C4';
          cellStyle.border = '3px solid #FFC107';
          cellStyle.boxShadow = '0 0 10px rgba(255, 193, 7, 0.5)';
          
          const guidedValue = guidedValues[key];
          displayValue = guidedValue !== undefined ? guidedValue : '?';
        } else if (guidedValues[key] !== undefined) {
          displayValue = guidedValues[key];
          const validation = guidedValidation[key];
          if (validation?.isCorrect) {
            cellStyle.backgroundColor = '#C8E6C9';
            cellStyle.border = '2px solid #4CAF50';
          }
        }
      }
      
      // DragDrop mode
      if (mode === 'dragDrop') {
        if (dragDropCellKeysRef.current.includes(key)) {
          const dragDropValue = dragDropValues[key];
          const validation = dragDropValidation[key];
          const isDragOver = dragOverCell === key;
          
          const dragDropStyle = {
            ...cellStyle,
            backgroundColor: isDragOver ? '#E1F5FE' : (dragDropValue !== undefined ? 'white' : '#F5F5F5'),
            border: isDragOver ? '3px dashed #0288D1' : '2px dashed #BDBDBD',
            cursor: 'pointer'
          };
          
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
            className: 'sub-cell sub-cell-dragdrop',
            'data-cell-key': key,
            style: dragDropStyle
          }, dragDropValue !== undefined ? dragDropValue : '?');
        }
      }
      
      // Input mode
      if (mode === 'input' && inputCells.includes(key)) {
        const inputValue = inputValues[key];
        const validation = inputValidation[key];
        
        let inputStyle = { ...cellStyle };
        if (validation) {
          if (validation.isCorrect) {
            inputStyle.backgroundColor = '#C8E6C9';
            inputStyle.border = '2px solid #4CAF50';
          } else {
            inputStyle.backgroundColor = '#FFCDD2';
            inputStyle.border = '2px solid #F44336';
          }
        }
        
        return React.createElement('input', {
          key,
          type: 'text',
          className: 'sub-cell sub-cell-input',
          style: {
            ...inputStyle,
            textAlign: 'center',
            outline: 'none'
          },
          maxLength: 1,
          value: inputValue !== undefined && inputValue !== null ? inputValue : '',
          onChange: (e) => handleInput(key, e.target.value),
          ref: el => inputRefs.current[key] = el
        });
      }
      
      // Default cell render
      return React.createElement('div', {
        key,
        'data-cell-key': key,
        className: cellClasses,
        style: cellStyle,
        onClick: () => handleCellClick(key)
      }, displayValue !== null && displayValue !== undefined ? displayValue : '');
    };
    
    // ===== MAIN RENDER =====
    const totalColumns = data.totalColumns;
    
    const containerStyle = {
      display: 'inline-block',
      padding: '20px',
      backgroundColor: minimalMode ? 'transparent' : backgroundColor,
      border: (minimalMode || !showContainerBorder) ? 'none' : containerBorder,
      borderRadius: '8px',
      fontFamily: 'monospace',
      position: 'relative'
    };
    
    const allRows = [];
    
    // === ROW 0: Place Value Labels (optional) ===
    const isIndonesiaMode = minusSignPosition === 'indonesia';
    
    const getPlaceValueLabel = (colIndex, totalColumns) => {
      const positionFromRight = totalColumns - 1 - colIndex;
      const labels = ['O', 'T', 'H', 'Th', 'TTh', 'HTh', 'M'];
      return positionFromRight < labels.length ? labels[positionFromRight] : '';
    };
    
    if (showPlaceValueLabels) {
      const placeValueRow = [];
      
      if (!isIndonesiaMode) {
        placeValueRow.push(
          React.createElement('span', {
            key: 'place-value-space',
            style: { width: '24px' }
          })
        );
      }
      
      for (let col = 0; col < totalColumns; col++) {
        const label = getPlaceValueLabel(col, totalColumns);
        
        placeValueRow.push(
          React.createElement('div', {
            key: `place-value-${col}`,
            className: 'sub-place-value-label',
            style: {
              width: cellSizePx,
              height: cellSizePx * 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: fontSizePx * 0.6,
              fontWeight: 'bold',
              color: '#666',
              textAlign: 'center',
              padding: '2px'
            }
          }, label)
        );
      }
      
      allRows.push(
        React.createElement('div', {
          key: 'place-value-row',
          className: 'sub-row sub-place-value-row',
          style: {
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginBottom: '4px'
          }
        }, placeValueRow)
      );
    }
    
    // === ROW 1: Regrouped values row (above minuend) ===
    // This row shows the regrouped values (e.g., "13" when 3 becomes 13 after borrowing)
    // It also shows the decremented values for columns that were borrowed FROM
    if (showBorrows) {
      const regroupedRow = [];
      
      if (!isIndonesiaMode) {
        regroupedRow.push(
          React.createElement('span', {
            key: 'regroup-space',
            style: { width: '24px' }
          })
        );
      }
      
      for (let col = 0; col < totalColumns; col++) {
        const regroupedKey = `regrouped-${col}`;
        const originalDigit = data.minuendDigits[col];
        const regroupedDigit = data.regroupedMinuend[col];
        const hasRegroupedValue = regroupedDigit !== originalDigit;
        
        // In animation mode, check if this regrouped value has been revealed
        const isHidden = mode === 'animation' && !visibleCells.has(regroupedKey);
        
        // Also check if this cell was animated via regroupedDisplayValues
        const displayValue = regroupedDisplayValues.get(`minuend-${col}`);
        const showValue = displayValue !== undefined ? displayValue : (hasRegroupedValue ? regroupedDigit : null);
        
        if (hasRegroupedValue || (mode === 'animation')) {
          regroupedRow.push(
            React.createElement('div', {
              key: regroupedKey,
              'data-cell-key': regroupedKey,
              className: `sub-cell sub-cell-regrouped${isHidden ? ' sub-cell-animation-hidden' : ''}`,
              style: {
                width: cellSizePx,
                height: cellSizePx * 0.6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: fontSizePx * 0.7,
                fontWeight: 'bold',
                color: isHidden ? 'transparent' : borrowColor,
                backgroundColor: 'transparent',
                position: 'relative'
              }
            }, isHidden ? '' : (showValue !== null ? showValue : ''))
          );
        } else {
          // Empty placeholder for alignment
          regroupedRow.push(
            React.createElement('div', {
              key: `regroup-empty-${col}`,
              style: { width: cellSizePx, height: cellSizePx * 0.6 }
            })
          );
        }
      }
      
      allRows.push(
        React.createElement('div', {
          key: 'regrouped-row',
          className: 'sub-row sub-regrouped-row',
          style: {
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            marginBottom: '2px',
            minHeight: cellSizePx * 0.6
          }
        }, regroupedRow)
      );
    }
    
    // === ROW 2: Minuend (top number) ===
    const minuendRow = [];
    
    if (!isIndonesiaMode) {
      minuendRow.push(
        React.createElement('span', {
          key: 'minuend-space',
          style: { width: '24px' }
        })
      );
    }
    
    data.minuendDigits.forEach((digit, col) => {
      minuendRow.push(renderCell(digit, `minuend-${col}`, 'minuend'));
    });
    
    allRows.push(
      React.createElement('div', {
        key: 'minuend-row',
        className: 'sub-row sub-minuend-row',
        style: {
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginBottom: '2px'
        }
      }, minuendRow)
    );
    
    // === ROW 3: Subtrahend (bottom number with minus sign) ===
    const subtrahendRow = [];
    
    if (isIndonesiaMode) {
      // Indonesia mode: minus sign at the end
    } else {
      // Default mode: minus sign at the beginning
      subtrahendRow.push(
        React.createElement('span', {
          key: 'minus-sign',
          style: {
            width: '20px',
            textAlign: 'center',
            fontSize: fontSizePx,
            fontWeight: 'bold',
            color: themeStyles.minus?.color || '#333',
            marginRight: '4px'
          }
        }, '−')
      );
    }
    
    data.subtrahendDigits.forEach((digit, col) => {
      subtrahendRow.push(renderCell(digit, `subtrahend-${col}`, 'subtrahend'));
    });
    
    if (isIndonesiaMode) {
      subtrahendRow.push(
        React.createElement('span', {
          key: 'minus-sign',
          style: {
            width: cellSizePx,
            textAlign: 'center',
            fontSize: fontSizePx,
            fontWeight: 'bold',
            color: themeStyles.minus?.color || '#333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        }, '−')
      );
    }
    
    allRows.push(
      React.createElement('div', {
        key: 'subtrahend-row',
        className: 'sub-row sub-subtrahend-row',
        style: {
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }
      }, subtrahendRow)
    );
    
    // === SEPARATOR LINE ===
    const lineWidth = totalColumns * cellSizePx + (isIndonesiaMode ? 0 : 24);
    allRows.push(
      React.createElement('div', {
        key: 'separator-line',
        className: 'sub-line',
        style: {
          width: `${lineWidth}px`,
          height: '6px',
          backgroundColor: 'white',
          marginTop: '6px',
          marginBottom: '6px',
          marginLeft: 'auto'
        }
      })
    );
    
    // === ROW 4: Difference (result) ===
    const differenceRow = [];
    
    if (!isIndonesiaMode) {
      differenceRow.push(
        React.createElement('span', {
          key: 'difference-space',
          style: { width: '24px' }
        })
      );
    }
    
    data.differenceDigits.forEach((digit, col) => {
      differenceRow.push(renderCell(digit, `difference-${col}`, 'difference'));
    });
    
    if (isIndonesiaMode) {
      differenceRow.push(
        React.createElement('span', {
          key: 'difference-end-space',
          style: { width: cellSizePx }
        })
      );
    }
    
    allRows.push(
      React.createElement('div', {
        key: 'difference-row',
        className: 'sub-row sub-difference-row',
        style: {
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }
      }, differenceRow)
    );
    
    // === ADDITIONAL UI ELEMENTS ===
    
    // Guided mode hint
    if (mode === 'guided' && guidedConfig.showHints && !guidedComplete) {
      const currentStep = getCurrentGuidedStep();
      if (currentStep?.hint) {
        allRows.push(
          React.createElement('div', {
            key: 'guided-hint',
            className: 'sub-guided-hint',
            style: {
              marginTop: '15px',
              padding: '10px 15px',
              backgroundColor: '#FFF9C4',
              borderRadius: '8px',
              border: '2px solid #FFC107',
              fontSize: fontSizePx * 0.8,
              color: '#333',
              textAlign: 'center'
            }
          }, currentStep.hint)
        );
      }
    }
    
    // Guided mode digit panel
    if (mode === 'guided' && guidedConfig.showDigitPanel && !guidedComplete) {
      const currentStep = getCurrentGuidedStep();
      if (currentStep && (currentStep.type === 'difference' || currentStep.type === 'borrow')) {
        const allowedDigits = guidedConfig.allowedDigits || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        allRows.push(
          React.createElement('div', {
            key: 'guided-digit-panel',
            className: 'sub-guided-digit-panel',
            style: {
              marginTop: '15px',
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              flexWrap: 'wrap'
            }
          }, allowedDigits.map(digit => 
            React.createElement('button', {
              key: `digit-${digit}`,
              className: 'sub-digit-button',
              style: {
                width: cellSizePx,
                height: cellSizePx,
                fontSize: fontSizePx,
                fontWeight: 'bold',
                border: '2px solid #2196F3',
                borderRadius: '8px',
                backgroundColor: '#E3F2FD',
                color: '#1976D2',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              },
              onClick: () => {
                const isCorrect = digit === currentStep.correctValue;
                
                if (isCorrect) {
                  setGuidedValues(prev => ({
                    ...prev,
                    [currentStep.cellKey]: digit
                  }));
                  setGuidedValidation(prev => ({
                    ...prev,
                    [currentStep.cellKey]: { isCorrect: true }
                  }));
                  
                  setTimeout(() => {
                    advanceGuidedStep();
                  }, 500);
                } else {
                  setWigglingCells(new Set([currentStep.cellKey]));
                  setTimeout(() => setWigglingCells(new Set()), 500);
                }
              }
            }, digit)
          ))
        );
      }
    }
    
    // Guided mode completion message
    if (mode === 'guided' && guidedComplete) {
      allRows.push(
        React.createElement('div', {
          key: 'guided-complete',
          className: 'sub-complete-message',
          style: {
            marginTop: '15px',
            padding: '15px 20px',
            backgroundColor: '#C8E6C9',
            borderRadius: '8px',
            border: '2px solid #4CAF50',
            fontSize: fontSizePx,
            color: '#2E7D32',
            textAlign: 'center',
            fontWeight: 'bold'
          }
        }, `✓ Complete! ${currentMinuend} − ${currentSubtrahend} = ${data.finalAnswer}`)
      );
    }
    
    // Animation controls and info will be rendered separately with absolute positioning
    
    // Animation completion message
    if (mode === 'animation' && animationComplete) {
      allRows.push(
        React.createElement('div', {
          key: 'animation-complete',
          className: 'sub-complete-message',
          style: {
            marginTop: '15px',
            padding: '15px 20px',
            backgroundColor: '#C8E6C9',
            borderRadius: '8px',
            border: '2px solid #4CAF50',
            fontSize: fontSizePx,
            color: '#2E7D32',
            textAlign: 'center',
            fontWeight: 'bold'
          }
        }, `✓ ${currentMinuend} − ${currentSubtrahend} = ${data.finalAnswer}`)
      );
    }
    
    // SpotIncorrect mode controls
    if (mode === 'spotIncorrect') {
      allRows.push(
        React.createElement('div', {
          key: 'spotincorrect-controls',
          style: {
            marginTop: '15px',
            display: 'flex',
            justifyContent: 'center',
            gap: '10px'
          }
        }, [
          React.createElement('button', {
            key: 'check-btn',
            onClick: handleCheck,
            disabled: checkResult !== null,
            style: {
              padding: '10px 25px',
              fontSize: fontSizePx * 0.8,
              border: '2px solid #4CAF50',
              borderRadius: '4px',
              backgroundColor: '#C8E6C9',
              color: '#2E7D32',
              cursor: checkResult !== null ? 'not-allowed' : 'pointer',
              opacity: checkResult !== null ? 0.6 : 1,
              fontWeight: 'bold'
            }
          }, 'Check'),
          React.createElement('button', {
            key: 'reset-btn',
            onClick: handleReset,
            style: {
              padding: '10px 25px',
              fontSize: fontSizePx * 0.8,
              border: '2px solid #F44336',
              borderRadius: '4px',
              backgroundColor: '#FFEBEE',
              color: '#F44336',
              cursor: 'pointer',
              fontWeight: 'bold'
            }
          }, 'Reset')
        ])
      );
    }
    
    // DragDrop mode digit bank
    if (mode === 'dragDrop' && dragDropConfig.showDigitBank) {
      const allowedDigits = dragDropConfig.allowedDigits || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      
      allRows.push(
        React.createElement('div', {
          key: 'dragdrop-digit-bank',
          className: 'sub-dragdrop-digit-bank',
          style: {
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#F5F5F5',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }
        }, allowedDigits.map(digit =>
          React.createElement('div', {
            key: `digit-tile-${digit}`,
            className: 'sub-digit-tile',
            style: {
              width: cellSizePx,
              height: cellSizePx,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: fontSizePx,
              fontWeight: 'bold',
              border: '2px solid #2196F3',
              borderRadius: '8px',
              backgroundColor: '#E3F2FD',
              color: '#1976D2',
              cursor: 'grab',
              userSelect: 'none'
            },
            onMouseDown: (e) => handleDragStart(digit, e),
            onTouchStart: (e) => handleDragStart(digit, e)
          }, digit)
        ))
      );
      
      // DragDrop controls
      allRows.push(
        React.createElement('div', {
          key: 'dragdrop-controls',
          className: 'sub-dragdrop-controls',
          style: {
            marginTop: '15px',
            display: 'flex',
            justifyContent: 'center',
            gap: '10px'
          }
        }, [
          React.createElement('button', {
            key: 'validate-btn',
            onClick: validateDragDrop,
            style: {
              padding: '10px 25px',
              fontSize: fontSizePx * 0.8,
              border: '2px solid #4CAF50',
              borderRadius: '4px',
              backgroundColor: '#C8E6C9',
              color: '#2E7D32',
              cursor: 'pointer',
              fontWeight: 'bold'
            }
          }, 'Check'),
          React.createElement('button', {
            key: 'reset-btn',
            onClick: resetDragDrop,
            style: {
              padding: '10px 25px',
              fontSize: fontSizePx * 0.8,
              border: '2px solid #F44336',
              borderRadius: '4px',
              backgroundColor: '#FFEBEE',
              color: '#F44336',
              cursor: 'pointer',
              fontWeight: 'bold'
            }
          }, 'Reset')
        ])
      );
    }
    
    // Flying borrow animation element with indicators
    if (flyingBorrow) {
      const endX = flyingBorrow.endX - flyingBorrow.startX;
      const endY = flyingBorrow.endY - flyingBorrow.startY;
      const borrowDuration = animationConfig.borrowAnimationDuration || 1200;
      
      // Flying "10" element
      allRows.push(
        React.createElement('div', {
          key: 'flying-borrow',
          className: 'sub-flying-borrow',
          style: {
            position: 'fixed',
            left: flyingBorrow.startX,
            top: flyingBorrow.startY,
            transform: 'translate(-50%, -50%)',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: fontSizePx * 0.9,
            fontWeight: 'bold',
            color: 'white',
            zIndex: 1000,
            animation: `flyBorrow ${borrowDuration}ms ease-out forwards`,
            '--end-x': `${endX}px`,
            '--end-y': `${endY}px`
          }
        }, '10')
      );
    }
    
    // Borrow indicators (-1 on source, +10 on target)
    if (borrowIndicators) {
      // Source indicator (-1)
      allRows.push(
        React.createElement('div', {
          key: 'borrow-indicator-source',
          className: 'sub-borrow-indicator-source',
          style: {
            position: 'fixed',
            left: borrowIndicators.source.x,
            top: borrowIndicators.source.y,
            zIndex: 999
          }
        }, borrowIndicators.source.text)
      );
      
      // Target indicator (+10)
      allRows.push(
        React.createElement('div', {
          key: 'borrow-indicator-target',
          className: 'sub-borrow-indicator-target',
          style: {
            position: 'fixed',
            left: borrowIndicators.target.x,
            top: borrowIndicators.target.y,
            zIndex: 999
          }
        }, borrowIndicators.target.text)
      );
    }
    
    // Bouncing digit animation element
    if (bouncingDigit) {
      const endX = bouncingDigit.endX - bouncingDigit.startX;
      const endY = bouncingDigit.endY - bouncingDigit.startY;
      
      allRows.push(
        React.createElement('div', {
          key: 'bouncing-digit',
          className: 'sub-bouncing-digit',
          style: {
            position: 'fixed',
            left: bouncingDigit.startX,
            top: bouncingDigit.startY,
            transform: 'translate(-50%, -50%)',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: fontSizePx * 1.2,
            fontWeight: 'bold',
            color: '#673AB7',
            backgroundColor: 'rgba(237, 231, 246, 0.95)',
            border: '3px solid #673AB7',
            borderRadius: '50%',
            boxShadow: '0 4px 20px rgba(103, 58, 183, 0.6)',
            zIndex: 1001,
            animation: 'bounceDown 800ms ease-out forwards',
            '--end-x': `${endX}px`,
            '--end-y': `${endY}px`
          }
        }, bouncingDigit.value)
      );
    }
    
    // Dragging digit element
    if (isDragging && draggedDigit !== null) {
      allRows.push(
        React.createElement('div', {
          key: 'dragging-digit',
          style: {
            position: 'fixed',
            left: dragPosition.x,
            top: dragPosition.y,
            transform: 'translate(-50%, -50%)',
            width: cellSizePx * 1.2,
            height: cellSizePx * 1.2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: fontSizePx * 1.2,
            fontWeight: 'bold',
            color: '#1976D2',
            backgroundColor: '#BBDEFB',
            border: '3px solid #2196F3',
            borderRadius: '8px',
            boxShadow: '0 8px 20px rgba(33, 150, 243, 0.5)',
            zIndex: 1002,
            pointerEvents: 'none',
            cursor: 'grabbing'
          }
        }, draggedDigit)
      );
    }
    
    // ===== ANIMATION CONTROLS AND INFO RENDERERS =====
    
    const renderAnimationControls = () => {
      if (mode !== 'animation' || !animationConfig.showControls) return null;
      
      return React.createElement('div', {
        key: 'animation-controls',
        className: 'sub-animation-controls',
        style: {
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '15px'
        }
      }, [
        React.createElement('button', {
          key: 'step-back',
          onClick: stepBackwardAnimation,
          disabled: animationStepIndex === 0,
          style: {
            padding: '8px 16px',
            fontSize: fontSizePx * 0.8,
            border: '2px solid #673AB7',
            borderRadius: '4px',
            backgroundColor: '#EDE7F6',
            color: '#673AB7',
            cursor: animationStepIndex === 0 ? 'not-allowed' : 'pointer',
            opacity: animationStepIndex === 0 ? 0.5 : 1
          }
        }, '⏮'),
        React.createElement('button', {
          key: 'play-pause',
          onClick: animationPlaying ? pauseAnimation : playAnimation,
          style: {
            padding: '8px 20px',
            fontSize: fontSizePx * 0.8,
            border: '2px solid #673AB7',
            borderRadius: '4px',
            backgroundColor: animationPlaying ? '#D1C4E9' : '#673AB7',
            color: animationPlaying ? '#673AB7' : 'white',
            cursor: 'pointer'
          }
        }, animationPlaying ? '⏸' : '▶'),
        React.createElement('button', {
          key: 'step-forward',
          onClick: stepForwardAnimation,
          disabled: animationComplete || animationStepIndex >= animationSteps.length - 1,
          style: {
            padding: '8px 16px',
            fontSize: fontSizePx * 0.8,
            border: '2px solid #673AB7',
            borderRadius: '4px',
            backgroundColor: '#EDE7F6',
            color: '#673AB7',
            cursor: (animationComplete || animationStepIndex >= animationSteps.length - 1) ? 'not-allowed' : 'pointer',
            opacity: (animationComplete || animationStepIndex >= animationSteps.length - 1) ? 0.5 : 1
          }
        }, '⏭'),
        React.createElement('button', {
          key: 'reset',
          onClick: resetAnimation,
          style: {
            padding: '8px 16px',
            fontSize: fontSizePx * 0.8,
            border: '2px solid #F44336',
            borderRadius: '4px',
            backgroundColor: '#FFEBEE',
            color: '#F44336',
            cursor: 'pointer'
          }
        }, '↺')
      ]);
    };
    
    const renderAnimationInfo = () => {
      if (mode !== 'animation' || animationSteps.length === 0) return null;
      
      const currentStep = animationSteps[animationStepIndex];
      
      // Determine callout style based on step type
      let calloutClass = 'sub-step-callout ';
      let bgColor = '#F3E5F5';
      let borderColor = '#9C27B0';
      let textColor = '#6A1B9A';
      
      if (currentStep) {
        switch (currentStep.type) {
          case 'cantSubtract':
            calloutClass += 'error';
            bgColor = 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)';
            borderColor = '#F44336';
            textColor = '#C62828';
            break;
          case 'checkZero':
            calloutClass += 'warning';
            bgColor = 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)';
            borderColor = '#FF9800';
            textColor = '#E65100';
            break;
          case 'findSource':
            calloutClass += 'success';
            bgColor = 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)';
            borderColor = '#4CAF50';
            textColor = '#2E7D32';
            break;
          case 'borrow':
          case 'strikethrough':
          case 'regroup':
            calloutClass += 'action';
            bgColor = 'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)';
            borderColor = '#9C27B0';
            textColor = '#6A1B9A';
            break;
          case 'subtract':
          case 'settle':
            calloutClass += 'info';
            bgColor = 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)';
            borderColor = '#2196F3';
            textColor = '#1565C0';
            break;
          case 'complete':
            calloutClass += 'complete';
            bgColor = 'linear-gradient(135deg, #E8F5E9 0%, #A5D6A7 100%)';
            borderColor = '#4CAF50';
            textColor = '#1B5E20';
            break;
          default:
            calloutClass += 'info';
        }
      }
      
      return React.createElement('div', {
        key: 'animation-info',
        className: calloutClass,
        style: {
          marginTop: '15px',
          padding: '12px 16px',
          background: bgColor,
          borderRadius: '8px',
          border: `2px solid ${borderColor}`,
          fontSize: fontSizePx * 0.75,
          color: textColor,
          textAlign: 'center',
          fontWeight: '600',
          boxShadow: `0 4px 15px ${borderColor}33`,
          animation: 'calloutAppear 0.4s ease-out'
        }
      }, [
        React.createElement('span', {
          key: 'step-counter',
          style: {
            display: 'inline-block',
            marginRight: '10px',
            padding: '2px 8px',
            backgroundColor: borderColor,
            color: 'white',
            borderRadius: '12px',
            fontSize: fontSizePx * 0.6
          }
        }, `${animationStepIndex + 1}/${animationSteps.length}`),
        currentStep?.description || ''
      ]);
    };
    
    // Main content wrapper (like division component)
    const mainContent = React.createElement('div', {
      key: 'main-content',
      className: 'sub-main-content'
    }, allRows);
    
    // Main container
    return React.createElement('div', {
      className: `long-subtraction-grid ${currentTheme}${minimalMode ? ' minimal-mode' : ''}`,
      'data-mode': mode,
      style: containerStyle
    }, [
      mainContent,
      renderAnimationInfo(),
      renderAnimationControls()
    ]);
  };
  
  // Register component to window
  try {
    window.LongSubtractionGrid = LongSubtractionGrid;
    console.log('✅ [LongSubtractionGrid] Component registered to window.LongSubtractionGrid');
  } catch (error) {
    console.error('❌ [LongSubtractionGrid] Error registering component:', error);
    // Keep placeholder if registration fails
    window.LongSubtractionGrid = function() {
      console.error('LongSubtractionGrid: Component failed to load properly');
      return null;
    };
  }
  
})();

