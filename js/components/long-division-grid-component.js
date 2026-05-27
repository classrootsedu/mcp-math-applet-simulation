/**
 * Long Division Grid Component
 * 
 * A fully interactive React component for visualizing and solving long division
 * with step-by-step working, remainders, and decimal support.
 */

(function() {
  'use strict';
  
  // Check if React is available
  if (typeof React === 'undefined') {
    console.error('❌ LongDivisionGrid: React is not loaded. Please load React before this component.');
    return;
  }
  
  // ===== HELPER FUNCTIONS =====
  
  /**
   * Convert a number to an array of digits
   */
  const numberToDigits = (num) => {
    return String(Math.abs(Math.floor(num))).split('').map(Number);
  };
  
  /**
   * Pad array to target length with nulls on the left
   */
  const padLeft = (arr, targetLength) => {
    const padding = new Array(Math.max(0, targetLength - arr.length)).fill(null);
    return [...padding, ...arr];
  };
  
  /**
   * Calculate a single division step
   * Returns { quotientDigit, subtractValue, difference, bringDown }
   */
  const calculateDivisionStep = (currentValue, divisor) => {
    const quotientDigit = Math.floor(currentValue / divisor);
    const subtractValue = quotientDigit * divisor;
    const difference = currentValue - subtractValue;
    
    return {
      quotientDigit,
      subtractValue,
      difference
    };
  };
  
  /**
   * Calculate all long division data
   * Returns structured data for rendering the division grid
   */
  const calculateLongDivision = (dividend, divisor, showRemainder = true, decimalPlaces = 0, preventLeadingZeroQuotient = false) => {
    if (divisor === 0) {
      return {
        error: 'Cannot divide by zero',
        dividendDigits: numberToDigits(dividend),
        divisorDigits: numberToDigits(0),
        quotientDigits: [],
        steps: [],
        remainder: null,
        finalAnswer: null
      };
    }
    
    const dividendDigits = numberToDigits(dividend);
    const divisorDigits = numberToDigits(divisor);
    const steps = [];
    const quotientDigits = [];
    
    let currentValue = 0;
    let dividendIndex = 0;
    let hasStartedQuotient = false;
    
    // Process each digit of the dividend
    while (dividendIndex < dividendDigits.length) {
      // Bring down the next digit
      currentValue = currentValue * 10 + dividendDigits[dividendIndex];
      
      // Calculate this step
      const step = calculateDivisionStep(currentValue, divisor);
      
      // Handle zero quotient case: if currentValue < divisor and we haven't started quotient yet,
      // we need to add 0 to quotient and bring down the next digit
      // This happens when the first digit(s) of dividend are smaller than divisor
      // If preventLeadingZeroQuotient is true, skip adding 0 and keep bringing down digits
      if (step.quotientDigit === 0 && !hasStartedQuotient && currentValue < divisor) {
        if (preventLeadingZeroQuotient) {
          // Skip adding 0 to quotient, just bring down the next digit
          // Don't record a step, just continue to bring down next digit
          dividendIndex++;
          continue; // Continue to bring down next digit without recording a step
        } else {
        // Add 0 to quotient
        hasStartedQuotient = true;
        quotientDigits.push(0);
        
        // Record the step with 0 quotient
        // Note: subtractValue is 0 (0 * divisor), and difference equals currentValue (no subtraction)
        steps.push({
          stepIndex: steps.length,
          dividendIndex,
          bringDownDigit: dividendDigits[dividendIndex],
          currentValue,
          quotientDigit: 0,
          subtractValue: 0, // 0 * divisor = 0
          subtractDigits: [0],
          difference: currentValue, // No subtraction, difference equals currentValue
          differenceDigits: numberToDigits(currentValue),
          position: dividendIndex,
          isZeroQuotient: true // Mark this as a zero quotient step
        });
        
        // currentValue remains the same (no subtraction), move to next digit
        // Note: We don't set currentValue = step.difference here because difference equals currentValue
        dividendIndex++;
        continue; // Continue to bring down next digit
        }
      }
      
      // Only add quotient digit if we've started or it's non-zero
      if (step.quotientDigit > 0 || hasStartedQuotient) {
        hasStartedQuotient = true;
        quotientDigits.push(step.quotientDigit);
      } else if (dividendIndex === dividendDigits.length - 1) {
        // Ensure at least one digit in quotient
        quotientDigits.push(0);
        hasStartedQuotient = true;
      }
      
      // Record the step
      steps.push({
        stepIndex: steps.length,
        dividendIndex,
        bringDownDigit: dividendDigits[dividendIndex],
        currentValue,
        quotientDigit: hasStartedQuotient ? step.quotientDigit : null,
        subtractValue: hasStartedQuotient ? step.subtractValue : null,
        subtractDigits: hasStartedQuotient ? numberToDigits(step.subtractValue) : [],
        difference: step.difference,
        differenceDigits: numberToDigits(step.difference),
        position: dividendIndex // Position in the dividend for alignment
      });
      
      currentValue = step.difference;
      dividendIndex++;
    }
    
    // Handle decimal places if not showing remainder
    let decimalDigits = [];
    if (!showRemainder && decimalPlaces > 0 && currentValue > 0) {
      for (let i = 0; i < decimalPlaces; i++) {
        currentValue = currentValue * 10;
        const step = calculateDivisionStep(currentValue, divisor);
        
        decimalDigits.push(step.quotientDigit);
        
        steps.push({
          stepIndex: steps.length,
          dividendIndex: dividendDigits.length + i,
          bringDownDigit: 0,
          currentValue,
          quotientDigit: step.quotientDigit,
          subtractValue: step.subtractValue,
          subtractDigits: numberToDigits(step.subtractValue),
          difference: step.difference,
          differenceDigits: numberToDigits(step.difference),
          position: dividendDigits.length + i,
          isDecimal: true
        });
        
        currentValue = step.difference;
        
        // Stop if remainder becomes 0
        if (currentValue === 0) break;
      }
    }
    
    // Calculate remainder
    const remainder = currentValue;
    
    // Calculate total columns needed (dividend width + some padding)
    const totalColumns = Math.max(
      dividendDigits.length + (decimalDigits.length > 0 ? decimalDigits.length + 1 : 0),
      divisorDigits.length + 2
    );
    
    // Calculate final answer
    let finalAnswer;
    if (showRemainder) {
      finalAnswer = remainder > 0 
        ? `${quotientDigits.join('')} R ${remainder}`
        : quotientDigits.join('');
    } else {
      finalAnswer = decimalDigits.length > 0
        ? `${quotientDigits.join('')}.${decimalDigits.join('')}`
        : quotientDigits.join('');
    }
    
    return {
      dividendDigits,
      divisorDigits,
      quotientDigits,
      decimalDigits,
      steps,
      remainder,
      remainderDigits: numberToDigits(remainder),
      totalColumns,
      finalAnswer,
      dividend,
      divisor,
      showRemainder,
      decimalPlaces
    };
  };
  
  // ===== MAIN COMPONENT =====
  
  const LongDivisionGrid = ({
    dividend = 156,
    divisor = 12,
    showRemainder = true,
    decimalPlaces = 2,
    preventLeadingZeroQuotient = false, // If true, first quotient digit is never 0 and first partial product is a multiple of divisor
    showMultiplicationTable = false, // If true, show multiplication table for divisor (1 to 10)
    multiplicationTableCoordinates = null, // [left, top, right, bottom] viewport bounding box (px); table rendered in portal to document.body for true screen coordinates
    multiplicationTableHeader = false, // If true, show "Multiplication Table for <divisor>" at top (20% height), rest for table
    multiplicationTableFontSize = null, // Font size for multiplication table, default: fontSize * 0.7
    multiplicationTableRowsClickable = false, // If true, multiplication table rows are clickable
    showWorkings = true,
    interactive = false,
    onComplete = null,
    cellSize = '15gc',
    showStepHighlight = true,
    backgroundColor = '#f9f9f9',
    fontSize = '12gc',
    cellBackgroundColor = 'white',
    containerBorder = '2px solid #ddd',
    showContainerBorder = false, // Toggle to control container border visibility
    // Separator line styling
    lineColor = '#333',
    lineThickness = '2gc',
    // Cell border styling
    cellBorderColor = '#ddd',
    cellBorderWidth = '1px',
    cellBorderStyle = 'solid',
    // Grid alignment
    gridAlignment = 'center', // 'left', 'center', or 'right'
    // Minus sign position
    minusSignPosition = 'default', // 'default' or 'indonesia'
    // Incorrect values
    incorrectCount = 0, // Number of cells to make incorrect
    // Mode
    mode = 'default', // 'default', 'spotIncorrect', 'input', 'practice', 'guided', 'animation', 'dragDrop'
    onCheck = null,   // Callback when check is triggered externally
    onReset = null,   // Callback when reset is triggered externally
    onSelectionChange = null, // Callback with current selection state
    // Input mode - cells that should be input tiles
    inputCells = [], // Array of cell keys that should be input tiles
    onInputChange = null, // Callback when input values change
    onInputValidation = null, // Callback for input validation results
    // Hint text for default mode
    hintText = '', // Optional hint text shown in default mode
    // Practice mode configuration
    practiceConfig: practiceConfigProp = {},
    onPracticeValidate = null,
    onPracticeComplete = null,
    // Guided mode configuration
    guidedConfig: guidedConfigProp = {},
    // guidedHintTarget: 'internal' = show hint in div-guided-hint below grid; string = external component id (show hint there, hide internal); null = hide hints
    guidedHintTarget = 'internal',
    onStepComplete = null,
    onGuidedComplete = null,
    // Callbacks for updating dividend and divisor
    onDividendChange = null, // Callback when dividend is updated: (newDividend) => {}
    onDivisorChange = null, // Callback when divisor is updated: (newDivisor) => {}
    // Animation mode configuration
    animationConfig: animationConfigProp = {},
    onAnimationStep = null,
    onAnimationComplete = null,
    // DragDrop mode configuration
    dragDropConfig: dragDropConfigProp = {},
    onDragDropValidate = null,
    onDragDropComplete = null,
    // Theme system
    theme = 'coloured-theme',
    // Button theme disabled state
    disabled = false,
    // Minimal mode
    minimalMode = false,
    // Hidden cells
    hiddenCells = [],
    // Grouped styling
    quotientStyle = {},
    dividendStyle = {},
    divisorStyle = {},
    workingStyle = {},
    remainderStyle = {},
    // Component position and id (from elements-registry.js; id used for quiz detection)
    id = null,
    coordinates = null,
    position = null,
    // Styling props - all configurable
    cellBorderRadius = null, // Default: '4px' or '10px' for dark theme
    containerPadding = null, // Default: '20px' or '32px' for dark theme
    containerBorderRadius = null, // Default: '8px' or '16px' for dark theme
    cellGap = null, // Horizontal spacing between cells (accepts gc units), default: '0' or '8px' for dark theme
    cellBoxShadow = null, // Box shadow for cells, default: 'none' or '0 6px 12px rgba(0,0,0,0.25)' for dark theme
    rowGap = null, // Vertical spacing between rows (accepts gc units), default: '4px' or '10px' for dark theme
    lineSpacing = null, // Spacing between division lines/rows (accepts gc units), default: same as rowGap or calculated from margins
    bracketWidth = null, // Width of division bracket, default: '20px'
    bracketStrokeWidth = null, // Stroke width of bracket, default: '6px' or '4px' for dark theme
    bracketBorderRadius = null, // Border radius of bracket corner, default: '10px' or '12px' for dark theme
    lineHeight = null, // Height of separator lines, default: '6px' or '3px' for dark theme
    lineBorderRadius = null, // Border radius of lines, default: '0' or '2px' for dark theme
    helperTextFontSize = null, // Font size for helper text like "6 × 3 =", default: '18gc'
    helperTextColor = null, // Color for helper text, default: 'rgba(255,255,255,0.45)' for dark theme
    helperTextMarginRight = null, // Right margin for helper text, default: '12px'
    showHelperText = true, // Show helper text (e.g., "6 × 3 ="), default: true
    showArrows = true, // Show bring-down arrows, default: true
    showRemainderLabel = true, // Show "Remainder:" label, default: true
    showFinalAnswer = true, // Show final answer text, default: true
    arrowStrokeWidth = null, // Stroke width for bring-down arrows, default: '3px'
    arrowColor = null, // Color for arrows, default: 'rgba(170,170,170,0.65)'
    quotientRowMarginBottom = null, // Margin bottom for quotient row, default: '2px' or '8px' for dark theme
    subtractRowMarginTop = null, // Margin top for subtract rows, default: '4px' or '10px' for dark theme
    dividendToPartialProductGap = null, // Gap between dividend/partial dividend and partial product rows, default: '5gc'
    differenceRowMarginTop = null, // Margin top for difference rows, default: '2px' or '10px' for dark theme
    lineMarginTop = null, // Margin top for separator lines, default: '3px' or '12px' for dark theme
    lineMarginBottom = null, // Margin bottom for separator lines, default: '3px' or '12px' for dark theme
    // Color props for specific elements
    dividendCellColor = null, // Background color for dividend cells, default: gradient or '#827FCA' for dark theme
    partialProductRowColor = null, // Color for partial product helper text (e.g., "6 × 3 ="), default: 'rgba(255,255,255,0.45)' for dark theme
    partialProductRowBackground = null, // Background color for partial product row, default: transparent
    partialProductCellColor = null, // Background color for partial product cells (subtract row cells), default: uses partialRemainderColor or alternating colors
    subtractionBarColor = null, // Color for subtraction bar/line, default: 'rgba(255,255,255,0.85)' for dark theme
    subtractionBarThickness = null, // Thickness of subtraction bar, default: '3px' for dark theme
    subtractionBarStyle = null, // Style of subtraction bar (solid, dashed, dotted), default: 'solid'
    partialRemainderColor = null, // Background color for partial remainder/new partial dividend cells, default: alternating colors for dark theme
    bringDownCellColor = null, // Background color for bring-down cells, default: '#8950A3' for dark theme
    // Bracket styling
    bracketColor = null, // Color for bracket, default: 'white' or '#FFFFFF' for dark theme
    bracketMarginLeft = null, // Left margin for bracket when no gap, default: '4px'
    bracketTopOffset = null, // Top offset for bracket, default: '-2px'
    bracketHeightOffset = null, // Height offset for bracket (added to cellSize), default: '4px'
    bracketDividendMarginTop = null, // Top margin for dividend row, default: '-2px'
    bracketDividendPaddingTop = null, // Top padding for dividend when no gap, default: '5px'
    // Arrow styling
    arrowHeight = null, // Height of bring-down arrow, default: '60px' or '20gc'
    arrowWidth = null, // Width of bring-down arrow, default: '30px' or '10gc'
    arrowRightOffset = null, // Right offset for arrow positioning, default: '5px' or '2gc'
    arrowTopOffset = null, // Top offset for arrow positioning, default: '10px' or '3gc'
    arrowPathControlX = null, // X control point for arrow curve, default: '20px' or '7gc'
    arrowPathStartX = null, // Start X position for arrow, default: '15px' or '5gc'
    arrowHeadYOffset = null, // Y offset for arrow head, default: '12px' or '4gc'
    arrowHeadYOffset2 = null, // Second Y offset for arrow head, default: '8px' or '3gc'
    // Remainder row styling
    remainderRowMarginTop = null, // Margin top for remainder row, default: '15px' or '5gc'
    remainderLabelFontSizeMultiplier = null, // Font size multiplier for remainder label, default: 0.8
    remainderLabelMarginRight = null, // Right margin for remainder label, default: '8px' or '3gc'
    // Final answer styling
    finalAnswerMarginTop = null, // Margin top for final answer, default: '15px' or '20px' for dark theme
    finalAnswerPadding = null, // Padding for final answer, default: '10px 20px' or '12px 24px' for dark theme
    finalAnswerBorder = null, // Border for final answer, default: '2px solid #4CAF50' or '2px solid #41BDA3' for dark theme
    finalAnswerBorderRadius = null, // Border radius for final answer, default: '8px' or '10px' for dark theme
    finalAnswerColor = null, // Text color for final answer, default: '#2E7D32' or '#FFFFFF' for dark theme
    finalAnswerBackground = null // Background for final answer, default: '#E8F5E9' or gradient for dark theme
  }) => {
    // Merge config props with defaults
    const practiceConfig = {
      validateOnChange: false,
      showAllErrors: true,
      editableTypes: ['quotient', 'subtract', 'difference', 'remainder'],
      prefillCells: [],
      ...practiceConfigProp
    };
    
    // Derive showGuidedHint from guidedHintTarget: internal = show in div-guided-hint, string = external id, null = hide
    const showGuidedHint = guidedHintTarget === 'internal';

    const guidedConfig = {
      autoAdvance: true,
      showHints: true,
      hintPosition: 'bottom',
      hintCoordinates: null, // Optional: [left, top, right, bottom] to position hint absolutely
      stepOrder: 'ltr', // Left to right for division
      allowSkip: false,
      showDigitPanel: true, // Show digit panel for clicking digits
      digitPanelCoordinates: null, // Optional: [left, top, right, bottom] viewport px; when set, digit panel is position:fixed and stationary
      digitPanelOrientation: 'horizontal', // 'horizontal', 'vertical', or 'grid' (keyboard numberpad style)
      allowedDigits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      // Which types of cells to ask user to fill
      editableTypes: ['quotient', 'subtract', 'difference', 'remainder', 'bringDown'], // Default: all types
      // How to bring down digits: 'click' (click from dividend), 'drag' (drag from digit panel), 'both' (either method)
      bringDownMode: 'drag', // Default: drag from digit panel
      // Auto-fill subtract cells when quotient digit is entered
      autoFillSubtract: false, // Default: false - user must fill subtract cells manually
      // Auto-calculate remainder when difference is entered
      autoCalculateRemainder: false, // Default: false - user must calculate remainder manually
      ...guidedConfigProp
    };
    
    const animationConfig = {
      autoPlay: false,
      speed: 1000,
      showControls: true,
      highlightDuration: 500,
      digitAnimation: 'scale',
      ...animationConfigProp
    };
    
    const dragDropConfig = {
      validateOnDrop: true,
      showDigitBank: true,
      digitBankPosition: 'right',
      allowedDigits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      editableTypes: ['quotient', 'subtract', 'difference', 'remainder'],
      ...dragDropConfigProp
    };
    
    // ===== STATE =====
    
    // Core state
    const [userInputs, setUserInputs] = React.useState({});
    const [completedSteps, setCompletedSteps] = React.useState(new Set());
    const [incorrectCells, setIncorrectCells] = React.useState(new Set());
    const [currentTheme, setCurrentTheme] = React.useState(theme);
    const [selectedMultTableRow, setSelectedMultTableRow] = React.useState(null); // Track selected multiplication table row
    const [multTableRowFeedback, setMultTableRowFeedback] = React.useState(null); // { row: number, correct: boolean } when in guided quotient row click
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
    
    // Digit selection state for guided mode
    const [selectedStartingDigits, setSelectedStartingDigits] = React.useState([]);
    // Temporary feedback message when the user clicks an intentionally-disabled digit button
    // during "selectStartingDigits".
    const [selectDigitError, setSelectDigitError] = React.useState(null);
    const selectDigitErrorTimeoutRef = React.useRef(null);
    // Ref to track if we've auto-advanced from digit selection (to prevent multiple advances)
    const hasAutoAdvancedFromSelectionRef = React.useRef(false);
    // Ref to track previous step index to avoid infinite loops
    const previousStepIndexRef = React.useRef(0);
    
    // GLOBAL INTERACTION LOCK - prevents ALL clicks until current action sequence completes
    // This is a React state so the UI re-renders and disables all clickable elements
    const [isInteractionLocked, setIsInteractionLocked] = React.useState(false);
    // Also keep a ref for immediate checks (state updates are async)
    const isInteractionLockedRef = React.useRef(false);
    
    // Guided mode drag state
    const [guidedDraggedDigit, setGuidedDraggedDigit] = React.useState(null);
    const [guidedDragPosition, setGuidedDragPosition] = React.useState({ x: 0, y: 0 });
    const [isGuidedDragging, setIsGuidedDragging] = React.useState(false);
    
    // BringDown animation state
    const [bringDownAnimation, setBringDownAnimation] = React.useState(null);
    const [bringDownAnimationActive, setBringDownAnimationActive] = React.useState(false);
    
    // Incorrect drop animation state (for wiggle effect)
    const [wigglingCells, setWigglingCells] = React.useState(new Set());
    
    // Animation mode state
    const [animationStepIndex, setAnimationStepIndex] = React.useState(0);
    const [animationPlaying, setAnimationPlaying] = React.useState(false);
    const [animationSteps, setAnimationSteps] = React.useState([]);
    const [animationComplete, setAnimationComplete] = React.useState(false);
    const [visibleCells, setVisibleCells] = React.useState(new Set());
    const [highlightedCell, setHighlightedCell] = React.useState(null);
    const animationTimerRef = React.useRef(null);
    
    // DragDrop mode state
    const [draggedDigit, setDraggedDigit] = React.useState(null);
    const [dragPosition, setDragPosition] = React.useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragOverCell, setDragOverCell] = React.useState(null);
    const [dragDropValues, setDragDropValues] = React.useState({});
    const [dragDropValidation, setDragDropValidation] = React.useState({});
    const [dragDropComplete, setDragDropComplete] = React.useState(false);
    const dragElementRef = React.useRef(null);
    
    // Pre-compute dragDrop cell keys for renderCell access
    const dragDropCellKeysRef = React.useRef([]);
    
    // State for dynamic dividend and divisor (can be updated via callbacks)
    const [currentDividend, setCurrentDividend] = React.useState(dividend);
    const [currentDivisor, setCurrentDivisor] = React.useState(divisor);
    
    // Update state when props change
    React.useEffect(() => {
      setCurrentDividend(dividend);
      setCurrentDivisor(divisor);
    }, [dividend, divisor]);
    
    // Reset guided mode when dividend or divisor changes
    React.useEffect(() => {
      if (mode === 'guided') {
        setSelectedStartingDigits([]);
        setSelectDigitError(null);
        if (selectDigitErrorTimeoutRef.current) {
          clearTimeout(selectDigitErrorTimeoutRef.current);
          selectDigitErrorTimeoutRef.current = null;
        }
        setGuidedStepIndex(0);
        setGuidedValues({});
        setGuidedValidation({});
        setGuidedComplete(false);
      }
    }, [currentDividend, currentDivisor, mode]);
    
    // Expose update functions via callbacks
    React.useEffect(() => {
      if (typeof window !== 'undefined') {
        window.longDivisionGridUpdateDividend = (newDividend) => {
          const numDividend = parseInt(newDividend, 10);
          if (!isNaN(numDividend) && numDividend > 0) {
            setCurrentDividend(numDividend);
            if (onDividendChange) onDividendChange(numDividend);
          }
        };
        window.longDivisionGridUpdateDivisor = (newDivisor) => {
          const numDivisor = parseInt(newDivisor, 10);
          if (!isNaN(numDivisor) && numDivisor > 0) {
            setCurrentDivisor(numDivisor);
            if (onDivisorChange) onDivisorChange(numDivisor);
          }
        };
      }
    }, [onDividendChange, onDivisorChange]);
    
    // Convert gc units to pixels using GridCellFontUtils if available, otherwise fallback
    const gcToPx = React.useCallback((gcValue, propertyName = 'width') => {
      if (typeof gcValue === 'number') return gcValue;
      if (typeof gcValue === 'string') {
        const match = gcValue.match(/^([\d.]+)gc$/);
        if (match) {
          const gcUnits = parseFloat(match[1]);
          // Use GridCellFontUtils if available for accurate conversion
          if (typeof window !== 'undefined' && window.GridCellFontUtils && window.GridCellFontUtils.convertGcToPixels) {
            const converted = window.GridCellFontUtils.convertGcToPixels(gcValue, propertyName);
            // convertGcToPixels returns a string with 'px', so extract the number
            if (typeof converted === 'string' && converted.includes('px')) {
              return parseFloat(converted.replace('px', ''));
            }
            return converted;
          }
          // Fallback: approximate conversion (1gc ≈ 3px at 1080p height with 900 rows)
          // Actually, at 1080p with 900 rows: 1080/900 = 1.2px per gc
          // But we'll use a more standard conversion: 1gc ≈ window.innerHeight / 900
          if (typeof window !== 'undefined' && window.innerHeight) {
            const containerHeight = window.innerHeight || 1080;
            const rows = 900; // Precision 100 has 900 rows
            return (containerHeight / rows) * gcUnits;
          }
          return gcUnits * 3;
        }
        return parseFloat(gcValue) || 30;
      }
      return 30;
    }, []);
    
    // Convert cellSize and fontSize using the same method
    // Use 'width' for cellSize (no clamping) and 'fontSize' for fontSize (with clamping)
    const cellSizePx = gcToPx(cellSize, 'width');
    const fontSizePx = gcToPx(fontSize, 'fontSize');
    
    // Calculate division data - memoized
    const data = React.useMemo(() => calculateLongDivision(currentDividend, currentDivisor, showRemainder, decimalPlaces, preventLeadingZeroQuotient), [currentDividend, currentDivisor, showRemainder, decimalPlaces, preventLeadingZeroQuotient]);
    
    // Guided completion message: "Using Long Division, we see that X ÷ Y gives a quotient of Z and leaves no remainder." (or "leaves a remainder of R.")
    // Quotient part in quotient color, remainder part in remainder color. Colors by theme (computed before getThemeStyles).
    const quotientDisplay = data.quotientDigits && data.quotientDigits.length > 0 ? data.quotientDigits.join('') : '0';
    const remainderDisplay = data.remainder != null ? String(data.remainder) : '0';
    const completionQuotientColor = currentTheme === 'dark-theme' ? '#41BDA3' : (currentTheme === 'coloured-theme' ? '#E91E63' : '#333');
    const completionRemainderColor = (currentTheme === 'dark-theme' || currentTheme === 'coloured-theme') ? '#FF9800' : '#333';
    const completionParams = { dividend: currentDividend, divisor: currentDivisor, quotient: quotientDisplay, remainder: remainderDisplay };
    const completionIntro = (typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function')
      ? window.i18n.t('division.completeIntro', completionParams)
      : `Using Long Division, we see that ${currentDividend} ÷ ${currentDivisor} gives `;
    const completionQuotientPart = (typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function')
      ? window.i18n.t('division.completeQuotientPart', completionParams)
      : `a quotient of ${quotientDisplay}`;
    const completionAnd = (typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function')
      ? window.i18n.t('division.completeAnd', completionParams)
      : ' and ';
    const completionNoRemainderPart = (typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function')
      ? window.i18n.t('division.completeNoRemainderPart', completionParams)
      : 'leaves no remainder.';
    const completionRemainderPart = (typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function')
      ? window.i18n.t('division.completeRemainderPart', completionParams)
      : `leaves a remainder of ${remainderDisplay}.`;
    const remainderPartText = data.remainder === 0 ? completionNoRemainderPart : completionRemainderPart;
    const guidedCompleteHintText = `${completionIntro}<span style="color:${completionQuotientColor}">${completionQuotientPart}</span>${completionAnd}<span style="color:${completionRemainderColor}">${remainderPartText}</span>`;
    
    // i18n helper for division guided hints (uses window.i18n from data.js)
    const getDivisionText = (key, params = {}) => {
      if (typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function') {
        return window.i18n.t(key, params);
      }
      const fallbacks = {
        'division.chooseFirstDigit': 'Choose the first digit in the dividend.',
        'division.chooseNextDigit': `The number ${params.value ?? ''} is less than ${params.divisor ?? ''}. Choose the next digit.`,
        'division.selectThenFind': `The number ${params.value ?? ''} is >= ${params.divisor ?? ''}.<br><br>Now find how many times ${params.divisor ?? ''} goes into ${params.value ?? ''}.<br><br> Use the multiplication table/ Digit panel to fill the highlighted quotient digit`,
        'division.multiplicationTableFor': `Multiplication Table for ${params.divisor ?? ''}`,
        'division.howManyTimes': `How many times does ${params.divisor ?? ''} go into ${params.value ?? ''}?`,
        'division.stepDescriptionDivide': `${params.value ?? ''} ÷ ${params.divisor ?? ''} = ${params.quotient ?? ''}`,
        'division.bringDownHint': 'Bring down the next digit from the dividend.<br><br>Click the highlighted digit in the dividend row (or drag from the digit panel into the bring-down cell).',
        'division.bringDownDescription': `Bring down ${params.digit ?? ''}`,
        'division.hintProduct': `${params.quotient ?? ''} × ${params.divisor ?? ''} = ?<br><br>Use the digit panel to fill in the product (quotient × divisor).`,
        'division.writeDigit': `Write ${params.digit ?? ''}`,
        'division.hintDifference': `${params.current ?? ''} - ${params.subtract ?? ''} = ?<br><br>Use the digit panel to fill in the difference (remainder after subtraction).`,
        'division.hintRemainder': 'The remainder is ?<br><br>Use the digit panel to fill in the remainder.',
        'division.writeRemainderDigit': `Write remainder digit ${params.digit ?? ''}`,
        'division.selectStartingDescription': 'Select starting digits from dividend',
        'division.completeMessage': 'Division complete!',
        'division.completeIntro': `Using Long Division, we see that ${params.dividend ?? ''} ÷ ${params.divisor ?? ''} gives `,
        'division.completeQuotientPart': `a quotient of ${params.quotient ?? ''}`,
        'division.completeAnd': ' and ',
        'division.completeNoRemainderPart': 'leaves no remainder.',
        'division.completeRemainderPart': `leaves a remainder of ${params.remainder ?? ''}.`
      };
      let s = fallbacks[key];
      if (params && s) { Object.keys(params).forEach((k) => { s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), String(params[k])); }); }
      return s || key;
    };
    
    // ===== STYLING DEFAULTS (theme-based) =====
    const isDarkTheme = currentTheme === 'dark-theme';
    
    // Calculate default styling values based on theme
    // First calculate rowGap and lineSpacing so we can use them for other defaults
    const calculatedRowGap = rowGap !== null ? rowGap : (isDarkTheme ? '10px' : '4px');
    const calculatedLineSpacing = lineSpacing !== null ? lineSpacing : (rowGap !== null ? rowGap : (isDarkTheme ? '10px' : '4px'));
    
    const stylingDefaults = {
      cellBorderRadius: cellBorderRadius !== null ? cellBorderRadius : (isDarkTheme ? '10px' : '4px'),
      containerPadding: containerPadding !== null ? containerPadding : (isDarkTheme ? '32px' : '20px'),
      containerBorderRadius: containerBorderRadius !== null ? containerBorderRadius : (isDarkTheme ? '16px' : '8px'),
      cellGap: cellGap !== null ? cellGap : (isDarkTheme ? '8px' : '0'),
      cellBoxShadow: cellBoxShadow !== null ? cellBoxShadow : (isDarkTheme ? '0 6px 12px rgba(0,0,0,0.25)' : 'none'),
      rowGap: calculatedRowGap,
      lineSpacing: calculatedLineSpacing,
      bracketWidth: bracketWidth !== null ? bracketWidth : '20px',
      bracketStrokeWidth: bracketStrokeWidth !== null ? bracketStrokeWidth : (isDarkTheme ? '4px' : '6px'),
      bracketBorderRadius: bracketBorderRadius !== null ? bracketBorderRadius : (isDarkTheme ? '12px' : '10px'),
      lineHeight: lineHeight !== null ? lineHeight : (isDarkTheme ? '3px' : '6px'),
      lineBorderRadius: lineBorderRadius !== null ? lineBorderRadius : (isDarkTheme ? '2px' : '0'),
      helperTextFontSize: helperTextFontSize !== null ? helperTextFontSize : '18gc',
      helperTextColor: helperTextColor !== null ? helperTextColor : (isDarkTheme ? 'rgba(255,255,255,0.45)' : '#666'),
      helperTextMarginRight: helperTextMarginRight !== null ? helperTextMarginRight : '12px',
      // Color props for specific elements
      dividendCellColor: dividendCellColor !== null ? dividendCellColor : (isDarkTheme ? '#827FCA' : null),
      partialProductRowColor: partialProductRowColor !== null ? partialProductRowColor : (isDarkTheme ? 'rgba(255,255,255,0.45)' : '#666'),
      partialProductRowBackground: partialProductRowBackground !== null ? partialProductRowBackground : 'transparent',
      partialProductCellColor: partialProductCellColor !== null ? partialProductCellColor : null, // null means use partialRemainderColor or alternating colors
      subtractionBarColor: subtractionBarColor !== null ? subtractionBarColor : (isDarkTheme ? 'rgba(255,255,255,0.85)' : '#333'),
      subtractionBarThickness: subtractionBarThickness !== null ? subtractionBarThickness : (isDarkTheme ? '3px' : '2px'),
      subtractionBarStyle: subtractionBarStyle !== null ? subtractionBarStyle : 'solid',
      partialRemainderColor: partialRemainderColor !== null ? partialRemainderColor : null, // null means use alternating colors
      bringDownCellColor: bringDownCellColor !== null ? bringDownCellColor : (isDarkTheme ? '#8950A3' : null), // Default: '#8950A3' for dark theme
      arrowStrokeWidth: arrowStrokeWidth !== null ? arrowStrokeWidth : '3px',
      arrowColor: arrowColor !== null ? arrowColor : 'rgba(170,170,170,0.65)',
      // Use rowGap/lineSpacing when set - they override individual props
      // Priority: rowGap/lineSpacing > individual props > theme defaults
      quotientRowMarginBottom: rowGap !== null ? calculatedRowGap : (quotientRowMarginBottom !== null ? quotientRowMarginBottom : (isDarkTheme ? '8px' : '2px')),
      dividendToPartialProductGap: dividendToPartialProductGap !== null ? dividendToPartialProductGap : '5gc',
      subtractRowMarginTop: dividendToPartialProductGap !== null ? dividendToPartialProductGap : (rowGap !== null ? calculatedRowGap : (subtractRowMarginTop !== null ? subtractRowMarginTop : (isDarkTheme ? '10px' : '4px'))),
      differenceRowMarginTop: rowGap !== null ? calculatedRowGap : (differenceRowMarginTop !== null ? differenceRowMarginTop : (isDarkTheme ? '10px' : '2px')),
      lineMarginTop: lineSpacing !== null ? calculatedLineSpacing : (lineMarginTop !== null ? lineMarginTop : (isDarkTheme ? '12px' : '3px')),
      lineMarginBottom: lineSpacing !== null ? calculatedLineSpacing : (lineMarginBottom !== null ? lineMarginBottom : (isDarkTheme ? '12px' : '3px')),
      lineColor: (lineColor !== '#333' && lineColor !== null) ? lineColor : (isDarkTheme ? 'rgba(255,255,255,0.85)' : (lineColor || 'white')),
      // Bracket styling
      bracketColor: bracketColor !== null ? bracketColor : (isDarkTheme ? '#FFFFFF' : 'white'),
      bracketMarginLeft: bracketMarginLeft !== null ? bracketMarginLeft : '4px',
      bracketTopOffset: bracketTopOffset !== null ? bracketTopOffset : '-2px',
      bracketHeightOffset: bracketHeightOffset !== null ? bracketHeightOffset : '4px',
      bracketDividendMarginTop: bracketDividendMarginTop !== null ? bracketDividendMarginTop : '-2px',
      bracketDividendPaddingTop: bracketDividendPaddingTop !== null ? bracketDividendPaddingTop : '5px',
      // Arrow styling
      arrowHeight: arrowHeight !== null ? arrowHeight : '60px',
      arrowWidth: arrowWidth !== null ? arrowWidth : '30px',
      arrowRightOffset: arrowRightOffset !== null ? arrowRightOffset : '5px',
      arrowTopOffset: arrowTopOffset !== null ? arrowTopOffset : '10px',
      arrowPathControlX: arrowPathControlX !== null ? arrowPathControlX : '20px',
      arrowPathStartX: arrowPathStartX !== null ? arrowPathStartX : '15px',
      arrowHeadYOffset: arrowHeadYOffset !== null ? arrowHeadYOffset : '12px',
      arrowHeadYOffset2: arrowHeadYOffset2 !== null ? arrowHeadYOffset2 : '8px',
      // Remainder row styling
      remainderRowMarginTop: rowGap !== null ? calculatedRowGap : (remainderRowMarginTop !== null ? remainderRowMarginTop : '15px'),
      remainderLabelFontSizeMultiplier: remainderLabelFontSizeMultiplier !== null ? remainderLabelFontSizeMultiplier : 0.8,
      remainderLabelMarginRight: remainderLabelMarginRight !== null ? remainderLabelMarginRight : '8px',
      // Final answer styling
      finalAnswerMarginTop: finalAnswerMarginTop !== null ? finalAnswerMarginTop : (isDarkTheme ? '20px' : '15px'),
      finalAnswerPadding: finalAnswerPadding !== null ? finalAnswerPadding : (isDarkTheme ? '12px 24px' : '10px 20px'),
      finalAnswerBorder: finalAnswerBorder !== null ? finalAnswerBorder : (isDarkTheme ? '2px solid #41BDA3' : '2px solid #4CAF50'),
      finalAnswerBorderRadius: finalAnswerBorderRadius !== null ? finalAnswerBorderRadius : (isDarkTheme ? '10px' : '8px'),
      finalAnswerColor: finalAnswerColor !== null ? finalAnswerColor : (isDarkTheme ? '#FFFFFF' : '#2E7D32'),
      finalAnswerBackground: finalAnswerBackground !== null ? finalAnswerBackground : (isDarkTheme ? 'linear-gradient(145deg, #1C8974, #156b5a)' : '#E8F5E9')
    };
    
    // ===== THEME STYLES =====
    
    const getThemeStyles = React.useCallback(() => {
      const themes = {
        'coloured-theme': {
          quotient: { color: '#E91E63', backgroundColor: 'rgba(233, 30, 99, 0.1)' },
          dividend: { color: '#4ECDC4', backgroundColor: 'rgba(78, 205, 196, 0.1)' },
          divisor: { color: '#FF6B6B', backgroundColor: 'rgba(255, 107, 107, 0.1)' },
          working: { color: '#9C27B0', backgroundColor: 'rgba(156, 39, 176, 0.1)' },
          bringDown: { color: '#4ECDC4', backgroundColor: 'rgba(78, 205, 196, 0.2)' }, // Same color as dividend to show it's brought down
          remainder: { color: '#FF9800', backgroundColor: 'rgba(255, 152, 0, 0.2)' },
          bracket: { color: '#333' }
        },
        'white-theme': {
          quotient: { color: '#333', backgroundColor: 'white' },
          dividend: { color: '#333', backgroundColor: 'white' },
          divisor: { color: '#333', backgroundColor: 'white' },
          working: { color: '#333', backgroundColor: 'white' },
          bringDown: { color: '#333', backgroundColor: 'white' },
          remainder: { color: '#333', backgroundColor: 'white' },
          bracket: { color: '#333' }
        },
        'button-theme': {
          quotient: { color: '#333', backgroundColor: '#e0e0e0', cursor: 'pointer' },
          dividend: { color: '#333', backgroundColor: '#e0e0e0', cursor: 'pointer' },
          divisor: { color: '#333', backgroundColor: '#e0e0e0', cursor: 'pointer' },
          working: { color: '#333', backgroundColor: '#e0e0e0', cursor: 'pointer' },
          bringDown: { color: '#333', backgroundColor: '#e0e0e0', cursor: 'pointer' },
          remainder: { color: '#333', backgroundColor: '#e0e0e0', cursor: 'pointer' },
          bracket: { color: '#333' }
        },
        // New dark theme based on UI spec - teal quotient tiles, purple work tiles
        'dark-theme': {
          quotient: { 
            color: '#FFFFFF', 
            background: 'linear-gradient(145deg, #41BDA3, #1C8974)',
            boxShadow: '0 6px 12px rgba(0,0,0,0.25)',
            borderRadius: '10px'
          },
          dividend: { 
            color: '#FFFFFF', 
            background: 'linear-gradient(145deg, #827FCA, #827FCA)',
            boxShadow: '0 6px 12px rgba(0,0,0,0.25)',
            borderRadius: '10px'
          },
          divisor: { 
            color: '#FFFFFF', 
            background: 'transparent',
            fontWeight: '700'
          },
          working: { 
            color: '#FFFFFF', 
            background: 'linear-gradient(145deg, #B27FCA, #8950A3)',
            boxShadow: '0 6px 12px rgba(0,0,0,0.25)',
            borderRadius: '10px'
          },
          bringDown: { 
            color: '#FFFFFF', 
            background: 'linear-gradient(145deg, #B27FCA, #8950A3)',
            boxShadow: '0 6px 12px rgba(0,0,0,0.25)',
            borderRadius: '10px'
          },
          remainder: { 
            color: '#FFFFFF', 
            background: 'linear-gradient(145deg, #B27FCA, #8950A3)',
            boxShadow: '0 6px 12px rgba(0,0,0,0.25)',
            borderRadius: '10px'
          },
          bracket: { color: '#FFFFFF' },
          helperText: { color: 'rgba(255,255,255,0.45)' },
          line: { color: 'rgba(255,255,255,0.85)' }
        }
      };
      
      return themes[currentTheme] || themes['coloured-theme'];
    }, [currentTheme]);
    
    // ===== INCORRECT VALUES GENERATION =====
    
    React.useEffect(() => {
      if (mode === 'spotIncorrect' && incorrectCount > 0) {
        const newIncorrectValues = {};
        const allCellKeys = [];
        
        // Collect all cell keys that can be made incorrect
        data.quotientDigits.forEach((_, idx) => {
          allCellKeys.push(`quotient-${idx}`);
        });
        
        data.steps.forEach((step, stepIdx) => {
          if (step.subtractDigits) {
            step.subtractDigits.forEach((_, digitIdx) => {
              allCellKeys.push(`subtract-${stepIdx}-${digitIdx}`);
            });
          }
          if (step.differenceDigits) {
            step.differenceDigits.forEach((_, digitIdx) => {
              allCellKeys.push(`difference-${stepIdx}-${digitIdx}`);
            });
          }
        });
        
        // Randomly select cells to make incorrect
        const shuffled = [...allCellKeys].sort(() => Math.random() - 0.5);
        const selectedKeys = shuffled.slice(0, Math.min(incorrectCount, allCellKeys.length));
        
        selectedKeys.forEach(key => {
          const correctValue = getCorrectValueForCell(key);
          if (correctValue !== null) {
            // Generate a different value
            let incorrectValue;
            do {
              incorrectValue = Math.floor(Math.random() * 10);
            } while (incorrectValue === correctValue);
            newIncorrectValues[key] = incorrectValue;
          }
        });
        
        setIncorrectValues(newIncorrectValues);
      }
    }, [mode, incorrectCount, data]);
    
    // ===== HELPER FUNCTIONS =====
    
    /**
     * Get the correct value for a cell key
     */
    const getCorrectValueForCell = React.useCallback((key) => {
      const quotientMatch = key.match(/^quotient-(\d+)$/);
      if (quotientMatch) {
        const idx = parseInt(quotientMatch[1]);
        return data.quotientDigits[idx] ?? null;
      }
      
      const subtractMatch = key.match(/^subtract-(\d+)-(\d+)$/);
      if (subtractMatch) {
        const stepIdx = parseInt(subtractMatch[1]);
        const digitIdx = parseInt(subtractMatch[2]);
        const step = data.steps[stepIdx];
        return step?.subtractDigits?.[digitIdx] ?? null;
      }
      
      const differenceMatch = key.match(/^difference-(\d+)-(\d+)$/);
      if (differenceMatch) {
        const stepIdx = parseInt(differenceMatch[1]);
        const digitIdx = parseInt(differenceMatch[2]);
        const step = data.steps[stepIdx];
        return step?.differenceDigits?.[digitIdx] ?? null;
      }
      
      const remainderMatch = key.match(/^remainder-(\d+)$/);
      if (remainderMatch) {
        const idx = parseInt(remainderMatch[1]);
        return data.remainderDigits[idx] ?? null;
      }
      
      return null;
    }, [data]);
    
    // ===== SPOTINCORRECT MODE =====
    
    const handleCellClick = React.useCallback((key) => {
      if (mode !== 'spotIncorrect') return;
      if (checkResult) return; // Already checked
      
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
      
      // Validate
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
        const isCorrect = userValue === correctValue || Number(userValue) === Number(correctValue);
        
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
      const editableTypes = practiceConfig.editableTypes || ['quotient', 'subtract', 'difference', 'remainder'];
      
      if (editableTypes.includes('quotient')) {
        data.quotientDigits.forEach((digit, idx) => {
          cells.push({
            key: `quotient-${idx}`,
            type: 'quotient',
            correctValue: digit
          });
        });
      }
      
      if (editableTypes.includes('subtract') || editableTypes.includes('difference')) {
        data.steps.forEach((step, stepIdx) => {
          if (editableTypes.includes('subtract') && step.subtractDigits) {
            step.subtractDigits.forEach((digit, digitIdx) => {
              cells.push({
                key: `subtract-${stepIdx}-${digitIdx}`,
                type: 'subtract',
                correctValue: digit
              });
            });
          }
          if (editableTypes.includes('difference') && step.differenceDigits) {
            step.differenceDigits.forEach((digit, digitIdx) => {
              cells.push({
                key: `difference-${stepIdx}-${digitIdx}`,
                type: 'difference',
                correctValue: digit
              });
            });
          }
        });
      }
      
      if (editableTypes.includes('remainder') && showRemainder && data.remainder > 0) {
        data.remainderDigits.forEach((digit, idx) => {
          cells.push({
            key: `remainder-${idx}`,
            type: 'remainder',
            correctValue: digit
          });
        });
      }
      
      return cells;
    }, [data, practiceConfig.editableTypes, showRemainder]);
    
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
          const isCorrect = userValue === cell.correctValue || Number(userValue) === Number(cell.correctValue);
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
    
    // Helper functions to lock/unlock all interactions
    const lockInteraction = React.useCallback(() => {
      isInteractionLockedRef.current = true;
      setIsInteractionLocked(true);
    }, []);
    
    const unlockInteraction = React.useCallback(() => {
      isInteractionLockedRef.current = false;
      setIsInteractionLocked(false);
    }, []);
    
    // Check if interaction is currently locked (use ref for synchronous check)
    const checkInteractionLocked = React.useCallback(() => {
      return isInteractionLockedRef.current;
    }, []);
    
    const showSelectDigitError = React.useCallback((message, durationMs = 4000) => {
      setSelectDigitError(message);
      if (selectDigitErrorTimeoutRef.current) {
        clearTimeout(selectDigitErrorTimeoutRef.current);
      }
      selectDigitErrorTimeoutRef.current = setTimeout(() => {
        setSelectDigitError(null);
        selectDigitErrorTimeoutRef.current = null;
      }, durationMs);
    }, []);

    // Clear any pending timeouts on unmount
    React.useEffect(() => {
      return () => {
        if (selectDigitErrorTimeoutRef.current) {
          clearTimeout(selectDigitErrorTimeoutRef.current);
          selectDigitErrorTimeoutRef.current = null;
        }
      };
    }, []);

    // Digit selection handlers
    const handleSelectStartingDigit = React.useCallback((digitIndex) => {
      // Prevent any clicks while interaction is locked
      if (checkInteractionLocked()) {
        return;
      }
      lockInteraction();
      setSelectDigitError(null);

      // Compute the new selection from the current closure value so we can
      // both update React state AND emit a student-sourced event with the
      // accurate selectedDigits list (Issue #7). The closure value is
      // current because selectedStartingDigits is in this callback's deps.
      const prev = selectedStartingDigits;
      const newSelection = [...prev];
      const index = newSelection.indexOf(digitIndex);

      if (index === -1) {
        // Add digit if it's sequential (can only add next digit)
        if (newSelection.length === 0 || digitIndex === Math.max(...newSelection) + 1) {
          newSelection.push(digitIndex);
          newSelection.sort((a, b) => a - b);
        }
      } else {
        // Remove digit and all subsequent digits
        newSelection.splice(index);
      }

      setSelectedStartingDigits(newSelection);

      // Surface the dividend-digit selection so MAX can react ("good, now
      // how many 3s fit in 9?"). Without this emit, MAX is blind to setup
      // moves and can only see graded quotient/subtract digits. We re-use
      // action.completed (the parent bridge's allowlist) with a clear name.
      try {
        if (window.AppAPI && typeof window.AppAPI._emit === 'function') {
          const dividendValue = newSelection.reduce(
            (acc, i) => acc * 10 + data.dividendDigits[i],
            0
          );
          window.AppAPI._emit({
            type: 'action.completed',
            source: 'student',
            payload: {
              name: 'selectStartingDigit',
              digitIndex,
              selectedDigits: newSelection,
              dividendValue,
              divisor,
              cellKey: 'select-starting-digits',
              validation: { correct: true },
            },
          });
        }
      } catch (e) {
        // Non-fatal — the React state update above already succeeded.
        // eslint-disable-next-line no-console
        console.warn('🔗 [AI bridge] selectStartingDigit emit failed', e);
      }

      // Note: Lock will be released by the auto-advance effect or after a timeout
      // if no auto-advance occurs (e.g., when value is still less than divisor)
    }, [lockInteraction, checkInteractionLocked, selectedStartingDigits, data.dividendDigits, divisor]);
    
    
    const generateGuidedSteps = React.useCallback(() => {
      const steps = [];
      const editableTypes = guidedConfig.editableTypes || ['quotient', 'subtract', 'difference', 'remainder', 'bringDown'];
      
      // Add digit selection step at the beginning
      // This step allows user to select which digits from dividend to start with
      // Calculate current value from selected digits
      const currentStartingValue = selectedStartingDigits.reduce((acc, idx) => {
        return acc * 10 + data.dividendDigits[idx];
      }, 0);
      
      // Determine hint based on current selection
      let selectionHint;
      if (selectedStartingDigits.length === 0) {
        selectionHint = getDivisionText('division.chooseFirstDigit');
      } else if (currentStartingValue < divisor) {
        selectionHint = getDivisionText('division.chooseNextDigit', { value: currentStartingValue, divisor });
      } else {
        selectionHint = getDivisionText('division.selectThenFind', { value: currentStartingValue, divisor });
      }
      
      steps.push({
        type: 'selectStartingDigits',
        cellKey: 'select-starting-digits',
        hint: selectionHint,
        description: getDivisionText('division.selectStartingDescription'),
        selectedDigits: selectedStartingDigits
      });
      
      // Find which step to start from based on selected starting digits
      let startStepIndex = 0;
      if (selectedStartingDigits.length > 0 && currentStartingValue >= divisor) {
        // Find the step where currentValue matches the selected starting value
        // This is the step that corresponds to the number formed by selected digits
        startStepIndex = data.steps.findIndex(step => step.currentValue === currentStartingValue);
        
        // If not found by exact match, find the step where the last selected digit index matches
        if (startStepIndex === -1) {
          const lastSelectedIndex = Math.max(...selectedStartingDigits);
          startStepIndex = data.steps.findIndex(step => step.dividendIndex === lastSelectedIndex);
        }
        
        // If still not found, find the first step where currentValue >= divisor and quotientDigit is not 0
        if (startStepIndex === -1) {
          startStepIndex = data.steps.findIndex(step => step.currentValue >= divisor && step.quotientDigit !== 0);
        }
        
        // Default to 0 if still not found
        if (startStepIndex === -1) {
          startStepIndex = 0;
        }
      }
      
      // For each division step, starting from the step that matches selected digits
      data.steps.slice(startStepIndex).forEach((step, relativeStepIdx) => {
        const stepIdx = startStepIndex + relativeStepIdx;
        // Step: Bring down next digit (for steps after the first)
        // This should come BEFORE the quotient step for the current division step
        // The bringDown digit is needed to form the new number before we can calculate the quotient
        // BUT: Skip bringDown if this digit is already part of the selected starting digits
        if (editableTypes.includes('bringDown') && stepIdx > 0 && step.bringDownDigit !== undefined && step.bringDownDigit !== null) {
          // Check if this dividend digit is already in the selected starting digits
          const isDigitAlreadySelected = selectedStartingDigits.includes(step.dividendIndex);
          
          if (!isDigitAlreadySelected) {
            // Only add bringDown step if the digit hasn't been selected yet
            steps.push({
              type: 'bringDown',
              cellKey: `bringdown-${stepIdx}`,
              correctValue: step.bringDownDigit,
              hint: getDivisionText('division.bringDownHint'),
              description: getDivisionText('division.bringDownDescription', { digit: step.bringDownDigit }),
              dividendIndex: step.dividendIndex // Store which dividend digit to bring down
            });
          }
        }
        
        // Step: Determine quotient digit
        // When user has selected starting digits, skip zero quotient steps that come before
        // the step matching their selection (they already brought down those digits by selecting)
        // Also skip if quotient digit is 0 and it's the first quotient digit (leading zero)
        if (editableTypes.includes('quotient') && step.quotientDigit !== null) {
          // Calculate the quotient index for this step
          const quotientIndex = data.quotientDigits.length - data.steps.length + stepIdx;
          const isFirstQuotientDigit = quotientIndex === 0;
          const isLeadingZero = isFirstQuotientDigit && step.quotientDigit === 0;
          
          // Skip if:
          // 1. Starting from a step > 0 and this is a zero quotient at start (user already selected digits)
          // 2. This is a leading zero (first quotient digit is 0)
          if ((startStepIndex > 0 && stepIdx === startStepIndex && step.quotientDigit === 0) || isLeadingZero) {
            // Skip this zero quotient step
          } else {
            // Include all other quotient steps
            steps.push({
              type: 'quotient',
              cellKey: `quotient-${quotientIndex}`,
              correctValue: step.quotientDigit,
              hint: getDivisionText('division.selectThenFind', { divisor, value: step.currentValue }),
              description: getDivisionText('division.stepDescriptionDivide', { value: step.currentValue, divisor, quotient: step.quotientDigit })
            });
          }
        }
        
        // Step: Write subtraction value (quotient * divisor)
        // Skip subtract steps for zero quotient (0 * divisor = 0, no subtraction needed)
        if (editableTypes.includes('subtract') && step.subtractDigits && step.subtractDigits.length > 0 && step.quotientDigit !== 0) {
          step.subtractDigits.forEach((digit, digitIdx) => {
            steps.push({
              type: 'subtract',
              cellKey: `subtract-${stepIdx}-${digitIdx}`,
              correctValue: digit,
              hint: getDivisionText('division.hintProduct', { quotient: step.quotientDigit, divisor }),
              description: getDivisionText('division.writeDigit', { digit })
            });
          });
        }
        
        // Step: Write difference (remainder after subtraction) - units place first (right-to-left)
        if (editableTypes.includes('difference') && step.differenceDigits && step.differenceDigits.length > 0) {
          for (let digitIdx = step.differenceDigits.length - 1; digitIdx >= 0; digitIdx--) {
            const digit = step.differenceDigits[digitIdx];
            steps.push({
              type: 'difference',
              cellKey: `difference-${stepIdx}-${digitIdx}`,
              correctValue: digit,
              hint: getDivisionText('division.hintDifference', { current: step.currentValue, subtract: step.subtractValue }),
              description: getDivisionText('division.writeDigit', { digit })
            });
          }
        }
      });
      
      // Final remainder if applicable
      // Only add remainder steps if they haven't been completed yet
      if (editableTypes.includes('remainder') && showRemainder && data.remainder > 0) {
        // Check if remainder has already been filled
        // In guided mode, check if all remainder digits are already in guidedValues
        let remainderAlreadyFilled = false;
        if (mode === 'guided') {
          remainderAlreadyFilled = data.remainderDigits.every((digit, idx) => {
            const cellKey = `remainder-${idx}`;
            // Check if this remainder cell has been filled
            // We need to check guidedValues, but it's not in scope here
            // Instead, we'll check this when the step is actually reached
            return false; // For now, always show remainder steps
          });
        }
        
        // Only add remainder steps if not already filled
        // Note: We'll check again when the step is reached to avoid showing if already completed
        if (!remainderAlreadyFilled) {
          // Units place first (right-to-left) for remainder
          for (let idx = data.remainderDigits.length - 1; idx >= 0; idx--) {
            const digit = data.remainderDigits[idx];
            steps.push({
              type: 'remainder',
              cellKey: `remainder-${idx}`,
              correctValue: digit,
              hint: getDivisionText('division.hintRemainder'),
              description: getDivisionText('division.writeRemainderDigit', { digit })
            });
          }
        }
      }
      
      return steps;
    }, [data, divisor, showRemainder, guidedConfig.editableTypes, selectedStartingDigits]);
    
    const getCurrentGuidedStep = React.useCallback(() => {
      return guidedSteps[guidedStepIndex] || null;
    }, [guidedSteps, guidedStepIndex]);

    // Ref so drop handler always sees latest step (avoids stale closure when mouseup fires)
    const currentStepRef = React.useRef(null);
    currentStepRef.current = getCurrentGuidedStep();

    // Returns current guided hint text for internal display or external target (same logic as renderGuidedHint)
    const getCurrentGuidedHintText = React.useCallback(() => {
      if (mode !== 'guided' || !guidedConfig.showHints) return null;
      const currentStep = getCurrentGuidedStep();
      if (guidedComplete) return guidedCompleteHintText;
      // No current step but we're past the last step (e.g. just filled last remainder) – show completion immediately (guidedComplete may not have updated yet)
      if (!currentStep && guidedSteps.length > 0 && guidedStepIndex >= guidedSteps.length) return guidedCompleteHintText;
      // All remainder steps filled correctly – show completion (handles last digit fill before advanceGuidedStep/guidedComplete)
      const remainderSteps = guidedSteps.filter(s => s.type === 'remainder');
      if (remainderSteps.length > 0) {
        const allRemainderFilled = remainderSteps.every(step => {
          const val = guidedValues[step.cellKey];
          const correct = step.correctValue;
          const valueMatch = val !== undefined && val !== null && (val === correct || Number(val) === Number(correct));
          const validationMatch = guidedValidation[step.cellKey]?.isCorrect === true;
          return valueMatch || validationMatch;
        });
        if (allRemainderFilled) return guidedCompleteHintText;
      }
      if (!currentStep) return null;
      // Override the normal guided hint while the user is seeing a "wrong digit" feedback.
      if (currentStep.type === 'selectStartingDigits' && selectDigitError) return selectDigitError;
      if (currentStep.type === 'quotient') return currentStep.hint || null; // Show quotient hint so instruction updates after bring-down or subtract (no stale hint)
      if (currentStep.type === 'selectStartingDigits') {
        const currentStartingValue = selectedStartingDigits.reduce((acc, idx) => acc * 10 + data.dividendDigits[idx], 0);
        if (selectedStartingDigits.length === 0) return getDivisionText('division.chooseFirstDigit');
        if (currentStartingValue < divisor) return getDivisionText('division.chooseNextDigit', { value: currentStartingValue, divisor });
        return getDivisionText('division.selectThenFind', { value: currentStartingValue, divisor });
      }
      const hintFromStep = currentStep.hint || null;
      if (currentStep.type === 'remainder' && hintFromStep) {
        console.log('🔍 [LongDivisionGrid] getCurrentGuidedHintText: returning REMAINDER STEP HINT (hardcoded from step definition lines 1199-1205):', hintFromStep.substring(0, 60) + '...');
      }
      return hintFromStep;
    }, [mode, guidedConfig.showHints, getCurrentGuidedStep, guidedComplete, guidedSteps, guidedStepIndex, guidedValues, guidedValidation, selectedStartingDigits, data.dividendDigits, divisor, guidedCompleteHintText, selectDigitError]);

    // When guidedHintTarget is external (string id), push hint text to global so the target component can display it
    const currentHintTextForExternal = (guidedHintTarget && typeof guidedHintTarget === 'string') ? getCurrentGuidedHintText() : null;
    const currentStepForHint = (guidedHintTarget && typeof guidedHintTarget === 'string') ? getCurrentGuidedStep() : null;
    if (currentStepForHint?.type === 'remainder' && currentHintTextForExternal && currentHintTextForExternal.indexOf('The remainder is ?') !== -1) {
      console.log('🔍 [LongDivisionGrid] currentHintTextForExternal is REMAINDER HARDCODED HINT (from step definition). currentStep =', currentStepForHint?.cellKey, 'hint source = step.hint lines 1199-1205');
    }
    // Prefer "Division complete!" when all remainder steps are filled (so we never overwrite completion with remainder hint)
    const remainderStepsForHint = (guidedHintTarget && typeof guidedHintTarget === 'string') ? guidedSteps.filter(s => s.type === 'remainder') : [];
    const allRemainderFilledForHint = remainderStepsForHint.length > 0 && remainderStepsForHint.every(step => {
      const val = guidedValues[step.cellKey];
      const correct = step.correctValue;
      const valueMatch = val !== undefined && val !== null && (val === correct || Number(val) === Number(correct));
      const validationMatch = guidedValidation[step.cellKey]?.isCorrect === true;
      return valueMatch || validationMatch;
    });
    const hintTextToPush = (guidedHintTarget && typeof guidedHintTarget === 'string')
      ? (allRemainderFilledForHint ? guidedCompleteHintText : (currentHintTextForExternal || ''))
      : null;
    const remainderHintPrefix = (getDivisionText('division.hintRemainder') || '').split('<br>')[0].trim() || 'The remainder is ?';
    React.useEffect(() => {
      console.log('🔍 [LongDivisionGrid] Main hint effect RUN: guidedHintTarget =', guidedHintTarget, 'hintTextToPush (first 50) =', (hintTextToPush || '').substring(0, 50), 'window.__longDivisionComplete =', window.__longDivisionComplete);
      if (typeof guidedHintTarget === 'string') {
        let textToPush = hintTextToPush || '';
        const isRemainderHardcodedHint = remainderHintPrefix && textToPush.indexOf(remainderHintPrefix) !== -1;
        if (isRemainderHardcodedHint && window.__longDivisionComplete) {
          textToPush = guidedCompleteHintText;
          console.log('🔍 [LongDivisionGrid] Pushing hint (main effect): using completion message (window.__longDivisionComplete=true)');
        }
        const existing = window.__longDivisionGuidedHint;
        const alreadyDivisionComplete = existing && existing.targetId === guidedHintTarget && existing.text && existing.text === guidedCompleteHintText;
        if (isRemainderHardcodedHint && !window.__longDivisionComplete && alreadyDivisionComplete) {
          console.log('🔍 [LongDivisionGrid] Pushing hint (main effect): SKIP – not overwriting completion message with remainder hint');
          return;
        }
        if (isRemainderHardcodedHint && !window.__longDivisionComplete) {
          console.log('🔍 [LongDivisionGrid] Pushing hint (main effect): text is REMAINDER HARDCODED HINT (from step definition lines 1199-1205) – this is why instruction shows remainder hint');
        }
        window.__longDivisionGuidedHint = { targetId: guidedHintTarget, text: textToPush };
        console.log('🔍 [LongDivisionGrid] Pushing hint (main effect): allRemainderFilled =', allRemainderFilledForHint, 'text =', textToPush.substring(0, 80) + (textToPush.length > 80 ? '...' : ''));
      } else {
        window.__longDivisionGuidedHint = { targetId: null, text: '' };
      }
      window.dispatchEvent(new CustomEvent('guided-hint-changed', { detail: { targetId: guidedHintTarget } }));
    }, [guidedHintTarget, hintTextToPush, guidedCompleteHintText, remainderHintPrefix]);

    // When all remainder steps are filled, force-push "Division complete!" so the external hint updates immediately (avoids timing/closure issues)
    React.useEffect(() => {
      if (mode !== 'guided' || typeof guidedHintTarget !== 'string' || !guidedConfig.showHints) return;
      const remainderSteps = guidedSteps.filter(s => s.type === 'remainder');
      if (remainderSteps.length === 0) return;
      const perStep = remainderSteps.map(step => {
        const val = guidedValues[step.cellKey];
        const correct = step.correctValue;
        const valueMatch = val !== undefined && val !== null && (val === correct || Number(val) === Number(correct));
        const validationMatch = guidedValidation[step.cellKey]?.isCorrect === true;
        return { cellKey: step.cellKey, val, correct, valueMatch, validationMatch, filled: valueMatch || validationMatch };
      });
      const allFilled = perStep.every(p => p.filled);
      const remainderKeys = remainderSteps.map(s => s.cellKey);
      const guidedValuesForRemainder = {};
      remainderKeys.forEach(k => { guidedValuesForRemainder[k] = guidedValues[k]; });
      const guidedValidationForRemainder = {};
      remainderKeys.forEach(k => { guidedValidationForRemainder[k] = guidedValidation[k]; });
      console.log('🔍 [LongDivisionGrid] Remainder-completion effect: remainderSteps =', remainderSteps.length, 'allFilled =', allFilled);
      console.log('🔍 [LongDivisionGrid] Remainder perStep (each step):', JSON.stringify(perStep));
      console.log('🔍 [LongDivisionGrid] guidedValues for remainder keys:', JSON.stringify(guidedValuesForRemainder), 'guidedValidation for remainder keys:', JSON.stringify(guidedValidationForRemainder));
      if (allFilled) {
        console.log('🔍 [LongDivisionGrid] Pushing hint (remainder complete): completion message');
        window.__longDivisionGuidedHint = { targetId: guidedHintTarget, text: guidedCompleteHintText };
        window.dispatchEvent(new CustomEvent('guided-hint-changed', { detail: { targetId: guidedHintTarget } }));
      }
    }, [mode, guidedHintTarget, guidedConfig.showHints, guidedSteps, guidedValues, guidedValidation, guidedCompleteHintText]);
    
    // Auto-advance when valid starting digits are selected
    React.useEffect(() => {
      if (selectedStartingDigits.length === 0) {
        hasAutoAdvancedFromSelectionRef.current = false;
        // Unlock if we're back to no selection
        unlockInteraction();
        return;
      }
      
      // Only auto-advance if we're still on the digit selection step
      const currentStep = guidedSteps[guidedStepIndex];
      if (!currentStep || currentStep.type !== 'selectStartingDigits') {
        hasAutoAdvancedFromSelectionRef.current = false;
        return;
      }
      
      // Calculate the starting value from selected digits
      const startingValue = selectedStartingDigits.reduce((acc, idx) => {
        return acc * 10 + data.dividendDigits[idx];
      }, 0);
      
      // Behavior:
      // - If selected value >= divisor: Auto-advance to next step (e.g., "7" for 72 ÷ 6)
      // - If selected value < divisor: Do nothing, allow user to continue selecting next digit
      //   (e.g., "1" for 158 ÷ 6, then user selects "5" to make "15" which is >= 6)
      if (startingValue >= divisor && !hasAutoAdvancedFromSelectionRef.current) {
        // Auto-advance to next step when valid selection is made
        // Only advance by 1 step, not all steps
        if (guidedConfig.autoAdvance) {
          hasAutoAdvancedFromSelectionRef.current = true; // Mark that we've auto-advanced
          setTimeout(() => {
            setGuidedStepIndex(prev => {
              // Double-check we're still on the selection step before advancing
              const step = guidedSteps[prev];
              if (step && step.type === 'selectStartingDigits') {
                return prev + 1; // Advance by exactly 1 step
              }
              return prev; // Don't advance if we're already past the selection step
            });
            // Unlock after step index is updated and a small delay for UI to settle
            setTimeout(() => {
              unlockInteraction();
            }, 100);
          }, 500); // Small delay to show the selection
        } else {
          // No auto-advance, unlock immediately
          unlockInteraction();
        }
      } else if (startingValue < divisor) {
        // Reset the flag when value is less than divisor (user is still selecting)
        hasAutoAdvancedFromSelectionRef.current = false;
        // Unlock so user can select the next digit
        unlockInteraction();
      }
      // If startingValue < divisor, the user can continue selecting the next sequential digit
      // The canSelectDigit logic allows selecting the next digit in sequence
    }, [selectedStartingDigits, data.dividendDigits, divisor, guidedConfig.autoAdvance, guidedSteps, guidedStepIndex, unlockInteraction]);
    
    const advanceGuidedStep = React.useCallback(() => {
      const prevStep = guidedSteps[guidedStepIndex];
      console.log('🔍 [LongDivisionGrid] advanceGuidedStep CALLED: guidedStepIndex =', guidedStepIndex, 'prevStep.type =', prevStep?.type, prevStep?.cellKey, 'guidedSteps.length =', guidedSteps.length);
      if (guidedStepIndex < guidedSteps.length - 1) {
        setGuidedStepIndex(prev => {
          let nextIndex = prev + 1;
          const nextStep = guidedSteps[nextIndex];
          console.log('🔍 [LongDivisionGrid] advanceGuidedStep: nextIndex =', nextIndex, 'nextStep.type =', nextStep?.type, nextStep?.cellKey);
          
          // Skip remainder steps if they're already filled
          while (nextIndex < guidedSteps.length) {
            const step = guidedSteps[nextIndex];
            if (step && step.type === 'remainder') {
              // Check if this remainder digit is already filled
              const isFilled = guidedValues[step.cellKey] !== undefined && 
                              guidedValues[step.cellKey] !== null &&
                              (guidedValues[step.cellKey] === step.correctValue || Number(guidedValues[step.cellKey]) === Number(step.correctValue));
              
              if (isFilled) {
                // Skip this remainder step and move to next
                nextIndex++;
                continue;
              }
            }
            // Not a remainder step or not filled, stop here
            break;
          }
          
          // Check if we've reached the end after skipping
          if (nextIndex >= guidedSteps.length) {
            console.log('🔍 [LongDivisionGrid] advanceGuidedStep: setting guidedComplete=true (reached end)');
            setGuidedComplete(true);
            if (typeof window !== 'undefined') window.__longDivisionComplete = true;
            if (onGuidedComplete) onGuidedComplete();
          } else if (onStepComplete) {
            onStepComplete(nextIndex - 1, guidedSteps.length);
          }
          
          return nextIndex;
        });
        // Unlock interactions after step has advanced and UI settles
        setTimeout(() => {
          unlockInteraction();
        }, 150);
      } else {
        console.log('🔍 [LongDivisionGrid] advanceGuidedStep: already at last step, setting guidedComplete=true');
        setGuidedComplete(true);
        if (typeof window !== 'undefined') window.__longDivisionComplete = true;
        if (onGuidedComplete) onGuidedComplete();
        // Unlock on completion
        setTimeout(() => {
          unlockInteraction();
        }, 150);
      }
    }, [guidedStepIndex, guidedSteps, guidedValues, onStepComplete, onGuidedComplete, unlockInteraction]);
    
    // Apply quotient digit chosen from multiplication table row click (same logic as correct drag-drop)
    const applyGuidedQuotientFromMultTableRow = React.useCallback((rowMultiplier) => {
      // Prevent any interaction while locked
      if (checkInteractionLocked()) {
        return;
      }
      lockInteraction();
      
      const currentStep = getCurrentGuidedStep();
      if (!currentStep || currentStep.type !== 'quotient') {
        unlockInteraction();
        return;
      }
      const key = currentStep.cellKey;
      setGuidedValidation(prev => ({ ...prev, [key]: { isCorrect: true } }));
      setGuidedValues(prev => ({ ...prev, [key]: rowMultiplier }));
      if (guidedConfig.autoFillSubtract) {
        const quotientIdx = parseInt(key.split('-')[1]);
        const stepIdx = quotientIdx - (data.quotientDigits.length - data.steps.length);
        if (stepIdx >= 0 && stepIdx < data.steps.length) {
          const subtractSteps = guidedSteps.filter(step =>
            step.type === 'subtract' && step.cellKey.startsWith(`subtract-${stepIdx}-`)
          );
          const shouldSkipNormalAdvance = guidedConfig.autoAdvance && subtractSteps.length > 0;
          setTimeout(() => {
            setGuidedValues(prev => {
              const newValues = { ...prev, [key]: rowMultiplier };
              subtractSteps.forEach(subtractStep => { newValues[subtractStep.cellKey] = subtractStep.correctValue; });
              return newValues;
            });
            setGuidedValidation(prev => {
              const newValidation = { ...prev, [key]: { isCorrect: true } };
              subtractSteps.forEach(subtractStep => { newValidation[subtractStep.cellKey] = { isCorrect: true }; });
              return newValidation;
            });
            if (shouldSkipNormalAdvance) {
              const lastSubtractStepIndex = guidedSteps.findIndex(step =>
                step.cellKey === subtractSteps[subtractSteps.length - 1].cellKey
              );
              if (lastSubtractStepIndex !== -1 && lastSubtractStepIndex > guidedStepIndex) {
                setTimeout(() => {
                  setGuidedStepIndex(lastSubtractStepIndex + 1);
                  if (onStepComplete) onStepComplete(lastSubtractStepIndex, guidedSteps.length);
                  // Unlock after step advance
                  setTimeout(() => { unlockInteraction(); }, 150);
                }, 200);
              } else {
                // Unlock if no step advance needed
                setTimeout(() => { unlockInteraction(); }, 150);
              }
            } else {
              // Not skipping normal advance, advanceGuidedStep will unlock
            }
          }, 100);
          if (!shouldSkipNormalAdvance && guidedConfig.autoAdvance) setTimeout(advanceGuidedStep, 300);
        } else {
          if (guidedConfig.autoAdvance) setTimeout(advanceGuidedStep, 300);
        }
      } else {
        if (guidedConfig.autoAdvance) setTimeout(advanceGuidedStep, 300);
      }
    }, [getCurrentGuidedStep, guidedSteps, data.quotientDigits, data.steps.length, guidedConfig.autoFillSubtract, guidedConfig.autoAdvance, guidedStepIndex, setGuidedValues, setGuidedValidation, setGuidedStepIndex, advanceGuidedStep, onStepComplete, checkInteractionLocked, lockInteraction, unlockInteraction]);
    
    // When multiplication table is disabled (not awaiting quotient), clear row selection and feedback
    React.useEffect(() => {
      const step = getCurrentGuidedStep();
      const tableEnabled = mode === 'guided' && step?.type === 'quotient' && !guidedComplete;
      if (!tableEnabled) {
        setSelectedMultTableRow(null);
        setMultTableRowFeedback(null);
      }
    }, [mode, guidedComplete, guidedStepIndex, guidedSteps, getCurrentGuidedStep]);
    
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
      if (typeof window !== 'undefined') window.__longDivisionComplete = false;
      setGuidedValues({});
      setGuidedValidation({});
      setSelectDigitError(null);
      if (selectDigitErrorTimeoutRef.current) {
        clearTimeout(selectDigitErrorTimeoutRef.current);
        selectDigitErrorTimeoutRef.current = null;
      }
      // Reset the global interaction lock
      isInteractionLockedRef.current = false;
      setIsInteractionLocked(false);
      hasAutoAdvancedFromSelectionRef.current = false;
    }, []);
    
    // Clear global "division complete" flag when problem changes so a new problem does not show completion from a previous one
    React.useEffect(() => {
      if (typeof window !== 'undefined') window.__longDivisionComplete = false;
    }, [dividend, divisor]);

    // Initialize guided steps
    React.useEffect(() => {
      if (mode === 'guided') {
        const steps = generateGuidedSteps();
        
        // Check if we were on the selection step before regenerating (using ref to avoid dependency cycle)
        const wasOnSelectionStep = guidedSteps.length > 0 && 
          previousStepIndexRef.current < guidedSteps.length &&
          guidedSteps[previousStepIndexRef.current] && 
          guidedSteps[previousStepIndexRef.current].type === 'selectStartingDigits';
        
        setGuidedSteps(steps);
        
        // When steps are regenerated due to digit selection:
        // - If we were on the selection step, stay on it (index 0) so auto-advance can move us forward by 1
        // - If we were past the selection step, try to maintain position (but for now, reset to 0)
        if (wasOnSelectionStep) {
          // Stay on selection step - the auto-advance useEffect will handle moving forward
          setGuidedStepIndex(0);
          previousStepIndexRef.current = 0;
        } else if (selectedStartingDigits.length === 0) {
          // No digits selected, reset to beginning
          setGuidedStepIndex(0);
          previousStepIndexRef.current = 0;
        }
        // If we were past selection step and digits are selected, don't reset (but this shouldn't happen)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, dividend, divisor, selectedStartingDigits]);
    
    // Update ref when step index changes (separate effect to avoid dependency cycle)
    React.useEffect(() => {
      previousStepIndexRef.current = guidedStepIndex;
    }, [guidedStepIndex]);
    
    // ===== ANIMATION MODE =====
    
    const generateAnimationSteps = React.useCallback(() => {
      const steps = [];
      
      // Step: Show divisor (single block)
      steps.push({
        type: 'show',
        cells: [{ key: 'divisor', value: divisor }],
        description: `Show divisor: ${divisor}`
      });
      
      // Step: Show dividend
      steps.push({
        type: 'show',
        cells: data.dividendDigits.map((d, i) => ({ key: `dividend-${i}`, value: d })),
        description: `Show dividend: ${dividend}`
      });
      
      // For each division step
      let quotientIdx = 0;
      data.steps.forEach((step, stepIdx) => {
        // Highlight current portion of dividend
        steps.push({
          type: 'highlight',
          cells: [{ key: `dividend-${step.dividendIndex}`, value: step.bringDownDigit }],
          description: step.dividendIndex === 0 
            ? `Start with ${step.currentValue}` 
            : `Bring down ${step.bringDownDigit} to get ${step.currentValue}`
        });
        
        // Show quotient digit
        if (step.quotientDigit !== null) {
          steps.push({
            type: 'show',
            cells: [{ key: `quotient-${quotientIdx}`, value: step.quotientDigit }],
            description: `${step.currentValue} ÷ ${divisor} = ${step.quotientDigit}`
          });
          quotientIdx++;
        }
        
        // Show subtraction
        if (step.subtractDigits && step.subtractDigits.length > 0) {
          steps.push({
            type: 'show',
            cells: step.subtractDigits.map((d, i) => ({ key: `subtract-${stepIdx}-${i}`, value: d })),
            description: `${step.quotientDigit} × ${divisor} = ${step.subtractValue}`
          });
        }
        
        // Show difference
        if (step.differenceDigits && step.differenceDigits.length > 0) {
          steps.push({
            type: 'show',
            cells: step.differenceDigits.map((d, i) => ({ key: `difference-${stepIdx}-${i}`, value: d })),
            description: `${step.currentValue} - ${step.subtractValue} = ${step.difference}`
          });
        }
      });
      
      // Show remainder if applicable
      if (showRemainder && data.remainder > 0) {
        steps.push({
          type: 'show',
          cells: data.remainderDigits.map((d, i) => ({ key: `remainder-${i}`, value: d })),
          description: `Remainder: ${data.remainder}`
        });
      }
      
      // Complete
      steps.push({
        type: 'complete',
        description: `${dividend} ÷ ${divisor} = ${data.finalAnswer}`
      });
      
      return steps;
    }, [data, dividend, divisor, showRemainder]);
    
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
      
      if (step.type === 'show') {
        step.cells.forEach(cell => {
          setVisibleCells(prev => new Set([...prev, cell.key]));
        });
        setHighlightedCell(step.cells[step.cells.length - 1]?.key || null);
      } else if (step.type === 'highlight') {
        setHighlightedCell(step.cells[0]?.key || null);
      } else if (step.type === 'complete') {
        setHighlightedCell(null);
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
        // Need to rebuild visible cells up to previous step
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
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
    }, []);
    
    // Animation playback effect
    React.useEffect(() => {
      if (mode === 'animation' && animationPlaying && !animationComplete) {
        animationTimerRef.current = setInterval(() => {
          setAnimationStepIndex(prev => {
            const nextStep = prev + 1;
            if (nextStep >= animationSteps.length) {
              setAnimationPlaying(false);
              setAnimationComplete(true);
              if (onAnimationComplete) onAnimationComplete();
              return prev;
            }
            playAnimationStep(nextStep);
            return nextStep;
          });
        }, animationConfig.speed);
        
        return () => {
          if (animationTimerRef.current) {
            clearInterval(animationTimerRef.current);
          }
        };
      }
    }, [mode, animationPlaying, animationComplete, animationSteps.length, animationConfig.speed]);
    
    // Initialize animation steps
    React.useEffect(() => {
      if (mode === 'animation') {
        const steps = generateAnimationSteps();
        setAnimationSteps(steps);
        
        if (animationConfig.autoPlay) {
          setTimeout(() => {
            playAnimationStep(0);
            setAnimationPlaying(true);
          }, 500);
        }
      }
    }, [mode, dividend, divisor, animationConfig.autoPlay]);
    
    // ===== DRAGDROP MODE =====
    
    const generateDragDropCells = React.useCallback(() => {
      const cells = [];
      const editableTypes = dragDropConfig.editableTypes || ['quotient', 'subtract', 'difference', 'remainder'];
      
      if (editableTypes.includes('quotient')) {
        data.quotientDigits.forEach((digit, idx) => {
          cells.push({
            key: `quotient-${idx}`,
            type: 'quotient',
            correctValue: digit
          });
        });
      }
      
      if (editableTypes.includes('subtract') || editableTypes.includes('difference')) {
        data.steps.forEach((step, stepIdx) => {
          if (editableTypes.includes('subtract') && step.subtractDigits) {
            step.subtractDigits.forEach((digit, digitIdx) => {
              cells.push({
                key: `subtract-${stepIdx}-${digitIdx}`,
                type: 'subtract',
                correctValue: digit
              });
            });
          }
          if (editableTypes.includes('difference') && step.differenceDigits) {
            step.differenceDigits.forEach((digit, digitIdx) => {
              cells.push({
                key: `difference-${stepIdx}-${digitIdx}`,
                type: 'difference',
                correctValue: digit
              });
            });
          }
        });
      }
      
      if (editableTypes.includes('remainder') && showRemainder && data.remainder > 0) {
        data.remainderDigits.forEach((digit, idx) => {
          cells.push({
            key: `remainder-${idx}`,
            type: 'remainder',
            correctValue: digit
          });
        });
      }
      
      return cells;
    }, [data, dragDropConfig.editableTypes, showRemainder]);
    
    const getDragDropCellKeys = React.useCallback(() => {
      return generateDragDropCells().map(cell => cell.key);
    }, [generateDragDropCells]);
    
    // Update dragDrop cell keys ref
    React.useEffect(() => {
      if (mode === 'dragDrop') {
        dragDropCellKeysRef.current = getDragDropCellKeys();
      }
    }, [mode, getDragDropCellKeys]);
    
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
        const cellElement = elementBelow.closest('.div-cell-dragdrop');
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
        const cellElement = elementBelow.closest('.div-cell-dragdrop');
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
          const isCorrect = digit === cell.correctValue || Number(digit) === Number(cell.correctValue);
          
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
          const isCorrect = userValue === cell.correctValue || Number(userValue) === Number(cell.correctValue);
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
    
    // ===== EXPOSE GLOBAL FUNCTIONS =====
    
    React.useEffect(() => {
      if (mode === 'spotIncorrect') {
        window.longDivisionGridCheck = handleCheck;
        window.longDivisionGridReset = handleReset;
        window.longDivisionGridSelectedCells = selectedCells;
        window.longDivisionGridCheckResult = checkResult;
        window.longDivisionGridAllCorrect = allCorrect;
        window.longDivisionGridIncorrectValues = incorrectValues;
      } else if (mode === 'input') {
        window.longDivisionGridCheckInputs = checkInputs;
        window.longDivisionGridInputValues = inputValues;
        window.longDivisionGridInputValidation = inputValidation;
      } else if (mode === 'practice') {
        window.longDivisionGridValidatePractice = validatePractice;
        window.longDivisionGridResetPractice = resetPractice;
        window.longDivisionGridPracticeValues = practiceValues;
        window.longDivisionGridPracticeValidation = practiceValidation;
        window.longDivisionGridPracticeComplete = practiceComplete;
      } else if (mode === 'guided') {
        window.longDivisionGridAdvanceGuided = advanceGuidedStep;
        window.longDivisionGridSkipGuided = skipGuidedStep;
        window.longDivisionGridResetGuided = resetGuided;
        window.longDivisionGridGuidedStepIndex = guidedStepIndex;
        window.longDivisionGridGuidedSteps = guidedSteps;
        window.longDivisionGridGuidedComplete = guidedComplete;
      } else if (mode === 'animation') {
        window.longDivisionGridAnimationPlay = playAnimation;
        window.longDivisionGridAnimationPause = pauseAnimation;
        window.longDivisionGridAnimationStepForward = stepForwardAnimation;
        window.longDivisionGridAnimationStepBackward = stepBackwardAnimation;
        window.longDivisionGridAnimationReset = resetAnimation;
        window.longDivisionGridAnimationStep = animationStepIndex;
        window.longDivisionGridAnimationPlaying = animationPlaying;
        window.longDivisionGridAnimationComplete = animationComplete;
      } else if (mode === 'dragDrop') {
        window.longDivisionGridDragDropValidate = validateDragDrop;
        window.longDivisionGridDragDropReset = resetDragDrop;
        window.longDivisionGridDragDropValues = dragDropValues;
        window.longDivisionGridDragDropValidation = dragDropValidation;
        window.longDivisionGridDragDropComplete = dragDropComplete;
      }
      
      return () => {
        // Cleanup
        if (mode === 'spotIncorrect') {
          window.longDivisionGridCheck = null;
          window.longDivisionGridReset = null;
        } else if (mode === 'input') {
          window.longDivisionGridCheckInputs = null;
        } else if (mode === 'practice') {
          window.longDivisionGridValidatePractice = null;
          window.longDivisionGridResetPractice = null;
        } else if (mode === 'guided') {
          window.longDivisionGridAdvanceGuided = null;
          window.longDivisionGridSkipGuided = null;
          window.longDivisionGridResetGuided = null;
        } else if (mode === 'animation') {
          window.longDivisionGridAnimationPlay = null;
          window.longDivisionGridAnimationPause = null;
        } else if (mode === 'dragDrop') {
          window.longDivisionGridDragDropValidate = null;
          window.longDivisionGridDragDropReset = null;
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
     * @param {object} [styleOverrides] - Optional style overrides (e.g. { width, minWidth } for divisor block)
     */
    const renderCell = (value, key, type, isEditable = false, stepIndex = null, styleOverrides = null) => {
      const isHidden = hiddenCells.includes(key);
      const displayValue = incorrectValues[key] !== undefined ? incorrectValues[key] : value;
      
      // Get theme style for this type
      let typeStyle = themeStyles[type] || {};
      
      // For dark theme, alternate working row colors: step 0 = #8950A3, step 1 = #827FCA, step 2 = #8950A3, etc.
      // Or use partialRemainderColor if specified
      // Check if this is a subtract cell (partial product) - if so, use partialProductCellColor if specified
      if (currentTheme === 'dark-theme' && type === 'working' && stepIndex !== null) {
        let workingColor;
        // Check if this is a subtract cell (key starts with 'subtract-')
        const isSubtractCell = key && key.startsWith('subtract-');
        if (isSubtractCell && stylingDefaults.partialProductCellColor !== null) {
          workingColor = stylingDefaults.partialProductCellColor;
        } else if (stylingDefaults.partialRemainderColor !== null) {
          workingColor = stylingDefaults.partialRemainderColor;
        } else {
          const isEvenStep = stepIndex % 2 === 0;
          workingColor = isEvenStep ? '#8950A3' : '#827FCA';
        }
        typeStyle = {
          ...typeStyle,
          background: `linear-gradient(145deg, ${workingColor}, ${workingColor})`
        };
      }
      
      // Override dividend color if dividendCellColor is specified
      if (currentTheme === 'dark-theme' && type === 'dividend' && stylingDefaults.dividendCellColor !== null) {
        typeStyle = {
          ...typeStyle,
          background: `linear-gradient(145deg, ${stylingDefaults.dividendCellColor}, ${stylingDefaults.dividendCellColor})`
        };
      }
      
      // Override bringDown color if bringDownCellColor is specified
      if (currentTheme === 'dark-theme' && type === 'bringDown' && stylingDefaults.bringDownCellColor !== null) {
        typeStyle = {
          ...typeStyle,
          background: `linear-gradient(145deg, ${stylingDefaults.bringDownCellColor}, ${stylingDefaults.bringDownCellColor})`
        };
      }
      
      // Build cell classes (for button theme in spotIncorrect mode)
      const cellClasses = [
        `div-cell div-cell-${type}`,
        currentTheme === 'button-theme' && !minimalMode && mode === 'spotIncorrect' ? 'div-cell-button-theme' : '',
        currentTheme === 'button-theme' && !minimalMode && mode === 'spotIncorrect' && selectedCells.has(key) ? 'selected' : '',
        currentTheme === 'button-theme' && !minimalMode && mode === 'spotIncorrect' && checkResult && selectedCells.has(key) && Object.keys(incorrectValues).includes(key) ? 'correct' : '',
        currentTheme === 'button-theme' && !minimalMode && mode === 'spotIncorrect' && checkResult && selectedCells.has(key) && !Object.keys(incorrectValues).includes(key) ? 'incorrect' : '',
        (disabled || allCorrect) && mode === 'spotIncorrect' ? 'disabled' : ''
      ].filter(Boolean).join(' ');
      
      // Determine if we should use button theme styling (CSS classes) or inline styles
      const useButtonTheme = currentTheme === 'button-theme' && !minimalMode && mode === 'spotIncorrect';
      
      // Special handling for dark theme divisor - transparent background, no border
      const isDarkThemeDivisor = currentTheme === 'dark-theme' && type === 'divisor';
      
      // For dark theme, ensure inline styles override CSS
      const isDarkTheme = currentTheme === 'dark-theme';
      
      // All cells (divisor, quotient, dividend, partial dividend/working, remainder, bringDown) use same block size and font size as dividend
      const correctRingShadow = '0 0 0 2px #4CAF50';
      const showCorrectRing = type !== 'quotient' && type !== 'working' && type !== 'bringDown'; // No ring on quotient, partial dividend, or bring-down blocks
      let cellStyle = {
        boxSizing: 'border-box',
        width: `${cellSizePx}px`,
        height: `${cellSizePx}px`,
        minWidth: `${cellSizePx}px`,
        minHeight: `${cellSizePx}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${fontSizePx}px`,
        fontWeight: 'bold',
        border: isDarkThemeDivisor ? 'none' : (minimalMode ? 'none' : (useButtonTheme ? 'none' : (type === 'quotient' || type === 'working' || type === 'bringDown' ? 'none' : `${cellBorderWidth} ${cellBorderStyle} ${cellBorderColor}`))),
        borderRadius: useButtonTheme ? '8px' : stylingDefaults.cellBorderRadius,
        // Use only 'background' (not backgroundColor) to avoid React shorthand conflict
        background: isDarkThemeDivisor ? 'transparent' : (minimalMode ? 'transparent' : (useButtonTheme ? 'transparent' : (typeStyle.background !== undefined ? typeStyle.background : (typeStyle.backgroundColor || cellBackgroundColor)))),
        color: useButtonTheme ? 'black' : (typeStyle.color || '#333'),
        cursor: mode === 'spotIncorrect' && !disabled && !allCorrect ? 'pointer' : (disabled || allCorrect ? 'not-allowed' : 'default'),
        transition: useButtonTheme ? 'all 0.1s ease' : 'all 0.2s ease',
        // Exclude width/height/fontSize/minWidth/minHeight from typeStyle so all cells stay same size as dividend
        ...(useButtonTheme ? {} : (() => { const { backgroundColor: _bg, background: _b, width: _w, height: _h, fontSize: _fs, minWidth: _mw, minHeight: _mh, ...rest } = typeStyle; return rest; })())
      };
      
      // Override for dark theme divisor to ensure transparent and no border (use background only to avoid React shorthand conflict)
      if (isDarkThemeDivisor) {
        cellStyle.background = 'transparent';
        delete cellStyle.backgroundColor;
        cellStyle.border = 'none';
        cellStyle.boxShadow = 'none';
      }
      
      // For dark theme, apply box shadow if specified
      if (isDarkTheme && type !== 'divisor' && stylingDefaults.cellBoxShadow !== 'none') {
        cellStyle.boxShadow = stylingDefaults.cellBoxShadow;
      }
      
      // Ensure all cells keep same size and font as dividend (re-apply in case any path overrode)
      cellStyle.width = `${cellSizePx}px`;
      cellStyle.height = `${cellSizePx}px`;
      cellStyle.minWidth = `${cellSizePx}px`;
      cellStyle.minHeight = `${cellSizePx}px`;
      cellStyle.fontSize = `${fontSizePx}px`;
      if (styleOverrides && typeof styleOverrides === 'object') Object.assign(cellStyle, styleOverrides);
      
      // Hidden cell
      if (isHidden) {
        cellStyle.visibility = 'hidden';
      }
      
      // SpotIncorrect mode - selection highlighting (only if not using button-theme)
      if (mode === 'spotIncorrect' && currentTheme !== 'button-theme') {
        const isSelected = selectedCells.has(key);
        const isIncorrect = Object.keys(incorrectValues).includes(key);
        
        if (checkResult) {
          if (isSelected && isIncorrect) {
            // Keep designated type background; show correct with box-shadow ring (not on quotient or partial dividend)
            if (showCorrectRing) cellStyle.boxShadow = (cellStyle.boxShadow ? cellStyle.boxShadow + ', ' : '') + correctRingShadow;
          } else if (isSelected && !isIncorrect) {
            cellStyle.background = '#FFCDD2';
            cellStyle.border = '3px solid #F44336';
          } else if (!isSelected && isIncorrect) {
            cellStyle.background = '#FFF9C4';
            cellStyle.border = '3px solid #FFC107';
          }
        } else if (isSelected) {
          cellStyle.background = '#E3F2FD';
          cellStyle.border = '3px solid #2196F3';
        }
      }
      
      // Practice mode - editable cell
      if (mode === 'practice') {
        const practiceCells = generatePracticeCells();
        const isPracticeCell = practiceCells.some(c => c.key === key);
        
        if (isPracticeCell) {
          const practiceValue = practiceValues[key];
          const validation = practiceValidation[key];
          
          if (validation) {
            if (validation.isCorrect) {
              // Keep designated type background; show correct with box-shadow ring (not on quotient or partial dividend)
              if (showCorrectRing) cellStyle.boxShadow = (cellStyle.boxShadow ? cellStyle.boxShadow + ', ' : '') + correctRingShadow;
            } else if (validation.status === 'incorrect') {
              cellStyle.background = '#FFCDD2';
              cellStyle.border = '2px solid #F44336';
            }
          } else {
            cellStyle.background = '#F5F5F5';
            cellStyle.border = '2px dashed #9E9E9E';
          }
          
          return React.createElement('input', {
            key,
            type: 'text',
            className: 'div-cell div-cell-practice',
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
      
      // Guided mode - active cell
      if (mode === 'guided') {
        const currentStep = getCurrentGuidedStep();
        const isActiveCell = currentStep?.cellKey === key;
        const guidedValue = guidedValues[key];
        const bringDownMode = guidedConfig.bringDownMode || 'drag';
        // Empty placeholder cells (subtract/difference/partial-dividend for current quotient step) keep working background
        const isPlaceholderForQuotientStep = (() => {
          if (currentStep?.type !== 'quotient') return false;
          const parts = currentStep.cellKey.split('-');
          const quotientIdx = parseInt(parts[1], 10);
          if (isNaN(quotientIdx)) return false;
          const stepIdxForQuotient = quotientIdx - (data.quotientDigits.length - data.steps.length);
          return key.startsWith(`subtract-${stepIdxForQuotient}-`) || key.startsWith(`difference-${stepIdxForQuotient}-`) || key.startsWith(`partial-dividend-${stepIdxForQuotient}-`);
        })();
        
        // Check if this is a bringDown step and if click mode is enabled
        const isBringDownStep = currentStep?.type === 'bringDown';
        const useClickMode = isBringDownStep && (bringDownMode === 'click' || bringDownMode === 'both');
        
        // Check if this is a dividend cell that should be clickable for bringDown
        const isDividendCell = key.startsWith('dividend-');
        const dividendIdx = isDividendCell ? parseInt(key.split('-')[1]) : -1;
        // isClickableDividend is false when interaction is locked
        const isClickableDividend = isBringDownStep && useClickMode && !isInteractionLocked &&
                                    currentStep.dividendIndex !== undefined && 
                                    dividendIdx === currentStep.dividendIndex;
        
        // Check if this is a digit selection step - make dividend digits clickable
        const isSelectStartingDigitsStep = currentStep?.type === 'selectStartingDigits';
        // canSelectDigit is false when interaction is locked to prevent rapid clicks
        const canSelectDigit = isSelectStartingDigitsStep && isDividendCell && !isInteractionLocked &&
                              // At the very start, only the first dividend digit should be clickable.
                              // After that, allow exactly the next sequential digit.
                              (selectedStartingDigits.length === 0
                                ? dividendIdx === 0
                                : dividendIdx === Math.max(...selectedStartingDigits) + 1);
        const isSelectedDigit = isSelectStartingDigitsStep && isDividendCell && selectedStartingDigits.includes(dividendIdx);
        
        // Find which step this cell belongs to
        const stepIndex = guidedSteps.findIndex(s => s.cellKey === key);
        const isInPlay = stepIndex !== -1 && stepIndex <= guidedStepIndex; // Current or previous steps
        const isFuture = stepIndex > guidedStepIndex;
        const isNotInGuidedSteps = stepIndex === -1; // Cell is not part of guided steps (e.g., dividend, divisor)
        
        // Make dividend digit clickable when selecting starting digits
        if (isSelectStartingDigitsStep && isDividendCell && !guidedComplete) {
          const startingValue = selectedStartingDigits.reduce((acc, idx) => {
            return acc * 10 + data.dividendDigits[idx];
          }, 0);
          const isValid = startingValue >= divisor || selectedStartingDigits.length === 0;
          const nextDigitValue = selectedStartingDigits.length === 0 ? 
            data.dividendDigits[0] : 
            (dividendIdx < data.dividendDigits.length ? data.dividendDigits[dividendIdx] : null);
          const wouldBeValid = nextDigitValue !== null && 
            (startingValue * 10 + nextDigitValue) >= divisor;
          
          return React.createElement('div', {
            key,
            className: 'div-cell div-cell-clickable',
            style: {
              ...cellStyle,
              background: isSelectedDigit ? '#4CAF50' : (canSelectDigit ? '#FFF9C4' : '#E0E0E0'),
              border: isSelectedDigit ? '3px solid #2E7D32' : (canSelectDigit ? '3px solid #FFC107' : '2px solid #9E9E9E'),
              boxShadow: canSelectDigit ? '0 0 10px rgba(255, 193, 7, 0.5)' : 'none',
              cursor: canSelectDigit ? 'pointer' : 'not-allowed',
              // Allow clicks even when "disabled" so we can show wrong-digit feedback.
              pointerEvents: 'auto',
              transition: 'all 0.2s ease',
              color: isSelectedDigit ? 'white' : '#333',
              fontWeight: isSelectedDigit ? 'bold' : 'normal',
              animation: canSelectDigit ? 'guidedPulse 1.5s ease-in-out infinite' : 'none'
            },
            onClick: () => {
              // If interaction is locked, ignore clicks (prevents rapid double actions).
              if (isInteractionLockedRef.current) return;

              if (canSelectDigit) {
                if (typeof window !== 'undefined' && window.playCarClickSound) {
                  window.playCarClickSound('click');
                }
                handleSelectStartingDigit(dividendIdx);
                return;
              }

              // Disabled click handling: show wrong-digit feedback, but do NOT change selection.
              const currentStartingValueForHint = selectedStartingDigits.reduce((acc, idx) => {
                return acc * 10 + data.dividendDigits[idx];
              }, 0);

              const msg = selectedStartingDigits.length === 0
                ? "Ini bukan angka pertama. Coba ketuk angka pertama pada bilangan yang dibagi"
                : (() => {
                    const nextDigitHint = getDivisionText('division.chooseNextDigit', {
                      value: currentStartingValueForHint,
                      divisor
                    });
                    return `That's not the next digit. ${nextDigitHint}`;
                  })();

              if (typeof window !== 'undefined' && window.playAnswerSound) window.playAnswerSound(false);
              showSelectDigitError(msg, 4000);
            },
            onMouseEnter: () => {},
            onMouseLeave: () => {}
          }, value);
        }
        
        // Only show borders for cells in play (current or completed steps)
        // Cells not in guided steps (dividend, divisor) should not have borders
        if ((!isInPlay && !isActiveCell) || isNotInGuidedSteps) {
          cellStyle.border = 'none';
          if (isNotInGuidedSteps) {
            // Keep original background for dividend/divisor but no border (use background only to avoid React shorthand conflict)
            cellStyle.background = minimalMode ? 'transparent' : (typeStyle.background !== undefined ? typeStyle.background : (typeStyle.backgroundColor || cellBackgroundColor));
            delete cellStyle.backgroundColor;
          } else if (!isPlaceholderForQuotientStep) {
            cellStyle.background = 'transparent';
            delete cellStyle.backgroundColor;
          }
        }
        
        // Make dividend digit clickable when bringDown step is active and click mode is enabled
        if (isClickableDividend && !guidedComplete) {
          return React.createElement('div', {
            key,
            className: 'div-cell div-cell-clickable',
            style: {
              ...cellStyle,
              background: '#FFF9C4',
              border: '3px solid #FFC107',
              boxShadow: '0 0 10px rgba(255, 193, 7, 0.5)',
              color: '#333',
              fontWeight: 'normal',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              animation: 'guidedPulse 1.5s ease-in-out infinite',
              opacity: bringDownAnimation?.sourceKey === key ? 0.3 : 1
            },
            onClick: (e) => {
              // Prevent any interaction while locked
              if (isInteractionLockedRef.current) {
                return;
              }
              isInteractionLockedRef.current = true;
              setIsInteractionLocked(true);
              
              const digitValue = value;
              const sourceElement = e.currentTarget;
              const sourceRect = sourceElement.getBoundingClientRect();
              
              // Find the target bringDown cell element
              const targetKey = currentStep.cellKey;
              setTimeout(() => {
                const targetElement = document.querySelector(`[data-cell-key="${targetKey}"]`) || 
                                    document.querySelector(`.div-cell-guided-target`);
                
                if (targetElement) {
                  const targetRect = targetElement.getBoundingClientRect();
                  
                  // Start animation
                  setBringDownAnimation({
                    digit: digitValue,
                    sourceKey: key,
                    targetKey: targetKey,
                    startX: sourceRect.left + sourceRect.width / 2,
                    startY: sourceRect.top + sourceRect.height / 2,
                    endX: targetRect.left + targetRect.width / 2,
                    endY: targetRect.top + targetRect.height / 2
                  });
                  
                  // Trigger animation after a small delay to ensure initial render
                  setTimeout(() => {
                    setBringDownAnimationActive(true);
                  }, 10);
                  
                  // After animation completes, fill in the value
                  setTimeout(() => {
                    setGuidedValues(prev => ({ ...prev, [targetKey]: digitValue }));
                    
                    if (digitValue === currentStep.correctValue || Number(digitValue) === Number(currentStep.correctValue)) {
                      setGuidedValidation(prev => ({ ...prev, [targetKey]: { isCorrect: true } }));
                      if (guidedConfig.autoAdvance) {
                        // advanceGuidedStep will unlock after completion
                        setTimeout(advanceGuidedStep, 300);
                      } else {
                        // No auto-advance, unlock now
                        isInteractionLockedRef.current = false;
                        setIsInteractionLocked(false);
                      }
                    } else {
                      setGuidedValidation(prev => ({ ...prev, [targetKey]: { isCorrect: false } }));
                      // Incorrect answer, unlock immediately so user can try again
                      isInteractionLockedRef.current = false;
                      setIsInteractionLocked(false);
                    }
                    
                    // Clear animation
                    setBringDownAnimation(null);
                    setBringDownAnimationActive(false);
                  }, 610); // Animation duration + small buffer
                } else {
                  // Fallback: fill immediately if target not found
                  setGuidedValues(prev => ({ ...prev, [targetKey]: digitValue }));
                  
                  if (digitValue === currentStep.correctValue || Number(digitValue) === Number(currentStep.correctValue)) {
                    setGuidedValidation(prev => ({ ...prev, [targetKey]: { isCorrect: true } }));
                    if (guidedConfig.autoAdvance) {
                      // advanceGuidedStep will unlock after completion
                      setTimeout(advanceGuidedStep, 300);
                    } else {
                      // No auto-advance, unlock now
                      isInteractionLockedRef.current = false;
                      setIsInteractionLocked(false);
                    }
                  } else {
                    setGuidedValidation(prev => ({ ...prev, [targetKey]: { isCorrect: false } }));
                    // Incorrect answer, unlock immediately
                    isInteractionLockedRef.current = false;
                    setIsInteractionLocked(false);
                  }
                }
              }, 10);
            },
            onMouseEnter: (e) => {
              if (!bringDownAnimation || bringDownAnimation.sourceKey !== key) {
                e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 193, 7, 0.7)';
              }
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 193, 7, 0.5)';
            }
          }, value);
        }
        
        // Handle bringDown cell - show as target if click mode, otherwise as input
        if (isActiveCell && !guidedComplete) {
          // If bringDown step and click mode, show as target (not input)
          // But also allow drag-and-drop if both modes are enabled
          if (isBringDownStep && useClickMode) {
            const allowDrag = bringDownMode === 'both';
            const isWiggling = wigglingCells.has(key);
            const isEmptyTarget = guidedValue === undefined;
            
            // If wiggling (incorrect drop), show salmon background
            const designatedBg = typeStyle.background !== undefined ? typeStyle.background : (typeStyle.backgroundColor || cellBackgroundColor);
            let bgColor = '#101010'; // Dark background when awaiting bring-down (empty "?" target)
            let textColor = '#8950A3'; // Purple for "?" when empty
            let borderColor = '#FFC107';
            if (isWiggling) {
              bgColor = '#FA8072'; // Salmon
              borderColor = '#FF6B6B';
              textColor = '#333';
            } else if (!isEmptyTarget) {
              bgColor = designatedBg;
              textColor = (typeStyle.color || '#333');
            }
            
            return React.createElement('div', {
              key,
              'data-cell-key': key,
              className: `div-cell div-cell-guided-target ${allowDrag ? 'div-cell-guided-active' : ''} ${isWiggling ? 'div-cell-wiggling' : ''}`,
              style: {
                ...cellStyle,
                width: `${cellSizePx}px`,
                height: `${cellSizePx}px`,
                minWidth: `${cellSizePx}px`,
                minHeight: `${cellSizePx}px`,
                fontSize: `${fontSizePx}px`,
                background: bgColor,
                color: textColor,
                border: `3px solid ${borderColor}`,
                boxShadow: isWiggling ? '0 0 10px rgba(250, 128, 114, 0.5)' : '0 0 10px rgba(255, 193, 7, 0.5)',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: allowDrag ? 'pointer' : 'default',
                animation: isWiggling ? 'wiggle 1500ms ease-in-out' : 'none'
              }
            }, guidedValue !== undefined ? guidedValue : '?');
          }
          
          // Regular input field for other cell types or drag mode
          const isWiggling = wigglingCells.has(key);
          
          // If wiggling (incorrect drop), show salmon background
          if (isWiggling) {
            cellStyle.background = '#FA8072'; // Salmon color
            cellStyle.border = '3px solid #FF6B6B';
            cellStyle.boxShadow = '0 0 10px rgba(250, 128, 114, 0.5)';
            cellStyle.animation = 'wiggle 1500ms ease-in-out';
          } else {
            cellStyle.background = '#FFF9C4';
            cellStyle.border = '3px solid #FFC107';
            cellStyle.boxShadow = '0 0 10px rgba(255, 193, 7, 0.5)';
          }
          
          return React.createElement('input', {
            key,
            type: 'text',
            className: `div-cell div-cell-guided-active ${isWiggling ? 'div-cell-wiggling' : ''}`,
            style: {
              ...cellStyle,
              textAlign: 'center',
              outline: 'none'
            },
            maxLength: 1,
            value: guidedValue !== undefined ? guidedValue : '',
            autoFocus: !isWiggling, // Don't auto-focus if wiggling
            readOnly: isWiggling, // Make read-only while wiggling
            onChange: (e) => {
              if (isWiggling) return; // Don't allow changes while wiggling
              
              const val = e.target.value;
              if (val === '' || /^[0-9]$/.test(val)) {
                const numVal = val === '' ? undefined : parseInt(val);
                setGuidedValues(prev => ({ ...prev, [key]: numVal }));
                
                if (numVal === currentStep.correctValue || Number(numVal) === Number(currentStep.correctValue)) {
                  setGuidedValidation(prev => ({ ...prev, [key]: { isCorrect: true } }));
                  
                  // If this is a quotient step and autoFillSubtract is enabled, auto-fill subtract cells
                  if (currentStep.type === 'quotient' && guidedConfig.autoFillSubtract) {
                    // Find the stepIdx by finding which division step has this quotient digit
                    // The quotient cellKey contains the quotient index, we need to find the corresponding stepIdx
                    const quotientIdx = parseInt(key.split('-')[1]);
                    const stepIdx = quotientIdx - (data.quotientDigits.length - data.steps.length);
                    
                    // Validate stepIdx is within bounds
                    if (stepIdx >= 0 && stepIdx < data.steps.length) {
                      // Find all subtract steps for this stepIdx
                      const subtractSteps = guidedSteps.filter(step => 
                        step.type === 'subtract' && step.cellKey.startsWith(`subtract-${stepIdx}-`)
                      );
                      
                      // Check if we should skip normal advance (if there are subtract steps to skip)
                      const shouldSkipNormalAdvance = guidedConfig.autoAdvance && subtractSteps.length > 0;
                      
                      // Auto-fill all subtract cells and auto-advance through them
                      setTimeout(() => {
                        setGuidedValues(prev => {
                          const newValues = { ...prev, [key]: numVal };
                          subtractSteps.forEach(subtractStep => {
                            newValues[subtractStep.cellKey] = subtractStep.correctValue;
                          });
                          return newValues;
                        });
                        
                        setGuidedValidation(prev => {
                          const newValidation = { ...prev, [key]: { isCorrect: true } };
                          subtractSteps.forEach(subtractStep => {
                            newValidation[subtractStep.cellKey] = { isCorrect: true };
                          });
                          return newValidation;
                        });
                        
                        // Auto-advance through all subtract steps
                        if (shouldSkipNormalAdvance) {
                          // Find the index of the last subtract step
                          const lastSubtractStepIndex = guidedSteps.findIndex(step => 
                            step.cellKey === subtractSteps[subtractSteps.length - 1].cellKey
                          );
                          
                          if (lastSubtractStepIndex !== -1 && lastSubtractStepIndex > guidedStepIndex) {
                            // Advance to the step after the last subtract step
                            setTimeout(() => {
                              setGuidedStepIndex(lastSubtractStepIndex + 1);
                              if (onStepComplete) {
                                onStepComplete(lastSubtractStepIndex, guidedSteps.length);
                              }
                            }, 200);
                          }
                        }
                      }, 100);
                      
                      // Skip normal advance if we're handling subtract steps
                      if (!shouldSkipNormalAdvance && guidedConfig.autoAdvance) {
                        setTimeout(advanceGuidedStep, 300);
                      }
                    } else {
                      // Normal advance if stepIdx is invalid
                      if (guidedConfig.autoAdvance) {
                        setTimeout(advanceGuidedStep, 300);
                      }
                    }
                  } else {
                    // If this is a difference step and autoCalculateRemainder is enabled, check if we should auto-fill remainder
                    if (currentStep.type === 'difference' && guidedConfig.autoCalculateRemainder && showRemainder && data.remainder > 0) {
                      // Extract stepIdx from difference cellKey: difference-${stepIdx}-${digitIdx}
                      const parts = key.split('-');
                      const stepIdx = parseInt(parts[1]);
                      
                      // Check if this is the last division step
                      if (stepIdx === data.steps.length - 1) {
                        // Find all difference steps for this stepIdx
                        const differenceSteps = guidedSteps.filter(step => 
                          step.type === 'difference' && step.cellKey.startsWith(`difference-${stepIdx}-`)
                        );
                        
                        // Check if all difference digits for this step are completed
                        // We need to check after updating the current value
                        setTimeout(() => {
                          setGuidedValues(prev => {
                            const updatedValues = { ...prev, [key]: numVal };
                            
                            const allDifferenceCompleted = differenceSteps.every(step => {
                              const stepValue = updatedValues[step.cellKey];
                              const stepValidation = guidedValidation[step.cellKey];
                              return stepValue !== undefined && stepValidation?.isCorrect === true;
                            });
                            
                            // Include the current step that was just completed
                            const currentStepCompleted = numVal === currentStep.correctValue || Number(numVal) === Number(currentStep.correctValue);
                            const allCompleted = allDifferenceCompleted && currentStepCompleted;
                            
                            if (allCompleted) {
                              // Find all remainder steps
                              const remainderSteps = guidedSteps.filter(step => step.type === 'remainder');
                              
                              // Auto-fill all remainder cells
                              remainderSteps.forEach(remainderStep => {
                                updatedValues[remainderStep.cellKey] = remainderStep.correctValue;
                              });
                              
                              // Update validation
                              setGuidedValidation(prevValidation => {
                                const newValidation = { ...prevValidation, [key]: { isCorrect: true } };
                                remainderSteps.forEach(remainderStep => {
                                  newValidation[remainderStep.cellKey] = { isCorrect: true };
                                });
                                return newValidation;
                              });
                            }
                            
                            return updatedValues;
                          });
                        }, 150);
                      }
                    }
                    
                    // Completion detection: last difference digit equals single-digit remainder → division complete (no separate remainder step needed).
                    const inputIsLastDifferenceStep = currentStep.type === 'difference' && (() => {
                      const parts = key.split('-');
                      const stepIdx = parseInt(parts[1], 10);
                      return stepIdx === data.steps.length - 1;
                    })();
                    const inputRemainderSingleDigitSameValue = showRemainder && data.remainder > 0 &&
                      data.remainderDigits.length === 1 &&
                      (data.remainderDigits[0] === numVal || Number(data.remainderDigits[0]) === Number(numVal));
                    if (inputIsLastDifferenceStep && inputRemainderSingleDigitSameValue) {
                      const remainderSteps = guidedSteps.filter(s => s.type === 'remainder');
                      setGuidedValues(prev => {
                        const next = { ...prev, [key]: numVal };
                        remainderSteps.forEach(remStep => { next[remStep.cellKey] = remStep.correctValue; });
                        return next;
                      });
                      setGuidedValidation(prev => {
                        const next = { ...prev, [key]: { isCorrect: true } };
                        remainderSteps.forEach(remStep => { next[remStep.cellKey] = { isCorrect: true }; });
                        return next;
                      });
                      setGuidedComplete(true);
                      if (onGuidedComplete) onGuidedComplete();
                      window.__longDivisionComplete = true;
                      const targetId = (typeof guidedHintTarget === 'string' && guidedHintTarget) ? guidedHintTarget : 'div-instruction';
                      window.__longDivisionGuidedHint = { targetId, text: guidedCompleteHintText };
                      window.dispatchEvent(new CustomEvent('guided-hint-changed', { detail: { targetId } }));
                      return;
                    }
                    
                    // Normal advance for non-quotient steps or when autoFillSubtract is disabled
                    if (guidedConfig.autoAdvance) {
                      setTimeout(advanceGuidedStep, 300);
                    }
                    // When user just filled the last remainder step, push "Division complete!" immediately (after commit) so instruction updates
                    if (currentStep.type === 'remainder' && (numVal === currentStep.correctValue || Number(numVal) === Number(currentStep.correctValue))) {
                      const remainderSteps = guidedSteps.filter(s => s.type === 'remainder');
                      const lastRem = remainderSteps.length > 0 ? remainderSteps[remainderSteps.length - 1] : null;
                      const isLastRemainder = lastRem && currentStep.cellKey === lastRem.cellKey;
                      console.log('🔍 [LongDivisionGrid] INPUT remainder: key =', key, 'numVal =', numVal, '(type:', typeof numVal, ') currentStep.correctValue =', currentStep.correctValue, '(type:', typeof currentStep.correctValue, ') currentStep.cellKey =', currentStep.cellKey, 'lastRem?.cellKey =', lastRem?.cellKey, 'isLastRemainder =', isLastRemainder);
                      if (isLastRemainder) {
                        const targetId = (typeof guidedHintTarget === 'string' && guidedHintTarget) ? guidedHintTarget : 'div-instruction';
                        console.log('🔍 [LongDivisionGrid] INPUT: scheduling setTimeout(0) to push Division complete! to targetId =', targetId);
                        window.__longDivisionComplete = true;
                        setTimeout(() => {
                          window.__longDivisionGuidedHint = { targetId, text: guidedCompleteHintText };
                          window.dispatchEvent(new CustomEvent('guided-hint-changed', { detail: { targetId } }));
                        }, 0);
                      }
                    }
                  }
                } else if (numVal !== undefined) {
                  setGuidedValidation(prev => ({ ...prev, [key]: { isCorrect: false } }));
                }
              }
            }
          });
        }
        
        // Show previously completed guided values (same block size and font as dividend)
        if (guidedValues[key] !== undefined) {
          const completedStyle = {
            ...cellStyle,
            width: `${cellSizePx}px`,
            height: `${cellSizePx}px`,
            minWidth: `${cellSizePx}px`,
            minHeight: `${cellSizePx}px`,
            fontSize: `${fontSizePx}px`,
            background: typeStyle.background !== undefined ? typeStyle.background : (typeStyle.backgroundColor || cellBackgroundColor)
          };
          if (showCorrectRing) completedStyle.boxShadow = (cellStyle.boxShadow ? cellStyle.boxShadow + ', ' : '') + correctRingShadow;
          return React.createElement('div', {
            key,
            className: 'div-cell',
            style: completedStyle
          }, guidedValues[key]);
        }
        
        // Hide future cells (no border, transparent) - except empty placeholder cells for current quotient step (keep working bg)
        if (isFuture && !isPlaceholderForQuotientStep) {
          return React.createElement('div', {
            key,
            className: 'div-cell div-cell-hidden',
            style: {
              ...cellStyle,
              background: 'transparent',
              border: 'none',
              color: 'transparent'
            }
          }, '');
        }
      }
      
      // Animation mode - show/hide cells
      if (mode === 'animation') {
        const isVisible = visibleCells.has(key);
        const isHighlighted = highlightedCell === key;
        
        const isAnimatableCell = key.startsWith('quotient-') || key.startsWith('subtract-') || 
                                  key.startsWith('difference-') || key.startsWith('remainder-');
        
        if (isAnimatableCell && !isVisible) {
          return React.createElement('div', {
            key,
            className: 'div-cell div-cell-animation-hidden',
            style: {
              ...cellStyle,
              background: 'transparent',
              border: '2px dashed #E0E0E0',
              color: 'transparent'
            }
          }, '');
        }
        
        if (isHighlighted) {
          cellStyle.background = '#FFEB3B';
          cellStyle.border = '3px solid #FFC107';
          cellStyle.boxShadow = '0 0 15px rgba(255, 193, 7, 0.6)';
          cellStyle.animation = 'digitAppear 0.3s ease-out';
        }
      }
      
      // DragDrop mode - render drop zone
      if (mode === 'dragDrop') {
        if (dragDropCellKeysRef.current.includes(key)) {
          const dragDropValue = dragDropValues[key];
          const validation = dragDropValidation[key];
          const isDragOver = dragOverCell === key;
          
          const dragDropStyle = {
            ...cellStyle,
            background: isDragOver ? '#E1F5FE' : (dragDropValue !== undefined ? 'white' : '#F5F5F5'),
            border: isDragOver ? '3px dashed #0288D1' : '2px dashed #BDBDBD',
            cursor: 'pointer'
          };
          
          if (validation) {
            if (validation.isCorrect) {
              dragDropStyle.background = typeStyle.background !== undefined ? typeStyle.background : (typeStyle.backgroundColor || cellBackgroundColor);
              if (showCorrectRing) dragDropStyle.boxShadow = (cellStyle.boxShadow ? cellStyle.boxShadow + ', ' : '') + correctRingShadow;
            } else if (validation.status === 'incorrect') {
              dragDropStyle.background = '#FFCDD2';
              dragDropStyle.border = '2px solid #F44336';
            }
          }
          
          return React.createElement('div', {
            key,
            className: 'div-cell div-cell-dragdrop',
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
            // Keep designated type background; show correct with box-shadow ring (not on quotient or partial dividend)
            if (showCorrectRing) inputStyle.boxShadow = (cellStyle.boxShadow ? cellStyle.boxShadow + ', ' : '') + correctRingShadow;
          } else {
            inputStyle.background = '#FFCDD2';
            inputStyle.border = '2px solid #F44336';
          }
        }
        
        return React.createElement('input', {
          key,
          type: 'text',
          className: 'div-cell div-cell-input',
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
        className: cellClasses || `div-cell div-cell-${type}`,
        style: cellStyle,
        onClick: () => handleCellClick(key)
      }, displayValue !== null && displayValue !== undefined ? displayValue : '');
    };
    
    // ===== MAIN RENDER =====
    
    // Calculate layout dimensions
    const dividendWidth = data.dividendDigits.length * cellSizePx;
    const bracketWidthPx = gcToPx(stylingDefaults.bracketWidth);
    // Divisor block: content-based width (font-size + digit count), not full cell width per digit
    const divisorBlockPaddingPx = 8;
    const divisorDigitWidthRatio = 0.55;
    const divisorBlockWidthPx = Math.max(cellSizePx, 2 * divisorBlockPaddingPx + data.divisorDigits.length * (fontSizePx * divisorDigitWidthRatio));
    const divisorWidth = divisorBlockWidthPx; // alias for layout code that may still reference divisorWidth
    const totalWidth = divisorBlockWidthPx + bracketWidthPx + dividendWidth;
    
    // Compute total grid height for full layout (all steps) so container size does not change as steps are added
    const quotientRowMarginBottomPx = gcToPx(stylingDefaults.quotientRowMarginBottom, 'padding');
    const dividendToPartialProductGapPx = gcToPx(stylingDefaults.dividendToPartialProductGap, 'width');
    const lineMarginTopPx = gcToPx(stylingDefaults.lineMarginTop, 'padding');
    const lineMarginBottomPx = gcToPx(stylingDefaults.lineMarginBottom, 'padding');
    const differenceRowMarginTopPx = gcToPx(stylingDefaults.differenceRowMarginTop, 'padding');
    const bracketHeightOffsetPx = parseFloat(String(stylingDefaults.bracketHeightOffset || '0')) || 0;
    const bracketDividendPaddingTopPx = gcToPx(stylingDefaults.bracketDividendPaddingTop || stylingDefaults.cellGap || '0', 'padding');
    const mainRowHeightPx = cellSizePx + bracketHeightOffsetPx + bracketDividendPaddingTopPx;
    let totalGridHeightPx = cellSizePx + quotientRowMarginBottomPx + mainRowHeightPx;
    const numSteps = data.steps ? data.steps.length : 0;
    for (let i = 0; i < numSteps; i++) {
      totalGridHeightPx += dividendToPartialProductGapPx + cellSizePx + lineMarginTopPx + lineMarginBottomPx + differenceRowMarginTopPx + cellSizePx;
    }
    if (showRemainder && data.remainder > 0) {
      const remainderRowMarginTopPx = gcToPx(stylingDefaults.remainderRowMarginTop, 'padding');
      totalGridHeightPx += remainderRowMarginTopPx + cellSizePx;
    }
    
    // Check if using dark theme
    const isDarkThemeContainer = currentTheme === 'dark-theme';
    
    const containerStyle = {
      display: 'block',
      width: '100%',
      height: '100%',
      minHeight: '100%',
      padding: stylingDefaults.containerPadding,
      background: minimalMode ? 'transparent' : backgroundColor,
      border: (minimalMode || !showContainerBorder || isDarkThemeContainer) ? 'none' : containerBorder,
      borderRadius: stylingDefaults.containerBorderRadius,
      fontFamily: isDarkThemeContainer ? "'Nunito', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif" : 'monospace',
      position: 'relative', // Required for absolute positioning of hints
      boxSizing: 'border-box', // Include padding in width calculation
      // Set CSS custom properties for dark theme cell sizing
      ...(isDarkThemeContainer ? {
        '--dark-theme-cell-size': `${cellSizePx}px`,
        '--dark-theme-font-size': `${fontSizePx}px`
      } : {})
    };
    
    // Build all rows
    const allRows = [];
    
    // Calculate row spacing in pixels (for consistent spacing between rows)
    const rowGapPx = gcToPx(stylingDefaults.rowGap, 'padding');
    const lineSpacingPx = gcToPx(stylingDefaults.lineSpacing, 'padding');
    
    // === ROW 1: Quotient (aligned over dividend, right-aligned) ===
    // Calculate gap size in pixels
    const gapSizePx = gcToPx(stylingDefaults.cellGap);
    const bracketMarginLeftPx = gapSizePx > 0 ? gapSizePx : gcToPx(stylingDefaults.bracketMarginLeft, 'padding');
    const quotientPaddingLeft = divisorBlockWidthPx + gcToPx(stylingDefaults.bracketWidth) + (data.dividendDigits.length - data.quotientDigits.length) * (cellSizePx + gapSizePx) + gapSizePx;
    // Fixed grid width so position does not shift when more subtraction rows appear (e.g. second step in guided mode)
    const quotientRowWidth = quotientPaddingLeft + data.quotientDigits.length * cellSizePx + (data.quotientDigits.length > 0 ? (data.quotientDigits.length - 1) * gapSizePx : 0);
    const dividendStartPositionForWidth = divisorBlockWidthPx + bracketWidthPx + bracketMarginLeftPx;
    const mainRowWidth = dividendStartPositionForWidth + data.dividendDigits.length * cellSizePx + (data.dividendDigits.length > 0 ? (data.dividendDigits.length - 1) * gapSizePx : 0);
    const maxSubtractRowWidth = data.steps.length > 0 ? Math.max(...data.steps.map(step => dividendStartPositionForWidth + (step.position + 1) * cellSizePx + step.position * gapSizePx)) : 0;
    let totalGridWidthPx = Math.max(quotientRowWidth, mainRowWidth, maxSubtractRowWidth);
    if (showRemainder && data.remainder > 0 && data.remainderDigits) {
      const remainderRowWidth = divisorBlockWidthPx + bracketWidthPx + data.remainderDigits.length * cellSizePx + (data.remainderDigits.length > 0 ? (data.remainderDigits.length - 1) * gapSizePx : 0);
      totalGridWidthPx = Math.max(totalGridWidthPx, remainderRowWidth);
    }
    allRows.push(
      React.createElement('div', {
        key: 'quotient-row',
        className: 'div-row div-quotient-row',
        style: {
          display: 'flex',
          paddingLeft: `${quotientPaddingLeft}px`,
          marginBottom: stylingDefaults.quotientRowMarginBottom,
          gap: typeof stylingDefaults.cellGap === 'string' && stylingDefaults.cellGap.includes('gc') ? `${gcToPx(stylingDefaults.cellGap, 'padding')}px` : stylingDefaults.cellGap
        }
      }, data.quotientDigits.map((digit, idx) => 
        renderCell(digit, `quotient-${idx}`, 'quotient')
      ))
    );
    
    // === ROW 2: Divisor + Bracket + Dividend ===
    // Use same thickness as subtraction line (div-line) for bracket and dividend border so they match
    const lineThicknessPx = parseFloat(String(stylingDefaults.subtractionBarThickness || '3px')) || 3;
    
    // Store arrows to add to main-row (will be populated during steps loop)
    const mainRowArrows = [];
    
    // Divisor as single block (content-based width)
    const divisorBlockStyleOverrides = { width: `${divisorBlockWidthPx}px`, minWidth: `${divisorBlockWidthPx}px` };

    // Create main-row structure (will add arrows after steps loop)
    const mainRowChildren = [
        // Divisor (single block showing full number)
        React.createElement('div', {
          key: 'divisor-container',
          style: { 
            display: 'flex', 
          alignItems: 'center',
          gap: gapSizePx > 0 ? `${gapSizePx}px` : '0'
          }
        }, renderCell(currentDivisor, 'divisor', 'divisor', false, null, divisorBlockStyleOverrides)),
        
        // Division bracket - the "⟌" shape
        React.createElement('div', {
          key: 'bracket',
          className: 'div-bracket-symbol',
          style: {
          width: `${bracketWidthPx}px`,
            minHeight: `${cellSizePx}px`,
            position: 'relative',
          marginLeft: gapSizePx > 0 ? `${gapSizePx}px` : stylingDefaults.bracketMarginLeft
          }
        }, 
          // The bracket shape using borders
          React.createElement('div', {
            style: {
              position: 'absolute',
            top: stylingDefaults.bracketTopOffset,
              left: '0',
              width: '100%',
            height: `${cellSizePx + parseFloat(stylingDefaults.bracketHeightOffset)}px`,
            borderLeft: `${lineThicknessPx}px solid ${stylingDefaults.bracketColor}`,
            borderTop: `${lineThicknessPx}px solid ${stylingDefaults.bracketColor}`,
            borderTopLeftRadius: stylingDefaults.bracketBorderRadius
            }
          })
        ),
        
        // Dividend (with line on top extending from bracket)
        React.createElement('div', {
          key: 'dividend-container',
          style: { 
            display: 'flex', 
            alignItems: 'center',
          borderTop: `${lineThicknessPx}px solid ${stylingDefaults.bracketColor}`,
          marginTop: stylingDefaults.bracketDividendMarginTop,
          paddingTop: gapSizePx > 0 ? `${gapSizePx}px` : stylingDefaults.bracketDividendPaddingTop,
          gap: gapSizePx > 0 ? `${gapSizePx}px` : '0'
          }
        }, data.dividendDigits.map((digit, idx) =>
          renderCell(digit, `dividend-${idx}`, 'dividend')
        ))
    ];
    
    // === WORKING ROWS (subtract, line, difference for each step) ===
    if (showWorkings) {
      const isIndonesiaMode = minusSignPosition === 'indonesia';
      
      // Helper function to check if a step is in progress or done (for guided mode)
      const isStepInProgressOrDone = (stepIdx) => {
        if (mode !== 'guided') return true; // Show all steps in non-guided modes
        
        // Find the first guided step that belongs to this division step
        // A division step includes: quotient (for this step), subtract digits, and difference digits
        let firstStepForDivisionStep = -1;
        
        // Find quotient step for this division step
        // The quotient index for stepIdx is: data.quotientDigits.length - data.steps.length + stepIdx
        const quotientIdx = data.quotientDigits.length - data.steps.length + stepIdx;
        
        for (let i = 0; i < guidedSteps.length; i++) {
          const step = guidedSteps[i];
          // Check if this guided step belongs to division step stepIdx
          if (step.cellKey === `quotient-${quotientIdx}` || 
              step.cellKey.startsWith(`subtract-${stepIdx}-`) || 
              step.cellKey.startsWith(`difference-${stepIdx}-`)) {
            if (firstStepForDivisionStep === -1) {
              firstStepForDivisionStep = i;
            }
          }
        }
        
        // Step is in progress or done if we've reached at least the first step of this division step
        if (firstStepForDivisionStep === -1) return false;
        return guidedStepIndex >= firstStepForDivisionStep;
      };
      
      // Helper function to check if a step is fully done (for bring down digits)
      const isStepFullyDone = (stepIdx) => {
        if (mode !== 'guided') return true; // Show all in non-guided modes
        
        // Find all guided steps that belong to this division step
        const quotientIdx = data.quotientDigits.length - data.steps.length + stepIdx;
        const stepIndices = [];
        
        for (let i = 0; i < guidedSteps.length; i++) {
          const step = guidedSteps[i];
          if (step.cellKey === `quotient-${quotientIdx}` || 
              step.cellKey.startsWith(`subtract-${stepIdx}-`) || 
              step.cellKey.startsWith(`difference-${stepIdx}-`)) {
            stepIndices.push(i);
          }
        }
        
        // Step is fully done if we've completed all steps for this division step
        if (stepIndices.length === 0) return false;
        const lastStepIndex = Math.max(...stepIndices);
        return guidedStepIndex > lastStepIndex;
      };
      
      data.steps.forEach((step, stepIdx) => {
        // Only show working rows for steps that are in progress or done (in guided mode)
        const shouldShowStep = isStepInProgressOrDone(stepIdx);
        const quotientIdxForStep = data.quotientDigits.length - data.steps.length + stepIdx;
        const currentStepForRow = getCurrentGuidedStep();
        const isWaitingForQuotient = mode === 'guided' && currentStepForRow?.type === 'quotient' && currentStepForRow?.cellKey === `quotient-${quotientIdxForStep}`;
        
        if (shouldShowStep && ((step.subtractDigits && step.subtractDigits.length > 0 && step.quotientDigit !== null) || isWaitingForQuotient)) {
          // When waiting for quotient and zero quotient step: show only partial dividend row (empty cells) with correct styling
          if (isWaitingForQuotient && (!step.subtractDigits || step.subtractDigits.length === 0)) {
            const bracketMarginLeftPx = gapSizePx > 0 ? gapSizePx : gcToPx(stylingDefaults.bracketMarginLeft, 'padding');
            const dividendStartPosition = divisorBlockWidthPx + bracketWidthPx + bracketMarginLeftPx;
            const digitCount = Math.max(1, String(step.currentValue).length);
            const dividendDigitRightEdge = dividendStartPosition + (step.position + 1) * cellSizePx + step.position * gapSizePx;
            const diffLeftPadding = dividendDigitRightEdge - digitCount * cellSizePx - (digitCount > 0 ? (digitCount - 1) * gapSizePx : 0);
            const dividendToPartialProductGapPx = gcToPx(stylingDefaults.dividendToPartialProductGap, 'width');
            const partialDividendRowCells = Array.from({ length: digitCount }, (_, digitIdx) =>
              renderCell(null, `partial-dividend-${stepIdx}-${digitIdx}`, 'working', false, stepIdx)
            );
            allRows.push(
              React.createElement('div', {
                key: `partial-dividend-row-${stepIdx}`,
                className: 'div-row div-difference-row',
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: gapSizePx > 0 ? `${gapSizePx}px` : '0',
                  paddingLeft: `${Math.max(0, diffLeftPadding)}px`,
                  marginTop: `${dividendToPartialProductGapPx}px`
                }
              }, partialDividendRowCells)
            );
          } else {
          // Calculate left padding to align subtract value under dividend
          // step.position is the index of the rightmost digit being divided
          // Use the same calculation as dividend row to ensure alignment
          const bracketMarginLeftPx = gapSizePx > 0 ? gapSizePx : gcToPx(stylingDefaults.bracketMarginLeft, 'padding');
          const dividendStartPosition = divisorBlockWidthPx + bracketWidthPx + bracketMarginLeftPx;
          // Right edge of dividend digit at step.position
          const subtractRightEdge = dividendStartPosition + (step.position + 1) * cellSizePx + step.position * gapSizePx;
          
          // When waiting for quotient, use empty cells (same layout and styling as default)
          const subtractDigitCount = step.subtractDigits?.length || 0;
          const effectiveSubtractDigits = isWaitingForQuotient && subtractDigitCount > 0 ? step.subtractDigits.map(() => null) : (step.subtractDigits || []);
          const effectiveDifferenceDigits = isWaitingForQuotient && step.differenceDigits?.length ? step.differenceDigits.map(() => null) : (step.differenceDigits || []);
          
          // Calculate padding for subtract row
          let subtractLeftPadding, subtractRowCells = [];
          
          // Check if we're using dark theme to show helper text
          const isDarkTheme = currentTheme === 'dark-theme';
          
          if (isIndonesiaMode) {
            // Indonesian mode: minus sign in separate column on the RIGHT
            // Calculate padding to align subtract digits (same as default, but no minus sign before)
            // Account for gaps between subtract digits
            subtractLeftPadding = subtractRightEdge - step.subtractDigits.length * cellSizePx - (step.subtractDigits.length > 0 ? (step.subtractDigits.length - 1) * gapSizePx : 0);
            
            // For dark theme, add helper equation text positioned relative to subtract digits (not when waiting for quotient)
            if (isDarkTheme && showHelperText && !isWaitingForQuotient) {
              // Position helper text: Indonesian mode = 1 column before, default mode = 2 columns before subtract digits
              const columnsBefore = isIndonesiaMode ? 1 : 2;
              // Use helperTextMarginRight prop (convert to pixels)
              const helperRightMarginPx = gcToPx(stylingDefaults.helperTextMarginRight, 'width');
              // Adjust left position to account for right margin (move left by margin amount)
              const helperLeftPosition = subtractLeftPadding - columnsBefore * (cellSizePx + gapSizePx) - helperRightMarginPx;
              
              // Get theme colors for divisor and quotient from theme styles
              // These match the colors used in renderCell for the actual cells (line 1940)
              const themeStyles = getThemeStyles();
              // Get the actual color used in cells (same logic as renderCell line 1940)
              const useButtonTheme = currentTheme === 'button-theme' && !minimalMode && mode === 'spotIncorrect';
              // For dark theme, both use white, but we want to distinguish them
              // Use the actual cell text color from theme styles
              let divisorColor = useButtonTheme ? 'black' : (themeStyles.divisor?.color || '#FFFFFF');
              let quotientColor = useButtonTheme ? 'black' : (themeStyles.quotient?.color || '#FFFFFF');
              
              // In dark theme, both are white, so use the background gradient colors for distinction
              // Divisor: transparent background, white text (keep white)
              // Quotient: teal gradient background, white text - but we can use a light teal color to match the teal gradient background
              if (currentTheme === 'dark-theme' && !useButtonTheme) {
                // Divisor stays white (it's transparent background)
                divisorColor = '#FFFFFF';
                // Quotient: use a light teal color to match the teal gradient background
                quotientColor = '#41BDA3'; // Light teal from the gradient
              }
              
              // Convert font size to pixels using the same method as fontSizePx
              // fontSizePx uses gcToPx(fontSize, 'fontSize'), so we should use the same
              // But we need to avoid min bounds clamping, so let's use 'width' property instead
              // Or better: use fontSizePx as a reference and scale proportionally
              let helperTextFontSizePx;
              if (typeof stylingDefaults.helperTextFontSize === 'string' && stylingDefaults.helperTextFontSize.includes('gc')) {
                const gcMatch = stylingDefaults.helperTextFontSize.match(/^([\d.]+)gc$/);
                if (gcMatch) {
                  const helperGcUnits = parseFloat(gcMatch[1]);
                  // Get the fontSize gc units to calculate ratio
                  const fontSizeGcMatch = typeof fontSize === 'string' && fontSize.includes('gc') ? fontSize.match(/^([\d.]+)gc$/) : null;
                  if (fontSizeGcMatch) {
                    const fontSizeGcUnits = parseFloat(fontSizeGcMatch[1]);
                    // Scale proportionally: helperTextFontSizePx = fontSizePx * (helperGcUnits / fontSizeGcUnits)
                    helperTextFontSizePx = fontSizePx * (helperGcUnits / fontSizeGcUnits);
                  } else {
                    // Fallback: use gcToPx with 'width' to avoid min bounds
                    helperTextFontSizePx = gcToPx(stylingDefaults.helperTextFontSize, 'width');
                  }
                } else {
                  helperTextFontSizePx = parseFloat(stylingDefaults.helperTextFontSize) || fontSizePx * 0.6;
                }
              } else {
                helperTextFontSizePx = parseFloat(stylingDefaults.helperTextFontSize) || fontSizePx * 0.6;
              }
              
              // Create helper text with different colors for different parts
              subtractRowCells.push(
                React.createElement('span', {
                  key: `helper-${stepIdx}`,
                  className: 'div-helper-text',
                  style: {
                    background: stylingDefaults.partialProductRowBackground,
                    fontSize: `${helperTextFontSizePx}px`,
                    fontWeight: '400',
                    fontFamily: "'Nunito', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    whiteSpace: 'nowrap',
                    position: 'absolute',
                    left: `${helperLeftPosition}px`,
                    width: `${cellSizePx}px`,
                    textAlign: 'right',
                    paddingRight: gapSizePx > 0 ? `${gapSizePx}px` : '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10
                  }
                }, [
                  // Divisor and "×" in divisor color
                  React.createElement('span', {
                    key: 'divisor-part',
                    style: { color: divisorColor }
                  }, `${currentDivisor} × `),
                  // Quotient digit in quotient color
                  React.createElement('span', {
                    key: 'quotient-part',
                    style: { color: quotientColor }
                  }, `${step.quotientDigit}`),
                  // "=" in divisor color
                  React.createElement('span', {
                    key: 'equals-part',
                    style: { color: divisorColor }
                  }, ' =')
                ])
              );
            }
            
            // Add subtract digits first (empty when waiting for quotient)
            subtractRowCells.push(
              ...effectiveSubtractDigits.map((digit, digitIdx) =>
                renderCell(digit, `subtract-${stepIdx}-${digitIdx}`, 'working', false, stepIdx)
              )
            );
            
            // Add minus sign in its own column on the RIGHT (after digits) as a full cell block
            subtractRowCells.push(
              React.createElement('div', {
                key: `minus-${stepIdx}`,
                className: 'div-cell div-cell-minus',
                style: {
                  width: `${cellSizePx}px`,
                  height: `${cellSizePx}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: `${fontSizePx}px`,
                  fontWeight: 'bold',
                  color: isDarkTheme ? '#FFFFFF' : (themeStyles.working?.color || '#9C27B0'),
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none'
                }
              }, '−')
            );
          } else {
            // Default mode: minus sign before digits (as a full cell block)
            // Calculate padding: subtractRightEdge - (minus cell + gap + subtract digits)
            subtractLeftPadding = subtractRightEdge - (cellSizePx + gapSizePx) - step.subtractDigits.length * cellSizePx - (step.subtractDigits.length > 0 ? (step.subtractDigits.length - 1) * gapSizePx : 0);
            
            // For dark theme, add helper equation text positioned relative to subtract digits (not when waiting for quotient)
            if (isDarkTheme && showHelperText && !isWaitingForQuotient) {
              // Position helper text: Indonesian mode = 1 column before, default mode = 2 columns before subtract digits
              const columnsBefore = isIndonesiaMode ? 1 : 2;
              // Use helperTextMarginRight prop (convert to pixels)
              const helperRightMarginPx = gcToPx(stylingDefaults.helperTextMarginRight, 'width');
              // Adjust left position to account for right margin (move left by margin amount)
              const helperLeftPosition = subtractLeftPadding - columnsBefore * (cellSizePx + gapSizePx) - helperRightMarginPx;
              
              // Get theme colors for divisor and quotient from theme styles
              // These match the colors used in renderCell for the actual cells (line 1940)
              const themeStyles = getThemeStyles();
              // Get the actual color used in cells (same logic as renderCell line 1940)
              const useButtonTheme = currentTheme === 'button-theme' && !minimalMode && mode === 'spotIncorrect';
              // For dark theme, both use white, but we want to distinguish them
              // Use the actual cell text color from theme styles
              let divisorColor = useButtonTheme ? 'black' : (themeStyles.divisor?.color || '#FFFFFF');
              let quotientColor = useButtonTheme ? 'black' : (themeStyles.quotient?.color || '#FFFFFF');
              
              // In dark theme, both are white, so use the background gradient colors for distinction
              // Divisor: transparent background, white text (keep white)
              // Quotient: teal gradient background, white text - but we can use a light teal color to match the teal gradient background
              if (currentTheme === 'dark-theme' && !useButtonTheme) {
                // Divisor stays white (it's transparent background)
                divisorColor = '#FFFFFF';
                // Quotient: use a light teal color to match the teal gradient background
                quotientColor = '#41BDA3'; // Light teal from the gradient
              }
              
              // Convert font size to pixels using the same method as fontSizePx
              // fontSizePx uses gcToPx(fontSize, 'fontSize'), so we should use the same
              // But we need to avoid min bounds clamping, so let's use 'width' property instead
              // Or better: use fontSizePx as a reference and scale proportionally
              let helperTextFontSizePx;
              if (typeof stylingDefaults.helperTextFontSize === 'string' && stylingDefaults.helperTextFontSize.includes('gc')) {
                const gcMatch = stylingDefaults.helperTextFontSize.match(/^([\d.]+)gc$/);
                if (gcMatch) {
                  const helperGcUnits = parseFloat(gcMatch[1]);
                  // Get the fontSize gc units to calculate ratio
                  const fontSizeGcMatch = typeof fontSize === 'string' && fontSize.includes('gc') ? fontSize.match(/^([\d.]+)gc$/) : null;
                  if (fontSizeGcMatch) {
                    const fontSizeGcUnits = parseFloat(fontSizeGcMatch[1]);
                    // Scale proportionally: helperTextFontSizePx = fontSizePx * (helperGcUnits / fontSizeGcUnits)
                    helperTextFontSizePx = fontSizePx * (helperGcUnits / fontSizeGcUnits);
                  } else {
                    // Fallback: use gcToPx with 'width' to avoid min bounds
                    helperTextFontSizePx = gcToPx(stylingDefaults.helperTextFontSize, 'width');
                  }
                } else {
                  helperTextFontSizePx = parseFloat(stylingDefaults.helperTextFontSize) || fontSizePx * 0.6;
                }
              } else {
                helperTextFontSizePx = parseFloat(stylingDefaults.helperTextFontSize) || fontSizePx * 0.6;
              }
              
              // Create helper text with different colors for different parts
              subtractRowCells.push(
              React.createElement('span', {
                  key: `helper-${stepIdx}`,
                  className: 'div-helper-text',
                  style: {
                    background: stylingDefaults.partialProductRowBackground,
                    fontSize: `${helperTextFontSizePx}px`,
                    fontWeight: '400',
                    fontFamily: "'Nunito', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    whiteSpace: 'nowrap',
                    position: 'absolute',
                    left: `${helperLeftPosition}px`,
                    width: `${cellSizePx}px`,
                    textAlign: 'right',
                    paddingRight: gapSizePx > 0 ? `${gapSizePx}px` : '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10
                  }
                }, [
                  // Divisor and "×" in divisor color
                  React.createElement('span', {
                    key: 'divisor-part',
                    style: { color: divisorColor }
                  }, `${currentDivisor} × `),
                  // Quotient digit in quotient color
                  React.createElement('span', {
                    key: 'quotient-part',
                    style: { color: quotientColor }
                  }, `${step.quotientDigit}`),
                  // "=" in divisor color
                  React.createElement('span', {
                    key: 'equals-part',
                    style: { color: divisorColor }
                  }, ' =')
                ])
              );
            }
            
            subtractRowCells.push(
              // Minus sign as a full cell block
              React.createElement('div', {
                key: `minus-${stepIdx}`,
                className: 'div-cell div-cell-minus',
                style: {
                  width: `${cellSizePx}px`,
                  height: `${cellSizePx}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: `${fontSizePx}px`,
                  fontWeight: 'bold',
                  color: isDarkTheme ? '#FFFFFF' : (themeStyles.working?.color || '#9C27B0'),
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none'
                }
              }, '−'),
              // Subtract digits (empty when waiting for quotient)
              ...effectiveSubtractDigits.map((digit, digitIdx) =>
                renderCell(digit, `subtract-${stepIdx}-${digitIdx}`, 'working')
              )
            );
          }
          
          // Subtract row with minus sign
          // Note: position is 'relative' to allow absolute positioning of helper text relative to this row
          // But helper text should be positioned relative to div-main-content, so we'll handle that in the helper text style
          // Convert dividendToPartialProductGap to pixels
          const dividendToPartialProductGapPx = gcToPx(stylingDefaults.dividendToPartialProductGap, 'width');
          
          allRows.push(
            React.createElement('div', {
              key: `subtract-row-${stepIdx}`,
              className: 'div-row div-subtract-row',
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: gapSizePx > 0 ? `${gapSizePx}px` : '0',
                paddingLeft: `${Math.max(0, subtractLeftPadding)}px`,
                marginTop: `${dividendToPartialProductGapPx}px`,
                position: 'relative'
              }
            }, subtractRowCells)
          );
          
          // Line under subtraction
          const lineLeftPadding = subtractRightEdge - step.subtractDigits.length * cellSizePx;
          const lineWidth = gapSizePx > 0 ? 
            (step.subtractDigits.length * cellSizePx + (step.subtractDigits.length - 1) * gapSizePx) : 
            (step.subtractDigits.length * cellSizePx);
          
          allRows.push(
            React.createElement('div', {
              key: `line-${stepIdx}`,
              className: 'div-line',
              style: {
                marginLeft: `${lineLeftPadding}px`,
                width: `${lineWidth}px`,
                height: '0',
                borderTop: `${stylingDefaults.subtractionBarThickness} ${stylingDefaults.subtractionBarStyle} ${stylingDefaults.subtractionBarColor}`,
                borderBottom: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderRadius: stylingDefaults.lineBorderRadius,
                marginTop: stylingDefaults.lineMarginTop,
                marginBottom: stylingDefaults.lineMarginBottom
              }
            })
          );
          
          // Difference row - only show when the corresponding quotient digit is filled (in guided mode)
          const quotientIdxForStep = data.quotientDigits.length - data.steps.length + stepIdx;
          const quotientKeyForStep = `quotient-${quotientIdxForStep}`;
          const quotientFilled = mode !== 'guided' || guidedValues[quotientKeyForStep] !== undefined;
          
          if (!quotientFilled) {
            // Skip difference row when quotient digit for this step is not yet filled
          } else {
          // Difference row - right-align with subtract row (so remainder digits align with units/tens column under partial dividend)
          const dividendDigitRightEdge = dividendStartPosition + (step.position + 1) * cellSizePx + step.position * gapSizePx;
          // Left edge of difference row = so its right edge matches subtract row (same as subtractRightEdge)
          const diffLeftPadding = subtractRightEdge - step.differenceDigits.length * cellSizePx - (step.differenceDigits.length > 0 ? (step.differenceDigits.length - 1) * gapSizePx : 0);
          
          // Prepare difference row cells (empty when waiting for quotient)
          const differenceRowCells = effectiveDifferenceDigits.map((digit, digitIdx) =>
            renderCell(digit, `difference-${stepIdx}-${digitIdx}`, 'working', false, stepIdx)
          );
          
          // Add bring down digit to the right of difference (for next step)
          // The bring down digit should appear on the same row, to the right of the difference
          // Only show bring down digit automatically if it's NOT in editableTypes (in guided mode)
          // If it's in editableTypes, it will be shown as a guided step (editable cell)
          
          // For dark theme, add bring-down arrow SVG
          let bringDownArrowElement = null;
          
          if (stepIdx < data.steps.length - 1) {
            const nextStep = data.steps[stepIdx + 1];
            const editableTypes = mode === 'guided' ? (guidedConfig.editableTypes || ['quotient', 'subtract', 'difference', 'remainder', 'bringDown']) : [];
            const isBringDownEditable = mode === 'guided' && editableTypes.includes('bringDown');
            const shouldShowBringDownAutomatically = mode !== 'guided' || (!isBringDownEditable && isStepFullyDone(stepIdx));
            // Show arrow only when block movement animation is over: for current bringDown step, show arrow only after the cell has been filled (animation completed)
            const currentGuidedStep = getCurrentGuidedStep();
            const isCurrentStepThisBringDown = mode === 'guided' && currentGuidedStep?.cellKey === `bringdown-${stepIdx + 1}`;
            const bringDownCellFilled = mode === 'guided' && (guidedValues[`bringdown-${stepIdx + 1}`] !== undefined && guidedValues[`bringdown-${stepIdx + 1}`] !== null);
            // Show arrow when: auto-show, or (current step is this bring-down and cell filled), or bring-down already completed (cell filled, so arrow stays visible when grid advances)
            const shouldShowArrow = showArrows && (shouldShowBringDownAutomatically || (isCurrentStepThisBringDown && bringDownCellFilled) || (mode === 'guided' && bringDownCellFilled));
            
            if (nextStep && nextStep.bringDownDigit !== undefined && nextStep.bringDownDigit !== null) {
              // Calculate position for bring down digit - it should be to the right of the difference
              // Position it to align with the dividend digit being brought down
              const bringDownPosition = dividendStartPosition + nextStep.dividendIndex * (cellSizePx + gapSizePx);
              const differenceRowRightEdge = diffLeftPadding + step.differenceDigits.length * cellSizePx + (step.differenceDigits.length > 0 ? (step.differenceDigits.length - 1) * gapSizePx : 0);
              // Account for two flex gaps: one after last difference cell, one after spacer (so bring-down aligns with dividend column)
              const bringDownLeftPadding = Math.max(0, bringDownPosition - differenceRowRightEdge - 2 * gapSizePx);
              
              // Add spacing
              if (bringDownLeftPadding > 0) {
                differenceRowCells.push(
                  React.createElement('div', {
                    key: `spacer-${stepIdx}`,
                    style: { width: `${bringDownLeftPadding}px` }
                  })
                );
              }
              
          // For dark theme, add bring-down arrow (also when guided and current step is this bring-down, e.g. dividend clicked)
          if (isDarkTheme && shouldShowArrow) {
                // Create SVG arrow that starts from below the dividend row and points down to the line for nextStep
                // Calculate the center X position of the dividend digit being brought down
                const dividendDigitCenterX = dividendStartPosition + nextStep.dividendIndex * (cellSizePx + gapSizePx) + cellSizePx / 2;
                
                const arrowWidthPx = gcToPx(stylingDefaults.arrowWidth);
                const arrowHeadYOffsetPx = gcToPx(stylingDefaults.arrowHeadYOffset);
                const arrowHeadYOffset2Px = gcToPx(stylingDefaults.arrowHeadYOffset2);
                const arrowStrokeWidthPx = parseFloat(stylingDefaults.arrowStrokeWidth);
                // Arrow should be centered on the dividend column
                const arrowCenterX = arrowWidthPx / 2;
                
                // Arrow should start from the beginning of the first subtract row (right after dividend row)
                // All arrows start from the same position
                const dividendRowBottom = cellSizePx + (gapSizePx > 0 ? parseFloat(gapSizePx) : gcToPx(stylingDefaults.bracketDividendPaddingTop || '0'));
                const subtractRowMarginTopPx = gcToPx(stylingDefaults.dividendToPartialProductGap);
                const arrowTopFromDividend = dividendRowBottom + subtractRowMarginTopPx; // Start from where first subtract row begins
                
                // Calculate cumulative height of all previous steps to find where nextStep's difference row (partial dividend) starts
                // Each step has: subtract row (cellSizePx + marginTop) + line (marginTop + marginBottom) + difference row (cellSizePx + marginTop)
                const lineMarginTopPx = gcToPx(stylingDefaults.lineMarginTop);
                const lineMarginBottomPx = gcToPx(stylingDefaults.lineMarginBottom);
                const differenceRowMarginTopPx = gcToPx(stylingDefaults.differenceRowMarginTop);
                
                // Calculate cumulative height from first subtract row start to nextStep's subtract row top (one row above difference row)
                // The arrow points to nextStep (stepIdx + 1), so we need to include all steps up to nextStep's subtract row
                let cumulativeHeightToSubtractRow = 0;
                const nextStepIdx = stepIdx + 1; // The step this arrow points to
                
                // The arrow starts at the top of step 0's subtract row
                // It needs to go through all steps up to and including nextStep's subtract row top (one row above the difference row)
                // Structure for each step i (before nextStep):
                //   - Subtract row: marginTop + cellSizePx
                //   - Line: marginTop + marginBottom
                //   - Difference row: cellSizePx + marginTop
                // For nextStep: only add subtract row marginTop to reach the top of its subtract row
                
                for (let i = 0; i < nextStepIdx; i++) {
                  // For step 0, we're already at the start, so just add height (no marginTop)
                  // For subsequent steps, add marginTop + height
                  if (i === 0) {
                    cumulativeHeightToSubtractRow += cellSizePx; // Step 0 subtract row height
                  } else {
                    cumulativeHeightToSubtractRow += subtractRowMarginTopPx + cellSizePx; // Margin + subtract row height
                  }
                  
                  // Line: always add marginTop + marginBottom
                  cumulativeHeightToSubtractRow += lineMarginTopPx + lineMarginBottomPx;
                  
                  // Difference row: add full row (height + marginTop)
                  cumulativeHeightToSubtractRow += cellSizePx + differenceRowMarginTopPx; // Full difference row
                }
                
                // Now add the marginTop for nextStep's subtract row to reach its top (one row above the difference row)
                cumulativeHeightToSubtractRow += subtractRowMarginTopPx;
                
                // Calculate arrow height: from first subtract row start to nextStep's subtract row top
                let calculatedArrowHeight = cumulativeHeightToSubtractRow;
                
                // For the first arrow (stepIdx === 0), reduce by half a cell height
                if (stepIdx === 0) {
                  calculatedArrowHeight -= cellSizePx / 2;
                }
                
                // Reduce all arrow lengths by 10% of cell height
                calculatedArrowHeight -= cellSizePx * 0.3;
                
                bringDownArrowElement = React.createElement('svg', {
                  key: `arrow-${stepIdx}`,
                  className: 'div-bring-down-arrow-svg',
                  width: arrowWidthPx,
                  height: calculatedArrowHeight,
                  style: {
                    position: 'absolute',
                    left: `${dividendDigitCenterX - arrowCenterX}px`,
                    top: `${arrowTopFromDividend}px`,
                    pointerEvents: 'none',
                    zIndex: 5
                  }
                }, [
                  // Arrow line (straight vertical line, centered in SVG, starting from top, ending at line)
                  React.createElement('path', {
                    key: 'arrow-line',
                    d: `M ${arrowCenterX} 0 L ${arrowCenterX} ${calculatedArrowHeight - arrowHeadYOffset2Px}`,
                    className: 'div-bring-down-arrow',
                    style: {
                      stroke: stylingDefaults.arrowColor,
                      strokeWidth: stylingDefaults.arrowStrokeWidth,
                      fill: 'none',
                      strokeLinecap: 'round'
                    }
                  }),
                  // Arrow head (centered in SVG, at the bottom, pointing to the line)
                  React.createElement('polygon', {
                    key: 'arrow-head',
                    points: `${arrowCenterX - 5},${calculatedArrowHeight - arrowHeadYOffsetPx} ${arrowCenterX},${calculatedArrowHeight} ${arrowCenterX + 5},${calculatedArrowHeight - arrowHeadYOffsetPx}`,
                    className: 'div-bring-down-arrow-head',
                    style: {
                      fill: stylingDefaults.arrowColor
                    }
                  })
                ]);
                // Add arrow to mainRowArrows array to be included in main-row
                mainRowArrows.push(bringDownArrowElement);
              }
              
              // Show bring down digit (either automatically or as editable guided step)
              // If editable, always show the cell (value will be shown/hidden based on guided step state in renderCell)
              // If not editable, only show when step is fully done
              // Note: The bringDown belongs to the next step (stepIdx + 1), so use that for the cell key
              const bringDownStepIdx = stepIdx + 1;
              if (shouldShowBringDownAutomatically) {
                // Show automatically (not editable) - show the value
                differenceRowCells.push(
                  renderCell(nextStep.bringDownDigit, `bringdown-${bringDownStepIdx}`, 'bringDown')
                );
              } else if (isBringDownEditable) {
                // Show as editable cell (will be handled by renderCell in guided mode)
                // Pass null so renderCell can determine if it should show value or be editable
                differenceRowCells.push(
                  renderCell(null, `bringdown-${bringDownStepIdx}`, 'bringDown')
                );
              }
            }
          }
          
          allRows.push(
            React.createElement('div', {
              key: `difference-row-${stepIdx}`,
              className: 'div-row div-difference-row',
              style: {
                display: 'flex',
                paddingLeft: `${diffLeftPadding}px`,
                alignItems: 'center',
                position: 'relative',
                gap: gapSizePx > 0 ? `${gapSizePx}px` : '0',
                marginTop: stylingDefaults.differenceRowMarginTop
              }
            }, differenceRowCells)
          );
          }
          }
        }
      });
      
      // Now create and insert the main-row with arrows included at the correct position (after quotient row, index 1)
      const mainRowElement = React.createElement('div', {
        key: 'main-row',
        className: 'div-row div-main-row',
        style: {
          display: 'flex',
          alignItems: 'stretch',
          position: 'relative'
        }
      }, mainRowChildren.concat(mainRowArrows));
      
      // Insert main-row after quotient row (at index 1)
      allRows.splice(1, 0, mainRowElement);
    }
    
    // Remainder display (if applicable)
    // In guided mode, only show remainder when remainder steps are reached
    let shouldShowRemainder = showRemainder && data.remainder > 0;
    if (mode === 'guided' && shouldShowRemainder) {
      // Check if remainder steps exist and if we've reached them
      const remainderSteps = guidedSteps.filter(step => step.type === 'remainder');
      if (remainderSteps.length > 0) {
        // Only show remainder if we've reached the first remainder step
        const firstRemainderStepIndex = guidedSteps.findIndex(step => step.type === 'remainder');
        shouldShowRemainder = firstRemainderStepIndex !== -1 && guidedStepIndex >= firstRemainderStepIndex;
      } else {
        // No remainder steps yet, don't show
        shouldShowRemainder = false;
      }
    }
    
    if (shouldShowRemainder && showRemainderLabel) {
      allRows.push(
        React.createElement('div', {
          key: 'remainder-row',
          className: 'div-row div-remainder-row',
          style: {
            display: 'flex',
            alignItems: 'center',
            marginTop: stylingDefaults.remainderRowMarginTop,
            paddingLeft: `${divisorBlockWidthPx + bracketWidthPx}px`
          }
        }, [
          React.createElement('span', {
            key: 'remainder-label',
            style: {
              fontSize: `${fontSizePx * stylingDefaults.remainderLabelFontSizeMultiplier}px`,
              marginRight: stylingDefaults.remainderLabelMarginRight,
              color: themeStyles.remainder?.color || '#FF9800',
              fontWeight: 'bold'
            }
          }, 'Remainder:'),
          ...data.remainderDigits.map((digit, idx) =>
            renderCell(digit, `remainder-${idx}`, 'remainder')
          )
        ])
      );
    }
    
    // Main content wrapper (fixed width and min-height so grid size does not change as steps are added)
    const mainContent = React.createElement('div', {
      key: 'main-content',
        className: 'div-main-content',
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          margin: '0 auto',
          width: `${totalGridWidthPx}px`,
          minWidth: `${totalGridWidthPx}px`,
          minHeight: `${totalGridHeightPx}px`,
          boxSizing: 'border-box',
          position: 'relative' // For absolute positioning of helper text
        }
    }, allRows);
    
    // Guided mode hint
    const renderGuidedHint = () => {
      if (mode !== 'guided' || !guidedConfig.showHints || !showGuidedHint) return null;
      
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
      
      // Do not show hint when waiting for quotient digit
      if (currentStep.type === 'quotient') return null;
      
      // Show hint for digit selection step
      if (currentStep.type === 'selectStartingDigits') {
        if (selectDigitError) {
          return React.createElement('div', {
            key: 'guided-hint-digit-error',
            className: 'div-guided-hint',
            style: {
              ...baseHintStyle,
              background: 'rgba(244, 67, 54, 0.15)',
              border: '2px solid #F44336',
              color: '#D32F2F'
            }
          }, selectDigitError);
        }

        // Calculate current value from selected digits for dynamic hint
        const currentStartingValue = selectedStartingDigits.reduce((acc, idx) => {
          return acc * 10 + data.dividendDigits[idx];
        }, 0);
        
        // Determine hint based on current selection
        let selectionHint;
        if (selectedStartingDigits.length === 0) {
          selectionHint = getDivisionText('division.chooseFirstDigit');
        } else if (currentStartingValue < divisor) {
          selectionHint = getDivisionText('division.chooseNextDigit', { value: currentStartingValue, divisor });
        } else {
          selectionHint = getDivisionText('division.selectThenFind', { value: currentStartingValue, divisor });
        }
        
        return React.createElement('div', {
          key: 'guided-hint',
          className: 'div-guided-hint',
          style: {
            ...baseHintStyle,
            background: '#E3F2FD',
            border: '2px solid #2196F3',
            color: '#1565C0'
          }
        }, selectionHint);
      }
      
      return React.createElement('div', {
        key: 'guided-hint',
        className: 'div-guided-hint',
        style: {
          ...baseHintStyle,
          background: '#FFF9C4',
          border: '2px solid #FFC107',
          color: '#5D4037'
        }
      }, currentStep.hint);
    };
    
    // Guided mode drag handlers
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
    
    // Apply a digit to the current guided step (used by both click and drag-end)
    const applyGuidedDigit = React.useCallback((digit) => {
      // Prevent any interaction while locked
      if (checkInteractionLocked()) {
        return;
      }
      lockInteraction();
      
      const currentStep = currentStepRef.current ?? getCurrentGuidedStep();
      if (!currentStep || guidedComplete) {
        // Release lock immediately if nothing to process
        unlockInteraction();
        return;
      }
      const key = currentStep.cellKey;
      setGuidedValues(prev => ({ ...prev, [key]: digit }));
      if (digit === currentStep.correctValue || Number(digit) === Number(currentStep.correctValue)) {
              // skipEmit: handleGuidedDigitClick emits a richer action.completed
              // right after applyGuidedDigit returns (with step name, digit,
              // expected, actual). Without skipEmit we'd double-fire and the
              // parent bridge's payload-aware dedupe would have to discard one
              // — keep the minimal sound-manager emit out of this path.
              if (typeof window !== 'undefined' && window.playAnswerSound) window.playAnswerSound(true, { skipEmit: true });
              console.log('🔍 [LongDivisionGrid] DROP CORRECT: key =', key, 'digit =', digit, 'currentStep.type =', currentStep.type, 'currentStep.correctValue =', currentStep.correctValue);
              setGuidedValidation(prev => ({ ...prev, [key]: { isCorrect: true } }));
              
              // If this is a quotient step and autoFillSubtract is enabled, auto-fill subtract cells
              if (currentStep.type === 'quotient' && guidedConfig.autoFillSubtract) {
                // Find the stepIdx by finding which division step has this quotient digit
                // The quotient cellKey contains the quotient index, we need to find the corresponding stepIdx
                const quotientIdx = parseInt(key.split('-')[1]);
                const stepIdx = quotientIdx - (data.quotientDigits.length - data.steps.length);
                
                // Validate stepIdx is within bounds
                if (stepIdx >= 0 && stepIdx < data.steps.length) {
                  // Find all subtract steps for this stepIdx
                  const subtractSteps = guidedSteps.filter(step => 
                    step.type === 'subtract' && step.cellKey.startsWith(`subtract-${stepIdx}-`)
                  );
                  
                  // Check if we should skip normal advance (if there are subtract steps to skip)
                  const shouldSkipNormalAdvance = guidedConfig.autoAdvance && subtractSteps.length > 0;
                  
                  // Auto-fill all subtract cells and auto-advance through them
                    setTimeout(() => {
                      setGuidedValues(prev => {
                        const newValues = { ...prev, [key]: digit };
                        subtractSteps.forEach(subtractStep => {
                        newValues[subtractStep.cellKey] = subtractStep.correctValue;
                      });
                      return newValues;
                    });
                    
                    setGuidedValidation(prev => {
                      const newValidation = { ...prev, [key]: { isCorrect: true } };
                      subtractSteps.forEach(subtractStep => {
                        newValidation[subtractStep.cellKey] = { isCorrect: true };
                      });
                      return newValidation;
                    });
                    
                    // Auto-advance through all subtract steps
                    if (shouldSkipNormalAdvance) {
                      // Find the index of the last subtract step
                      const lastSubtractStepIndex = guidedSteps.findIndex(step => 
                        step.cellKey === subtractSteps[subtractSteps.length - 1].cellKey
                      );
                      
                      if (lastSubtractStepIndex !== -1 && lastSubtractStepIndex > guidedStepIndex) {
                        // Advance to the step after the last subtract step
                        setTimeout(() => {
                          setGuidedStepIndex(lastSubtractStepIndex + 1);
                          if (onStepComplete) {
                            onStepComplete(lastSubtractStepIndex, guidedSteps.length);
                          }
                          // Unlock after manual step index jump
                          setTimeout(() => { unlockInteraction(); }, 150);
                        }, 200);
                      } else {
                        // Nothing to advance to; release the lock
                        setTimeout(() => { unlockInteraction(); }, 150);
                      }
                    }
                  }, 100);
                  
                  // Skip normal advance if we're handling subtract steps
                  if (!shouldSkipNormalAdvance && guidedConfig.autoAdvance) {
                    setTimeout(advanceGuidedStep, 300);
                  }
                } else {
                  // Normal advance if stepIdx is invalid
                  if (guidedConfig.autoAdvance) {
                    setTimeout(advanceGuidedStep, 300);
                  }
                }
              } else {
                // If this is a difference step and autoCalculateRemainder is enabled, check if we should auto-fill remainder
                if (currentStep.type === 'difference' && guidedConfig.autoCalculateRemainder && showRemainder && data.remainder > 0) {
                  // Extract stepIdx from difference cellKey: difference-${stepIdx}-${digitIdx}
                  const parts = key.split('-');
                  const stepIdx = parseInt(parts[1]);
                  
                  // Check if this is the last division step
                  if (stepIdx === data.steps.length - 1) {
                    // Find all difference steps for this stepIdx
                    const differenceSteps = guidedSteps.filter(step => 
                      step.type === 'difference' && step.cellKey.startsWith(`difference-${stepIdx}-`)
                    );
                    
                    // Check if all difference digits for this step are completed
                    // We need to check after updating the current value
                    setTimeout(() => {
                      setGuidedValues(prev => {
                        const updatedValues = { ...prev, [key]: digit };
                        
                        const allDifferenceCompleted = differenceSteps.every(step => {
                          const stepValue = updatedValues[step.cellKey];
                          const stepValidation = guidedValidation[step.cellKey];
                          return stepValue !== undefined && stepValidation?.isCorrect === true;
                        });
                        
                        // Include the current step that was just completed
                        const currentStepCompleted = digit === currentStep.correctValue || Number(digit) === Number(currentStep.correctValue);
                        const allCompleted = allDifferenceCompleted && currentStepCompleted;
                        
                        if (allCompleted) {
                          // Find all remainder steps
                          const remainderSteps = guidedSteps.filter(step => step.type === 'remainder');
                          
                          // Auto-fill all remainder cells
                          remainderSteps.forEach(remainderStep => {
                            updatedValues[remainderStep.cellKey] = remainderStep.correctValue;
                          });
                          
                          // Update validation
                          setGuidedValidation(prevValidation => {
                            const newValidation = { ...prevValidation, [key]: { isCorrect: true } };
                            remainderSteps.forEach(remainderStep => {
                              newValidation[remainderStep.cellKey] = { isCorrect: true };
                            });
                            return newValidation;
                          });
                        }
                        
                        return updatedValues;
                      });
                    }, 150);
                  }
                }
                
                // Completion detection: when user fills the LAST difference digit and remainder is a single digit with the SAME value, treat as division complete (no second drop needed).
                const isLastDifferenceStep = currentStep.type === 'difference' && (() => {
                  const parts = key.split('-');
                  const stepIdx = parseInt(parts[1], 10);
                  return stepIdx === data.steps.length - 1;
                })();
                const remainderSingleDigitSameValue = showRemainder && data.remainder > 0 &&
                  data.remainderDigits.length === 1 &&
                  (data.remainderDigits[0] === digit || Number(data.remainderDigits[0]) === Number(digit));
                if (isLastDifferenceStep && remainderSingleDigitSameValue) {
                  const remainderSteps = guidedSteps.filter(s => s.type === 'remainder');
                  setGuidedValues(prev => {
                    const next = { ...prev, [key]: digit };
                    remainderSteps.forEach(remStep => { next[remStep.cellKey] = remStep.correctValue; });
                    return next;
                  });
                  setGuidedValidation(prev => {
                    const next = { ...prev, [key]: { isCorrect: true } };
                    remainderSteps.forEach(remStep => { next[remStep.cellKey] = { isCorrect: true }; });
                    return next;
                  });
                  setGuidedComplete(true);
                  if (onGuidedComplete) onGuidedComplete();
                  window.__longDivisionComplete = true;
                  const targetId = (typeof guidedHintTarget === 'string' && guidedHintTarget) ? guidedHintTarget : 'div-instruction';
                  window.__longDivisionGuidedHint = { targetId, text: guidedCompleteHintText };
                  window.dispatchEvent(new CustomEvent('guided-hint-changed', { detail: { targetId } }));
                  setIsGuidedDragging(false);
                  setGuidedDraggedDigit(null);
                  setGuidedDragPosition({ x: 0, y: 0 });
                  // Complete path returns early, so release interaction lock here.
                  setTimeout(() => { unlockInteraction(); }, 150);
                  return;
                }
                
                // Normal advance for non-quotient steps or when autoFillSubtract is disabled
                if (guidedConfig.autoAdvance) {
                  setTimeout(advanceGuidedStep, 300);
                } else {
                  // Without auto-advance nothing else unlocks; release lock now.
                  setTimeout(() => { unlockInteraction(); }, 150);
                }
                // When user just filled the last remainder step, push "Division complete!" immediately (after commit) so instruction updates
                if (currentStep.type === 'remainder') {
                  const remainderSteps = guidedSteps.filter(s => s.type === 'remainder');
                  const lastRem = remainderSteps.length > 0 ? remainderSteps[remainderSteps.length - 1] : null;
                  const isLastRemainder = lastRem && currentStep.cellKey === lastRem.cellKey;
                  console.log('🔍 [LongDivisionGrid] >>> DROP ON REMAINDER STEP: key =', currentStep.cellKey, 'lastRem?.cellKey =', lastRem?.cellKey, 'isLastRemainder =', isLastRemainder, 'guidedHintTarget =', guidedHintTarget);
                  if (isLastRemainder) {
                    const targetId = (typeof guidedHintTarget === 'string' && guidedHintTarget) ? guidedHintTarget : 'div-instruction';
                    console.log('🔍 [LongDivisionGrid] >>> PUSHING Division complete! now (targetId =', targetId, ')');
                    window.__longDivisionComplete = true;
                    window.__longDivisionGuidedHint = { targetId, text: guidedCompleteHintText };
                    window.dispatchEvent(new CustomEvent('guided-hint-changed', { detail: { targetId } }));
                    setTimeout(() => {
                      window.__longDivisionGuidedHint = { targetId, text: guidedCompleteHintText };
                      window.dispatchEvent(new CustomEvent('guided-hint-changed', { detail: { targetId } }));
                    }, 0);
                  }
                }
              }
            } else {
              // skipEmit: handleGuidedDigitClick emits a richer action.rejected
              // right after applyGuidedDigit returns (see ~line 4452). Keep the
              // minimal sound-manager emit out of this path to avoid double-fire.
              if (typeof window !== 'undefined' && window.playAnswerSound) window.playAnswerSound(false, { skipEmit: true });
              // Incorrect drop - add to cell, show salmon background, wiggle, then clear
              setGuidedValidation(prev => ({ ...prev, [key]: { isCorrect: false } }));
              
              // Add to wiggling cells
              setWigglingCells(prev => new Set(prev).add(key));
              
              // After 1500ms, clear the value and remove from wiggling, then unlock
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
                // Unlock after wiggle animation completes
                unlockInteraction();
              }, 1500);
            }
    }, [getCurrentGuidedStep, guidedComplete, guidedStepIndex, guidedConfig.autoAdvance, guidedConfig.autoFillSubtract, guidedConfig.autoCalculateRemainder, advanceGuidedStep, guidedHintTarget, guidedSteps, guidedValidation, onGuidedComplete, data, showRemainder, guidedCompleteHintText, checkInteractionLocked, lockInteraction, unlockInteraction]);
    
    const handleGuidedDragEnd = React.useCallback((e) => {
      if (!isGuidedDragging || guidedDraggedDigit === null) return;
      const currentStep = currentStepRef.current ?? getCurrentGuidedStep();
      if (!currentStep || guidedComplete) {
        setIsGuidedDragging(false);
        setGuidedDraggedDigit(null);
        setGuidedDragPosition({ x: 0, y: 0 });
        return;
      }
      applyGuidedDigit(guidedDraggedDigit);
      setIsGuidedDragging(false);
      setGuidedDraggedDigit(null);
      setGuidedDragPosition({ x: 0, y: 0 });
    }, [isGuidedDragging, guidedDraggedDigit, getCurrentGuidedStep, guidedComplete, applyGuidedDigit]);
    
    /**
     * AI-facing wrapper around applyGuidedDigit.
     * Validates cellKey matches the current expected step's cellKey, then delegates
     * to applyGuidedDigit. Does NOT change user-facing behavior — only adds a
     * structured return for window.AppAPI consumers.
     *
     * @param {{cellKey: string, value: number, source: string}} args
     * @returns {{accepted: boolean, correct: boolean, expected: number|null, advancedTo: string|null, hint: object|null}}
     */
    const applyDigit = React.useCallback(({ cellKey, value, source } = {}) => {
      // Locate the active guided step.
      const stepBefore = guidedSteps[guidedStepIndex] || null;
      if (!stepBefore || stepBefore.cellKey !== cellKey) {
        // The AI tried to fill a cell that isn't currently the active step.
        // Reject without mutating state — caller (AI surface) can read currentStep
        // from the handle and retry with the right cellKey.
        return {
          accepted: false,
          correct: false,
          expected: stepBefore ? stepBefore.correctValue : null,
          advancedTo: null,
          hint: typeof window !== 'undefined' ? (window.__longDivisionGuidedHint || null) : null
        };
      }
      const expected = stepBefore.correctValue;
      const correct  = (Number(value) === Number(expected));

      // Delegate to existing handler. It owns the React state updates, audio, hint, and advance.
      applyGuidedDigit(value);

      // Compute advancedTo from the steps array (post-call inspection).
      // Note: setGuidedStepIndex is async; we read the step that *would* be next on success.
      let advancedTo = null;
      if (correct) {
        const nextStep = guidedSteps[guidedStepIndex + 1];
        advancedTo = nextStep ? nextStep.type : 'complete';
      }

      return {
        accepted: true,
        correct,
        expected,
        advancedTo,
        hint: typeof window !== 'undefined' ? (window.__longDivisionGuidedHint || null) : null
      };
    }, [applyGuidedDigit, guidedSteps, guidedStepIndex]);

    /**
     * Programmatic bring-down. The user-facing path is an inline onClick on the
     * highlighted dividend digit (which animates the digit to the target cell);
     * the AI surface needs an equivalent programmatic trigger that fills the
     * target cell and advances the guided step. Skips the visual animation —
     * the cell still fills correctly, just without the 610ms travel.
     *
     * @returns {{ ok: boolean, advancedTo: string|null }}
     */
    const bringDownNextDigit = React.useCallback(() => {
      const step = guidedSteps[guidedStepIndex];
      if (!step || step.type !== 'bringDown' || !step.cellKey) {
        return { ok: false, advancedTo: null };
      }
      const targetKey = step.cellKey;
      const value = step.correctValue;
      setGuidedValues(prev => ({ ...prev, [targetKey]: value }));
      setGuidedValidation(prev => ({ ...prev, [targetKey]: { isCorrect: true, correctValue: value, userValue: value } }));
      if (guidedConfig.autoAdvance) {
        setTimeout(advanceGuidedStep, 50);
      }
      const nextStep = guidedSteps[guidedStepIndex + 1];
      return { ok: true, advancedTo: nextStep ? nextStep.type : 'complete' };
    }, [guidedSteps, guidedStepIndex, guidedConfig.autoAdvance, advanceGuidedStep]);

    // Expose AI-facing grid handle. Only when AI scaffolding is active.
    React.useEffect(() => {
      if (typeof window === 'undefined') return;
      if (!window.APP_CONFIG || !window.APP_CONFIG.AI_ENABLED) return;
      if (mode !== 'guided') return;

      window.__longDivisionGridHandle = {
        applyDigit,
        selectStartingDigit: (digitIndex) => handleSelectStartingDigit(digitIndex),
        bringDownNextDigit,
        getGuidedValues:    () => guidedValues,
        getGuidedValidation:() => guidedValidation,
        getGuidedSteps:     () => guidedSteps,
        getGuidedStepIndex: () => guidedStepIndex,
        getProblem:         () => ({ dividend, divisor }),
        getSelectedStartingDigits: () => Array.from(selectedStartingDigits || [])
      };

      return () => {
        if (window.__longDivisionGridHandle &&
            window.__longDivisionGridHandle.applyDigit === applyDigit) {
          delete window.__longDivisionGridHandle;
        }
      };
    }, [applyDigit, handleSelectStartingDigit, bringDownNextDigit, guidedValues, guidedValidation,
        guidedSteps, guidedStepIndex, dividend, divisor, selectedStartingDigits, mode]);

    const handleGuidedDigitClick = React.useCallback((digit) => {
      // Capture step BEFORE applyGuidedDigit can advance it
      const step = getCurrentGuidedStep();
      applyGuidedDigit(digit);

      // Emit a student-sourced event so the postMessage bridge relays it to the parent
      // frame (the demo frontend), which then forwards it to the AI tutor backend.
      // Only source='student' events are relayed — 'ai' events are suppressed by the bridge
      // to avoid feedback loops from mirrored MCP tool calls.
      if (step && !guidedComplete && window.AppAPI && typeof window.AppAPI._emit === 'function') {
        const correct = Number(digit) === Number(step.correctValue);
        window.AppAPI._emit({
          type: correct ? 'action.completed' : 'action.rejected',
          source: 'student',
          payload: {
            name: step.type,
            digit: Number(digit),
            cellKey: step.cellKey,
            validation: {
              correct,
              expected: Number(step.correctValue),
              actual: Number(digit),
            },
          },
        });
      }
    }, [applyGuidedDigit, getCurrentGuidedStep, guidedComplete]);
    
    // Global drag event listeners for guided mode
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
    
    // Guided mode digit panel - always visible when showDigitPanel is true; enabled only when input is required
    const renderGuidedDigitPanel = () => {
      if (mode !== 'guided' || !guidedConfig.showDigitPanel) return null;
      
      const currentStep = getCurrentGuidedStep();
      const bringDownMode = guidedConfig.bringDownMode || 'drag';
      // Panel is enabled (interactive) only when input is required from the panel: quotient, subtract, difference, remainder, or bringDown with drag/both
      const inputRequiredFromPanel = currentStep && !guidedComplete &&
        currentStep.type !== 'selectStartingDigits' &&
        !(currentStep.type === 'bringDown' && bringDownMode === 'click');
      // Panel is disabled during interaction lock to prevent rapid clicks
      const panelEnabled = !!inputRequiredFromPanel && !isInteractionLocked;
      
      const digits = guidedConfig.allowedDigits || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const orientation = guidedConfig.digitPanelOrientation || 'horizontal';
      
      // Base style for digit panel
      const basePanelStyle = {
        padding: '15px',
        background: '#F5F5F5',
        border: '2px solid #FFC107',
        borderRadius: '8px',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        // Explicitly allow interactions even when we visually mark the panel disabled.
        // (Some theme/layout code may set pointer-events: none on ancestors.)
        pointerEvents: 'auto'
      };
      if (!panelEnabled) {
        basePanelStyle.opacity = 0.5;
        basePanelStyle.cursor = 'not-allowed';
        basePanelStyle.pointerEvents = 'auto';
      }
      
      // Apply coordinates if provided: fixed in viewport using same screen/layout coordinate system as the page (convert via gridPositions so coordinates are screen-relative, not container-relative)
      if (guidedConfig.digitPanelCoordinates && Array.isArray(guidedConfig.digitPanelCoordinates) && guidedConfig.digitPanelCoordinates.length >= 4) {
        basePanelStyle.position = 'fixed';
        basePanelStyle.zIndex = 1000;
        basePanelStyle.marginTop = '0';
        if (typeof gridPositions !== 'undefined' && gridPositions.convertToCSS) {
          const panelCss = gridPositions.convertToCSS(guidedConfig.digitPanelCoordinates, 'digit-panel', 'page', 'custom');
          if (panelCss && panelCss.css) {
            basePanelStyle.left = panelCss.css.left;
            basePanelStyle.top = panelCss.css.top;
            basePanelStyle.width = panelCss.css.width;
            basePanelStyle.height = panelCss.css.height;
          } else {
            const [left, top, right, bottom] = guidedConfig.digitPanelCoordinates;
            basePanelStyle.left = `${left}px`;
            basePanelStyle.top = `${top}px`;
            basePanelStyle.width = `${right - left}px`;
            basePanelStyle.height = `${bottom - top}px`;
          }
        } else {
          const [left, top, right, bottom] = guidedConfig.digitPanelCoordinates;
          basePanelStyle.left = `${left}px`;
          basePanelStyle.top = `${top}px`;
          basePanelStyle.width = `${right - left}px`;
          basePanelStyle.height = `${bottom - top}px`;
        }
      } else {
        // Default positioning (relative, below content)
        basePanelStyle.marginTop = '15px';
      }
      
      // Helper function to create digit button (click fills the highlighted cell; no drag)
      const createDigitButton = (digit) => {
        const canInteract = panelEnabled;
        return React.createElement('div', {
          key: `digit-${digit}`,
          className: 'div-digit-button',
          style: {
            width: cellSizePx * 1.2,
            height: cellSizePx * 1.2,
            minWidth: cellSizePx * 1.2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#E3F2FD',
            border: '2px solid #2196F3',
            borderRadius: '8px',
            fontSize: fontSizePx * 1.1,
            fontWeight: 'bold',
            color: '#1976D2',
            cursor: canInteract ? 'pointer' : 'not-allowed',
            userSelect: 'none',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            pointerEvents: 'auto'
          },
          onClick: () => {
            if (canInteract) {
              handleGuidedDigitClick(digit);
              return;
            }

            // Disabled click handling: show wrong-digit feedback for the
            // selectStartingDigits step instead of doing nothing.
            const stepNow = getCurrentGuidedStep();
            if (!stepNow || guidedComplete) return;
            if (stepNow.type !== 'selectStartingDigits') return;

            // Play the same "wrong" sound used for other incorrect guided interactions.
            if (typeof window !== 'undefined' && window.playAnswerSound) window.playAnswerSound(false);

            const msg = selectedStartingDigits.length === 0
              ? "Ini bukan angka pertama. Coba ketuk angka pertama pada bilangan yang dibagi"
              : (() => {
                  const currentStartingValue = selectedStartingDigits.reduce(
                    (acc, idx) => acc * 10 + data.dividendDigits[idx],
                    0
                  );
                  const nextDigitHint = getDivisionText('division.chooseNextDigit', {
                    value: currentStartingValue,
                    divisor
                  });
                  return `That's not the next digit. ${nextDigitHint}`;
                })();

            showSelectDigitError(msg, 4000);
          },
          onMouseEnter: (e) => {
            if (canInteract) {
              e.target.style.background = '#BBDEFB';
              e.target.style.transform = 'scale(1.1)';
            }
          },
          onMouseLeave: (e) => {
            if (canInteract) {
              e.target.style.background = '#E3F2FD';
              e.target.style.transform = 'scale(1)';
            }
          }
        }, digit);
      };
      
      // Orientation-specific layout
      let containerStyle = {};
      let digitElements = [];
      
      if (orientation === 'grid') {
        // Grid layout: 4 rows like keyboard numberpad
        // Row 1: 7, 8, 9
        // Row 2: 4, 5, 6
        // Row 3: 1, 2, 3
        // Row 4: 0 (centered, wider)
        containerStyle = {
          ...basePanelStyle,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        };
        
        const gridRows = [
          [7, 8, 9],
          [4, 5, 6],
          [1, 2, 3],
          [0]
        ];
        
        digitElements = gridRows.map((row, rowIdx) => {
          const rowDigits = row.filter(d => digits.includes(d));
          if (rowDigits.length === 0) return null;
          
          return React.createElement('div', {
            key: `grid-row-${rowIdx}`,
            style: {
              display: 'flex',
              flexDirection: 'row',
              gap: '6px',
              justifyContent: rowIdx === 3 ? 'center' : 'flex-start', // Center the 0 row
              alignItems: 'center'
            }
          }, rowDigits.map(digit => createDigitButton(digit)));
        }).filter(Boolean);
      } else if (orientation === 'vertical') {
        // Vertical layout: all digits in a column
        containerStyle = {
          ...basePanelStyle,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          alignItems: 'center'
        };
        
        digitElements = digits.map(digit => createDigitButton(digit));
      } else {
        // Horizontal layout (default): all digits in a row
        containerStyle = {
          ...basePanelStyle,
          display: 'flex',
          flexDirection: 'row',
          gap: '6px',
          flexWrap: 'nowrap',
          overflowX: 'auto'
        };
        
        digitElements = digits.map(digit => createDigitButton(digit));
      }
      
      return React.createElement('div', {
        key: 'guided-digit-panel',
        className: 'div-guided-digit-panel',
        style: containerStyle
      }, digitElements);
    };
    
    // Guided mode dragged digit overlay
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
          background: '#2196F3',
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
    
    // Render bringDown animation overlay
    const renderBringDownAnimation = () => {
      if (!bringDownAnimation) return null;
      
      return React.createElement('div', {
        key: 'bringdown-animation-overlay',
        style: {
          position: 'fixed',
          left: `${bringDownAnimation.startX - cellSizePx / 2}px`,
          top: `${bringDownAnimation.startY - cellSizePx / 2}px`,
          width: `${cellSizePx}px`,
          height: `${cellSizePx}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#4ECDC4',
          border: '3px solid #26A69A',
          borderRadius: '8px',
          fontSize: fontSizePx,
          fontWeight: 'bold',
          color: 'white',
          zIndex: 10001,
          pointerEvents: 'none',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
          transition: bringDownAnimationActive ? 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          transform: bringDownAnimationActive 
            ? `translate(${bringDownAnimation.endX - bringDownAnimation.startX}px, ${bringDownAnimation.endY - bringDownAnimation.startY}px)`
            : 'translate(0, 0)'
        }
      }, bringDownAnimation.digit);
    };
    
    // Animation controls
    const renderAnimationControls = () => {
      if (mode !== 'animation' || !animationConfig.showControls) return null;
      
      const buttonStyle = {
        padding: '8px 16px',
        background: '#673AB7',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        margin: '0 4px'
      };
      
      return React.createElement('div', {
        key: 'animation-controls',
        className: 'div-animation-controls',
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
          style: { ...buttonStyle, background: '#757575' }
        }, '↺')
      ]);
    };
    
    // Animation info
    const renderAnimationInfo = () => {
      if (mode !== 'animation') return null;
      
      const currentStep = animationSteps[animationStepIndex];
      
      return React.createElement('div', {
        key: 'animation-info',
        className: 'div-animation-info',
        style: {
          padding: '12px 20px',
          background: '#EDE7F6',
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
    
    // DragDrop digit bank
    const renderDragDropDigitBank = () => {
      if (mode !== 'dragDrop' || !dragDropConfig.showDigitBank) return null;
      
      const digits = dragDropConfig.allowedDigits || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      
      return React.createElement('div', {
        key: 'dragdrop-digit-bank',
        className: 'div-dragdrop-digit-bank',
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '15px',
          background: '#F5F5F5',
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
            className: 'div-digit-tile',
            style: {
              width: cellSizePx,
              height: cellSizePx,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#E3F2FD',
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
    
    // Dragged digit overlay
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
          background: '#2196F3',
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
    
    // DragDrop controls
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
            background: '#9C27B0',
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
            background: '#757575',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }
        }, 'Reset')
      ]);
    };
    
    // DragDrop complete message
    const renderDragDropComplete = () => {
      if (mode !== 'dragDrop' || !dragDropComplete) return null;
      
      return React.createElement('div', {
        key: 'dragdrop-complete',
        style: {
          padding: '15px 20px',
          background: '#C8E6C9',
          border: '2px solid #4CAF50',
          borderRadius: '8px',
          marginTop: '15px',
          textAlign: 'center',
          color: '#2E7D32',
          fontWeight: '500'
        }
      }, '🎉 All answers are correct!');
    };
    
    // Practice controls
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
            background: '#2196F3',
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
            background: '#757575',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }
        }, 'Reset')
      ]);
    };
    
    // Practice complete message
    const renderPracticeComplete = () => {
      if (mode !== 'practice' || !practiceComplete) return null;
      
      return React.createElement('div', {
        key: 'practice-complete',
        style: {
          padding: '15px 20px',
          background: '#C8E6C9',
          border: '2px solid #4CAF50',
          borderRadius: '8px',
          marginTop: '15px',
          textAlign: 'center',
          color: '#2E7D32',
          fontWeight: '500'
        }
      }, '🎉 All answers are correct!');
    };
    
    // Guided complete message (do not show green box when instruction text shows completion via guidedHintTarget)
    const renderGuidedComplete = () => {
      if (mode !== 'guided' || !guidedComplete) return null;
      if (typeof guidedHintTarget === 'string' && guidedHintTarget) return null;
      return React.createElement('div', {
        key: 'guided-complete',
        style: {
          padding: '15px 20px',
          background: '#C8E6C9',
          border: '2px solid #4CAF50',
          borderRadius: '8px',
          marginTop: '15px',
          textAlign: 'center',
          color: '#2E7D32',
          fontWeight: '500'
        }
      }, `🎉 Complete! ${currentDividend} ÷ ${currentDivisor} = ${data.finalAnswer}`);
    };
    
    // SpotIncorrect controls
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
            background: '#4CAF50',
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
            background: '#757575',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }
        }, 'Reset')
      ]);
    };
    
    // Final answer display (for default mode)
    const renderFinalAnswer = () => {
      if (mode !== 'default' || !showFinalAnswer) return null;
      
      const isDarkTheme = currentTheme === 'dark-theme';
      
      return React.createElement('div', {
        key: 'final-answer',
        className: isDarkTheme ? 'div-final-answer' : '',
        style: {
          marginTop: stylingDefaults.finalAnswerMarginTop,
          padding: stylingDefaults.finalAnswerPadding,
          background: stylingDefaults.finalAnswerBackground,
          border: stylingDefaults.finalAnswerBorder,
          borderRadius: stylingDefaults.finalAnswerBorderRadius,
          textAlign: 'center',
          fontSize: fontSizePx,
          fontWeight: 'bold',
          color: stylingDefaults.finalAnswerColor,
          fontFamily: isDarkTheme ? "'Nunito', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif" : 'inherit'
        }
      }, `${currentDividend} ÷ ${currentDivisor} = ${data.finalAnswer}`);
    };
    
    // Multiplication table display
    const renderMultiplicationTable = () => {
      if (!showMultiplicationTable) return null;
      
      const isDarkTheme = currentTheme === 'dark-theme';
      const themeStyles = getThemeStyles();
      const useButtonTheme = currentTheme === 'button-theme' && !minimalMode && mode === 'spotIncorrect';
      const currentStep = getCurrentGuidedStep();
      const isGuidedQuotientClickable = mode === 'guided' && currentStep?.type === 'quotient' && !guidedComplete;
      // Table is enabled only when input required for quotient digit; when disabled no row is selected
      // Also disabled when interaction is locked to prevent rapid clicks
      const rowsClickable = isGuidedQuotientClickable && !isInteractionLocked;
      
      // Get colors for divisor, quotient, and dividend
      let divisorColor = useButtonTheme ? 'black' : (themeStyles.divisor?.color || '#FFFFFF');
      let quotientColor = useButtonTheme ? 'black' : (themeStyles.quotient?.color || '#FFFFFF');
      let dividendColor = useButtonTheme ? 'black' : (themeStyles.dividend?.color || '#FFFFFF');
      
      // In dark theme, use the background gradient colors for distinction
      if (currentTheme === 'dark-theme' && !useButtonTheme) {
        divisorColor = '#FFFFFF'; // Divisor stays white
        quotientColor = '#41BDA3'; // Quotient: light teal
        dividendColor = '#8950A3'; // Dividend: purple
      }
      
      // Calculate font size for multiplication table
      let multTableFontSizePx;
      if (multiplicationTableFontSize !== null) {
        multTableFontSizePx = gcToPx(multiplicationTableFontSize, 'fontSize');
      } else {
        multTableFontSizePx = fontSizePx * 0.7; // Default: 70% of main font size
      }
      
      // When coordinates are set, rows divide container height equally
      const useEqualRowHeights = !!(multiplicationTableCoordinates && Array.isArray(multiplicationTableCoordinates) && multiplicationTableCoordinates.length >= 4);
      
      // Alternating background colors
      const bgColors = ['#34382F', '#4B563E'];
      
      // Generate table rows
      const tableRows = [];
      const borderWidthPx = gcToPx('4gc', 'width'); // Convert 4gc to pixels for border
      const clickedBgColor = '#21271C';
      const clickedBorderColor = '#AFEE71';
      
      const incorrectBorderColor = '#F44336';
      for (let i = 1; i <= 10; i++) {
        const answer = currentDivisor * i;
        const bgColor = bgColors[(i - 1) % 2];
        const isSelected = selectedMultTableRow === i && !isGuidedQuotientClickable;
        const feedback = multTableRowFeedback?.row === i ? multTableRowFeedback : null;
        const isCorrectRow = feedback?.correct === true;
        const isIncorrectRow = feedback?.correct === false;
        
        // Build row style
        const rowStyle = {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: useEqualRowHeights ? '0 12px' : '8px 12px',
          background: isSelected ? clickedBgColor : bgColor,
          fontSize: `${multTableFontSizePx}px`,
          fontFamily: isDarkTheme ? "'Nunito', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif" : 'inherit',
          marginBottom: i < 10 ? '0' : '0'
        };
        if (useEqualRowHeights) {
          rowStyle.flex = 1;
          rowStyle.minHeight = 0;
        }
        
        // Border: guided quotient feedback (green correct / red incorrect) or normal selection
        if (isCorrectRow) {
          rowStyle.border = `${borderWidthPx}px solid ${clickedBorderColor}`;
        } else if (isIncorrectRow) {
          rowStyle.border = `${borderWidthPx}px solid ${incorrectBorderColor}`;
          rowStyle.animation = 'wiggle 500ms ease-in-out';
        } else if (isSelected) {
          rowStyle.border = `${borderWidthPx}px solid ${clickedBorderColor}`;
        }
        
        // Add clickable styles if enabled
        if (rowsClickable) {
          rowStyle.cursor = 'pointer';
          rowStyle.transition = 'background-color 0.2s, border 0.2s';
        }
        
        // Create row element with optional onClick handler
        const rowProps = {
          key: `mult-row-${i}`,
          style: rowStyle
        };
        
        if (rowsClickable) {
          rowProps.onClick = () => {
            if (i === currentStep.correctValue || Number(i) === Number(currentStep.correctValue)) {
              if (typeof window !== 'undefined' && window.playAnswerSound) window.playAnswerSound(true);
              setMultTableRowFeedback({ row: i, correct: true });
              applyGuidedQuotientFromMultTableRow(i);
              setTimeout(() => setMultTableRowFeedback(null), 400);
            } else {
              if (typeof window !== 'undefined' && window.playAnswerSound) window.playAnswerSound(false);
              setMultTableRowFeedback({ row: i, correct: false });
              setTimeout(() => setMultTableRowFeedback(null), 500);
            }
          };
          rowProps.onMouseEnter = (e) => {
            if (!isSelected && !feedback) {
              e.currentTarget.style.background = '#5A6B4F';
            }
          };
          rowProps.onMouseLeave = (e) => {
            if (!isSelected && !feedback) {
              e.currentTarget.style.background = bgColor;
            }
          };
        }
        
        tableRows.push(
          React.createElement('div', rowProps, [
            // Divisor in white
            React.createElement('span', {
              key: 'divisor',
              style: { color: divisorColor, fontWeight: 'bold' }
            }, `${currentDivisor}`),
            // "×" in white
            React.createElement('span', {
              key: 'times',
              style: { color: divisorColor, margin: '0 8px' }
            }, '×'),
            // Multiplier (1-10) in quotient color
            React.createElement('span', {
              key: 'multiplier',
              style: { color: quotientColor, fontWeight: 'bold' }
            }, `${i}`),
            // "=" in white
            React.createElement('span', {
              key: 'equals',
              style: { color: divisorColor, margin: '0 8px' }
            }, '='),
            // Answer in dividend color
            React.createElement('span', {
              key: 'answer',
              style: { color: dividendColor, fontWeight: 'bold' }
            }, `${answer}`)
          ])
        );
      }
      
      // Build style object (no border or border radius on multiplication table)
      const tableStyle = {
        overflow: 'hidden',
        width: 'fit-content',
        minWidth: '200px'
      };
      
      // If coordinates are provided: [left, top, right, bottom] — interpreted as screen/page coordinates (convert via gridPositions so coordinates are screen-relative, not container-relative)
      // Table will be rendered via portal to document.body so coordinates are true screen/viewport coordinates
      if (multiplicationTableCoordinates && Array.isArray(multiplicationTableCoordinates) && multiplicationTableCoordinates.length >= 4) {
        tableStyle.position = 'fixed';
        tableStyle.marginTop = '0';
        tableStyle.overflowY = 'auto';
        tableStyle.zIndex = 10000;
        tableStyle.pointerEvents = 'auto';
        tableStyle.display = 'flex';
        tableStyle.flexDirection = 'column';
        if (typeof gridPositions !== 'undefined' && gridPositions.convertToCSS) {
          const tableCss = gridPositions.convertToCSS(multiplicationTableCoordinates, 'multiplication-table', 'page', 'custom');
          if (tableCss && tableCss.css) {
            tableStyle.left = tableCss.css.left;
            tableStyle.top = tableCss.css.top;
            tableStyle.width = tableCss.css.width;
            tableStyle.height = tableCss.css.height;
          } else {
            const [left, top, right, bottom] = multiplicationTableCoordinates;
            tableStyle.left = `${left}px`;
            tableStyle.top = `${top}px`;
            tableStyle.width = `${right - left}px`;
            tableStyle.height = `${bottom - top}px`;
          }
        } else {
          const [left, top, right, bottom] = multiplicationTableCoordinates;
          tableStyle.left = `${left}px`;
          tableStyle.top = `${top}px`;
          tableStyle.width = `${right - left}px`;
          tableStyle.height = `${bottom - top}px`;
        }
      } else {
        tableStyle.marginTop = '20px';
      }
    
      const hasFixedCoordinates = multiplicationTableCoordinates && Array.isArray(multiplicationTableCoordinates) && multiplicationTableCoordinates.length >= 4;
      const showHeader = multiplicationTableHeader && hasFixedCoordinates;
    
      if (showHeader) {
        const headerStyle = {
          flexShrink: 0,
          height: '20%',
          minHeight: '20%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontFamily: isDarkTheme ? "'Nunito', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif" : 'inherit',
          fontSize: multTableFontSizePx ? `${Math.max(14, multTableFontSizePx * 1.2)}px` : '16px',
          fontWeight: 'bold',
          color: isDarkTheme ? 'rgba(255, 255, 255, 0.95)' : '#333',
          padding: '8px'
        };
        const bodyStyle = {
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        };
        return React.createElement('div', {
          key: 'multiplication-table',
          style: tableStyle
        }, [
          React.createElement('div', { key: 'mult-table-header', style: headerStyle }, getDivisionText('division.multiplicationTableFor', { divisor: currentDivisor })),
          React.createElement('div', { key: 'mult-table-body', style: bodyStyle }, tableRows)
        ]);
      }
    
    return React.createElement('div', {
        key: 'multiplication-table',
        style: tableStyle
      }, tableRows);
    };
    
    // Add theme class to container
    const themeClass = currentTheme === 'dark-theme' ? ' dark-theme' : 
                       currentTheme === 'white-theme' ? ' white-theme' : '';
    
    // When multiplicationTableCoordinates is set, render table in portal to document.body for true viewport coordinates
    const ReactDOMGlobal = typeof ReactDOM !== 'undefined' ? ReactDOM : (typeof window !== 'undefined' ? window.ReactDOM : null);
    const multiplicationTableNode = (multiplicationTableCoordinates && multiplicationTableCoordinates.length >= 4 && ReactDOMGlobal && ReactDOMGlobal.createPortal)
      ? ReactDOMGlobal.createPortal(renderMultiplicationTable(), document.body)
      : renderMultiplicationTable();

    // When digitPanelCoordinates is set, render digit panel in portal to document.body so it is fixed and visible
    const digitPanelNode = (guidedConfig.digitPanelCoordinates && Array.isArray(guidedConfig.digitPanelCoordinates) && guidedConfig.digitPanelCoordinates.length >= 4 && ReactDOMGlobal && ReactDOMGlobal.createPortal)
      ? ReactDOMGlobal.createPortal(renderGuidedDigitPanel(), document.body)
      : renderGuidedDigitPanel();

    return React.createElement('div', {
      ...(id ? { id } : {}),
      className: `long-division-grid long-division-grid-${mode}${themeClass}`,
      'data-mode': mode,
      'data-component-type': 'LongDivisionGrid',
      style: containerStyle
    }, [
      mainContent,
      renderFinalAnswer(),
      multiplicationTableNode,
      renderGuidedHint(),
      digitPanelNode,
      renderGuidedDraggedDigitOverlay(),
      renderBringDownAnimation(),
      renderGuidedComplete(),
      renderAnimationInfo(),
      renderAnimationControls(),
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
  
  window.LongDivisionGrid = LongDivisionGrid;
})();

