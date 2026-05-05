/**
 * Long Addition Grid Component
 * 
 * A fully interactive React component for visualizing and solving long addition
 * with carries, multiple addends, and step-by-step validation.
 */

(function() {
  'use strict';
  
  console.log('🔍 [LongAdditionGrid] Component file loading - VERSION 1.0');
  
  // Temporarily export a placeholder to ensure the component is detected
  // This will be overwritten with the actual component below
  window.LongAdditionGrid = window.LongAdditionGrid || function() {
    console.warn('LongAdditionGrid: Component still initializing...');
    return null;
  };
  
  // Check if React is available
  if (typeof React === 'undefined') {
    console.error('❌ LongAdditionGrid: React is not loaded. Please load React before this component.');
    // Keep the placeholder export
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
   * Calculate long addition with carries
   * @param {number[]} addends - Array of numbers to add
   * @returns {Object} Calculation data for rendering
   */
  const calculateLongAddition = (addends) => {
    if (!addends || addends.length === 0) {
      return {
        error: 'No addends provided',
        addendDigits: [],
        sumDigits: [],
        carries: [],
        totalColumns: 0,
        finalAnswer: 0
      };
    }
    
    // Convert each addend to digits
    const addendDigitArrays = addends.map(a => numberToDigits(a));
    
    // Find the maximum number of digits
    const maxDigits = Math.max(...addendDigitArrays.map(arr => arr.length));
    
    // Pad all addend digit arrays to same length
    const paddedAddends = addendDigitArrays.map(arr => padLeft(arr, maxDigits, null));
    
    // Calculate sum and carries column by column (right to left)
    const carries = new Array(maxDigits + 1).fill(0);
    const sumDigits = [];
    
    for (let col = maxDigits - 1; col >= 0; col--) {
      let columnSum = carries[col + 1] || 0;
      
      for (let row = 0; row < paddedAddends.length; row++) {
        const digit = paddedAddends[row][col];
        if (digit !== null) {
          columnSum += digit;
        }
      }
      
      sumDigits.unshift(columnSum % 10);
      carries[col] = Math.floor(columnSum / 10);
    }
    
    // Handle final carry
    if (carries[0] > 0) {
      sumDigits.unshift(carries[0]);
    }
    
    // Display carries: The carry FROM column i goes TO column i-1, so it's displayed ABOVE column i-1
    // carries[0] becomes the leading digit (not displayed as a carry)
    // carries[1] is displayed above column 0
    // carries[2] is displayed above column 1
    // etc.
    // So displayCarries[i] should show the carry that goes TO column i (which comes FROM column i+1)
    const displayCarries = [];
    for (let i = 0; i < maxDigits; i++) {
      // Carry to column i comes from column i+1
      displayCarries[i] = carries[i + 1] || 0;
    }
    
    const finalAnswer = addends.reduce((sum, n) => sum + n, 0);
    
    return {
      addendDigits: paddedAddends,
      sumDigits,
      carries: displayCarries,
      totalColumns: Math.max(maxDigits, sumDigits.length),
      finalAnswer,
      addends
    };
  };
  
  // ===== MAIN COMPONENT =====
  
  const LongAdditionGrid = ({
    addends = [456, 789],
    showCarries = true,
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
    plusSignPosition = 'default',
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
    dragDropConfig: dragDropConfigProp = {},
    onDragDropValidate = null,
    onDragDropComplete = null,
    theme = 'coloured-theme',
    disabled = false,
    minimalMode = false,
    hiddenCells = [],
    carryStyle = {},
    addendStyle = {},
    sumStyle = {},
    coordinates = null,
    position = null,
    showPlaceValueLabels = false
  }) => {
    
    console.log('🔍 [LongAdditionGrid] Component created with props:', {
      theme, hiddenCells, addends, mode
    });
    
    // Merge config props with defaults
    const practiceConfig = {
      validateOnChange: false,
      showAllErrors: true,
      editableTypes: ['carry', 'sum'],
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
      editableTypes: ['carry', 'sum'],
      ...guidedConfigProp
    };
    
    const animationConfig = {
      autoPlay: false,
      speed: 1000,
      showControls: true,
      highlightDuration: 500,
      digitAnimation: 'scale',
      delayBetweenSteps: 2000, // Default delay between animation steps (fallback)
      delayAfterHighlight: null, // Delay after highlight step (null = use delayBetweenSteps)
      delayAfterBounce: null, // Delay after bounce step (null = use delayBetweenSteps)
      delayAfterSettle: null, // Delay after settle step (null = use delayBetweenSteps)
      delayAfterSplit: null, // Delay after split step (null = use delayBetweenSteps)
      delayAfterComplete: null, // Delay after complete step (null = use delayBetweenSteps)
      wiggleDuration: 1500, // Default wiggle animation duration
      ...animationConfigProp
    };
    
    const dragDropConfig = {
      validateOnDrop: true,
      showDigitBank: true,
      digitBankPosition: 'right',
      allowedDigits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      editableTypes: ['carry', 'sum'],
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
    
    // Temporary display values for animation (e.g., showing "18" before splitting to "8" and carry "1")
    const [temporaryDisplayValues, setTemporaryDisplayValues] = React.useState(new Map());
    
    // Flying carry animation state
    const [flyingCarry, setFlyingCarry] = React.useState(null);
    
    // Bouncing digit animation state for cascading addition
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
    
    // DragDrop mode state
    const [draggedDigit, setDraggedDigit] = React.useState(null);
    const [dragPosition, setDragPosition] = React.useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragOverCell, setDragOverCell] = React.useState(null);
    const [dragDropValues, setDragDropValues] = React.useState({});
    const [dragDropValidation, setDragDropValidation] = React.useState({});
    const [dragDropComplete, setDragDropComplete] = React.useState(false);
    
    const dragDropCellKeysRef = React.useRef([]);
    
    // State for dynamic addends (can be updated via callbacks)
    const [currentAddends, setCurrentAddends] = React.useState(addends);
    
    // Update state when props change
    React.useEffect(() => {
      setCurrentAddends(addends);
    }, [addends]);
    
    // Reset guided mode when addends change
    React.useEffect(() => {
      if (mode === 'guided') {
        setGuidedStepIndex(0);
        setGuidedValues({});
        setGuidedValidation({});
        setGuidedComplete(false);
      }
      // Reset animation mode when addends change
      if (mode === 'animation') {
        setAnimationStepIndex(0);
        setAnimationPlaying(false);
        setAnimationComplete(false);
        setVisibleCells(new Set());
        setHighlightedCells(new Set());
        setTemporaryDisplayValues(new Map());
        setFlyingCarry(null);
        setBouncingDigit(null);
        setImpactCell(null);
      }
    }, [currentAddends, mode]);
    
    // Expose update function via callbacks
    React.useEffect(() => {
      if (typeof window !== 'undefined') {
        window.longAdditionGridUpdateAddends = (newAddends) => {
          if (Array.isArray(newAddends) && newAddends.length > 0 && newAddends.every(a => typeof a === 'number' && a > 0)) {
            setCurrentAddends(newAddends);
          }
        };
      }
      return () => {
        if (typeof window !== 'undefined') {
          window.longAdditionGridUpdateAddends = null;
        }
      };
    }, []);
    
    // Calculate addition data
    const data = React.useMemo(() => calculateLongAddition(currentAddends), [currentAddends]);
    
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
          carry: { color: '#FF9800', backgroundColor: 'rgba(255, 152, 0, 0.1)' },
          addend: { color: '#4ECDC4', backgroundColor: 'rgba(78, 205, 196, 0.1)' },
          sum: { color: '#E91E63', backgroundColor: 'rgba(233, 30, 99, 0.1)' },
          plus: { color: '#333' }
        },
        'white-theme': {
          carry: { color: '#333', backgroundColor: 'white' },
          addend: { color: '#333', backgroundColor: 'white' },
          sum: { color: '#333', backgroundColor: 'white' },
          plus: { color: '#333' }
        },
        'button-theme': {
          carry: { color: '#333', backgroundColor: '#e0e0e0', cursor: 'pointer' },
          addend: { color: '#333', backgroundColor: '#e0e0e0', cursor: 'pointer' },
          sum: { color: '#333', backgroundColor: '#e0e0e0', cursor: 'pointer' },
          plus: { color: '#333' }
        }
      };
      return themes[currentTheme] || themes['coloured-theme'];
    }, [currentTheme]);
    
    // ===== GET CORRECT VALUE FOR CELL =====
    const getCorrectValueForCell = React.useCallback((key) => {
      const carryMatch = key.match(/^carry-(\d+)$/);
      if (carryMatch) {
        const idx = parseInt(carryMatch[1]);
        return data.carries[idx] ?? null;
      }
      
      const addendMatch = key.match(/^addend-(\d+)-(\d+)$/);
      if (addendMatch) {
        const rowIdx = parseInt(addendMatch[1]);
        const colIdx = parseInt(addendMatch[2]);
        return data.addendDigits[rowIdx]?.[colIdx] ?? null;
      }
      
      const sumMatch = key.match(/^sum-(\d+)$/);
      if (sumMatch) {
        const idx = parseInt(sumMatch[1]);
        return data.sumDigits[idx] ?? null;
      }
      
      return null;
    }, [data]);
    
    // ===== INCORRECT VALUES GENERATION =====
    React.useEffect(() => {
      if (mode === 'spotIncorrect' && incorrectCount > 0) {
        const newIncorrectValues = {};
        const allCellKeys = [];
        
        // Collect carry cells
        data.carries.forEach((_, idx) => {
          if (data.carries[idx] > 0) {
            allCellKeys.push(`carry-${idx}`);
          }
        });
        
        // Collect sum cells
        data.sumDigits.forEach((_, idx) => {
          allCellKeys.push(`sum-${idx}`);
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
      const editableTypes = practiceConfig.editableTypes || ['carry', 'sum'];
      
      if (editableTypes.includes('carry')) {
        data.carries.forEach((carry, idx) => {
          if (carry > 0) {
            cells.push({
              key: `carry-${idx}`,
              type: 'carry',
              correctValue: carry
            });
          }
        });
      }
      
      if (editableTypes.includes('sum')) {
        data.sumDigits.forEach((digit, idx) => {
          cells.push({
            key: `sum-${idx}`,
            type: 'sum',
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
      
      const allCorrect = correctCount === cells.length && emptyCount === 0;
      if (allCorrect && !practiceComplete) {
        setPracticeComplete(true);
        if (onPracticeComplete) onPracticeComplete();
      }
      
      if (onPracticeValidate) {
        onPracticeValidate({ results, correctCount, incorrectCount, emptyCount, allCorrect });
      }
      
      return { allCorrect, results, correctCount, incorrectCount, emptyCount };
    }, [generatePracticeCells, practiceValues, practiceComplete, onPracticeComplete, onPracticeValidate]);
    
    const resetPractice = React.useCallback(() => {
      setPracticeValues({});
      setPracticeValidation({});
      setPracticeComplete(false);
    }, []);
    
    // ===== GUIDED MODE =====
    const generateGuidedSteps = React.useCallback(() => {
      const steps = [];
      const editableTypes = guidedConfig.editableTypes || ['carry', 'sum'];
      const addendColumns = data.addendDigits[0]?.length || 0;
      
      // Step 0: Column selection (first step)
      steps.push({
        type: 'selectColumn',
        description: 'Select the column to add first',
        hint: 'Click on a column to start adding. Usually, we start with the ones column (rightmost).',
        columnName: null,
        availableColumns: Array.from({ length: addendColumns }, (_, i) => {
          const col = addendColumns - 1 - i; // Right to left: ones, tens, hundreds
          return {
            index: col,
            name: col === addendColumns - 1 ? 'ones' : 
                  col === addendColumns - 2 ? 'tens' : 
                  col === addendColumns - 3 ? 'hundreds' : `column ${addendColumns - col}`
          };
        })
      });
      
      // Process columns from right to left (matching animation sequence)
      for (let col = addendColumns - 1; col >= 0; col--) {
        const columnName = col === addendColumns - 1 ? 'ones' : 
                          col === addendColumns - 2 ? 'tens' : 
                          col === addendColumns - 3 ? 'hundreds' : `column ${addendColumns - col}`;
        
        // Calculate column sum for hint
        let columnSum = 0;
        const highlightCells = [];
        
        // Add incoming carry (if any)
        if (col < addendColumns - 1) {
          const carryToThisCol = data.carries[col];
          if (carryToThisCol > 0) {
            columnSum += carryToThisCol;
            highlightCells.push({ key: `carry-${col}`, value: carryToThisCol });
          }
        }
        
        // Add all addend digits in this column
        for (let row = 0; row < data.addendDigits.length; row++) {
          const digit = data.addendDigits[row][col];
          if (digit !== null) {
            columnSum += digit;
            highlightCells.push({ key: `addend-${row}-${col}`, value: digit });
          }
        }
        
        const sumDigit = columnSum % 10;
        const carryDigit = Math.floor(columnSum / 10);
        
        // Step 1: Highlight column (matching animation sequence)
        if (highlightCells.length > 0) {
          steps.push({
            type: 'highlight',
            cells: highlightCells,
            description: `Step 1: Highlight ${columnName} digits`,
            columnName: columnName,
            columnSum: columnSum,
            columnIndex: col
          });
        }
        
        // Step 2: Enter sum digit for this column (after showing the sum in animation)
        if (editableTypes.includes('sum')) {
          const sumIdx = col + (data.sumDigits.length - addendColumns);
          if (sumIdx >= 0) {
            steps.push({
              type: 'sum',
              cellKey: `sum-${sumIdx}`,
              correctValue: data.sumDigits[sumIdx],
              hint: columnSum >= 10 
                ? `The sum is ${columnSum}. Write ${sumDigit} in the answer and carry ${carryDigit}.`
                : `The sum is ${columnSum}. Write ${sumDigit} in the answer.`,
              description: `Step 2: Enter sum digit ${sumDigit}`,
              columnSum: columnSum,
              columnIndex: col
            });
          }
        }
        
        // Step 3: Enter carry digit (if any) - matching split animation
        if (editableTypes.includes('carry') && carryDigit > 0) {
          if (col > 0) {
            // Normal carry to next column
            const carryIdx = col - 1;
            if (carryIdx >= 0 && data.carries[carryIdx] > 0) {
              steps.push({
                type: 'carry',
                cellKey: `carry-${carryIdx}`,
                correctValue: data.carries[carryIdx],
                hint: `Carry ${carryDigit} to the ${col === addendColumns - 1 ? 'tens' : col === addendColumns - 2 ? 'hundreds' : 'next'} column`,
                description: `Step 3: Enter carry ${carryDigit}`,
                columnSum: columnSum,
                columnIndex: col
              });
            }
          } else {
            // Final carry becomes leading digit
            if (data.sumDigits.length > addendColumns) {
              steps.push({
                type: 'sum',
                cellKey: `sum-0`,
                correctValue: data.sumDigits[0],
                hint: `The final carry ${carryDigit} becomes the leading digit.`,
                description: `Step 3: Enter leading digit ${carryDigit}`,
                columnSum: columnSum,
                isFinalCarry: true,
                columnIndex: col
              });
            }
          }
        }
      }
      
      return steps;
    }, [data, guidedConfig.editableTypes]);
    
    const getCurrentGuidedStep = React.useCallback(() => {
      // If column selection step, return it
      if (guidedSteps[guidedStepIndex]?.type === 'selectColumn') {
        return guidedSteps[guidedStepIndex];
      }
      
      // Filter steps to only show steps for the selected column
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
    
    // Column selection handler
    const handleSelectColumn = React.useCallback((columnIndex) => {
      setSelectedColumn(columnIndex);
      // Auto-advance to next step after selection
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, currentAddends]);
    
    // Auto-advance highlight steps (matching animation sequence)
    React.useEffect(() => {
      if (mode === 'guided' && guidedSteps.length > 0 && guidedStepIndex < guidedSteps.length) {
        const currentStep = guidedSteps[guidedStepIndex];
        if (currentStep && currentStep.type === 'highlight' && guidedConfig.autoAdvance) {
          // Auto-advance after showing highlight (similar to animation delay)
          const highlightTimer = setTimeout(() => {
            if (guidedStepIndex < guidedSteps.length - 1) {
              advanceGuidedStep();
            }
          }, 1500); // Match animation highlight duration
          
          return () => clearTimeout(highlightTimer);
        }
      }
    }, [mode, guidedSteps, guidedStepIndex, guidedConfig.autoAdvance, advanceGuidedStep]);
    
    // ===== ANIMATION MODE =====
    const generateAnimationSteps = React.useCallback(() => {
      const steps = [];
      // Use addendDigits[0].length to get the actual number of addend columns
      // totalColumns might be larger if there's a leading carry digit
      const addendColumns = data.addendDigits[0]?.length || 0;
      
      console.log(`🎬 [generateAnimationSteps] addendColumns: ${addendColumns}`);
      console.log(`🎬 [generateAnimationSteps] data.carries:`, data.carries);
      
      // Process each column from right to left (units/ones, tens, hundreds, etc.)
      for (let col = addendColumns - 1; col >= 0; col--) {
        const columnName = col === addendColumns - 1 ? 'ones' : 
                          col === addendColumns - 2 ? 'tens' : 
                          col === addendColumns - 3 ? 'hundreds' : `column ${addendColumns - col}`;
        
        console.log(`🎬 [generateAnimationSteps] Processing col ${col} (${columnName})`);
        
        // Build cascade sequence for this column
        const cascadeSequence = [];
        const highlightCells = []; // Cells to highlight before bouncing starts
        
        // Start with carry from previous column (if any)
        if (col < addendColumns - 1) {
          const carryToThisCol = data.carries[col];
          if (carryToThisCol > 0) {
            cascadeSequence.push({
              key: `carry-${col}`,
              value: carryToThisCol,
              isCarry: true
            });
            highlightCells.push({ key: `carry-${col}`, value: carryToThisCol });
          }
        }
        
        // Add all addend digits in this column (top to bottom)
        for (let row = 0; row < data.addendDigits.length; row++) {
          if (data.addendDigits[row][col] !== null) {
            cascadeSequence.push({
              key: `addend-${row}-${col}`,
              value: data.addendDigits[row][col],
              isCarry: false
            });
            highlightCells.push({ key: `addend-${row}-${col}`, value: data.addendDigits[row][col] });
          }
        }
        
        // Step 0: Highlight all cells in this column
        if (highlightCells.length > 0) {
          steps.push({
            type: 'highlight',
            cells: highlightCells,
            description: `Highlight ${columnName} digits`,
            columnName: columnName
          });
        }
        
        // Calculate the final sum for this column
        const sumIdx = col + (data.sumDigits.length - addendColumns);
        const finalDigit = data.sumDigits[sumIdx];
        let runningTotal = 0;
        
        // Create bounce animation steps
        for (let i = 0; i < cascadeSequence.length; i++) {
          const current = cascadeSequence[i];
          const next = i < cascadeSequence.length - 1 ? cascadeSequence[i + 1] : null;
          const target = next ? next.key : `sum-${sumIdx}`;
          
          runningTotal += current.value;
          
          steps.push({
            type: 'bounce',
            sourceKey: current.key,
            targetKey: target,
            startValue: i === 0 ? current.value : runningTotal - current.value,
            currentDigit: current.value,
            runningTotal: runningTotal,
            isLast: !next,
            description: i === 0 ? 
              `Start ${columnName}: ${current.value}` : 
              `Add ${current.value}: ${runningTotal - current.value} + ${current.value} = ${runningTotal}`,
            columnName: columnName,
            sumIdx: sumIdx
          });
        }
        
        // After all bounces in this column, check if we need to split for carry
        const fullColumnSum = runningTotal;
        const hasCarry = fullColumnSum >= 10;
        
        if (hasCarry) {
          const carryValue = Math.floor(fullColumnSum / 10);
          
          // Determine target for carry
          if (col > 0) {
            // Normal carry to next column
            const carryKey = `carry-${col - 1}`;
            steps.push({
              type: 'split',
              sumCell: { key: `sum-${sumIdx}`, value: finalDigit },
              carryCell: { key: carryKey, value: carryValue },
              description: `Split ${fullColumnSum} → carry ${carryValue} and ${finalDigit}`,
              columnSum: fullColumnSum,
              isFinalCarry: false
            });
          } else {
            // Final carry becomes leading digit
            const nextDigitKey = `sum-0`;
            steps.push({
              type: 'split',
              sumCell: { key: `sum-${sumIdx}`, value: finalDigit },
              carryCell: { key: nextDigitKey, value: carryValue },
              description: `Split ${fullColumnSum} → leading digit ${carryValue} and ${finalDigit}`,
              columnSum: fullColumnSum,
              isFinalCarry: true
            });
          }
        } else {
          // No carry, just settle the final digit
          steps.push({
            type: 'settle',
            cellKey: `sum-${sumIdx}`,
            value: finalDigit,
            description: `Final: ${finalDigit}`
          });
        }
      }
      
      // Add completion step
      steps.push({
        type: 'complete',
        description: `${currentAddends.join(' + ')} = ${data.finalAnswer}`
      });
      
      console.log(`🎬 [generateAnimationSteps] Total steps generated: ${steps.length}`);
      
      return steps;
    }, [data, currentAddends]);
    
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
      
      console.log(`🎬 [LongAdditionGrid] Playing step ${stepIndex}:`, {
        type: step.type,
        description: step.description,
        cells: step.cells?.map(c => c.key) || []
      });
      
      if (onAnimationStep) {
        // Step index is already correct (0-based, but displayed as 1-based)
        onAnimationStep(stepIndex, animationSteps.length);
      }
      
      if (step.type === 'show') {
        step.cells.forEach(cell => {
          setVisibleCells(prev => new Set([...prev, cell.key]));
        });
        setHighlightedCell(step.cells[step.cells.length - 1]?.key || null);
        setHighlightedCells(new Set()); // Clear previous highlights
      } else if (step.type === 'highlight') {
        // Highlight ALL cells in the column
        const cellKeys = new Set(step.cells.map(cell => cell.key));
        console.log(`🎬 [LongAdditionGrid] Highlighting cells:`, Array.from(cellKeys));
        setHighlightedCells(cellKeys);
        setHighlightedCell(null); // Clear single cell highlight
      } else if (step.type === 'complete') {
        setHighlightedCell(null);
        setHighlightedCells(new Set());
      }
      
      setAnimationStepIndex(stepIndex);
    }, [animationSteps, onAnimationStep, onAnimationComplete]);
    
    const playAnimation = React.useCallback(() => {
      if (animationComplete) {
        setAnimationStepIndex(0);
        setVisibleCells(new Set());
        setAnimationComplete(false);
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
        const newVisibleCells = new Set();
        for (let i = 0; i < animationStepIndex; i++) {
          const step = animationSteps[i];
          if (step.type === 'show') {
            step.cells.forEach(cell => newVisibleCells.add(cell.key));
          }
        }
        setVisibleCells(newVisibleCells);
        setAnimationStepIndex(animationStepIndex - 1);
        setHighlightedCell(null);
      }
    }, [animationStepIndex, animationSteps]);
    
    const resetAnimation = React.useCallback(() => {
      setAnimationStepIndex(0);
      setAnimationPlaying(false);
      setAnimationComplete(false);
      setVisibleCells(new Set());
      setHighlightedCell(null);
      setHighlightedCells(new Set());
      setTemporaryDisplayValues(new Map()); // Clear temporary display values
      setFlyingCarry(null); // Clear flying carry
      setBouncingDigit(null); // Clear bouncing digit
      setImpactCell(null); // Clear impact cell
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
    }, []);
    
    // Animation playback effect - separate effect for playing current step
    React.useEffect(() => {
      if (mode === 'animation' && animationPlaying && !animationComplete) {
        // Play the current step
        const currentSteps = animationStepsRef.current;
        const currentStep = currentSteps[animationStepIndex];
        if (currentStep) {
          console.log(`🎬 [LongAdditionGrid] Playing step ${animationStepIndex}:`, {
            type: currentStep.type,
            description: currentStep.description
          });
          
          if (onAnimationStep) {
            onAnimationStep(animationStepIndex, currentSteps.length);
          }
          
          if (currentStep.type === 'highlight') {
            // Highlight all cells in the column before bouncing starts
            const cellKeys = new Set(currentStep.cells.map(cell => cell.key));
            console.log(`🎬 [Highlight Animation] Highlighting cells:`, Array.from(cellKeys));
            setHighlightedCells(cellKeys);
            setHighlightedCell(null);
          } else if (currentStep.type === 'bounce') {
            // Bounce animation: bouncing digit from source to target, accumulating value
            const { sourceKey, targetKey, startValue, currentDigit, runningTotal, isLast } = currentStep;
            
            console.log(`🎬 [Bounce Animation] ${sourceKey} → ${targetKey}, value: ${runningTotal}`);
            
            // Get positions of source and target cells
            const sourceElement = document.querySelector(`[data-cell-key="${sourceKey}"]`);
            const targetElement = document.querySelector(`[data-cell-key="${targetKey}"]`);
            
            if (sourceElement && targetElement) {
              const sourceRect = sourceElement.getBoundingClientRect();
              const targetRect = targetElement.getBoundingClientRect();
              
              // Calculate center positions (no offset needed since we use translate(-50%, -50%))
              const startX = sourceRect.left + sourceRect.width / 2;
              const startY = sourceRect.top + sourceRect.height / 2;
              const endX = targetRect.left + targetRect.width / 2;
              const endY = targetRect.top + targetRect.height / 2;
              
              // Start bouncing digit immediately
              setBouncingDigit({
                value: runningTotal,
                startX,
                startY,
                endX,
                endY,
                sourceKey,
                targetKey
              });
              
              // Show impact effect slightly before animation completes (at 750ms) for smoother transition
              setTimeout(() => {
                setImpactCell(targetKey);
                setTimeout(() => setImpactCell(null), 400); // Clear impact after 400ms
                
                // If this is the last bounce (landing on sum cell), show the running total temporarily
                if (isLast) {
                  // Make sum cell visible with the running total
                  setVisibleCells(prev => new Set([...prev, targetKey]));
                  
                  // If we have a carry (runningTotal >= 10), show the full value temporarily
                  if (runningTotal >= 10) {
                    setTemporaryDisplayValues(prev => {
                      const newMap = new Map(prev);
                      newMap.set(targetKey, runningTotal);
                      return newMap;
                    });
                  }
                }
              }, 750); // Show impact slightly before bounce completes
              
              // Clear bouncing digit right at the end (800ms) - next bounce will start immediately
              setTimeout(() => {
                setBouncingDigit(null);
              }, 800); // Bounce duration
            }
          } else if (currentStep.type === 'settle') {
            // Settle animation: finalize the digit in the sum cell (no carry)
            const { cellKey, value } = currentStep;
            console.log(`🎬 [Settle Animation] ${cellKey} = ${value}`);
            
            // Clear highlights from column
            setHighlightedCells(new Set());
            setHighlightedCell(null);
            
            // Make cell visible with final value
            setVisibleCells(prev => new Set([...prev, cellKey]));
            
            // Show impact effect
            setImpactCell(cellKey);
            setTimeout(() => setImpactCell(null), 400);
          } else if (currentStep.type === 'split') {
            // Split animation: wiggle, then fly carry up (or to next digit for final carry)
            const sumCell = currentStep.sumCell;
            const carryCell = currentStep.carryCell;
            const isFinalCarry = currentStep.isFinalCarry || false;
            
            console.log(`🎬 [Split Animation] Starting for sum cell: ${sumCell.key}, ${isFinalCarry ? 'next digit' : 'carry'} cell: ${carryCell.key}`);
            
            // Clear highlights from column
            setHighlightedCells(new Set());
            setHighlightedCell(null);
            
            // Step 1: Wiggle the sum (configurable duration)
            setWigglingCells(new Set([sumCell.key]));
            
            setTimeout(() => {
              setWigglingCells(new Set());
              console.log(`🎬 [Split Animation] Wiggle complete, looking for elements...`);
              
              // Step 2: Start flying carry animation
              // Get positions of sum cell and target cell (carry row or next answer digit)
              const sumElement = document.querySelector(`[data-cell-key="${sumCell.key}"]`);
              const targetElement = document.querySelector(`[data-cell-key="${carryCell.key}"]`);
              
              console.log(`🎬 [Split Animation] Sum element:`, sumElement, `${isFinalCarry ? 'Next digit' : 'Carry'} element:`, targetElement);
              
              if (sumElement && targetElement) {
                const sumRect = sumElement.getBoundingClientRect();
                const targetRect = targetElement.getBoundingClientRect();
                
                console.log(`🎬 [Split Animation] Flying from (${sumRect.left}, ${sumRect.top}) to (${targetRect.left}, ${targetRect.top})`);
                
                setFlyingCarry({
                  value: carryCell.value,
                  startX: sumRect.left + sumRect.width / 2,
                  startY: sumRect.top + sumRect.height / 2,
                  endX: targetRect.left + targetRect.width / 2,
                  endY: targetRect.top + targetRect.height / 2
                });
              } else {
                console.error(`🎬 [Split Animation] ERROR: Could not find elements!`);
              }
              
              // Step 3: Update sum cell to show final digit
              setTemporaryDisplayValues(prev => {
                const newMap = new Map(prev);
                newMap.delete(sumCell.key);
                return newMap;
              });
              
              // Step 4: After flying animation, show target in place
              setTimeout(() => {
                console.log(`🎬 [Split Animation] Complete, showing ${isFinalCarry ? 'next digit' : 'carry'}`);
                setFlyingCarry(null);
                setVisibleCells(prev => new Set([...prev, carryCell.key]));
              }, 1000); // Flying animation duration - increased from 600ms to 1000ms
            }, animationConfig.wiggleDuration || 1500); // Wiggle duration - configurable
          } else if (currentStep.type === 'highlight') {
            // Highlight ALL cells in the column
            const cellKeys = new Set(currentStep.cells.map(cell => cell.key));
            console.log(`🎬 [LongAdditionGrid] Highlighting cells:`, Array.from(cellKeys));
            setHighlightedCells(cellKeys);
            setHighlightedCell(null); // Clear single cell highlight
          } else if (currentStep.type === 'complete') {
            setHighlightedCell(null);
            setHighlightedCells(new Set());
          }
        }
      }
    }, [mode, animationPlaying, animationComplete, animationStepIndex, onAnimationStep]);
    
    // Animation playback interval - separate effect for interval with dynamic timing
    React.useEffect(() => {
      if (mode === 'animation' && animationPlaying && !animationComplete) {
        const currentSteps = animationStepsRef.current;
        const currentStep = currentSteps[animationStepIndex];
        
        if (!currentStep) return;
        
        // Calculate delay based on step type for smooth transitions
        let animationDuration = 0;
        let stepDelay = animationConfig.delayBetweenSteps || 2000; // Default delay
        
        if (currentStep.type === 'highlight') {
          animationDuration = 400; // Quick highlight
          stepDelay = animationConfig.delayAfterHighlight !== null ? animationConfig.delayAfterHighlight : stepDelay;
        } else if (currentStep.type === 'bounce') {
          animationDuration = 800; // Exactly match bounce animation duration for seamless flow
          stepDelay = animationConfig.delayAfterBounce !== null ? animationConfig.delayAfterBounce : stepDelay;
        } else if (currentStep.type === 'settle') {
          animationDuration = 400; // Impact animation duration
          stepDelay = animationConfig.delayAfterSettle !== null ? animationConfig.delayAfterSettle : stepDelay;
        } else if (currentStep.type === 'split') {
          const wiggleDuration = animationConfig.wiggleDuration || 1500;
          const flyDuration = 1000; // Flying animation duration
          animationDuration = wiggleDuration + flyDuration; // Wiggle + fly
          stepDelay = animationConfig.delayAfterSplit !== null ? animationConfig.delayAfterSplit : stepDelay;
        } else if (currentStep.type === 'complete') {
          animationDuration = 500;
          stepDelay = animationConfig.delayAfterComplete !== null ? animationConfig.delayAfterComplete : stepDelay;
        }
        
        // Total step duration = animation duration + step-specific delay
        const stepDuration = animationDuration + stepDelay;
        
        console.log(`🎬 [Animation Timing] Step ${animationStepIndex} (${currentStep.type}): ${animationDuration}ms animation + ${stepDelay}ms delay = ${stepDuration}ms total`);
        
        // Schedule next step
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
    }, [mode, animationPlaying, animationComplete, animationStepIndex, animationConfig.delayBetweenSteps, animationConfig.delayAfterHighlight, animationConfig.delayAfterBounce, animationConfig.delayAfterSettle, animationConfig.delayAfterSplit, animationConfig.delayAfterComplete, onAnimationComplete]);
    
    // Initialize animation steps
    React.useEffect(() => {
      if (mode === 'animation') {
        const steps = generateAnimationSteps();
        console.log(`🎬 [LongAdditionGrid] Generated ${steps.length} animation steps:`, steps.map((s, i) => `${i}: ${s.type} - ${s.description}`));
        setAnimationSteps(steps);
        animationStepsRef.current = steps; // Store in ref for interval access
        
        // Make all addends visible immediately (they're always visible, not animated)
        const allAddendCells = new Set();
        for (let row = 0; row < data.addendDigits.length; row++) {
          data.addendDigits[row].forEach((d, i) => {
            if (d !== null) {
              allAddendCells.add(`addend-${row}-${i}`);
            }
          });
        }
        setVisibleCells(allAddendCells);
        
        if (animationConfig.autoPlay) {
          setTimeout(() => {
            // Start from step 0 - highlighting ones column
            console.log(`🎬 [LongAdditionGrid] Auto-playing from step 0`);
            setAnimationStepIndex(0);
            setAnimationPlaying(true);
            // playAnimationStep will be called by the animation playback effect
          }, 500);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, addends, animationConfig.autoPlay]);
    
    // Update ref when animationSteps changes
    React.useEffect(() => {
      animationStepsRef.current = animationSteps;
    }, [animationSteps]);
    
    // ===== DRAGDROP MODE =====
    const generateDragDropCells = React.useCallback(() => {
      const cells = [];
      const editableTypes = dragDropConfig.editableTypes || ['carry', 'sum'];
      
      if (editableTypes.includes('carry')) {
        data.carries.forEach((carry, idx) => {
          if (carry > 0) {
            cells.push({
              key: `carry-${idx}`,
              type: 'carry',
              correctValue: carry
            });
          }
        });
      }
      
      if (editableTypes.includes('sum')) {
        data.sumDigits.forEach((digit, idx) => {
          cells.push({
            key: `sum-${idx}`,
            type: 'sum',
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, addends]);
    
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
        const cellElement = elementBelow.closest('.add-cell-dragdrop');
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
    
    const handleDragEnd = React.useCallback((e) => {
      if (!isDragging || draggedDigit === null) return;
      
      const clientX = e.clientX || e.changedTouches?.[0]?.clientX || 0;
      const clientY = e.clientY || e.changedTouches?.[0]?.clientY || 0;
      
      const elementBelow = document.elementFromPoint(clientX, clientY);
      if (elementBelow) {
        const cellElement = elementBelow.closest('.add-cell-dragdrop');
        if (cellElement) {
          const cellKey = cellElement.dataset.cellKey;
          if (cellKey && dragDropCellKeysRef.current.includes(cellKey)) {
            handleDragDrop(cellKey, draggedDigit);
          }
        }
      }
      
      setIsDragging(false);
      setDraggedDigit(null);
      setDragOverCell(null);
      setDragPosition({ x: 0, y: 0 });
    }, [isDragging, draggedDigit]);
    
    const handleDragDrop = React.useCallback((cellKey, digit) => {
      const cells = generateDragDropCells();
      const cell = cells.find(c => c.key === cellKey);
      
      if (!cell) return;
      
      setDragDropValues(prev => {
        const newValues = { ...prev, [cellKey]: digit };
        
        if (dragDropConfig.validateOnDrop) {
          const isCorrect = digit === cell.correctValue;
          
          setDragDropValidation(prevValidation => {
            const newValidation = {
              ...prevValidation,
              [cellKey]: { isCorrect, correctValue: cell.correctValue, userValue: digit }
            };
            
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
    
    // ===== GUIDED MODE DRAG HANDLERS =====
    const handleGuidedDragStart = React.useCallback((digit, e) => {
      e.preventDefault();
      setGuidedDraggedDigit(digit);
      setGuidedDragPosition({
        x: e.clientX || e.touches?.[0]?.clientX || 0,
        y: e.clientY || e.touches?.[0]?.clientY || 0
      });
      setIsGuidedDragging(true);
    }, []);
    
    const handleGuidedDragMove = React.useCallback((e) => {
      if (!isGuidedDragging || guidedDraggedDigit === null) return;
      
      const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
      const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
      
      setGuidedDragPosition({ x: clientX, y: clientY });
    }, [isGuidedDragging, guidedDraggedDigit]);
    
    const handleGuidedDragEnd = React.useCallback((e) => {
      if (!isGuidedDragging || guidedDraggedDigit === null) return;
      
      const clientX = e.clientX || e.changedTouches?.[0]?.clientX || 0;
      const clientY = e.clientY || e.changedTouches?.[0]?.clientY || 0;
      
      const elementBelow = document.elementFromPoint(clientX, clientY);
      if (elementBelow) {
        const cellElement = elementBelow.closest('.add-cell-guided-active');
        if (cellElement) {
          const currentStep = getCurrentGuidedStep();
          if (currentStep && !guidedComplete) {
            const key = currentStep.cellKey;
            setGuidedValues(prev => ({ ...prev, [key]: guidedDraggedDigit }));
            
            if (guidedDraggedDigit === currentStep.correctValue) {
              setGuidedValidation(prev => ({ ...prev, [key]: { isCorrect: true } }));
              if (guidedConfig.autoAdvance) {
                setTimeout(advanceGuidedStep, 300);
              }
            } else {
              setGuidedValidation(prev => ({ ...prev, [key]: { isCorrect: false } }));
              setWigglingCells(prev => new Set(prev).add(key));
              
              setTimeout(() => {
                setGuidedValues(prev => {
                  const newValues = { ...prev };
                  delete newValues[key];
                  return newValues;
                });
                setGuidedValidation(prev => {
                  const newValidation = { ...prev };
                  delete newValidation[key];
                  return newValidation;
                });
                setWigglingCells(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(key);
                  return newSet;
                });
              }, 1500);
            }
          }
        }
      }
      
      setIsGuidedDragging(false);
      setGuidedDraggedDigit(null);
      setGuidedDragPosition({ x: 0, y: 0 });
    }, [isGuidedDragging, guidedDraggedDigit, getCurrentGuidedStep, guidedComplete, guidedConfig.autoAdvance, advanceGuidedStep]);
    
    // Global guided drag event listeners
    React.useEffect(() => {
      if (mode === 'guided' && isGuidedDragging) {
        window.addEventListener('mousemove', handleGuidedDragMove);
        window.addEventListener('mouseup', handleGuidedDragEnd);
        window.addEventListener('touchmove', handleGuidedDragMove, { passive: false });
        window.addEventListener('touchend', handleGuidedDragEnd);
        
        return () => {
          window.removeEventListener('mousemove', handleGuidedDragMove);
          window.removeEventListener('mouseup', handleGuidedDragEnd);
          window.removeEventListener('touchmove', handleGuidedDragMove);
          window.removeEventListener('touchend', handleGuidedDragEnd);
        };
      }
    }, [mode, isGuidedDragging, handleGuidedDragMove, handleGuidedDragEnd]);
    
    // ===== EXPOSE GLOBAL FUNCTIONS =====
    React.useEffect(() => {
      if (mode === 'spotIncorrect') {
        window.longAdditionGridCheck = handleCheck;
        window.longAdditionGridReset = handleReset;
        window.longAdditionGridSelectedCells = selectedCells;
        window.longAdditionGridCheckResult = checkResult;
        window.longAdditionGridAllCorrect = allCorrect;
        window.longAdditionGridIncorrectValues = incorrectValues;
      } else if (mode === 'input') {
        window.longAdditionGridCheckInputs = checkInputs;
        window.longAdditionGridInputValues = inputValues;
        window.longAdditionGridInputValidation = inputValidation;
      } else if (mode === 'practice') {
        window.longAdditionGridValidatePractice = validatePractice;
        window.longAdditionGridResetPractice = resetPractice;
        window.longAdditionGridPracticeValues = practiceValues;
        window.longAdditionGridPracticeValidation = practiceValidation;
        window.longAdditionGridPracticeComplete = practiceComplete;
      } else if (mode === 'guided') {
        window.longAdditionGridAdvanceGuided = advanceGuidedStep;
        window.longAdditionGridSkipGuided = skipGuidedStep;
        window.longAdditionGridResetGuided = resetGuided;
        window.longAdditionGridGuidedStepIndex = guidedStepIndex;
        window.longAdditionGridGuidedSteps = guidedSteps;
        window.longAdditionGridGuidedComplete = guidedComplete;
      } else if (mode === 'animation') {
        window.longAdditionGridAnimationPlay = playAnimation;
        window.longAdditionGridAnimationPause = pauseAnimation;
        window.longAdditionGridAnimationStepForward = stepForwardAnimation;
        window.longAdditionGridAnimationStepBackward = stepBackwardAnimation;
        window.longAdditionGridAnimationReset = resetAnimation;
        window.longAdditionGridAnimationStep = animationStepIndex;
        window.longAdditionGridAnimationPlaying = animationPlaying;
        window.longAdditionGridAnimationComplete = animationComplete;
      } else if (mode === 'dragDrop') {
        window.longAdditionGridDragDropValidate = validateDragDrop;
        window.longAdditionGridDragDropReset = resetDragDrop;
        window.longAdditionGridDragDropValues = dragDropValues;
        window.longAdditionGridDragDropValidation = dragDropValidation;
        window.longAdditionGridDragDropComplete = dragDropComplete;
      }
      
      return () => {
        // Cleanup
        if (mode === 'spotIncorrect') {
          window.longAdditionGridCheck = null;
          window.longAdditionGridReset = null;
        } else if (mode === 'input') {
          window.longAdditionGridCheckInputs = null;
        } else if (mode === 'practice') {
          window.longAdditionGridValidatePractice = null;
          window.longAdditionGridResetPractice = null;
        } else if (mode === 'guided') {
          window.longAdditionGridAdvanceGuided = null;
          window.longAdditionGridSkipGuided = null;
          window.longAdditionGridResetGuided = null;
        } else if (mode === 'animation') {
          window.longAdditionGridAnimationPlay = null;
          window.longAdditionGridAnimationPause = null;
        } else if (mode === 'dragDrop') {
          window.longAdditionGridDragDropValidate = null;
          window.longAdditionGridDragDropReset = null;
        }
      };
    }, [mode, handleCheck, handleReset, selectedCells, checkResult, allCorrect, incorrectValues,
        checkInputs, inputValues, inputValidation, validatePractice, resetPractice,
        practiceValues, practiceValidation, practiceComplete, advanceGuidedStep, skipGuidedStep,
        resetGuided, guidedStepIndex, guidedSteps, guidedComplete, playAnimation, pauseAnimation,
        stepForwardAnimation, stepBackwardAnimation, resetAnimation, animationStepIndex,
        animationPlaying, animationComplete, validateDragDrop, resetDragDrop, dragDropValues,
        dragDropValidation, dragDropComplete]);
    
    // ===== RENDER HELPERS =====
    const themeStyles = getThemeStyles();
    
    /**
     * Render a single cell
     */
    const renderCell = (value, key, type, isEditable = false) => {
      const isHidden = hiddenCells.includes(key);
      
      // Check if there's a temporary display value (e.g., "18" before splitting to "8" and carry "1")
      const tempValue = temporaryDisplayValues.get(key);
      const displayValue = tempValue !== undefined ? tempValue : (incorrectValues[key] !== undefined ? incorrectValues[key] : value);
      
      const typeStyle = themeStyles[type] || {};
      
      const cellClasses = [
        `add-cell add-cell-${type}`,
        currentTheme === 'button-theme' && !minimalMode && mode === 'spotIncorrect' ? 'add-cell-button-theme' : '',
        currentTheme === 'button-theme' && !minimalMode && mode === 'spotIncorrect' && selectedCells.has(key) ? 'selected' : '',
        currentTheme === 'button-theme' && !minimalMode && mode === 'spotIncorrect' && checkResult && selectedCells.has(key) && Object.keys(incorrectValues).includes(key) ? 'correct' : '',
        currentTheme === 'button-theme' && !minimalMode && mode === 'spotIncorrect' && checkResult && selectedCells.has(key) && !Object.keys(incorrectValues).includes(key) ? 'incorrect' : '',
        (disabled || allCorrect) && mode === 'spotIncorrect' ? 'disabled' : '',
        impactCell === key ? 'add-cell-impact' : '' // Add impact animation class
      ].filter(Boolean).join(' ');
      
      const useButtonTheme = currentTheme === 'button-theme' && !minimalMode && mode === 'spotIncorrect';
      
      // Special styling for carry cells - make them smaller and more distinct
      const isCarryCell = type === 'carry';
      const carryHeight = isCarryCell ? cellSizePx * 0.6 : cellSizePx;
      const carryFontSize = isCarryCell ? fontSizePx * 0.75 : fontSizePx;
      
      let cellStyle = {
        width: cellSizePx,
        height: carryHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: carryFontSize,
        fontWeight: 'bold',
        border: minimalMode ? 'none' : (useButtonTheme ? 'none' : `${cellBorderWidth} ${cellBorderStyle} ${cellBorderColor}`),
        borderRadius: useButtonTheme ? '8px' : '4px',
        backgroundColor: minimalMode ? 'transparent' : (useButtonTheme ? 'transparent' : (typeStyle.backgroundColor || cellBackgroundColor)),
        color: useButtonTheme ? 'black' : (typeStyle.color || '#333'),
        cursor: mode === 'spotIncorrect' && !disabled && !allCorrect ? 'pointer' : (disabled || allCorrect ? 'not-allowed' : 'default'),
        transition: useButtonTheme ? 'all 0.1s ease' : 'all 0.2s ease',
        ...(useButtonTheme ? {} : typeStyle)
      };
      
      // Additional styling for carry cells
      if (isCarryCell && !minimalMode && !useButtonTheme) {
        cellStyle.border = '1px dashed rgba(255, 152, 0, 0.5)';
        cellStyle.opacity = 0.85;
      }
      
      if (isHidden) {
        cellStyle.visibility = 'hidden';
      }
      
      // SpotIncorrect mode highlighting
      if (mode === 'spotIncorrect' && currentTheme !== 'button-theme') {
        const isSelected = selectedCells.has(key);
        const isIncorrect = Object.keys(incorrectValues).includes(key);
        
        if (checkResult) {
          if (isSelected && isIncorrect) {
            cellStyle.backgroundColor = '#C8E6C9';
            cellStyle.border = '3px solid #4CAF50';
          } else if (isSelected && !isIncorrect) {
            cellStyle.backgroundColor = '#FFCDD2';
            cellStyle.border = '3px solid #F44336';
          } else if (!isSelected && isIncorrect) {
            cellStyle.backgroundColor = '#FFF9C4';
            cellStyle.border = '3px solid #FFC107';
          }
        } else if (isSelected) {
          cellStyle.backgroundColor = '#E3F2FD';
          cellStyle.border = '3px solid #2196F3';
        }
      }
      
      // Practice mode
      if (mode === 'practice') {
        const practiceCells = generatePracticeCells();
        const isPracticeCell = practiceCells.some(c => c.key === key);
        
        if (isPracticeCell) {
          const practiceValue = practiceValues[key];
          const validation = practiceValidation[key];
          
          if (validation) {
            if (validation.isCorrect) {
              cellStyle.backgroundColor = '#C8E6C9';
              cellStyle.border = '2px solid #4CAF50';
            } else if (validation.status === 'incorrect') {
              cellStyle.backgroundColor = '#FFCDD2';
              cellStyle.border = '2px solid #F44336';
            }
          } else {
            cellStyle.backgroundColor = '#F5F5F5';
            cellStyle.border = '2px dashed #9E9E9E';
          }
          
          return React.createElement('input', {
            key,
            type: 'text',
            className: 'add-cell add-cell-practice',
            style: {
              ...cellStyle,
              textAlign: 'center',
              outline: 'none'
            },
            maxLength: 1,
            value: practiceValue !== undefined ? practiceValue : '',
            onChange: (e) => {
              const val = e.target.value;
              if (val === '' || /^[0-9]$/.test(val)) {
                setPracticeValues(prev => ({
                  ...prev,
                  [key]: val === '' ? undefined : parseInt(val)
                }));
              }
            }
          });
        }
      }
      
      // Guided mode
      if (mode === 'guided') {
        const currentStep = getCurrentGuidedStep();
        
        // Check if this is a column selection step
        const isSelectColumnStep = currentStep?.type === 'selectColumn';
        
        // Check if this cell belongs to a column that can be selected
        if (isSelectColumnStep) {
          // Extract column index from cell key (e.g., "addend-0-2" -> column 2)
          const match = key.match(/(?:addend|sum|carry)-(\d+)-(\d+)/);
          if (match) {
            const colIndex = parseInt(match[2], 10);
            const isSelected = selectedColumn === colIndex;
            const addendColumns = data.addendDigits[0]?.length || 0;
            
            // Make column clickable
            if (colIndex < addendColumns) {
              cellStyle.cursor = 'pointer';
              cellStyle.transition = 'all 0.2s ease';
              
              if (isSelected) {
                cellStyle.backgroundColor = '#C8E6C9';
                cellStyle.border = '3px solid #4CAF50';
                cellStyle.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
              } else {
                cellStyle.backgroundColor = '#E3F2FD';
                cellStyle.border = '2px solid #2196F3';
                cellStyle.boxShadow = '0 0 5px rgba(33, 150, 243, 0.3)';
              }
              
              // Add hover effect
              const originalOnClick = cellStyle.onClick;
              cellStyle.onClick = (e) => {
                e.stopPropagation();
                handleSelectColumn(colIndex);
              };
            }
          }
        }
        
        // Check if this is a highlight step
        const isHighlightStep = currentStep?.type === 'highlight';
        const isHighlightedCell = isHighlightStep && currentStep?.cells?.some(c => c.key === key);
        
        // Highlight cells during highlight step
        if (isHighlightedCell) {
          cellStyle.backgroundColor = '#E3F2FD';
          cellStyle.border = '3px solid #2196F3';
          cellStyle.boxShadow = '0 0 10px rgba(33, 150, 243, 0.5)';
        }
        
        const isActiveCell = currentStep?.cellKey === key;
        const guidedValue = guidedValues[key];
        
        if (isActiveCell && !guidedComplete) {
          const isWiggling = wigglingCells.has(key);
          
          if (isWiggling) {
            cellStyle.backgroundColor = '#FA8072';
            cellStyle.border = '3px solid #FF6B6B';
            cellStyle.boxShadow = '0 0 10px rgba(250, 128, 114, 0.5)';
            cellStyle.animation = 'wiggle 1500ms ease-in-out';
          } else {
            cellStyle.backgroundColor = '#FFF9C4';
            cellStyle.border = '3px solid #FFC107';
            cellStyle.boxShadow = '0 0 10px rgba(255, 193, 7, 0.5)';
          }
          
          return React.createElement('input', {
            key,
            type: 'text',
            className: `add-cell add-cell-guided-active ${isWiggling ? 'add-cell-wiggling' : ''}`,
            style: {
              ...cellStyle,
              textAlign: 'center',
              outline: 'none'
            },
            maxLength: 1,
            value: guidedValue !== undefined ? guidedValue : '',
            autoFocus: !isWiggling,
            readOnly: isWiggling,
            onChange: (e) => {
              if (isWiggling) return;
              
              const val = e.target.value;
              if (val === '' || /^[0-9]$/.test(val)) {
                const numVal = val === '' ? undefined : parseInt(val);
                setGuidedValues(prev => ({ ...prev, [key]: numVal }));
                
                if (numVal === currentStep.correctValue) {
                  setGuidedValidation(prev => ({ ...prev, [key]: { isCorrect: true } }));
                  if (guidedConfig.autoAdvance) {
                    setTimeout(advanceGuidedStep, 300);
                  }
                } else if (numVal !== undefined) {
                  setGuidedValidation(prev => ({ ...prev, [key]: { isCorrect: false } }));
                }
              }
            }
          });
        }
        
        if (guidedValues[key] !== undefined) {
          return React.createElement('div', {
            key,
            'data-cell-key': key, // Add for animation positioning
            className: 'add-cell',
            style: {
              ...cellStyle,
              backgroundColor: '#C8E6C9',
              border: '2px solid #4CAF50'
            }
          }, guidedValues[key]);
        }
        
        // Find step index for this cell
        const stepIndex = guidedSteps.findIndex(s => s.cellKey === key);
        const isFuture = stepIndex > guidedStepIndex;
        
        if (isFuture && stepIndex !== -1) {
          return React.createElement('div', {
            key,
            'data-cell-key': key, // Add for animation positioning
            className: 'add-cell add-cell-hidden',
            style: {
              ...cellStyle,
              backgroundColor: 'transparent',
              border: 'none',
              color: 'transparent'
            }
          }, '');
        }
      }
      
      // Animation mode
      if (mode === 'animation') {
        const isVisible = visibleCells.has(key);
        const isHighlighted = highlightedCell === key || highlightedCells.has(key);
        
        // Only sum and carry cells are animated (hidden until shown)
        // Addend cells are always visible
        const isAnimatableCell = key.startsWith('carry-') || key.startsWith('sum-');
        
        if (isAnimatableCell && !isVisible) {
          return React.createElement('div', {
            key,
            'data-cell-key': key, // IMPORTANT: Keep data-cell-key for positioning even when hidden
            className: 'add-cell add-cell-animation-hidden',
            style: {
              ...cellStyle,
              backgroundColor: 'transparent',
              border: '2px dashed #E0E0E0',
              color: 'transparent'
            }
          }, '');
        }
        
        // Apply highlighting to all highlighted cells (for column highlighting)
        if (isHighlighted) {
          cellStyle.backgroundColor = '#FFEB3B';
          cellStyle.border = '3px solid #FFC107';
          cellStyle.boxShadow = '0 0 15px rgba(255, 193, 7, 0.6)';
          cellStyle.animation = 'digitAppear 0.3s ease-out';
        }
        
        // Apply wiggle animation for temporary sums being replaced
        if (wigglingCells.has(key)) {
          const wiggleDuration = animationConfig.wiggleDuration || 1500;
          cellStyle.backgroundColor = '#FFE082';
          cellStyle.border = '3px solid #FFA000';
          cellStyle.boxShadow = '0 0 15px rgba(255, 160, 0, 0.8)';
          cellStyle.animation = `wiggle ${wiggleDuration}ms ease-in-out`; // Configurable duration
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
            className: 'add-cell add-cell-dragdrop',
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
          className: 'add-cell add-cell-input',
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
        'data-cell-key': key, // Add data attribute for animation positioning
        className: cellClasses || `add-cell add-cell-${type}`,
        style: cellStyle,
        onClick: () => handleCellClick(key)
      }, displayValue !== null && displayValue !== undefined ? displayValue : '');
    };
    
    // ===== MAIN RENDER =====
    const totalColumns = data.totalColumns;
    const sumColumns = data.sumDigits.length;
    const maxColumns = Math.max(totalColumns, sumColumns);
    
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
    const isIndonesiaMode = plusSignPosition === 'indonesia';
    
    // Helper function to get place value label
    const getPlaceValueLabel = (colIndex, totalColumns) => {
      const positionFromRight = totalColumns - 1 - colIndex;
      const labels = ['O', 'T', 'H', 'Th', 'TTh', 'HTh', 'M'];
      return positionFromRight < labels.length ? labels[positionFromRight] : '';
    };
    
    if (showPlaceValueLabels) {
      const placeValueRow = [];
      const numAddendColumns = data.addendDigits[0]?.length || 0;
      
      // Add empty space matching the plus sign column (24px)
      if (!isIndonesiaMode) {
        placeValueRow.push(
          React.createElement('span', {
            key: 'place-value-space',
            style: { width: '24px' }
          })
        );
      }
      
      // Calculate alignment: addends are right-aligned
      const addendOffset = maxColumns - numAddendColumns;
      
      // Add empty cells for alignment with addends
      for (let i = 0; i < addendOffset; i++) {
        placeValueRow.push(
          React.createElement('div', {
            key: `place-value-empty-align-${i}`,
            style: { width: cellSizePx, height: cellSizePx * 0.5 }
          })
        );
      }
      
      // Add place value labels for each addend column (right to left: O, T, H, etc.)
      for (let col = 0; col < numAddendColumns; col++) {
        const positionFromRight = numAddendColumns - 1 - col;
        const label = getPlaceValueLabel(col, numAddendColumns);
        
        placeValueRow.push(
          React.createElement('div', {
            key: `place-value-${col}`,
            className: 'add-place-value-label',
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
          className: 'add-row add-place-value-row',
          style: {
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginBottom: '4px'
          }
        }, placeValueRow)
      );
    }
    
    // === ROW 1: Carries (above first addend) ===
    
    if (showCarries) {
      const carryRow = [];
      
      // Match the addend row structure for alignment:
      // 1. Plus sign space (empty, 24px) - to align with addend rows
      // 2. Empty cells for alignment (right-align)
      // 3. One empty cell for rightmost column (no carry above units column)
      // 4. Carries positioned above their target columns
      
      // Add empty space matching the plus sign column (24px)
      if (!isIndonesiaMode) {
        carryRow.push(
          React.createElement('span', {
            key: 'carry-space',
            style: { width: '24px' }
          })
        );
      }
      
      // Calculate alignment: addends are right-aligned
      const addendOffset = maxColumns - data.addendDigits[0].length;
      
      // Add empty cells for alignment with addends
      for (let i = 0; i < addendOffset; i++) {
        carryRow.push(
          React.createElement('div', {
            key: `carry-empty-align-${i}`,
            style: { width: cellSizePx, height: cellSizePx * 0.7 }
          })
        );
      }
      
      // Now add carries: they should align with the addend columns
      // Addends are: [plus] [align] [col0] [col1] [col2]
      // Carries should be: [plus] [align] [carry-0] [carry-1] [empty]
      // The carry FROM column i+1 goes TO column i, displayed ABOVE column i
      // data.carries[i] contains the carry TO column i
      const numAddendColumns = data.addendDigits[0]?.length || 0;
      
      // Iterate from leftmost (col 0) to second-to-rightmost (col numAddendColumns-2)
      // This matches the addend column order
      for (let displayIdx = 0; displayIdx < numAddendColumns - 1; displayIdx++) {
        // displayIdx is the column index where we display the carry
        // The carry displayed at column displayIdx is the carry TO column displayIdx
        // which comes FROM column displayIdx+1
        const carry = displayIdx < data.carries.length ? data.carries[displayIdx] : 0;
        if (carry > 0) {
          carryRow.push(renderCell(carry, `carry-${displayIdx}`, 'carry'));
        } else {
          carryRow.push(
            React.createElement('div', {
              key: `carry-${displayIdx}`,
              style: { width: cellSizePx, height: cellSizePx * 0.7 }
            })
          );
        }
      }
      
      // Add one empty cell for the rightmost column (units column has no carry above it)
      carryRow.push(
        React.createElement('div', {
          key: 'carry-empty-rightmost',
          style: { width: cellSizePx, height: cellSizePx * 0.7 }
        })
      );
      
      allRows.push(
        React.createElement('div', {
          key: 'carry-row',
          className: 'add-row add-carry-row',
          style: {
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            marginBottom: '12px',
            minHeight: cellSizePx * 0.6,
            position: 'relative'
          }
        }, carryRow)
      );
    }
    
    // === ADDEND ROWS ===
    // isIndonesiaMode is already declared above in the carry row section
    
    data.addendDigits.forEach((addendDigits, rowIdx) => {
      const isLastAddend = rowIdx === data.addendDigits.length - 1;
      const rowCells = [];
      
      // Add plus sign for last addend
      if (isLastAddend) {
        if (isIndonesiaMode) {
          // Indonesia mode: plus sign at the end
        } else {
          // Default mode: plus sign at the beginning
          rowCells.push(
            React.createElement('span', {
              key: `plus-${rowIdx}`,
              style: {
                width: '20px',
                textAlign: 'center',
                fontSize: fontSizePx,
                fontWeight: 'bold',
                color: themeStyles.plus?.color || '#333',
                marginRight: '4px'
              }
            }, '+')
          );
        }
      } else {
        // Empty space for alignment
        if (!isIndonesiaMode) {
          rowCells.push(
            React.createElement('span', {
              key: `space-${rowIdx}`,
              style: { width: '24px' }
            })
          );
        }
      }
      
      // Add empty cells for alignment (right-align addends)
      const addendOffset = maxColumns - addendDigits.length;
      for (let i = 0; i < addendOffset; i++) {
        rowCells.push(
          React.createElement('div', {
            key: `addend-empty-${rowIdx}-${i}`,
            style: { width: cellSizePx, height: cellSizePx }
          })
        );
      }
      
      // Add addend digit cells
      addendDigits.forEach((digit, colIdx) => {
        if (digit !== null) {
          rowCells.push(renderCell(digit, `addend-${rowIdx}-${colIdx}`, 'addend'));
        } else {
          rowCells.push(
            React.createElement('div', {
              key: `addend-${rowIdx}-${colIdx}`,
              style: { width: cellSizePx, height: cellSizePx }
            })
          );
        }
      });
      
      // Indonesia mode: plus sign at the end
      if (isLastAddend && isIndonesiaMode) {
        rowCells.push(
          React.createElement('span', {
            key: `plus-${rowIdx}`,
            style: {
              width: cellSizePx,
              textAlign: 'center',
              fontSize: fontSizePx,
              fontWeight: 'bold',
              color: themeStyles.plus?.color || '#333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }
          }, '+')
        );
      }
      
      allRows.push(
        React.createElement('div', {
          key: `addend-row-${rowIdx}`,
          className: 'add-row add-addend-row',
          style: {
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center'
          }
        }, rowCells)
      );
    });
    
    // === SEPARATOR LINE ===
    const lineWidth = maxColumns * cellSizePx + (isIndonesiaMode ? 0 : 24);
    allRows.push(
      React.createElement('div', {
        key: 'separator-line',
        className: 'add-line',
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
    
    // === SUM ROW ===
    const sumRowCells = [];
    
    // Empty space for alignment with plus sign column
    if (!isIndonesiaMode) {
      sumRowCells.push(
        React.createElement('span', {
          key: 'sum-space',
          style: { width: '24px' }
        })
      );
    }
    
    // Add empty cells for alignment
    const sumOffset = maxColumns - sumColumns;
    for (let i = 0; i < sumOffset; i++) {
      sumRowCells.push(
        React.createElement('div', {
          key: `sum-empty-${i}`,
          style: { width: cellSizePx, height: cellSizePx }
        })
      );
    }
    
    // Add sum digit cells
    data.sumDigits.forEach((digit, idx) => {
      sumRowCells.push(renderCell(digit, `sum-${idx}`, 'sum'));
    });
    
    // Indonesia mode: empty space at end for alignment
    if (isIndonesiaMode) {
      sumRowCells.push(
        React.createElement('span', {
          key: 'sum-end-space',
          style: { width: cellSizePx }
        })
      );
    }
    
    allRows.push(
      React.createElement('div', {
        key: 'sum-row',
        className: 'add-row add-sum-row',
        style: {
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }
      }, sumRowCells)
    );
    
    // Main content
    const mainContent = React.createElement('div', {
      key: 'main-content',
      className: 'add-main-content'
    }, allRows);
    
    // ===== GUIDED MODE HINT =====
    const renderGuidedHint = () => {
      if (mode !== 'guided' || !guidedConfig.showHints) return null;
      
      const currentStep = getCurrentGuidedStep();
      if (!currentStep || guidedComplete) return null;
      
      // Base style for hint
      const baseHintStyle = {
        padding: '12px 20px',
        borderRadius: '8px',
        textAlign: 'center',
        fontSize: fontSizePx * 0.7,
        fontWeight: 'bold'
      };
      
      // If hintCoordinates are provided, use absolute positioning
      // Format: [left, top, right, bottom] in grid coordinate system (same as PageConfig)
      if (guidedConfig.hintCoordinates && Array.isArray(guidedConfig.hintCoordinates) && guidedConfig.hintCoordinates.length >= 4) {
        const [hintLeft, hintTop, hintRight, hintBottom] = guidedConfig.hintCoordinates;
        
        // Get component's position to calculate relative coordinates
        // The component receives coordinates via props (from elements-registry.js)
        const componentCoordinates = typeof coordinates !== 'undefined' ? coordinates : null;
        
        // Convert grid coordinates to CSS pixels
        // Use gridPositions if available to get proper conversion
        let leftPx, topPx, widthPx, heightPx;
        
        if (typeof gridPositions !== 'undefined' && gridPositions.convertToCSS) {
          // Convert hint coordinates to CSS
          const hintCss = gridPositions.convertToCSS(guidedConfig.hintCoordinates, 'hint', 'custom', 'custom');
          
          // Convert component coordinates to CSS (if available)
          let componentCss = null;
          if (componentCoordinates && Array.isArray(componentCoordinates) && componentCoordinates.length >= 4) {
            componentCss = gridPositions.convertToCSS(componentCoordinates, 'component', 'custom', 'custom');
          }
          
          if (hintCss && hintCss.css) {
            // Extract pixel values from CSS (may be percentages or pixels)
            const getPxValue = (cssValue, dimension) => {
              if (!cssValue) return 0;
              if (typeof cssValue === 'string') {
                if (cssValue.endsWith('px')) {
                  return parseFloat(cssValue);
                } else if (cssValue.endsWith('%')) {
                  const percent = parseFloat(cssValue);
                  const gridSize = dimension === 'width' ? 
                    (typeof GridPrecisionConfig !== 'undefined' ? 
                      GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].cols : 1600) :
                    (typeof GridPrecisionConfig !== 'undefined' ? 
                      GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].rows : 900);
                  return (percent / 100) * gridSize;
                }
              }
              return parseFloat(cssValue) || 0;
            };
            
            const hintLeftPx = getPxValue(hintCss.css.left, 'width');
            const hintTopPx = getPxValue(hintCss.css.top, 'height');
            const hintWidthPx = getPxValue(hintCss.css.width, 'width');
            const hintHeightPx = getPxValue(hintCss.css.height, 'height');
            
            if (componentCss && componentCss.css) {
              // Make hint coordinates relative to component
              const compLeftPx = getPxValue(componentCss.css.left, 'width');
              const compTopPx = getPxValue(componentCss.css.top, 'height');
              
              leftPx = hintLeftPx - compLeftPx;
              topPx = hintTopPx - compTopPx;
              widthPx = hintWidthPx;
              heightPx = hintHeightPx;
            } else {
              // Use hint coordinates directly (assume they're already relative or page-absolute)
              leftPx = hintLeftPx;
              topPx = hintTopPx;
              widthPx = hintWidthPx;
              heightPx = hintHeightPx;
            }
          }
        }
        
        // Fallback: direct calculation from grid coordinates
        if (leftPx === undefined) {
          const gridWidth = typeof GridPrecisionConfig !== 'undefined' ? 
            GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].cols : 1600;
          const gridHeight = typeof GridPrecisionConfig !== 'undefined' ? 
            GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].rows : 900;
          
          // Convert grid coordinates to pixels (assuming 1:1 mapping for now)
          // Calculate relative to component if component coordinates are available
          if (componentCoordinates && Array.isArray(componentCoordinates) && componentCoordinates.length >= 4) {
            const [compLeft, compTop] = componentCoordinates;
            leftPx = hintLeft - compLeft;
            topPx = hintTop - compTop;
          } else {
            leftPx = hintLeft;
            topPx = hintTop;
          }
          
          widthPx = hintRight - hintLeft;
          heightPx = hintBottom - hintTop;
        }
        
        baseHintStyle.position = 'absolute';
        baseHintStyle.left = `${leftPx}px`;
        baseHintStyle.top = `${topPx}px`;
        baseHintStyle.width = widthPx > 0 ? `${widthPx}px` : 'auto';
        baseHintStyle.height = heightPx > 0 ? `${heightPx}px` : 'auto';
        baseHintStyle.zIndex = 1000;
        baseHintStyle.marginTop = '0';
      } else {
        // Default positioning (relative, below content)
        baseHintStyle.marginTop = '15px';
      }
      
      // Show hint for highlight step
      if (currentStep.type === 'highlight') {
        const columnName = currentStep.columnName || 'this column';
        const columnSum = currentStep.columnSum || 0;
        return React.createElement('div', {
          key: 'guided-hint',
          className: 'add-guided-hint',
          style: {
            ...baseHintStyle,
            backgroundColor: '#E3F2FD',
            border: '2px solid #2196F3',
            color: '#1565C0'
          }
        }, currentStep.description || `Look at the ${columnName} column. The sum is ${columnSum}.`);
      }
      
      // Show hint for digit selection step
      if (currentStep.type === 'digit' && currentStep.selectionHint) {
        return React.createElement('div', {
          key: 'guided-hint',
          className: 'add-guided-hint',
          style: {
            ...baseHintStyle,
            backgroundColor: '#E3F2FD',
            border: '2px solid #2196F3',
            color: '#1565C0'
          }
        }, currentStep.selectionHint);
      }
      
      return React.createElement('div', {
        key: 'guided-hint',
        className: 'add-guided-hint',
        style: {
          ...baseHintStyle,
          backgroundColor: '#FFF9C4',
          border: '2px solid #FFC107',
          color: '#5D4037'
        }
      }, currentStep.hint || currentStep.description);
    };
    
    // ===== GUIDED MODE DIGIT PANEL =====
    const renderGuidedDigitPanel = () => {
      if (mode !== 'guided' || !guidedConfig.showDigitPanel) return null;
      
      const currentStep = getCurrentGuidedStep();
      if (!currentStep || guidedComplete) return null;
      
      const digits = guidedConfig.allowedDigits || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      
      return React.createElement('div', {
        key: 'guided-digit-panel',
        className: 'add-guided-digit-panel',
        style: {
          display: 'flex',
          flexDirection: 'row',
          gap: '6px',
          padding: '15px',
          backgroundColor: '#F5F5F5',
          border: '2px solid #FFC107',
          borderRadius: '8px',
          marginTop: '15px',
          alignItems: 'center',
          justifyContent: 'center'
        }
      }, [
        React.createElement('div', {
          key: 'panel-label',
          style: { fontSize: '14px', fontWeight: 'bold', marginRight: '12px', color: '#424242' }
        }, 'Drag a digit:'),
        ...digits.map(digit =>
          React.createElement('div', {
            key: `digit-${digit}`,
            className: 'add-digit-button',
            style: {
              width: cellSizePx * 1.2,
              height: cellSizePx * 1.2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isGuidedDragging && guidedDraggedDigit === digit ? '#BBDEFB' : '#E3F2FD',
              border: '2px solid #2196F3',
              borderRadius: '8px',
              fontSize: fontSizePx * 1.1,
              fontWeight: 'bold',
              color: '#1976D2',
              cursor: isGuidedDragging ? 'not-allowed' : 'grab',
              userSelect: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            },
            onMouseDown: (e) => !isGuidedDragging && handleGuidedDragStart(digit, e),
            onTouchStart: (e) => !isGuidedDragging && handleGuidedDragStart(digit, e),
            onMouseEnter: (e) => {
              if (!isGuidedDragging) {
                e.target.style.backgroundColor = '#BBDEFB';
                e.target.style.transform = 'scale(1.1)';
              }
            },
            onMouseLeave: (e) => {
              if (!isGuidedDragging) {
                e.target.style.backgroundColor = '#E3F2FD';
                e.target.style.transform = 'scale(1)';
              }
            }
          }, digit)
        )
      ]);
    };
    
    // ===== GUIDED MODE DRAGGED DIGIT OVERLAY =====
    const renderGuidedDraggedDigitOverlay = () => {
      if (mode !== 'guided' || !isGuidedDragging || guidedDraggedDigit === null) return null;
      
      return React.createElement('div', {
        key: 'guided-dragged-digit-overlay',
        style: {
          position: 'fixed',
          left: `${guidedDragPosition.x - 20}px`,
          top: `${guidedDragPosition.y - 20}px`,
          width: cellSizePx * 1.2,
          height: cellSizePx * 1.2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#2196F3',
          border: '3px solid #1976D2',
          borderRadius: '8px',
          fontSize: fontSizePx * 1.1,
          fontWeight: 'bold',
          color: 'white',
          pointerEvents: 'none',
          zIndex: 10000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          transform: 'scale(1.2)'
        }
      }, guidedDraggedDigit);
    };
    
    // ===== GUIDED COMPLETE MESSAGE =====
    const renderGuidedComplete = () => {
      if (mode !== 'guided' || !guidedComplete) return null;
      
      return React.createElement('div', {
        key: 'guided-complete',
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
      }, `🎉 Complete! ${addends.join(' + ')} = ${data.finalAnswer}`);
    };
    
    // ===== FLYING CARRY OVERLAY =====
    const renderFlyingCarryOverlay = () => {
      if (!flyingCarry) return null;
      
      const { value, startX, startY, endX, endY } = flyingCarry;
      
      // Calculate the difference (delta) for the transform
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      
      return React.createElement('div', {
        key: 'flying-carry',
        className: 'add-flying-carry',
        style: {
          position: 'fixed',
          left: `${startX}px`,
          top: `${startY}px`,
          transform: 'translate(-50%, -50%)',
          animation: `flyToCarry 1000ms ease-out forwards`,
          animationFillMode: 'forwards',
          '--start-x': `0px`,
          '--start-y': `0px`,
          '--end-x': `${deltaX}px`,
          '--end-y': `${deltaY}px`
        }
      }, value);
    };
    
    // ===== BOUNCING DIGIT OVERLAY =====
    const renderBouncingDigitOverlay = () => {
      if (!bouncingDigit) return null;
      
      const { value, startX, startY, endX, endY } = bouncingDigit;
      
      // Calculate the difference (delta) for the transform
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      
      return React.createElement('div', {
        key: 'bouncing-digit',
        className: 'add-bouncing-digit',
        style: {
          position: 'fixed',
          left: `${startX}px`,
          top: `${startY}px`,
          transform: 'translate(-50%, -50%)',
          animation: `bounceDown 800ms ease-out forwards`,
          animationFillMode: 'forwards',
          '--start-x': `0px`,
          '--start-y': `0px`,
          '--end-x': `${deltaX}px`,
          '--end-y': `${deltaY}px`
        }
      }, value);
    };
    
    // ===== ANIMATION CONTROLS =====
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
        margin: '0 4px'
      };
      
      return React.createElement('div', {
        key: 'animation-controls',
        className: 'add-animation-controls',
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
          style: buttonStyle,
          disabled: animationStepIndex === 0
        }, '⏮'),
        React.createElement('button', {
          key: 'play-pause',
          onClick: animationPlaying ? pauseAnimation : playAnimation,
          style: buttonStyle
        }, animationPlaying ? '⏸' : '▶'),
        React.createElement('button', {
          key: 'step-forward',
          onClick: stepForwardAnimation,
          style: buttonStyle,
          disabled: animationStepIndex >= animationSteps.length - 1
        }, '⏭'),
        React.createElement('button', {
          key: 'reset',
          onClick: resetAnimation,
          style: { ...buttonStyle, backgroundColor: '#757575' }
        }, '↺')
      ]);
    };
    
    // ===== ANIMATION INFO =====
    const renderAnimationInfo = () => {
      if (mode !== 'animation') return null;
      
      const currentStep = animationSteps[animationStepIndex];
      
      // Calculate base width from container or use a fixed value
      // Assuming typical container width, we'll use a fixed width that's 1.5x the original
      // Original would be around 300-400px, so 1.5x = 450-600px
      const fixedWidth = '600px'; // 1.5x of typical ~400px
      const fixedHeight = '120px'; // 2x of typical ~60px (with padding)
      
      return React.createElement('div', {
        key: 'animation-info',
        className: 'add-animation-info',
        style: {
          width: fixedWidth,
          height: fixedHeight,
          padding: '12px 20px',
          backgroundColor: '#EDE7F6',
          border: '2px solid #673AB7',
          borderRadius: '8px',
          marginTop: '15px',
          marginLeft: 'auto',
          marginRight: 'auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }
      }, [
        React.createElement('div', {
          key: 'step-description',
          style: { 
            fontSize: '16px', 
            color: '#4527A0', 
            fontWeight: '500',
            marginBottom: '8px',
            wordWrap: 'break-word',
            maxWidth: '100%'
          }
        }, currentStep?.description || 'Ready to start'),
        React.createElement('div', {
          key: 'step-progress',
          style: { 
            fontSize: '12px', 
            color: '#7E57C2', 
            marginTop: '6px'
          }
        }, `Step ${animationStepIndex + 1} of ${animationSteps.length}`)
      ]);
    };
    
    // ===== DRAGDROP DIGIT BANK =====
    const renderDragDropDigitBank = () => {
      if (mode !== 'dragDrop' || !dragDropConfig.showDigitBank) return null;
      
      const digits = dragDropConfig.allowedDigits || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      
      return React.createElement('div', {
        key: 'dragdrop-digit-bank',
        className: 'add-dragdrop-digit-bank',
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '15px',
          backgroundColor: '#F5F5F5',
          border: '2px solid #9E9E9E',
          borderRadius: '8px',
          marginTop: '15px',
          alignItems: 'center'
        }
      }, [
        React.createElement('div', {
          key: 'bank-label',
          style: { fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#424242' }
        }, 'Drag digits:'),
        React.createElement('div', {
          key: 'digits-container',
          style: { display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }
        }, digits.map(digit =>
          React.createElement('div', {
            key: `digit-${digit}`,
            className: 'add-digit-tile',
            style: {
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
              userSelect: 'none'
            },
            onMouseDown: (e) => !isDragging && handleDragStart(digit, e),
            onTouchStart: (e) => !isDragging && handleDragStart(digit, e)
          }, digit)
        ))
      ]);
    };
    
    // ===== DRAGGED DIGIT OVERLAY =====
    const renderDraggedDigitOverlay = () => {
      if (mode !== 'dragDrop' || !isDragging || draggedDigit === null) return null;
      
      return React.createElement('div', {
        key: 'dragged-digit-overlay',
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
          transform: 'scale(1.2)'
        }
      }, draggedDigit);
    };
    
    // ===== DRAGDROP CONTROLS =====
    const renderDragDropControls = () => {
      if (mode !== 'dragDrop') return null;
      
      return React.createElement('div', {
        key: 'dragdrop-controls',
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
            fontSize: '14px'
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
    
    // ===== DRAGDROP COMPLETE =====
    const renderDragDropComplete = () => {
      if (mode !== 'dragDrop' || !dragDropComplete) return null;
      
      return React.createElement('div', {
        key: 'dragdrop-complete',
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
    
    // ===== PRACTICE CONTROLS =====
    const renderPracticeControls = () => {
      if (mode !== 'practice') return null;
      
      return React.createElement('div', {
        key: 'practice-controls',
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
            fontSize: '14px'
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
    
    // ===== PRACTICE COMPLETE =====
    const renderPracticeComplete = () => {
      if (mode !== 'practice' || !practiceComplete) return null;
      
      return React.createElement('div', {
        key: 'practice-complete',
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
    
    // ===== SPOTINCORRECT CONTROLS =====
    const renderSpotIncorrectControls = () => {
      if (mode !== 'spotIncorrect') return null;
      
      return React.createElement('div', {
        key: 'spot-incorrect-controls',
        style: {
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          marginTop: '15px'
        }
      }, [
        !checkResult && React.createElement('button', {
          key: 'check-btn',
          onClick: handleCheck,
          style: {
            padding: '10px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }
        }, 'Check'),
        React.createElement('button', {
          key: 'reset-btn',
          onClick: handleReset,
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
    
    // ===== FINAL ANSWER (default mode) =====
    const renderFinalAnswer = () => {
      if (mode !== 'default') return null;
      
      return React.createElement('div', {
        key: 'final-answer',
        style: {
          marginTop: '15px',
          padding: '10px 20px',
          backgroundColor: '#E8F5E9',
          border: '2px solid #4CAF50',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: fontSizePx,
          fontWeight: 'bold',
          color: '#2E7D32'
        }
      }, `${addends.join(' + ')} = ${data.finalAnswer}`);
    };
    
    return React.createElement('div', {
      className: `long-addition-grid long-addition-grid-${mode}`,
      'data-mode': mode,
      style: containerStyle
    }, [
      mainContent,
      renderFinalAnswer(),
      renderGuidedHint(),
      renderGuidedDigitPanel(),
      renderGuidedDraggedDigitOverlay(),
      renderGuidedComplete(),
      renderAnimationInfo(),
      renderAnimationControls(),
      renderFlyingCarryOverlay(), // Add flying carry animation
      renderBouncingDigitOverlay(), // Add bouncing digit animation
      renderDragDropDigitBank(),
      renderDraggedDigitOverlay(),
      renderDragDropControls(),
      renderDragDropComplete(),
      renderPracticeControls(),
      renderPracticeComplete(),
      renderSpotIncorrectControls()
    ]);
  };
  
  // ===== EXPORT =====
  // Export immediately - React should be loaded by this point
  try {
    window.LongAdditionGrid = LongAdditionGrid;
    console.log('✅ [LongAdditionGrid] Component registered to window.LongAdditionGrid');
  } catch (error) {
    console.error('❌ [LongAdditionGrid] Error registering component:', error);
    // Try to export a placeholder function so the check passes
    window.LongAdditionGrid = function() {
      console.error('LongAdditionGrid: Component failed to load properly');
      return null;
    };
  }
})();

