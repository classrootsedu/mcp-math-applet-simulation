/**
 * Layout Components - React 18 Optimized
 * 
 * This file contains all layout-related components:
 * - Header
 * - Footer
 * - Left Sidebar
 * - Right Sidebar
 * - Main Content
 * - Full Content
 * - Modal Center
 */

// Dependencies: SharedUtilities, GridCellFontUtils should be loaded before this file

/**
 * Logo Component for ProblemSolve Header
 */
const LogoComponent = React.memo((props) => {
  const { headerText = 'ProblemSolve', fontSize } = props;
  
  console.log('🔍 LogoComponent props:', props);
  console.log('🔍 LogoComponent headerText:', headerText);
  console.log('🔍 LogoComponent fontSize:', fontSize);
  
  // fontSize should already be processed by math-applet.js, so use it directly
  const logoTextStyle = fontSize ? { fontSize: fontSize } : {};
  console.log('🔍 LogoComponent logoTextStyle:', logoTextStyle);
  
  return React.createElement('div', {
    className: 'problem-solve-logo'
  }, [
    React.createElement('div', {
      key: 'logo-icon',
      className: 'logo-icon challenge-icon'
    }, [
      React.createElement('span', {
        key: 'challenge-symbol',
        className: 'challenge-symbol'
      }, '🏆')
    ]),
    React.createElement('span', {
      key: 'logo-text',
      className: 'logo-text',
      style: logoTextStyle
    }, headerText)
  ]);
});

/**
 * Question Text Box Component
 */
const QuestionComponent = React.memo((props) => {
  const elementId = React.useId();
  const { 
    position, 
    processedStyles, 
    elementZIndex, 
    text, 
    textSize = '24gc', 
    leftMargin = '16gc', 
    rightMargin = '20gc',
    backgroundColor = 'linear-gradient(135deg, #6B46C1 0%, #A855F7 100%)',
    iconMarginLeft = '20gc',
    border = '2gc solid transparent',
    borderRadius = '0gc',
    textColor = '#ffffff',
    iconSize = '60gc',
    iconLetter = 'Q',
    showIcon = true,
    highlights = []
  } = props;
  
  console.log('🔍 QuestionComponent RENDERED!');
  console.log('🔍 QuestionComponent props:', props);
  console.log('🔍 QuestionComponent position:', position);
  console.log('🔍 QuestionComponent processedStyles:', processedStyles);
  console.log('🔍 QuestionComponent elementZIndex:', elementZIndex);
  console.log('🔍 QuestionComponent text:', text);
  console.log('🔍 QuestionComponent textSize:', textSize);
  console.log('🔍 QuestionComponent leftMargin:', leftMargin);
  console.log('🔍 QuestionComponent rightMargin:', rightMargin);
  
  // Process textSize if it contains gc units
  let processedTextSize = textSize;
  if (textSize && typeof textSize === 'string' && textSize.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedTextSize = window.GridCellFontUtils.processGcProperty(textSize, 'fontSize');
  } else if (textSize && typeof textSize === 'number') {
    // If textSize is a number, convert to pixels
    processedTextSize = `${textSize}px`;
  }

  // Process leftMargin if it contains gc units
  let processedLeftMargin = leftMargin;
  if (leftMargin && leftMargin.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedLeftMargin = window.GridCellFontUtils.processGcProperty(leftMargin, 'marginLeft');
  }

  // Process rightMargin if it contains gc units
  let processedRightMargin = rightMargin;
  if (rightMargin && rightMargin.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedRightMargin = window.GridCellFontUtils.processGcProperty(rightMargin, 'marginRight');
  }

  // Process iconMarginLeft if it contains gc units
  let processedIconMarginLeft = iconMarginLeft;
  if (iconMarginLeft && iconMarginLeft.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedIconMarginLeft = window.GridCellFontUtils.processGcProperty(iconMarginLeft, 'marginLeft');
  }

  // Process iconSize if it contains gc units
  let processedIconSize = iconSize;
  if (iconSize && iconSize.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedIconSize = window.GridCellFontUtils.processGcProperty(iconSize, 'width');
  }

  // Process border property if it contains gc units
  let processedBorder = border;
  if (border && border.includes('gc')) {
    // Split border into parts: "20gc solid gray" -> ["20gc", "solid", "gray"]
    const borderParts = border.split(' ');
    if (borderParts.length >= 3) {
      const width = borderParts[0];
      const style = borderParts[1];
      const color = borderParts.slice(2).join(' '); // Handle multi-word colors like "light gray"
      
      // Process the width part if it contains gc
      if (width.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
        const processedWidth = window.GridCellFontUtils.processGcProperty(width, 'borderWidth');
        processedBorder = `${processedWidth} ${style} ${color}`;
      }
    }
  }

  // Process border radius if it contains gc units
  let processedBorderRadius = borderRadius;
  if (borderRadius && borderRadius.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedBorderRadius = window.GridCellFontUtils.processGcProperty(borderRadius, 'borderRadius');
  }


  // Use the position and processedStyles passed from math-applet.js (matching ProblemSolveHeaderComponent pattern)
  const finalStyles = {
    // Apply grid positioning from the element renderer
    ...(position?.css || {}),
    // Apply processed styles (already processed by math-applet.js with gc units)
    ...(processedStyles || {}),
    // Apply z-index
    zIndex: elementZIndex || 50,
    // Apply background color
    backgroundColor: backgroundColor,
    // Apply processed border
    ...(processedBorder ? { border: processedBorder } : {}),
    // Apply processed border radius
    ...(processedBorderRadius ? { borderRadius: processedBorderRadius } : {}),
    // Ensure proper display
    display: 'flex',
    alignItems: 'center'
  };
  
  // Use processed text size and other styles
  const textStyle = {
    ...(processedTextSize ? { fontSize: processedTextSize } : {}),
    ...(processedLeftMargin ? { marginLeft: processedLeftMargin } : {}),
    ...(processedRightMargin ? { marginRight: processedRightMargin } : {}),
    ...(textColor ? { color: textColor } : {})
  };
  
  // Use processed icon margin
  const iconStyle = {
    ...(processedIconMarginLeft ? { marginLeft: processedIconMarginLeft } : {}),
    ...(processedIconSize ? { 
      width: processedIconSize, 
      height: processedIconSize 
    } : {})
  };

  // Separator line should scale with icon size
  const separatorStyle = {
    ...(processedIconSize ? { 
      height: processedIconSize 
    } : {})
  };

  // Icon letter should use the same font size as the question text
  const iconLetterStyle = {
    ...(processedTextSize ? { fontSize: processedTextSize } : {})
  };
  
  console.log('🔍 QuestionComponent finalStyles:', finalStyles);
  console.log('🔍 QuestionComponent textStyle:', textStyle);
  console.log('🔍 QuestionComponent highlights:', highlights);
  console.log('🔍 QuestionComponent highlights type:', typeof highlights);
  console.log('🔍 QuestionComponent highlights isArray:', Array.isArray(highlights));
  
  // Function to convert LaTeX fractions to HTML fractions
  const convertLatexFractions = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // First, handle fractions within $...$ blocks (may contain multiple fractions or mixed numbers)
    // Match pattern: $...$ and replace all \frac{}{} inside
    let result = text.replace(/\$([^$]+)\$/g, (match, content) => {
      // Replace all \frac{numerator}{denominator} patterns within the $...$ block
      const fractionPattern = /\\frac\{([^}]+)\}\{([^}]+)\}/g;
      const convertedContent = content.replace(fractionPattern, (fracMatch, numerator, denominator) => {
        // Create HTML fraction with proper styling
        return `<span style="display: inline-block; vertical-align: middle; text-align: center; line-height: 1.2;">
          <span style="display: block; border-bottom: 1px solid currentColor; padding: 0 2px;">${numerator}</span>
          <span style="display: block; padding: 0 2px;">${denominator}</span>
        </span>`;
      });
      return convertedContent; // Return without the $ delimiters
    });
    
    // Also handle standalone fractions outside $...$ blocks (backward compatibility)
    const standaloneFractionPattern = /\$\\frac\{([^}]+)\}\{([^}]+)\}\$/g;
    result = result.replace(standaloneFractionPattern, (match, numerator, denominator) => {
      return `<span style="display: inline-block; vertical-align: middle; text-align: center; line-height: 1.2;">
        <span style="display: block; border-bottom: 1px solid currentColor; padding: 0 2px;">${numerator}</span>
        <span style="display: block; padding: 0 2px;">${denominator}</span>
      </span>`;
    });
    
    return result;
  };
  
  // Convert LaTeX fractions in the text before processing
  const textWithFractions = convertLatexFractions(text);
  
  // Function to parse text with highlights
  const parseTextWithHighlights = (text, highlights) => {
    // Ensure highlights is always an array
    const safeHighlights = Array.isArray(highlights) ? highlights : [];
    
    if (!safeHighlights || safeHighlights.length === 0) {
      return [{ type: 'normal', text }];
    }
    
    // Create an array to track all highlight positions
    const highlightPositions = [];
    
    // Find all highlight positions in the original text
    for (const highlight of safeHighlights) {
      const highlightText = highlight.text;
      let searchIndex = 0;
      
      while (true) {
        const index = text.indexOf(highlightText, searchIndex);
        if (index === -1) break;
        
        highlightPositions.push({
          start: index,
          end: index + highlightText.length,
          highlight: highlight,
          text: highlightText
        });
        
        searchIndex = index + 1; // Continue searching from next position
      }
    }
    
    // Sort by start position
    highlightPositions.sort((a, b) => a.start - b.start);
    
    // Remove overlapping highlights (keep the first one found)
    const nonOverlappingHighlights = [];
    let lastEnd = 0;
    
    for (const pos of highlightPositions) {
      if (pos.start >= lastEnd) {
        nonOverlappingHighlights.push(pos);
        lastEnd = pos.end;
      }
    }
    
    // Build the result
    const result = [];
    let currentIndex = 0;
    
    for (const pos of nonOverlappingHighlights) {
      // Add normal text before highlight
      if (pos.start > currentIndex) {
        result.push({
          type: 'normal',
          text: text.substring(currentIndex, pos.start)
        });
      }
      
      // Process highlight fontSize if it contains gc units
      let processedFontSize = pos.highlight.fontSize;
      if (pos.highlight.fontSize && pos.highlight.fontSize.includes('gc')) {
        if (window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
          processedFontSize = window.GridCellFontUtils.processGcProperty(pos.highlight.fontSize, 'fontSize');
        }
      }
      
      // Add highlighted text
      result.push({
        type: 'highlight',
        text: pos.text,
        highlightColor: pos.highlight.highlightColor,
        fontColor: pos.highlight.fontColor,
        fontSize: processedFontSize,
        bold: pos.highlight.bold,
        underline: pos.highlight.underline
      });
      
      currentIndex = pos.end;
    }
    
    // Add remaining normal text
    if (currentIndex < text.length) {
      result.push({
        type: 'normal',
        text: text.substring(currentIndex)
      });
    }
    
    return result.length > 0 ? result : [{ type: 'normal', text }];
  };
  
  // State for dynamic highlights (updated by StageComponent events)
  const [dynamicHighlights, setDynamicHighlights] = React.useState(highlights);
  
  // Sync state with props when props change (e.g., page navigation)
  React.useEffect(() => {
    setDynamicHighlights(highlights);
  }, [highlights]);
  
  // Listen for updateQuestionHighlights events from StageComponent
  React.useEffect(() => {
    const handleUpdateHighlights = (event) => {
      const { highlightsArray } = event.detail || {};
      if (highlightsArray !== undefined) {
        console.log('🔍 [QuestionComponent] Updating highlights from StageComponent:', highlightsArray);
        setDynamicHighlights(highlightsArray);
      }
    };
    
    window.addEventListener('updateQuestionHighlights', handleUpdateHighlights);
    
    return () => {
      window.removeEventListener('updateQuestionHighlights', handleUpdateHighlights);
    };
  }, []);
  
  const parsedText = parseTextWithHighlights(textWithFractions, dynamicHighlights);
  console.log('🔍 QuestionComponent parsedText:', parsedText);
  
  // Determine if icon should be shown
  const shouldShowIcon = showIcon && iconLetter && iconLetter.trim() !== '';
  
  // Create the content array conditionally
  const contentElements = [];
  
  // Add icon and separator only if shouldShowIcon is true
  if (shouldShowIcon) {
    contentElements.push(
      React.createElement('div', {
        key: 'question-icon',
        className: 'question-icon',
        style: iconStyle
      }, [
        React.createElement('span', {
          key: 'question-q',
          className: 'question-q',
          style: iconLetterStyle
        }, iconLetter)
      ]),
      React.createElement('div', {
        key: 'separator-line',
        className: 'separator-line',
        style: separatorStyle
      })
    );
  }
  
  // Always add the text content
  contentElements.push(
    React.createElement('div', {
      key: 'question-text',
      className: 'question-text',
      style: textStyle
    }, Array.isArray(parsedText) ? parsedText.map((part, index) => {
      if (part.type === 'highlight') {
        let highlightStyle = {
          fontSize: part.fontSize,
          fontWeight: part.bold ? 'bold' : 'normal',
          textDecoration: part.underline ? 'underline' : 'none'
        };
        
        // Apply highlight color as background and font color
        if (part.highlightColor) {
          highlightStyle.backgroundColor = part.highlightColor;
          highlightStyle.padding = '2px 4px';
          highlightStyle.borderRadius = '4px';
        }
        
        // Apply font color
        if (part.fontColor) {
          highlightStyle.color = part.fontColor;
        }
        
        return React.createElement('span', {
          key: index,
          style: highlightStyle
        }, part.text);
      } else {
        // Handle HTML content like <br> tags or fraction spans
        if (part.text && (part.text.includes('<br>') || part.text.includes('<span'))) {
          return React.createElement('span', {
            key: index,
            dangerouslySetInnerHTML: { __html: part.text }
          });
        } else {
          return part.text;
        }
      }
    }) : parsedText)
  );
  
  return React.createElement('div', {
    id: elementId,
    className: 'question-text-box',
    style: finalStyles,
    'data-element-type': 'question',
    'data-grid-position': position?.gridPosition
  }, contentElements);
});

/**
 * Page 1 Header - "What is <dividend> ÷ <divisor>?" with colors: "What is " orange, ÷ white, dividend in dividend color, divisor white.
 * Reads dividend/divisor from window.question[currentQuestionIndex]; no props pipeline.
 */
const Page1HeaderComponent = React.memo((props) => {
  const elementId = React.useId();
  const { position, processedStyles, elementZIndex, showSecondLine = true } = props;
  const currentIndex = typeof window !== 'undefined' && window.currentQuestionIndex !== undefined
    ? window.currentQuestionIndex
    : 0;
  const qList = (typeof window !== 'undefined' && window.question) ? window.question : [];
  const q = (qList && qList[currentIndex]) ? qList[currentIndex] : { dividend: 96, divisor: 3 };
  const dividend = q.dividend != null ? q.dividend : 96;
  const divisor = q.divisor != null ? q.divisor : 3;
  let processedFontSize = '40gc';
  if (window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedFontSize = window.GridCellFontUtils.processGcProperty('40gc', 'fontSize');
  }
  const baseSpanStyle = { fontSize: processedFontSize, fontWeight: 'bold' };
  const orange = '#FF9900';
  const dividendColor = '#8950A3';
  const white = '#FFFFFF';
  const headerWhatIs = (typeof window !== 'undefined' && window.i18n && window.i18n.t) ? window.i18n.t('pages.page1.headerWhatIs') : 'What is';
  const headerSolveUsing = (typeof window !== 'undefined' && window.i18n && window.i18n.t) ? window.i18n.t('pages.page1.headerSolveUsing') : 'Solve using Tiered Division…';
  const line1 = [
    React.createElement('span', { key: 'what', style: { ...baseSpanStyle, color: orange } }, headerWhatIs),
    React.createElement('span', { key: 'sp1', style: { ...baseSpanStyle, color: orange } }, '\u00A0'),
    React.createElement('span', { key: 'dividend', style: { ...baseSpanStyle, color: dividendColor } }, String(dividend)),
    React.createElement('span', { key: 'sp2', style: { ...baseSpanStyle, color: white } }, '\u00A0'),
    React.createElement('span', { key: 'divOp', style: { ...baseSpanStyle, color: white } }, '\u00F7'),
    React.createElement('span', { key: 'sp3', style: { ...baseSpanStyle, color: white } }, '\u00A0'),
    React.createElement('span', { key: 'divisor', style: { ...baseSpanStyle, color: white } }, String(divisor)),
    React.createElement('span', { key: 'qmark', style: { ...baseSpanStyle, color: white } }, '?')
  ];
  const line2 = showSecondLine
    ? React.createElement('span', { key: 's2', style: { ...baseSpanStyle, color: orange } }, headerSolveUsing)
    : null;
  const children = [
    React.createElement('div', { key: 'line1', style: { display: 'block', textAlign: 'center' } }, line1),
    line2
  ].filter(Boolean);
  const style = {
    ...(position?.css || {}),
    ...(processedStyles || {}),
    zIndex: elementZIndex || 50,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: white,
    fontSize: processedFontSize,
    fontWeight: 'bold',
    backgroundColor: 'transparent',
    border: 'none',
    padding: 0,
    margin: 0
  };
  return React.createElement('div', {
    id: elementId,
    className: 'page1-header',
    style: style,
    'data-element-type': 'page1-header',
    'data-grid-position': position?.gridPosition
  }, children);
});

/**
 * Static image component - displays an image at given position with optional opacity (e.g. tap.gif hint near a button).
 */
const StaticImageComponent = React.memo((props) => {
  const elementId = React.useId();
  const { position, processedStyles, elementZIndex, src, opacity = 0.45 } = props;
  const positionCss = position?.css || {};
  const style = {
    ...positionCss,
    position: 'absolute',
    zIndex: elementZIndex != null ? elementZIndex : 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none'
  };
  return React.createElement('div', {
    id: props.id || elementId,
    className: 'static-image-component',
    style: style,
    'data-element-type': 'static-image'
  }, React.createElement('img', {
    src: src,
    alt: '',
    style: {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
      opacity: opacity
    }
  }));
});

/**
 * Division Problem Display - shows dividend ÷ divisor as blocks (dynamic from question[currentQuestionIndex])
 */
const DivisionProblemDisplayComponent = React.memo((props) => {
  const elementId = React.useId();
  const {
    position,
    processedStyles,
    elementZIndex,
    dividend: propDividend,
    divisor: propDivisor
  } = props;

  const currentIndex = typeof window !== 'undefined' && window.currentQuestionIndex !== undefined
    ? window.currentQuestionIndex
    : 0;
  const qArray = (typeof window !== 'undefined' && window.question) ? window.question : (typeof question !== 'undefined' ? question : []);
  const q = qArray[currentIndex] || { dividend: 96, divisor: 3 };
  const dividend = propDividend != null ? propDividend : q.dividend;
  const divisor = propDivisor != null ? propDivisor : q.divisor;

  const dividendStr = String(dividend);
  const divisorStr = String(divisor);

  // Use same colors as page 13 long division config: dividendCellColor '#8950A3'
  const dividendDivisorBlockColor = '#8950A3';
  const gc = (value, propertyName) => {
    if (typeof value !== 'string' || !value.endsWith('gc')) return value;
    if (window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
      return window.GridCellFontUtils.processGcProperty(value, propertyName);
    }
    const num = parseInt(value.replace('gc', ''), 10);
    return Number.isNaN(num) ? value : `${num}px`;
  };

  const blockFontSize = '40gc';
  const processedBlockFontSize = gc(blockFontSize, 'fontSize');
  // Block dimensions in gc so they scale with viewport (2x size)
  const blockMinWidth = '96gc';
  const blockHeight = '112gc';
  const blockPaddingH = '24gc';
  const blockMarginH = '8gc';
  const blockBorderRadius = '16gc';
  const blockGap = '16gc';

  const blockBaseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: gc(blockMinWidth, 'width'),
    height: gc(blockHeight, 'height'),
    paddingLeft: gc(blockPaddingH, 'padding'),
    paddingRight: gc(blockPaddingH, 'padding'),
    paddingTop: 0,
    paddingBottom: 0,
    marginLeft: gc(blockMarginH, 'margin'),
    marginRight: gc(blockMarginH, 'margin'),
    marginTop: 0,
    marginBottom: 0,
    borderRadius: gc(blockBorderRadius, 'borderRadius'),
    backgroundColor: dividendDivisorBlockColor,
    background: `linear-gradient(145deg, ${dividendDivisorBlockColor}, ${dividendDivisorBlockColor})`,
    color: '#ffffff',
    fontSize: processedBlockFontSize,
    fontWeight: 'bold',
    boxShadow: '0 6px 12px rgba(0,0,0,0.25)'
  };

  const symbolBlockStyle = {
    ...blockBaseStyle,
    backgroundColor: 'transparent',
    background: 'transparent',
    minWidth: gc(blockMinWidth, 'width'),
    boxShadow: 'none',
    border: 'none',
    filter: 'none'
  };

  const containerStyle = {
    ...(position?.css || {}),
    ...(processedStyles || {}),
    zIndex: elementZIndex || 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    gap: gc(blockGap, 'width')
  };

  const dividendBlocks = dividendStr.split('').map((digit, i) =>
    React.createElement('div', { key: `d-${i}`, style: blockBaseStyle }, digit)
  );
  const divisorBlocks = divisorStr.split('').map((digit, i) =>
    React.createElement('div', { key: `v-${i}`, style: blockBaseStyle }, digit)
  );

  return React.createElement('div', {
    id: elementId,
    className: 'division-problem-display',
    style: containerStyle,
    'data-element-type': 'division-problem-display',
    'data-grid-position': position?.gridPosition
  }, [
    ...dividendBlocks,
    React.createElement('div', { key: 'symbol', style: symbolBlockStyle }, '÷'),
    ...divisorBlocks
  ]);
});

/**
 * Information Analysis Panel Component
 */
const InformationAnalysisComponent = React.memo((props) => {
  const elementId = React.useId();
  const { 
    position, 
    processedStyles, 
    elementZIndex, 
    componentHeader = '24gc',
    sectionHeader = '24gc',
    bodyTextSize = '24gc',
    bulletSize = '8gc',
    factsArray = [
      { text: "Fact 1" },
      { text: "Fact 2" }
    ],
    valueArray = [
      { text: "Value 1" }
    ],
    toFindArray = [
      { text: "To Find 1" }
    ],
    backgroundColor = '#0A0A1A',
    backgroundColorOpacity = 0.5,
    cardBackgroundColor = '#1A1A2E',
    cardBackgroundOpacity = 0.5,
    border,
    borderRadius = '15gc',
    sectionLeftBorderRadius = '10gc',
    padding = '20gc',
    cardPadding = '16gc 20gc',
    cardSpacing = '16gc',
    textColor = '#E0E0E0',
    factsColor = '#FFD700',
    valueColor = '#00FF7F',
    toFindColor = '#8A2BE2',
    accentBarWidth = '4gc',
    sectionMarginBottom = '8gc',
    sectionMarginLeft = '12gc',
    listMarginLeft = '12gc',
    listItemMarginBottom = '4gc',
    bulletMarginRight = '8gc'
  } = props;
  
  // State for dynamic updates
  const [dynamicFactsArray, setDynamicFactsArray] = React.useState(factsArray);
  const [dynamicValueArray, setDynamicValueArray] = React.useState(valueArray);
  const [dynamicToFindArray, setDynamicToFindArray] = React.useState(toFindArray);

  // Sync state with props when props change (e.g., page navigation or language change)
  React.useEffect(() => {
    // Reset state to props when props change
    setDynamicFactsArray(factsArray);
    setDynamicValueArray(valueArray);
    setDynamicToFindArray(toFindArray);
  }, [factsArray, valueArray, toFindArray]);

  // Listen for updateInformationAnalysis events
  React.useEffect(() => {
    const handleUpdateInformationAnalysis = (event) => {
      console.log('🔍 [InformationAnalysis] Received updateInformationAnalysis event:', event.detail);
      const { pageNumber, factsArray: newFactsArray, valueArray: newValueArray, toFindArray: newToFindArray } = event.detail;
      
      // Append new data to existing arrays instead of replacing
      if (newFactsArray && newFactsArray.length > 0) {
        const newFacts = Array.isArray(newFactsArray) && typeof newFactsArray[0] === 'object' 
          ? newFactsArray 
          : newFactsArray.map(fact => ({ text: fact, size: bodyTextSize, color: '#FFD700' }));
        console.log('🔍 [InformationAnalysis] Appending to factsArray:', newFacts);
        setDynamicFactsArray(prevArray => {
          // Filter out null/undefined entries before mapping
          const validPrevArray = prevArray.filter(item => item && (item.text || typeof item === 'string'));
          const existingTexts = validPrevArray.map(item => typeof item === 'string' ? item : item.text);
          const uniqueNewFacts = newFacts.filter(fact => !existingTexts.includes(fact.text));
          const updatedArray = [...validPrevArray, ...uniqueNewFacts];
          console.log('🔍 [InformationAnalysis] Updated factsArray:', updatedArray);
          return updatedArray;
        });
      }
      
      if (newValueArray && newValueArray.length > 0) {
        const newValues = Array.isArray(newValueArray) && typeof newValueArray[0] === 'object'
          ? newValueArray
          : newValueArray.map(value => ({ text: value, size: bodyTextSize, color: '#00FF7F' }));
        console.log('🔍 [InformationAnalysis] Appending to valueArray:', newValues);
        setDynamicValueArray(prevArray => {
          // Filter out null/undefined entries before mapping
          const validPrevArray = prevArray.filter(item => item && (item.text || typeof item === 'string'));
          const existingTexts = validPrevArray.map(item => typeof item === 'string' ? item : item.text);
          const uniqueNewValues = newValues.filter(value => !existingTexts.includes(value.text));
          const updatedArray = [...validPrevArray, ...uniqueNewValues];
          console.log('🔍 [InformationAnalysis] Updated valueArray:', updatedArray);
          return updatedArray;
        });
      }
      
      if (newToFindArray && newToFindArray.length > 0) {
        const newToFind = Array.isArray(newToFindArray) && typeof newToFindArray[0] === 'object'
          ? newToFindArray
          : newToFindArray.map(toFind => ({ text: toFind, size: bodyTextSize, color: '#8A2BE2' }));
        console.log('🔍 [InformationAnalysis] Appending to toFindArray:', newToFind);
        setDynamicToFindArray(prevArray => {
          // Filter out null/undefined entries before mapping
          const validPrevArray = prevArray.filter(item => item && (item.text || typeof item === 'string'));
          const existingTexts = validPrevArray.map(item => typeof item === 'string' ? item : item.text);
          const uniqueNewToFind = newToFind.filter(toFind => !existingTexts.includes(toFind.text));
          const updatedArray = [...validPrevArray, ...uniqueNewToFind];
          console.log('🔍 [InformationAnalysis] Updated toFindArray:', updatedArray);
          return updatedArray;
        });
      }
    };

    window.addEventListener('updateInformationAnalysis', handleUpdateInformationAnalysis);
    
    return () => {
      window.removeEventListener('updateInformationAnalysis', handleUpdateInformationAnalysis);
    };
  }, []);

  // Use dynamic arrays if they have been updated, otherwise use props
  const currentFactsArray = dynamicFactsArray.length > 0 ? dynamicFactsArray : factsArray;
  const currentValueArray = dynamicValueArray.length > 0 ? dynamicValueArray : valueArray;
  const currentToFindArray = dynamicToFindArray.length > 0 ? dynamicToFindArray : toFindArray;
  
  console.log('🔍 InformationAnalysisComponent RENDERED!');
  console.log('🔍 InformationAnalysisComponent props:', props);
  console.log('🔍 InformationAnalysisComponent position:', position);
  console.log('🔍 InformationAnalysisComponent processedStyles:', processedStyles);
  console.log('🔍 InformationAnalysisComponent currentFactsArray:', currentFactsArray);
  console.log('🔍 InformationAnalysisComponent currentValueArray:', currentValueArray);
  console.log('🔍 InformationAnalysisComponent currentToFindArray:', currentToFindArray);
  
  // Helper function to convert hex to rgba with opacity
  const hexToRgba = (hex, opacity) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };
  
  // Process border property if it contains gc units
  let processedBorder = border;
  if (border && border.includes('gc')) {
    const borderParts = border.split(' ');
    if (borderParts.length >= 3) {
      const width = borderParts[0];
      const style = borderParts[1];
      const color = borderParts.slice(2).join(' ');
      
      if (width.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
        const processedWidth = window.GridCellFontUtils.processGcProperty(width, 'borderWidth');
        processedBorder = `${processedWidth} ${style} ${color}`;
      }
    }
  }

  // Process other gc properties
  let processedBorderRadius = borderRadius;
  if (borderRadius && borderRadius.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedBorderRadius = window.GridCellFontUtils.processGcProperty(borderRadius, 'borderRadius');
  }

  let processedPadding = padding;
  if (padding && padding.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedPadding = window.GridCellFontUtils.processGcProperty(padding, 'padding');
  }

  let processedCardPadding = cardPadding;
  if (cardPadding && cardPadding.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedCardPadding = window.GridCellFontUtils.processGcProperty(cardPadding, 'padding');
  }

  let processedCardSpacing = cardSpacing;
  if (cardSpacing && cardSpacing.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedCardSpacing = window.GridCellFontUtils.processGcProperty(cardSpacing, 'marginBottom');
  }

  let processedAccentBarWidth = accentBarWidth;
  if (accentBarWidth && accentBarWidth.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedAccentBarWidth = window.GridCellFontUtils.processGcProperty(accentBarWidth, 'width');
  }

  let processedSectionLeftBorderRadius = sectionLeftBorderRadius;
  if (sectionLeftBorderRadius && sectionLeftBorderRadius.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedSectionLeftBorderRadius = window.GridCellFontUtils.processGcProperty(sectionLeftBorderRadius, 'borderRadius');
  }

  let processedSectionMarginBottom = sectionMarginBottom;
  if (sectionMarginBottom && sectionMarginBottom.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedSectionMarginBottom = window.GridCellFontUtils.processGcProperty(sectionMarginBottom, 'marginBottom');
  }

  let processedSectionMarginLeft = sectionMarginLeft;
  if (sectionMarginLeft && sectionMarginLeft.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedSectionMarginLeft = window.GridCellFontUtils.processGcProperty(sectionMarginLeft, 'marginLeft');
  }

  let processedListMarginLeft = listMarginLeft;
  if (listMarginLeft && listMarginLeft.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedListMarginLeft = window.GridCellFontUtils.processGcProperty(listMarginLeft, 'marginLeft');
  }

  let processedListItemMarginBottom = listItemMarginBottom;
  if (listItemMarginBottom && listItemMarginBottom.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedListItemMarginBottom = window.GridCellFontUtils.processGcProperty(listItemMarginBottom, 'marginBottom');
  }

  let processedBulletMarginRight = bulletMarginRight;
  if (bulletMarginRight && bulletMarginRight.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedBulletMarginRight = window.GridCellFontUtils.processGcProperty(bulletMarginRight, 'marginRight');
  }

  let processedBulletSize = bulletSize;
  if (bulletSize && bulletSize.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedBulletSize = window.GridCellFontUtils.processGcProperty(bulletSize, 'width');
  }

  let processedComponentHeader = componentHeader;
  if (componentHeader && componentHeader.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedComponentHeader = window.GridCellFontUtils.processGcProperty(componentHeader, 'fontSize');
  }

  let processedSectionHeader = sectionHeader;
  if (sectionHeader && sectionHeader.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedSectionHeader = window.GridCellFontUtils.processGcProperty(sectionHeader, 'fontSize');
  }

  let processedBodyTextSize = bodyTextSize;
  if (bodyTextSize && bodyTextSize.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedBodyTextSize = window.GridCellFontUtils.processGcProperty(bodyTextSize, 'fontSize');
  }

  // Use the position and processedStyles passed from math-applet.js
  const finalStyles = {
    ...(position?.css || {}),
    ...(processedStyles || {}),
    zIndex: elementZIndex || 50,
    backgroundColor: hexToRgba(backgroundColor, backgroundColorOpacity),
    ...(processedBorder ? { border: processedBorder } : {}),
    ...(processedBorderRadius ? { borderRadius: processedBorderRadius } : {}),
    ...(processedPadding ? { padding: processedPadding } : {}),
    display: 'flex',
    flexDirection: 'column'
  };

  const headerStyle = {
    ...(processedComponentHeader ? { fontSize: processedComponentHeader } : {}),
    color: textColor,
    marginBottom: processedCardSpacing,
    fontWeight: '600'
  };

  const cardStyle = {
    backgroundColor: hexToRgba(cardBackgroundColor, cardBackgroundOpacity),
    borderRadius: processedBorderRadius,
    ...(processedSectionLeftBorderRadius ? { 
      borderTopLeftRadius: processedSectionLeftBorderRadius,
      borderBottomLeftRadius: processedSectionLeftBorderRadius
    } : {}),
    padding: processedCardPadding,
    marginBottom: processedCardSpacing,
    display: 'flex',
    alignItems: 'flex-start',
    position: 'relative'
  };

  const accentBarStyle = (color) => ({
    width: processedAccentBarWidth,
    backgroundColor: color,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: processedSectionLeftBorderRadius ? 
      `${processedSectionLeftBorderRadius} 0 0 ${processedSectionLeftBorderRadius}` : 
      `${processedBorderRadius} 0 0 ${processedBorderRadius}`
  });

  const sectionHeaderStyle = (color) => ({
    ...(processedSectionHeader ? { fontSize: processedSectionHeader } : {}),
    color: color,
    fontWeight: '600',
    marginBottom: processedSectionMarginBottom || '8px',
    marginLeft: processedAccentBarWidth ? `calc(${processedAccentBarWidth} + ${processedSectionMarginLeft || '12px'})` : (processedSectionMarginLeft || '12px')
  });

  const listStyle = {
    marginLeft: processedAccentBarWidth ? `calc(${processedAccentBarWidth} + ${processedListMarginLeft || '12px'})` : (processedListMarginLeft || '12px'),
    padding: 0,
    listStyle: 'none'
  };

  const listItemStyle = (color) => ({
    ...(processedBodyTextSize ? { fontSize: processedBodyTextSize } : {}),
    color: textColor,
    marginBottom: processedListItemMarginBottom || '4px',
    display: 'flex',
    alignItems: 'center'
  });

  const bulletStyle = (color) => ({
    width: processedBulletSize || '6px',
    height: processedBulletSize || '6px',
    backgroundColor: color,
    borderRadius: '50%',
    marginRight: processedBulletMarginRight || '8px',
    flexShrink: 0
  });

  // Function to convert LaTeX fractions to HTML fractions (same as QuestionComponent)
  const convertLatexFractions = React.useCallback((text) => {
    if (!text || typeof text !== 'string') return text;
    
    // First, handle fractions within $...$ blocks (may contain multiple fractions or mixed numbers)
    // Match pattern: $...$ and replace all \frac{}{} inside
    let result = text.replace(/\$([^$]+)\$/g, (match, content) => {
      // Replace all \frac{numerator}{denominator} patterns within the $...$ block
      const fractionPattern = /\\frac\{([^}]+)\}\{([^}]+)\}/g;
      const convertedContent = content.replace(fractionPattern, (fracMatch, numerator, denominator) => {
        // Create HTML fraction with proper styling
        return `<span style="display: inline-block; vertical-align: middle; text-align: center; line-height: 1.2;">
          <span style="display: block; border-bottom: 1px solid currentColor; padding: 0 2px;">${numerator}</span>
          <span style="display: block; padding: 0 2px;">${denominator}</span>
        </span>`;
      });
      return convertedContent; // Return without the $ delimiters
    });
    
    // Also handle standalone fractions outside $...$ blocks (backward compatibility)
    const standaloneFractionPattern = /\$\\frac\{([^}]+)\}\{([^}]+)\}\$/g;
    result = result.replace(standaloneFractionPattern, (match, numerator, denominator) => {
      return `<span style="display: inline-block; vertical-align: middle; text-align: center; line-height: 1.2;">
        <span style="display: block; border-bottom: 1px solid currentColor; padding: 0 2px;">${numerator}</span>
        <span style="display: block; padding: 0 2px;">${denominator}</span>
      </span>`;
    });
    
    return result;
  }, []);

  const renderCard = (title, items, color) => {
    // Ensure items is an array
    const itemsArray = Array.isArray(items) ? items : [];
    if (!itemsArray || itemsArray.length === 0) return null;
    
    // Filter out null/undefined items and ensure all items have text property
    const validItems = itemsArray.filter(item => item && (item.text || typeof item === 'string'));
    
    if (validItems.length === 0) return null;
    
    return React.createElement('div', {
      key: title,
      style: cardStyle
    }, [
      React.createElement('div', {
        key: 'accent-bar',
        style: accentBarStyle(color)
      }),
      React.createElement('div', {
        key: 'content'
      }, [
        React.createElement('h3', {
          key: 'title',
          style: sectionHeaderStyle(color)
        }, title),
        React.createElement('ul', {
          key: 'list',
          style: listStyle
        }, validItems.map((item, index) => {
          // Handle both object format {text: '...', size: '...', color: '...'} and string format
          const itemText = typeof item === 'string' ? item : (item.text || '');
          const itemColor = typeof item === 'object' ? (item.color || textColor) : textColor;
          const itemSize = typeof item === 'object' && item.size ? item.size : processedBodyTextSize;
          
          // Process gc units for size if needed
          const processedItemSize = itemSize && typeof itemSize === 'string' && itemSize.includes('gc') 
            ? (window.GridCellFontUtils?.processGcProperty ? window.GridCellFontUtils.processGcProperty(itemSize, 'fontSize') : itemSize)
            : itemSize;
          
          // Convert LaTeX fractions to HTML
          const textWithFractions = convertLatexFractions(itemText);
          
          // Check if text contains HTML tags (including converted fraction spans)
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
          
          return React.createElement('li', {
            key: index,
            style: listItemStyle(color)
          }, [
            React.createElement('span', {
              key: 'bullet',
              style: bulletStyle(color)
            }),
            React.createElement('span', {
              key: 'text',
              style: { 
                color: itemColor,
                fontSize: processedItemSize
              }
            }, hasHTML ? 
              React.createElement('span', {
                dangerouslySetInnerHTML: { __html: textWithFractions }
              }) : 
              textWithFractions)
          ]);
        }))
      ])
    ]);
  };

  // Helper function to get i18n text
  const getI18nLabel = (key, fallback) => {
    if (typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function') {
      return window.i18n.t(key, {}) || fallback;
    }
    return fallback;
  };

  // Get i18n labels
  const headerLabel = getI18nLabel('common.informationAnalysis.header', 'INFORMATION ANALYSIS');
  const factsLabel = getI18nLabel('common.informationAnalysis.facts', 'Facts');
  const valueLabel = getI18nLabel('common.informationAnalysis.values', 'Value');
  const toFindLabel = getI18nLabel('common.informationAnalysis.toFind', 'To Find');

  // Create cards array, filtering out null values
  const cards = [
    renderCard(factsLabel, currentFactsArray, factsColor),
    renderCard(valueLabel, currentValueArray, valueColor),
    renderCard(toFindLabel, currentToFindArray, toFindColor)
  ].filter(Boolean);

  return React.createElement('div', {
    id: elementId,
    className: 'information-analysis-panel',
    style: finalStyles,
    'data-element-type': 'information-analysis',
    'data-grid-position': position?.gridPosition
  }, [
    React.createElement('h2', {
      key: 'header',
      style: headerStyle
    }, headerLabel),
    ...cards
  ]);
});

/**
 * Concept Summary Panel Component
 * Exact replica of InformationAnalysisComponent
 */
const ConceptSummaryComponent = React.memo((props) => {
  const elementId = React.useId();
  const { 
    position, 
    processedStyles, 
    elementZIndex, 
    componentHeader = '24gc',
    sectionHeader = '24gc',
    bodyTextSize = '24gc',
    bulletSize = '12gc',
    givenArray = [],
    toFindArray = [],
    factsArray = [],
    valueArray = [],
    backgroundColor = '#0A0A1A',
    backgroundColorOpacity = 0.5,
    cardBackgroundColor = '#1A1A2E',
    cardBackgroundOpacity = 0.5,
    border,
    borderRadius = '15gc',
    sectionLeftBorderRadius = '10gc',
    padding = '20gc',
    cardPadding = '16gc 20gc',
    cardSpacing = '16gc',
    textColor = '#E0E0E0',
    factsColor = '#8A2BE2',
    valueColor = '#00FF7F',
    toFindColor = '#8A2BE2',
    accentBarWidth = '4gc',
    sectionMarginBottom = '8gc',
    sectionMarginLeft = '12gc',
    listMarginLeft = '12gc',
    listItemMarginBottom = '4gc',
    bulletMarginRight = '8gc'
  } = props;
  
  // State for dynamic updates
  const [dynamicGivenArray, setDynamicGivenArray] = React.useState(Array.isArray(givenArray) ? givenArray : []);
  const [dynamicToFindArray, setDynamicToFindArray] = React.useState(Array.isArray(toFindArray) ? toFindArray : []);
  const [dynamicFactsArray, setDynamicFactsArray] = React.useState(Array.isArray(factsArray) ? factsArray : []);
  const [dynamicValueArray, setDynamicValueArray] = React.useState(Array.isArray(valueArray) ? valueArray : []);

  // Listen for updateConceptSummary events
  React.useEffect(() => {
    const handleUpdateConceptSummary = (event) => {
      console.log('🔍 [ConceptSummary] Received updateConceptSummary event:', event.detail);
      const { pageNumber, keyConcepts, impFormulae } = event.detail;
      
      // Append new data to existing arrays instead of replacing
      if (keyConcepts && Array.isArray(keyConcepts) && keyConcepts.length > 0) {
        const newConcepts = keyConcepts.map(concept => ({ text: concept, color: '#FFD700' }));
        console.log('🔍 [ConceptSummary] Appending to factsArray:', newConcepts);
        setDynamicFactsArray(prevArray => {
          // Ensure prevArray is always an array
          const safePrevArray = Array.isArray(prevArray) ? prevArray : [];
          // Check if concept already exists to avoid duplicates
          const existingTexts = safePrevArray.map(item => item.text);
          const uniqueNewConcepts = newConcepts.filter(concept => !existingTexts.includes(concept.text));
          const updatedArray = [...safePrevArray, ...uniqueNewConcepts];
          console.log('🔍 [ConceptSummary] Updated factsArray:', updatedArray);
          return updatedArray;
        });
      }
      
      if (impFormulae && Array.isArray(impFormulae) && impFormulae.length > 0) {
        // Handle both string arrays and object arrays
        const newFormulae = impFormulae.map(formula => {
          if (typeof formula === 'string') {
            return { text: formula, color: '#70ACC7' }; // Default color for backward compatibility
          } else if (formula && typeof formula === 'object' && formula.text) {
            return { text: formula.text, color: formula.color || '#70ACC7' }; // Use provided color or default
          }
          return null;
        }).filter(Boolean);
        console.log('🔍 [ConceptSummary] Appending to valueArray:', newFormulae);
        setDynamicValueArray(prevArray => {
          // Ensure prevArray is always an array
          const safePrevArray = Array.isArray(prevArray) ? prevArray : [];
          // Check if formula already exists to avoid duplicates
          const existingTexts = safePrevArray.map(item => item.text);
          const uniqueNewFormulae = newFormulae.filter(formula => !existingTexts.includes(formula.text));
          const updatedArray = [...safePrevArray, ...uniqueNewFormulae];
          console.log('🔍 [ConceptSummary] Updated valueArray:', updatedArray);
          return updatedArray;
        });
      }
    };

    window.addEventListener('updateConceptSummary', handleUpdateConceptSummary);
    
    return () => {
      window.removeEventListener('updateConceptSummary', handleUpdateConceptSummary);
    };
  }, []);

  // Use dynamic arrays if they have been updated, otherwise use props
  // Ensure all arrays are actually arrays
  const currentGivenArray = Array.isArray(dynamicGivenArray) && dynamicGivenArray.length > 0 ? dynamicGivenArray : (Array.isArray(givenArray) ? givenArray : []);
  const currentToFindArray = Array.isArray(dynamicToFindArray) && dynamicToFindArray.length > 0 ? dynamicToFindArray : (Array.isArray(toFindArray) ? toFindArray : []);
  const currentFactsArray = Array.isArray(dynamicFactsArray) && dynamicFactsArray.length > 0 ? dynamicFactsArray : (Array.isArray(factsArray) ? factsArray : []);
  const currentValueArray = Array.isArray(dynamicValueArray) && dynamicValueArray.length > 0 ? dynamicValueArray : (Array.isArray(valueArray) ? valueArray : []);

  console.log('🔍 ConceptSummaryComponent RENDERED!');
  console.log('🔍 ConceptSummaryComponent props:', props);
  console.log('🔍 ConceptSummaryComponent position:', position);
  console.log('🔍 ConceptSummaryComponent processedStyles:', processedStyles);
  console.log('🔍 ConceptSummaryComponent currentFactsArray:', currentFactsArray);
  console.log('🔍 ConceptSummaryComponent currentValueArray:', currentValueArray);
  console.log('🔍 ConceptSummaryComponent toFindArray:', toFindArray);
  
  // Helper function to convert hex to rgba with opacity
  const hexToRgba = (hex, opacity) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };
  
  // Process border property if it contains gc units
  let processedBorder = border;
  if (border && border.includes('gc')) {
    const borderParts = border.split(' ');
    if (borderParts.length >= 3) {
      const width = borderParts[0];
      const style = borderParts[1];
      const color = borderParts.slice(2).join(' ');
      
      if (width.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
        const processedWidth = window.GridCellFontUtils.processGcProperty(width, 'borderWidth');
        processedBorder = `${processedWidth} ${style} ${color}`;
      }
    }
  }

  // Process other gc properties
  let processedBorderRadius = borderRadius;
  if (borderRadius && borderRadius.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedBorderRadius = window.GridCellFontUtils.processGcProperty(borderRadius, 'borderRadius');
  }

  let processedPadding = padding;
  if (padding && padding.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedPadding = window.GridCellFontUtils.processGcProperty(padding, 'padding');
  }

  let processedCardPadding = cardPadding;
  if (cardPadding && cardPadding.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedCardPadding = window.GridCellFontUtils.processGcProperty(cardPadding, 'padding');
  }

  let processedCardSpacing = cardSpacing;
  if (cardSpacing && cardSpacing.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedCardSpacing = window.GridCellFontUtils.processGcProperty(cardSpacing, 'marginBottom');
  }

  let processedAccentBarWidth = accentBarWidth;
  if (accentBarWidth && accentBarWidth.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedAccentBarWidth = window.GridCellFontUtils.processGcProperty(accentBarWidth, 'width');
  }

  let processedSectionLeftBorderRadius = sectionLeftBorderRadius;
  if (sectionLeftBorderRadius && sectionLeftBorderRadius.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedSectionLeftBorderRadius = window.GridCellFontUtils.processGcProperty(sectionLeftBorderRadius, 'borderRadius');
  }

  let processedSectionMarginBottom = sectionMarginBottom;
  if (sectionMarginBottom && sectionMarginBottom.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedSectionMarginBottom = window.GridCellFontUtils.processGcProperty(sectionMarginBottom, 'marginBottom');
  }

  let processedSectionMarginLeft = sectionMarginLeft;
  if (sectionMarginLeft && sectionMarginLeft.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedSectionMarginLeft = window.GridCellFontUtils.processGcProperty(sectionMarginLeft, 'marginLeft');
  }

  let processedListMarginLeft = listMarginLeft;
  if (listMarginLeft && listMarginLeft.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedListMarginLeft = window.GridCellFontUtils.processGcProperty(listMarginLeft, 'marginLeft');
  }

  let processedListItemMarginBottom = listItemMarginBottom;
  if (listItemMarginBottom && listItemMarginBottom.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedListItemMarginBottom = window.GridCellFontUtils.processGcProperty(listItemMarginBottom, 'marginBottom');
  }

  let processedBulletMarginRight = bulletMarginRight;
  if (bulletMarginRight && bulletMarginRight.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedBulletMarginRight = window.GridCellFontUtils.processGcProperty(bulletMarginRight, 'marginRight');
  }

  let processedBulletSize = bulletSize;
  if (bulletSize && bulletSize.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedBulletSize = window.GridCellFontUtils.processGcProperty(bulletSize, 'width');
  }

  let processedComponentHeader = componentHeader;
  if (componentHeader && componentHeader.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedComponentHeader = window.GridCellFontUtils.processGcProperty(componentHeader, 'fontSize');
  }

  let processedSectionHeader = sectionHeader;
  if (sectionHeader && sectionHeader.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedSectionHeader = window.GridCellFontUtils.processGcProperty(sectionHeader, 'fontSize');
  }

  let processedBodyTextSize = bodyTextSize;
  if (bodyTextSize && bodyTextSize.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedBodyTextSize = window.GridCellFontUtils.processGcProperty(bodyTextSize, 'fontSize');
  }

  // Use the position and processedStyles passed from math-applet.js
  const finalStyles = {
    ...(position?.css || {}),
    zIndex: elementZIndex || 50,
    backgroundColor: hexToRgba(backgroundColor, backgroundColorOpacity),
    ...(processedBorder ? { border: processedBorder } : {}),
    ...(processedBorderRadius ? { borderRadius: processedBorderRadius } : {}),
    ...(processedPadding ? { padding: processedPadding } : {}),
    display: 'flex',
    flexDirection: 'column',
    // Apply processedStyles last to ensure coordinate system takes precedence
    ...(processedStyles || {})
  };

  const headerStyle = {
    ...(processedComponentHeader ? { fontSize: processedComponentHeader } : {}),
    color: textColor,
    marginBottom: processedCardSpacing,
    fontWeight: '600'
  };

  const cardStyle = {
    backgroundColor: hexToRgba(cardBackgroundColor, cardBackgroundOpacity),
    borderRadius: processedBorderRadius,
    ...(processedSectionLeftBorderRadius ? { 
      borderTopLeftRadius: processedSectionLeftBorderRadius,
      borderBottomLeftRadius: processedSectionLeftBorderRadius
    } : {}),
    padding: processedCardPadding,
    marginBottom: processedCardSpacing,
    display: 'flex',
    alignItems: 'flex-start',
    position: 'relative'
  };

  const accentBarStyle = (color) => ({
    width: processedAccentBarWidth,
    backgroundColor: color,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: processedSectionLeftBorderRadius ? 
      `${processedSectionLeftBorderRadius} 0 0 ${processedSectionLeftBorderRadius}` : 
      `${processedBorderRadius} 0 0 ${processedBorderRadius}`
  });

  const sectionHeaderStyle = (color) => ({
    ...(processedSectionHeader ? { fontSize: processedSectionHeader } : {}),
    color: color,
    fontWeight: '600',
    marginBottom: processedSectionMarginBottom || '8px',
    marginLeft: processedAccentBarWidth ? `calc(${processedAccentBarWidth} + ${processedSectionMarginLeft || '12px'})` : (processedSectionMarginLeft || '12px')
  });

  const listStyle = {
    marginLeft: processedAccentBarWidth ? `calc(${processedAccentBarWidth} + ${processedListMarginLeft || '12px'})` : (processedListMarginLeft || '12px'),
    padding: 0,
    listStyle: 'none'
  };

  const listItemStyle = (color) => ({
    ...(processedBodyTextSize ? { fontSize: processedBodyTextSize } : {}),
    color: textColor,
    marginBottom: processedListItemMarginBottom || '4px',
    display: 'flex',
    alignItems: 'center'
  });

  const bulletStyle = (color) => ({
    width: processedBulletSize || '6px',
    height: processedBulletSize || '6px',
    backgroundColor: color,
    borderRadius: '50%',
    marginRight: processedBulletMarginRight || '8px',
    flexShrink: 0
  });

  // Function to convert LaTeX fractions to HTML fractions
  const convertLatexFractions = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // First, handle fractions within $...$ blocks (may contain multiple fractions)
    // Match pattern: $...$ and replace all \frac{}{} inside
    let result = text.replace(/\$([^$]+)\$/g, (match, content) => {
      // Replace all \frac{numerator}{denominator} patterns within the $...$ block
      const fractionPattern = /\\frac\{([^}]+)\}\{([^}]+)\}/g;
      const convertedContent = content.replace(fractionPattern, (fracMatch, numerator, denominator) => {
        // Create HTML fraction with proper styling
        return `<span style="display: inline-block; vertical-align: middle; text-align: center; line-height: 1.2;">
          <span style="display: block; border-bottom: 1px solid currentColor; padding: 0 2px;">${numerator}</span>
          <span style="display: block; padding: 0 2px;">${denominator}</span>
        </span>`;
      });
      return convertedContent; // Return without the $ delimiters
    });
    
    // Also handle standalone fractions outside $...$ blocks (backward compatibility)
    const standaloneFractionPattern = /\$\\frac\{([^}]+)\}\{([^}]+)\}\$/g;
    result = result.replace(standaloneFractionPattern, (match, numerator, denominator) => {
      return `<span style="display: inline-block; vertical-align: middle; text-align: center; line-height: 1.2;">
        <span style="display: block; border-bottom: 1px solid currentColor; padding: 0 2px;">${numerator}</span>
        <span style="display: block; padding: 0 2px;">${denominator}</span>
      </span>`;
    });
    
    return result;
  };

  const renderCard = (title, items, color) => {
    // Ensure items is an array
    const itemsArray = Array.isArray(items) ? items : [];
    if (!itemsArray || itemsArray.length === 0) return null;
    
    return React.createElement('div', {
      key: title,
      style: cardStyle
    }, [
      React.createElement('div', {
        key: 'accent-bar',
        style: accentBarStyle(color)
      }),
      React.createElement('div', {
        key: 'content'
      }, [
        React.createElement('h3', {
          key: 'title',
          style: sectionHeaderStyle(color)
        }, title),
        React.createElement('ul', {
          key: 'list',
          style: listStyle
        }, itemsArray.map((item, index) => {
          // Convert LaTeX fractions in the text
          const convertedText = convertLatexFractions(item.text);
          const containsHTML = typeof convertedText === 'string' && /<[^>]+>/.test(convertedText);
          
          return React.createElement('li', {
            key: index,
            style: listItemStyle(color)
          }, [
            React.createElement('span', {
              key: 'bullet',
              style: bulletStyle(color)
            }),
            React.createElement('span', {
              key: 'text',
              style: { color: item.color || textColor },
              ...(containsHTML ? { dangerouslySetInnerHTML: { __html: convertedText } } : {})
            }, containsHTML ? null : convertedText)
          ]);
        }))
      ])
    ]);
  };

  // Debug logging for arrays
  console.log('🔍 [ConceptSummaryComponent] Array contents:', {
    currentGivenArray,
    currentToFindArray,
    currentFactsArray,
    currentValueArray,
    givenLength: currentGivenArray?.length,
    toFindLength: currentToFindArray?.length,
    factsLength: currentFactsArray?.length,
    valueLength: currentValueArray?.length
  });

  // Get internationalized labels
  const getI18nLabel = (key, fallback) => {
    if (typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function') {
      return window.i18n.t(key, {}) || fallback;
    }
    return fallback;
  };

  const headerLabel = getI18nLabel('common.conceptSummary.header', 'CONCEPT SUMMARY');
  const givenLabel = getI18nLabel('common.conceptSummary.given', 'Given');
  const toFindLabel = getI18nLabel('common.conceptSummary.toFind', 'To Find');
  const keyConceptsLabel = getI18nLabel('common.conceptSummary.keyConcepts', 'Key Concepts');
  const importantFormulaeLabel = getI18nLabel('common.conceptSummary.importantFormulae', 'Important Formulae');

  // Create cards array, filtering out null values
  const cards = [
    renderCard(givenLabel, currentGivenArray, '#70ACC7'),
    renderCard(toFindLabel, currentToFindArray, '#F28283'),
    renderCard(keyConceptsLabel, currentFactsArray, factsColor),
    renderCard(importantFormulaeLabel, currentValueArray, valueColor)
  ].filter(Boolean);

  return React.createElement('div', {
    id: elementId,
    className: 'concept-summary-panel',
    style: finalStyles,
    'data-element-type': 'concept-summary',
    'data-grid-position': position?.gridPosition
  }, [
    React.createElement('h2', {
      key: 'header',
      style: headerStyle
    }, headerLabel),
    ...cards
  ]);
});

/**
 * Teacher Note Text Box Component
 */
const TeacherNoteComponent = React.memo((props) => {
  const elementId = React.useId();
  const { 
    position, 
    processedStyles, 
    elementZIndex, 
    text = 'Introduce the question',
    fontSize = '36gc',
    textColor = '#ffffff',
    backgroundColor = 'transparent',
    border = '2gc solid transparent',
    borderRadius = '0gc',
    padding = '20gc',
    fontStyle = 'normal',
    guidedHintTargetId = null // When set, display guided hint from LongDivisionGrid when targetId matches (from window.__longDivisionGuidedHint)
  } = props;

  const [guidedHintText, setGuidedHintText] = React.useState('');
  React.useEffect(() => {
    if (!guidedHintTargetId) return;
    const handler = () => {
      const hint = window.__longDivisionGuidedHint;
      console.log('🔍 [TeacherNote] guided-hint-changed: window.__longDivisionGuidedHint =', hint, 'guidedHintTargetId =', guidedHintTargetId, 'match =', hint && hint.targetId === guidedHintTargetId);
      if (hint && hint.targetId === guidedHintTargetId) {
        // Only update when we have new text; don't clear to '' when grid sends empty (e.g. step change) so instruction doesn't revert to static text
        if (hint.text != null && hint.text !== '') {
          console.log('🔍 [TeacherNote] Setting guidedHintText to:', hint.text.substring(0, 80) + (hint.text.length > 80 ? '...' : ''));
          setGuidedHintText(hint.text);
        } else {
          console.log('🔍 [TeacherNote] Hint text empty/null, NOT updating guidedHintText (keeping previous)');
        }
      } else if (!hint || hint.targetId === null) {
        console.log('🔍 [TeacherNote] No hint or targetId null, clearing guidedHintText');
        setGuidedHintText('');
      }
    };
    handler();
    window.addEventListener('guided-hint-changed', handler);
    return () => window.removeEventListener('guided-hint-changed', handler);
  }, [guidedHintTargetId]);
  
  console.log('🔍 TeacherNoteComponent RENDERED!');
  console.log('🔍 TeacherNoteComponent props:', props);
  
  // Function to convert LaTeX fractions to HTML fractions
  const convertLatexFractions = React.useCallback((text) => {
    if (!text || typeof text !== 'string') return text;
    
    // First, handle fractions within $...$ blocks (may contain multiple fractions or mixed numbers)
    // Match pattern: $...$ and replace all \frac{}{} inside
    let result = text.replace(/\$([^$]+)\$/g, (match, content) => {
      // Replace all \frac{numerator}{denominator} patterns within the $...$ block
      const fractionPattern = /\\frac\{([^}]+)\}\{([^}]+)\}/g;
      const convertedContent = content.replace(fractionPattern, (fracMatch, numerator, denominator) => {
        // Create HTML fraction with proper styling
        return `<span style="display: inline-block; vertical-align: middle; text-align: center; line-height: 1.2;">
          <span style="display: block; border-bottom: 1px solid currentColor; padding: 0 2px;">${numerator}</span>
          <span style="display: block; padding: 0 2px;">${denominator}</span>
        </span>`;
      });
      return convertedContent; // Return without the $ delimiters
    });
    
    // Also handle standalone fractions outside $...$ blocks (backward compatibility)
    const standaloneFractionPattern = /\$\\frac\{([^}]+)\}\{([^}]+)\}\$/g;
    result = result.replace(standaloneFractionPattern, (match, numerator, denominator) => {
      return `<span style="display: inline-block; vertical-align: middle; text-align: center; line-height: 1.2;">
        <span style="display: block; border-bottom: 1px solid currentColor; padding: 0 2px;">${numerator}</span>
        <span style="display: block; padding: 0 2px;">${denominator}</span>
      </span>`;
    });
    
    return result;
  }, []);
  
  // Convert LaTeX fractions in the text before processing
  const textWithFractions = convertLatexFractions(text);
  // When guidedHintTargetId is set and we have hint text from LongDivisionGrid, show that instead of static text
  const displayText = (guidedHintTargetId && guidedHintText) ? guidedHintText : textWithFractions;
  console.log('🔍 [TeacherNote] INSTRUCTION RENDERED: source =', (guidedHintTargetId && guidedHintText) ? 'guidedHintText (from grid)' : 'static text (props.text)', '| guidedHintText length =', guidedHintText ? guidedHintText.length : 0, '| displayText preview =', typeof displayText === 'string' ? displayText.substring(0, 100) + (displayText.length > 100 ? '...' : '') : displayText);
  
  // Process border property if it contains gc units
  let processedBorder = border;
  if (border && border.includes('gc')) {
    const borderParts = border.split(' ');
    if (borderParts.length >= 3) {
      const width = borderParts[0];
      const style = borderParts[1];
      const color = borderParts.slice(2).join(' ');
      
      if (width.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
        const processedWidth = window.GridCellFontUtils.processGcProperty(width, 'borderWidth');
        processedBorder = `${processedWidth} ${style} ${color}`;
      }
    }
  }

  // Process other gc properties
  let processedBorderRadius = borderRadius;
  if (borderRadius && borderRadius.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedBorderRadius = window.GridCellFontUtils.processGcProperty(borderRadius, 'borderRadius');
  }

  let processedPadding = padding;
  if (padding && padding.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedPadding = window.GridCellFontUtils.processGcProperty(padding, 'padding');
  }

  let processedFontSize = fontSize;
  if (fontSize && fontSize.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedFontSize = window.GridCellFontUtils.processGcProperty(fontSize, 'fontSize');
  }

  // Use the position and processedStyles passed from math-applet.js
  const finalStyles = {
    ...(position?.css || {}),
    ...(processedStyles || {}),
    zIndex: elementZIndex || 50,
    backgroundColor: backgroundColor,
    ...(processedBorder ? { border: processedBorder } : {}),
    ...(processedBorderRadius ? { borderRadius: processedBorderRadius } : {}),
    ...(processedPadding ? { padding: processedPadding } : {}),
    ...(processedFontSize ? { fontSize: processedFontSize } : {}),
    color: textColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
    fontWeight: '500',
    fontStyle: fontStyle
  };

  // Check if display text contains HTML tags
  const containsHTML = displayText && typeof displayText === 'string' && /<[^>]+>/.test(displayText);
  
  return React.createElement('div', {
    id: elementId,
    className: 'teacher-note-text-box',
    style: finalStyles,
    'data-element-type': 'teacher-note',
    'data-grid-position': position?.gridPosition
  }, containsHTML ? 
    React.createElement('span', {
      dangerouslySetInnerHTML: { __html: displayText }
    }) : 
    displayText
  );
});

/**
 * Section Header Component - Generic component for section headers with optional underlines
 */
const SectionHeaderComponent = React.memo((props) => {
  const elementId = React.useId();
  const { 
    position, 
    processedStyles, 
    elementZIndex, 
    text = 'Section Header',
    fontSize = '24gc',
    textColor = '#ffffff',
    backgroundColor = 'transparent',
    underlineColor = '#00FF7F',
    underlineThickness = '3gc',
    padding = '20gc',
    borderRadius = '15gc',
    underlineFirstWord = true,
    fontWeight = 'bold',
    textAlign = 'left'
  } = props;
  
  console.log('🔍 SectionHeaderComponent RENDERED!');
  console.log('🔍 SectionHeaderComponent props:', props);
  
  // Process gc properties
  let processedUnderlineThickness = underlineThickness;
  if (underlineThickness && underlineThickness.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedUnderlineThickness = window.GridCellFontUtils.processGcProperty(underlineThickness, 'borderWidth');
  }

  let processedPadding = padding;
  if (padding && padding.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedPadding = window.GridCellFontUtils.processGcProperty(padding, 'padding');
  }

  let processedBorderRadius = borderRadius;
  if (borderRadius && borderRadius.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedBorderRadius = window.GridCellFontUtils.processGcProperty(borderRadius, 'borderRadius');
  }

  let processedFontSize = fontSize;
  if (fontSize && fontSize.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedFontSize = window.GridCellFontUtils.processGcProperty(fontSize, 'fontSize');
  }

  // Parse text to find the word to underline
  const parseTextWithUnderline = (text, underlineColor, underlineThickness, underlineFirstWord) => {
    if (!underlineFirstWord) {
      return text; // Return plain text if no underline needed
    }
    
    const words = text.split(' ');
    const firstWord = words[0];
    const remainingWords = words.slice(1).join(' ');
    
    return React.createElement('span', {
      style: {
        position: 'relative',
        display: 'inline'
      }
    }, [
      React.createElement('span', {
        key: 'underlined-word',
        style: {
          position: 'relative',
          display: 'inline'
        }
      }, [
        firstWord,
        React.createElement('span', {
          key: 'underline',
          style: {
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: underlineThickness,
            backgroundColor: underlineColor,
            display: 'block'
          }
        })
      ]),
      remainingWords ? ` ${remainingWords}` : ''
    ]);
  };

  // Use the position and processedStyles passed from math-applet.js
  const finalStyles = {
    ...(position?.css || {}),
    zIndex: elementZIndex || 50,
    backgroundColor: backgroundColor,
    ...(processedPadding ? { padding: processedPadding } : {}),
    ...(processedBorderRadius ? { borderRadius: processedBorderRadius } : {}),
    ...(processedFontSize ? { fontSize: processedFontSize } : {}),
    color: textColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
    textAlign: textAlign,
    fontFamily: 'Arial, sans-serif',
    fontWeight: fontWeight,
    boxSizing: 'border-box',
    lineHeight: 'normal',
    // Apply processedStyles last to ensure coordinate system takes precedence
    ...(processedStyles || {})
  };

  return React.createElement('div', {
    id: elementId,
    className: 'section-header',
    style: finalStyles,
    'data-element-type': 'section-header',
    'data-grid-position': position?.gridPosition
  }, parseTextWithUnderline(text, underlineColor, processedUnderlineThickness, underlineFirstWord));
});

/**
 * Tab Navigation Component
 */
const TabNavigationComponent = React.memo((props) => {
  const { activeTab = 'Comprehend', onTabChange, fontSize, marginRight, tabBorderRadius, buttonBorderRadius, buttonPadding } = props;
  const tabs = ['Comprehend', 'Connect', 'Compute', 'Check'];
  
  console.log('🔍 TabNavigationComponent props:', props);
  console.log('🔍 TabNavigationComponent activeTab:', activeTab);
  console.log('🔍 TabNavigationComponent fontSize:', fontSize);
  console.log('🔍 TabNavigationComponent marginRight:', marginRight);
  console.log('🔍 TabNavigationComponent tabBorderRadius:', tabBorderRadius);
  console.log('🔍 TabNavigationComponent buttonBorderRadius:', buttonBorderRadius);
  console.log('🔍 TabNavigationComponent buttonPadding:', buttonPadding);
  
  // fontSize, marginRight, border radius, and padding should already be processed by math-applet.js, so use them directly
  const tabButtonStyle = {
    ...(fontSize ? { fontSize: fontSize } : {}),
    ...(buttonBorderRadius ? { borderRadius: buttonBorderRadius } : {}),
    ...(buttonPadding ? { padding: buttonPadding } : {})
  };
  const tabNavigationStyle = {
    ...(marginRight ? { marginRight: marginRight } : {}),
    ...(tabBorderRadius ? { borderRadius: tabBorderRadius } : {})
  };
  console.log('🔍 TabNavigationComponent tabButtonStyle:', tabButtonStyle);
  console.log('🔍 TabNavigationComponent tabNavigationStyle:', tabNavigationStyle);
  
  return React.createElement('div', {
    className: 'tab-navigation',
    style: tabNavigationStyle
  }, tabs.map(tab => 
    React.createElement('button', {
      key: tab,
      className: `tab-button ${tab === activeTab ? 'active' : ''}`,
      onClick: () => onTabChange && onTabChange(tab),
      type: 'button',
      style: tabButtonStyle
    }, tab)
  ));
});

/**
 * ProblemSolve Header Component
 */
const ProblemSolveHeaderComponent = React.memo((props) => {
  const elementId = React.useId();
  const {
    position,
    processedStyles,
    elementZIndex,
    backgroundColor = 'linear-gradient(135deg, #6B46C1 0%, #A855F7 100%)',
    borderRadius = '0gc',
    tabBorderRadius = '30gc',
    buttonBorderRadius = '30gc',
    fontSize = '24gc',
    headerText = 'ProblemSolve',
     tabMarginRight = '50gc',
     buttonPadding = '8gc 16gc',
     paddingLeft = '50gc',
    activeTab = 'Comprehend',
    onTabChange
  } = props;
  
  // Process gc properties
  let processedTabMarginRight = tabMarginRight;
  if (tabMarginRight && tabMarginRight.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedTabMarginRight = window.GridCellFontUtils.processGcProperty(tabMarginRight, 'marginRight');
  }

  let processedButtonPadding = buttonPadding;
  if (buttonPadding && buttonPadding.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedButtonPadding = window.GridCellFontUtils.processGcProperty(buttonPadding, 'padding');
  }

  let processedPaddingLeft = paddingLeft;
  if (paddingLeft && paddingLeft.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedPaddingLeft = window.GridCellFontUtils.processGcProperty(paddingLeft, 'paddingLeft');
  }

  let processedBorderRadius = borderRadius;
  if (borderRadius && borderRadius.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedBorderRadius = window.GridCellFontUtils.processGcProperty(borderRadius, 'borderRadius');
  }

  let processedTabBorderRadius = tabBorderRadius;
  if (tabBorderRadius && tabBorderRadius.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedTabBorderRadius = window.GridCellFontUtils.processGcProperty(tabBorderRadius, 'borderRadius');
  }

  let processedButtonBorderRadius = buttonBorderRadius;
  if (buttonBorderRadius && buttonBorderRadius.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedButtonBorderRadius = window.GridCellFontUtils.processGcProperty(buttonBorderRadius, 'borderRadius');
  }

  let processedFontSize = fontSize;
  if (fontSize && fontSize.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedFontSize = window.GridCellFontUtils.processGcProperty(fontSize, 'fontSize');
  }

  // Debug logging
  console.log('🔍 ProblemSolveHeaderComponent props:', props);
  console.log('🔍 processedStyles:', processedStyles);
  
  // Use the position and processedStyles passed from math-applet.js (matching textbox pattern)
  const finalStyles = {
    // Apply grid positioning from the element renderer
    ...(position?.css || {}),
    // Apply processed styles (already processed by math-applet.js with gc units)
    ...(processedStyles || {}),
    // Apply z-index
    zIndex: elementZIndex || 402,
    // Apply background
    background: backgroundColor,
    // Apply border radius
    ...(processedBorderRadius ? { borderRadius: processedBorderRadius } : {}),
    // Apply left padding if specified
    ...(processedPaddingLeft ? { paddingLeft: processedPaddingLeft } : {}),
    // Ensure proper display and alignment
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };
  
  console.log('🔍 ProblemSolveHeaderComponent finalStyles:', finalStyles);
  
  return React.createElement('div', {
    id: elementId,
    className: 'header-container problem-solve-header',
    style: finalStyles,
    'data-element-type': 'header',
    'data-grid-position': position?.gridPosition
  }, [
    React.createElement(LogoComponent, { 
      key: 'logo',
      headerText: headerText,
      fontSize: processedFontSize
    }),
              React.createElement(TabNavigationComponent, {
                key: 'tabs',
                activeTab,
                onTabChange,
                fontSize: processedFontSize,
                marginRight: processedTabMarginRight,
                tabBorderRadius: processedTabBorderRadius,
              buttonBorderRadius: processedButtonBorderRadius,
              buttonPadding: processedButtonPadding
            })
  ]);
});

/**
 * Quiz Panel Component
 */
const QuizPanelComponent = React.memo((props) => {
  const elementId = React.useId();
  const { 
    position, 
    processedStyles, 
    elementZIndex, 
    backgroundColor = '#0A0A1A',
    backgroundColorOpacity = 0.5, // Opacity for background color (0-1)
    border = '3gc solid transparent',
    borderRadius = '15gc',
    padding = '15gc',
    quizType = 'MCQ', // Valid types: MCQ, FIB, MAT, SEQ
    quizSubtype = null, // Valid for MCQ: QT2, QT3, QT4, QTI2, QTI3, QTI4, QT2R, QT3R, QT4R, QTI2R, QTI3R, QTI4R, QTIS2, QTIS3, QTIS4, QTIS2R, QTIS3R, QTIS4R; null for others
    questionText = '',
    questionTextFontSize = '24gc',
    questionTextColor = '#ffffff',
    feedbackState: initialFeedbackState = 'default', // Valid states: default, normal, correct, incorrect
    feedbackText: initialFeedbackText = '',
    contentColor = '#E0E0E0',
    contentFontSize = '24gc',
    optionButtonTextSize = '24gc', // Font size for option button text (in gc units)
    optionButtonWidth = null, // Override button width percentage (e.g., 80, 90). If null, uses config default
    optionButtonHeight = null, // Override button height percentage (e.g., 85, 95). If null, uses config default
    // Options row props (for MCQ)
    options = [], // Array of {text, image, iscorrect, feedback}
    image = '', // Image path for QTI subtypes
    imageText = '', // Text below image for QTI subtypes
    imageStack = [], // Array of image layer objects for QTIS subtypes (see ImageStackComponent)
    imageStackLayerReplacements = [], // Array of {layerId: number, src: string} to replace specific layers dynamically
    imageStackCoordinates = null, // Optional custom coordinates for image stack [x1, y1, x2, y2]
    keyConcepts = [], // Array of key concepts
    impFormulae = [], // Array of important formulae
    quizId = '', // Unique identifier for this quiz instance
    // Header row props
    headerText = '', // Text for the header row (like comprehend-text-box)
    headerFontSize = '24gc',
    headerTextColor = '#ffffff',
    headerBackgroundColor = 'transparent',
    headerBorder = 'none',
    headerBorderRadius = '0gc',
    headerPadding = '20gc',
    headerUnderlineColor = '#00A0A0',
    headerUnderlineThickness = '2gc'
  } = props;
  
  // Debug logging for component props
  console.log('🔍 [DEBUG] QuizPanelComponent props:', {
    quizId,
    keyConcepts,
    impFormulae,
    options: options?.length || 0
  });
  
  // State management for option selection
  const [clickedOptions, setClickedOptions] = React.useState(new Set()); // Track all clicked options
  const [currentFeedbackState, setCurrentFeedbackState] = React.useState(initialFeedbackState);
  const [currentFeedbackText, setCurrentFeedbackText] = React.useState(initialFeedbackText);
  // State for dynamic image stack layer replacements
  const [dynamicImageStackLayerReplacements, setDynamicImageStackLayerReplacements] = React.useState(imageStackLayerReplacements || []);
  
  // Initialize global state store if it doesn't exist
  if (typeof window !== 'undefined' && !window.quizPanelStateStore) {
    window.quizPanelStateStore = {};
  }
  
  // Use a unique key based on quizId or component ID
  const stateKey = quizId || props.id || `quiz-${elementId}`;
  
  // Restore or initialize state when quizId changes (page navigation)
  React.useEffect(() => {
    const savedState = window.quizPanelStateStore?.[stateKey];
    
    if (savedState) {
      // Restore saved state
      console.log('🔄 QuizPanelComponent quizId changed to:', quizId, '- Restoring saved state');
      setClickedOptions(new Set(savedState.clickedOptions || []));
      setCurrentFeedbackState(savedState.feedbackState !== undefined ? savedState.feedbackState : initialFeedbackState);
      setCurrentFeedbackText(savedState.feedbackText !== undefined ? savedState.feedbackText : initialFeedbackText);
    } else {
      // Initialize fresh state
      console.log('🔄 QuizPanelComponent quizId changed to:', quizId, '- Initializing fresh state');
      setClickedOptions(new Set());
      setCurrentFeedbackState(initialFeedbackState);
      setCurrentFeedbackText(initialFeedbackText);
    }
  }, [quizId, initialFeedbackState, initialFeedbackText, stateKey]);
  
  // Save state whenever it changes
  React.useEffect(() => {
    if (!window.quizPanelStateStore) {
      window.quizPanelStateStore = {};
    }
    
    window.quizPanelStateStore[stateKey] = {
      clickedOptions: Array.from(clickedOptions),
      feedbackState: currentFeedbackState,
      feedbackText: currentFeedbackText
    };
    
    console.log('💾 [QuizPanel] Saved state for', stateKey);
  }, [stateKey, clickedOptions, currentFeedbackState, currentFeedbackText]);
  
  // Count total correct answers
  const totalCorrectAnswers = React.useMemo(() => {
    return options.filter(opt => opt.iscorrect === true).length;
  }, [options]);
  
  // Count correct answers that have been clicked
  const correctAnswersClicked = React.useMemo(() => {
    let count = 0;
    clickedOptions.forEach(index => {
      if (options[index]?.iscorrect === true) {
        count++;
      }
    });
    return count;
  }, [clickedOptions, options]);
  
  // Check if all correct answers have been found
  const allCorrectAnswersFound = totalCorrectAnswers > 0 && correctAnswersClicked === totalCorrectAnswers;
  
  // Determine row heights based on quiz subtype if not explicitly provided
  let headerRowHeight, questionRowHeight, optionsRowHeight, feedbackRowHeight;
  
  // Check if custom heights were provided
  const hasCustomHeights = props.headerRowHeight !== undefined && 
                          props.questionRowHeight !== undefined && 
                          props.optionsRowHeight !== undefined && 
                          props.feedbackRowHeight !== undefined;
  
  if (hasCustomHeights) {
    // Use provided custom heights
    headerRowHeight = props.headerRowHeight;
    questionRowHeight = props.questionRowHeight;
    optionsRowHeight = props.optionsRowHeight;
    feedbackRowHeight = props.feedbackRowHeight;
  } else {
    // Get heights from constants configuration
    const heightsConfig = window.QUIZ_ROW_HEIGHTS || {};
    let heights;
    
    // Try to get heights based on quiz type and subtype
    if (quizType === 'MCQ' && quizSubtype && heightsConfig.MCQ && heightsConfig.MCQ[quizSubtype]) {
      heights = heightsConfig.MCQ[quizSubtype];
    } else if (quizType && heightsConfig[quizType]) {
      heights = heightsConfig[quizType];
    } else {
      // Fallback to DEFAULT
      heights = heightsConfig.DEFAULT || { header: 10, question: 15, options: 70, feedback: 15 };
    }
    
    headerRowHeight = heights.header;
    questionRowHeight = heights.question;
    optionsRowHeight = heights.options;
    feedbackRowHeight = heights.feedback;
  }
  
  console.log('🔍 QuizPanelComponent RENDERED!');
  console.log('🔍 QuizPanelComponent props:', props);
  console.log('🔍 QuizPanelComponent quizType:', quizType);
  console.log('🔍 QuizPanelComponent quizSubtype:', quizSubtype);
  console.log('🔍 QuizPanelComponent row heights:', { headerRowHeight, questionRowHeight, optionsRowHeight, feedbackRowHeight });
  console.log('🔍 QuizPanelComponent options:', options);
  console.log('🔍 QuizPanelComponent image:', image);
  console.log('🔍 QuizPanelComponent imageText:', imageText);
  console.log('🔍 QuizPanelComponent keyConcepts:', keyConcepts);
  console.log('🔍 QuizPanelComponent totalCorrectAnswers:', totalCorrectAnswers);
  console.log('🔍 QuizPanelComponent correctAnswersClicked:', correctAnswersClicked);
  console.log('🔍 QuizPanelComponent allCorrectAnswersFound:', allCorrectAnswersFound);
  console.log('🔍 QuizPanelComponent clickedOptions:', Array.from(clickedOptions));
  
  // Validate quiz type
  const validQuizTypes = ['MCQ', 'FIB', 'MAT', 'SEQ'];
  const validMCQSubtypes = ['QT2', 'QT3', 'QT4', 'QTI2', 'QTI3', 'QTI4', 'QT2R', 'QT3R', 'QT4R', 'QTI2R', 'QTI3R', 'QTI4R', 'QTIS2', 'QTIS3', 'QTIS4', 'QTIS2R', 'QTIS3R', 'QTIS4R'];
  
  if (!validQuizTypes.includes(quizType)) {
    console.warn(`⚠️ Invalid quizType: ${quizType}. Valid types are: ${validQuizTypes.join(', ')}`);
  }
  
  if (quizType === 'MCQ' && quizSubtype && !validMCQSubtypes.includes(quizSubtype)) {
    console.warn(`⚠️ Invalid quizSubtype for MCQ: ${quizSubtype}. Valid subtypes are: ${validMCQSubtypes.join(', ')}`);
  }
  
  if (quizType !== 'MCQ' && quizSubtype !== null) {
    console.warn(`⚠️ quizSubtype should be null for quiz type: ${quizType}`);
  }
  
  // Validate row heights - if any are provided (non-default), all must be provided
  const hasCustomHeaderHeight = props.headerRowHeight !== undefined;
  const hasCustomQuestionHeight = props.questionRowHeight !== undefined;
  const hasCustomOptionsHeight = props.optionsRowHeight !== undefined;
  const hasCustomFeedbackHeight = props.feedbackRowHeight !== undefined;
  const hasAnyCustomHeight = hasCustomHeaderHeight || hasCustomQuestionHeight || hasCustomOptionsHeight || hasCustomFeedbackHeight;
  const hasAllCustomHeights = hasCustomHeaderHeight && hasCustomQuestionHeight && hasCustomOptionsHeight && hasCustomFeedbackHeight;
  
  if (hasAnyCustomHeight && !hasAllCustomHeights) {
    console.warn('⚠️ If any row height is provided, ALL FOUR row heights must be provided (headerRowHeight, questionRowHeight, optionsRowHeight, feedbackRowHeight)');
  }
  
  // Validate that heights sum to 100 if all are provided
  if (hasAllCustomHeights) {
    const totalHeight = headerRowHeight + questionRowHeight + optionsRowHeight + feedbackRowHeight;
    if (totalHeight !== 100) {
      console.warn(`⚠️ Row heights should sum to 100%. Current sum: ${totalHeight}% (Header: ${headerRowHeight}%, Question: ${questionRowHeight}%, Options: ${optionsRowHeight}%, Feedback: ${feedbackRowHeight}%)`);
    }
  }
  
  // Process border property if it contains gc units
  let processedBorder = border;
  if (border && border.includes('gc')) {
    const borderParts = border.split(' ');
    if (borderParts.length >= 3) {
      const width = borderParts[0];
      const style = borderParts[1];
      const color = borderParts.slice(2).join(' ');
      
      if (width.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
        const processedWidth = window.GridCellFontUtils.processGcProperty(width, 'borderWidth');
        processedBorder = `${processedWidth} ${style} ${color}`;
      }
    }
  }

  // Process other gc properties
  let processedBorderRadius = borderRadius;
  if (borderRadius && borderRadius.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedBorderRadius = window.GridCellFontUtils.processGcProperty(borderRadius, 'borderRadius');
  }

  let processedPadding = padding;
  if (padding && padding.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedPadding = window.GridCellFontUtils.processGcProperty(padding, 'padding');
  }

  let processedContentFontSize = contentFontSize;
  if (contentFontSize && contentFontSize.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedContentFontSize = window.GridCellFontUtils.processGcProperty(contentFontSize, 'fontSize');
  }

  let processedOptionButtonTextSize = optionButtonTextSize;
  if (optionButtonTextSize && optionButtonTextSize.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedOptionButtonTextSize = window.GridCellFontUtils.processGcProperty(optionButtonTextSize, 'fontSize');
  }

  // Process header row properties
  let processedHeaderFontSize = headerFontSize;
  if (headerFontSize && headerFontSize.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedHeaderFontSize = window.GridCellFontUtils.processGcProperty(headerFontSize, 'fontSize');
  }

  let processedHeaderBorder = headerBorder;
  if (headerBorder && headerBorder.includes('gc')) {
    const borderParts = headerBorder.split(' ');
    if (borderParts.length >= 3) {
      const width = borderParts[0];
      const style = borderParts[1];
      const color = borderParts.slice(2).join(' ');
      
      if (width.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
        const processedWidth = window.GridCellFontUtils.processGcProperty(width, 'borderWidth');
        processedHeaderBorder = `${processedWidth} ${style} ${color}`;
      }
    }
  }

  let processedHeaderBorderRadius = headerBorderRadius;
  if (headerBorderRadius && headerBorderRadius.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedHeaderBorderRadius = window.GridCellFontUtils.processGcProperty(headerBorderRadius, 'borderRadius');
  }

  let processedHeaderPadding = headerPadding;
  if (headerPadding && headerPadding.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedHeaderPadding = window.GridCellFontUtils.processGcProperty(headerPadding, 'padding');
  }

  let processedHeaderUnderlineThickness = headerUnderlineThickness;
  if (headerUnderlineThickness && headerUnderlineThickness.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedHeaderUnderlineThickness = window.GridCellFontUtils.processGcProperty(headerUnderlineThickness, 'borderWidth');
  }

  let processedQuestionTextFontSize = questionTextFontSize;
  if (questionTextFontSize && questionTextFontSize.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedQuestionTextFontSize = window.GridCellFontUtils.processGcProperty(questionTextFontSize, 'fontSize');
  }

  // Convert backgroundColor to rgba with opacity
  const getBackgroundColorWithOpacity = (color, opacity) => {
    // If already rgba or transparent, return as-is
    if (color.startsWith('rgba') || color === 'transparent') {
      return color;
    }
    
    // If rgb format, convert to rgba
    if (color.startsWith('rgb(')) {
      return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
    }
    
    // Convert hex to rgba
    let hex = color.replace('#', '');
    
    // Handle shorthand hex (e.g., #fff)
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const finalBackgroundColor = getBackgroundColorWithOpacity(backgroundColor, backgroundColorOpacity);

  // Use the position and processedStyles passed from math-applet.js
  const finalStyles = {
    ...(position?.css || {}),
    ...(processedStyles || {}),
    zIndex: elementZIndex || 50,
    backgroundColor: finalBackgroundColor,
    ...(processedBorder ? { border: processedBorder } : {}),
    ...(processedBorderRadius ? { borderRadius: processedBorderRadius } : {}),
    ...(processedPadding ? { padding: processedPadding } : {}),
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box'
  };

  // Row 0: Header Row (configurable height)
  const headerRowStyle = {
    flex: `0 0 ${headerRowHeight}%`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    fontSize: processedHeaderFontSize,
    color: headerTextColor,
    backgroundColor: headerBackgroundColor,
    border: processedHeaderBorder,
    borderRadius: processedHeaderBorderRadius,
    padding: processedHeaderPadding,
    fontWeight: 'bold',
    boxSizing: 'border-box',
    minHeight: 0,
    position: 'relative'
  };

  // Row 1: Question Row (configurable height)
  const questionRowStyle = {
    flex: `0 0 ${questionRowHeight}%`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: processedQuestionTextFontSize,
    color: questionTextColor,
    fontWeight: 'bold',
    boxSizing: 'border-box',
    minHeight: 0
  };

  // Get options configuration from constants
  const optionsConfig = (window.QUIZ_OPTIONS_CONFIG && window.QUIZ_OPTIONS_CONFIG[quizSubtype]) || null;
  
  // Get CSS color variables
  const getColorVariable = (varName) => {
    if (typeof window !== 'undefined' && window.getComputedStyle) {
      const root = document.documentElement;
      return window.getComputedStyle(root).getPropertyValue(varName).trim();
    }
    return null;
  };
  
  // Function to update concept summary panel with quiz data
  const updateConceptSummaryPanel = React.useCallback(() => {
    console.log('🔍 [DEBUG] updateConceptSummaryPanel called');
    console.log('🔍 [DEBUG] quizId:', quizId);
    console.log('🔍 [DEBUG] keyConcepts:', keyConcepts);
    console.log('🔍 [DEBUG] impFormulae:', impFormulae);
    console.log('🔍 [DEBUG] keyConcepts type:', typeof keyConcepts, 'isArray:', Array.isArray(keyConcepts));
    console.log('🔍 [DEBUG] impFormulae type:', typeof impFormulae, 'isArray:', Array.isArray(impFormulae));
    
    // Extract page number from quizId (e.g., "page5-quiz" -> "5")
    const pageMatch = quizId.match(/page(\d+)-/);
    if (!pageMatch) {
      console.log('❌ [DEBUG] Could not extract page number from quizId:', quizId);
      return;
    }
    
    const pageNumber = pageMatch[1];
    const conceptSummaryId = `page${pageNumber}-concept-summary-panel`;
    
    console.log('🔍 [DEBUG] Extracted page number:', pageNumber);
    console.log('🔍 [DEBUG] Looking for concept summary panel with ID:', conceptSummaryId);
    console.log('🔍 [DEBUG] Current page (from window):', typeof window !== 'undefined' ? window.currentPage : 'undefined');
    console.log('🔍 [DEBUG] Current page (from URL):', window.location ? window.location.href : 'no location');
    
    // Add a small delay to ensure DOM element is available
    setTimeout(() => {
      // Find the concept summary panel element by ID first
      let conceptSummaryElement = document.getElementById(conceptSummaryId);
      
      // If not found by ID, try to find by class name (React auto-generated IDs)
      if (!conceptSummaryElement) {
        console.log('❌ [DEBUG] Concept summary panel not found with ID:', conceptSummaryId);
        console.log('🔍 [DEBUG] Trying to find by class name...');
        
        // Look for element with concept-summary-panel class
        const conceptElements = document.querySelectorAll('.concept-summary-panel');
        console.log('🔍 [DEBUG] Elements with concept-summary-panel class:', conceptElements.length);
        
        if (conceptElements.length > 0) {
          conceptSummaryElement = conceptElements[0]; // Take the first one
          console.log('✅ [DEBUG] Found concept summary element by class:', conceptSummaryElement);
          console.log('🔍 [DEBUG] Element ID:', conceptSummaryElement.id);
          console.log('🔍 [DEBUG] Element classes:', conceptSummaryElement.className);
        } else {
          console.log('❌ [DEBUG] No elements with concept-summary-panel class found');
          console.log('🔍 [DEBUG] Available elements with "concept" in ID:');
          const allElements = document.querySelectorAll('[id*="concept"]');
          allElements.forEach(el => console.log('  -', el.id));
          console.log('🔍 [DEBUG] All elements with "page5" in ID:');
          const page5Elements = document.querySelectorAll('[id*="page5"]');
          page5Elements.forEach(el => console.log('  -', el.id));
          console.log('🔍 [DEBUG] All elements in the document:');
          const allDocElements = document.querySelectorAll('[id]');
          console.log('🔍 [DEBUG] Total elements with IDs:', allDocElements.length);
          allDocElements.forEach(el => {
            console.log('  -', el.id, '|', el.tagName, '|', el.className);
          });
          
          // Check if we're actually on the right page by looking at visible elements
          console.log('🔍 [DEBUG] Checking page context...');
          const quizElements = document.querySelectorAll('[id*="quiz"]');
          console.log('🔍 [DEBUG] Quiz elements found:', quizElements.length);
          quizElements.forEach(el => console.log('  - Quiz element:', el.id));
          
          const pageElements = document.querySelectorAll('[id*="page"]');
          console.log('🔍 [DEBUG] Page elements found:', pageElements.length);
          pageElements.forEach(el => console.log('  - Page element:', el.id));
          return;
        }
      }
      
      console.log('✅ [DEBUG] Found concept summary element:', conceptSummaryElement);
      console.log('🔍 [DEBUG] Element classes:', conceptSummaryElement.className);
      console.log('🔍 [DEBUG] Element innerHTML length:', conceptSummaryElement.innerHTML.length);
      
      // Get the ConceptSummaryComponent instance
      const conceptSummaryComponent = conceptSummaryElement._reactInternalFiber || 
                                     conceptSummaryElement._reactInternalInstance;
      
      console.log('🔍 [DEBUG] React component instance:', conceptSummaryComponent);
      
      if (conceptSummaryComponent) {
        console.log('🔍 [DEBUG] Current component props:', conceptSummaryComponent.props);
        
        // Update the component's props
        const newProps = {
          ...conceptSummaryComponent.props,
          factsArray: keyConcepts.map(concept => ({ text: concept, color: '#FFD700' })),
          valueArray: impFormulae.map(formula => ({ text: formula, color: '#70ACC7' }))
        };
        
        console.log('🔍 [DEBUG] New props to apply:', newProps);
        console.log('🔍 [DEBUG] Mapped keyConcepts:', keyConcepts.map(concept => ({ text: concept, color: '#FFD700' })));
        console.log('🔍 [DEBUG] Mapped impFormulae:', impFormulae.map(formula => ({ text: formula, color: '#70ACC7' })));
        
        // Force re-render by updating the component
        if (conceptSummaryComponent.forceUpdate) {
          console.log('🔍 [DEBUG] Calling forceUpdate on component');
          conceptSummaryComponent.forceUpdate();
        } else {
          console.log('❌ [DEBUG] forceUpdate method not available');
        }
      } else {
        console.log('❌ [DEBUG] No React component instance found');
      }
      
      // Alternative approach: Dispatch a custom event to update the concept summary
      // Ensure impFormulae is always an array
      const safeImpFormulae = Array.isArray(impFormulae) ? impFormulae : (impFormulae ? [impFormulae] : []);
      const updateEvent = new CustomEvent('updateConceptSummary', {
        detail: {
          pageNumber: pageNumber,
          keyConcepts: Array.isArray(keyConcepts) ? keyConcepts : (keyConcepts ? [keyConcepts] : []),
          impFormulae: safeImpFormulae
        }
      });
      
      console.log('🔍 [DEBUG] Dispatching updateConceptSummary event with detail:', updateEvent.detail);
      window.dispatchEvent(updateEvent);
      console.log('✅ [DEBUG] Dispatched updateConceptSummary event');
    }, 100); // 100ms delay to ensure DOM is ready
    
  }, [quizId, keyConcepts, impFormulae]);

  // Handler for option button click
  const handleOptionClick = React.useCallback((optionIndex, optionData) => {
    // Prevent clicking if this option was already clicked
    if (clickedOptions.has(optionIndex)) {
      console.log('Option already clicked, ignoring');
      return;
    }
    
    // Prevent clicking if all correct answers have been found
    if (allCorrectAnswersFound) {
      console.log('All correct answers found, ignoring click');
      return;
    }
    
    console.log(`Option ${optionIndex + 1} clicked`);
    console.log('Option data:', optionData);
    console.log('Total correct answers:', totalCorrectAnswers);
    console.log('Correct answers clicked before this:', correctAnswersClicked);
    
    // Add this option to clicked set
    const newClickedOptions = new Set(clickedOptions);
    newClickedOptions.add(optionIndex);
    setClickedOptions(newClickedOptions);
    
    // Check if option has imageStackLayerReplacement defined
    if (optionData.imageStackLayerReplacement) {
      const replacement = optionData.imageStackLayerReplacement;
      setDynamicImageStackLayerReplacements(prev => {
        // Check if replacement for this layer already exists
        const existingIndex = prev.findIndex(r => r.layerId === replacement.layerId);
        if (existingIndex >= 0) {
          // Update existing replacement
          const updated = [...prev];
          updated[existingIndex] = replacement;
          return updated;
        } else {
          // Add new replacement
          return [...prev, replacement];
        }
      });
    }
    
    // Play sound effect based on answer correctness
    if (typeof window !== 'undefined' && window.playAnswerSound) {
      window.playAnswerSound(optionData.iscorrect);
    }
    
    // Update feedback based on whether answer is correct
    if (optionData.iscorrect) {
      setCurrentFeedbackState('correct');
      setCurrentFeedbackText(optionData.feedback || 'Correct!');
      
      // Dispatch event to update calculation steps for page 9
      if (quizId === 'page9-quiz') {
        const updateStepEvent = new CustomEvent('updateCalculationStep', {
          detail: {
            stepIndex: 0,
            newText: '<span style="display: inline-block; vertical-align: middle;">Ratio of the distance traveled<br>by adult Komodo to baby Komodo</span> <span style="display: inline-block; vertical-align: middle; margin-left: 10px;">= $\\frac{11200}{2000}$= $\\frac{112}{20}$</span>'
          }
        });
        window.dispatchEvent(updateStepEvent);
        console.log('🔍 [QuizPanel] Dispatched updateCalculationStep event for page 9');
      }
      
      // Update information analysis panel if option has facts, values, or toFindArray data
      if (optionData.facts || optionData.values || optionData.toFindArray) {
        const updateDetail = {};
        
        if (optionData.facts && optionData.facts.length > 0) {
          updateDetail.factsArray = optionData.facts;
          console.log('🔍 [QuizPanel] Updating InformationAnalysisComponent with factsArray:', optionData.facts);
        }
        
        if (optionData.values && optionData.values.length > 0) {
          updateDetail.valueArray = optionData.values;
          console.log('🔍 [QuizPanel] Updating InformationAnalysisComponent with valueArray:', optionData.values);
        }
        
        if (optionData.toFindArray && optionData.toFindArray.length > 0) {
          updateDetail.toFindArray = optionData.toFindArray;
          console.log('🔍 [QuizPanel] Updating InformationAnalysisComponent with toFindArray:', optionData.toFindArray);
        }
        
        if (Object.keys(updateDetail).length > 0) {
          const updateInfoAnalysisEvent = new CustomEvent('updateInformationAnalysis', {
            detail: updateDetail
          });
          window.dispatchEvent(updateInfoAnalysisEvent);
        }
      }
      
      // Check if this was the last correct answer
      const newCorrectCount = correctAnswersClicked + 1;
      console.log('New correct count:', newCorrectCount);
      
      if (newCorrectCount === totalCorrectAnswers) {
        console.log('🎉 [DEBUG] All correct answers found!');
        console.log('🔍 [DEBUG] newCorrectCount:', newCorrectCount);
        console.log('🔍 [DEBUG] totalCorrectAnswers:', totalCorrectAnswers);
        console.log('🔍 [DEBUG] About to call updateConceptSummaryPanel');
        // Update concept summary panel with quiz data
        updateConceptSummaryPanel();
        console.log('🔍 [DEBUG] updateConceptSummaryPanel call completed');
        
        // Dispatch event to enable next button
        const enableNextEvent = new CustomEvent('quizCompleted', {
          detail: {
            quizId: quizId,
            pageNumber: window.getCurrentPage?.() || null
          }
        });
        window.dispatchEvent(enableNextEvent);
        console.log('🔍 [DEBUG] Dispatched quizCompleted event for quizId:', quizId);
      }
    } else {
      setCurrentFeedbackState('incorrect');
      setCurrentFeedbackText(optionData.feedback || 'Incorrect. Try again!');
    }
  }, [clickedOptions, allCorrectAnswersFound, totalCorrectAnswers, correctAnswersClicked]);
  
  // Function to convert LaTeX fractions to HTML fractions
  const convertLatexFractions = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // First, handle fractions within $...$ blocks (may contain multiple fractions)
    // Match pattern: $...$ and replace all \frac{}{} inside
    let result = text.replace(/\$([^$]+)\$/g, (match, content) => {
      // Replace all \frac{numerator}{denominator} patterns within the $...$ block
      const fractionPattern = /\\frac\{([^}]+)\}\{([^}]+)\}/g;
      let convertedContent = content.replace(fractionPattern, (fracMatch, numerator, denominator) => {
        // Create HTML fraction with proper styling
        return `<span style="display: inline-block; vertical-align: middle; text-align: center; line-height: 1.2;">
          <span style="display: block; border-bottom: 1px solid currentColor; padding: 0 2px;">${numerator}</span>
          <span style="display: block; padding: 0 2px;">${denominator}</span>
        </span>`;
      });
      
      // Replace LaTeX commands with their symbols
      convertedContent = convertedContent.replace(/\\times/g, '×');
      convertedContent = convertedContent.replace(/\\cdot/g, '·');
      
      return convertedContent; // Return without the $ delimiters
    });
    
    // Also handle standalone fractions outside $...$ blocks (backward compatibility)
    const standaloneFractionPattern = /\$\\frac\{([^}]+)\}\{([^}]+)\}\$/g;
    result = result.replace(standaloneFractionPattern, (match, numerator, denominator) => {
      return `<span style="display: inline-block; vertical-align: middle; text-align: center; line-height: 1.2;">
        <span style="display: block; border-bottom: 1px solid currentColor; padding: 0 2px;">${numerator}</span>
        <span style="display: block; padding: 0 2px;">${denominator}</span>
      </span>`;
    });
    
    return result;
  };

  // Function to create option button with 3-layered structure (matching next button style)
  const createOptionButton = (optionIndex, optionData, buttonHeight, buttonWidth) => {
    console.log(`🔍 createOptionButton - optionIndex: ${optionIndex}, optionData:`, optionData);
    
    // For row layouts (QT4R, QTI4R), each button takes full width and divided height
    // For column layouts (QT2, QT4, QTI2, QTI4), buttons are divided by number of options
    const isRowLayout = optionsConfig?.layoutType === 'rows';
    const containerWidth = isRowLayout ? '100%' : `${100 / (optionsConfig?.numberOfOptions || 1)}%`;
    const containerHeight = isRowLayout ? `${100 / (optionsConfig?.numberOfOptions || 1)}%` : '100%';
    
    const buttonContainerStyle = {
      width: containerWidth,
      height: containerHeight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box'
    };
    
    // Determine button background color based on whether it was clicked
    let buttonBackgroundColor = '#1A1A2E'; // Default dark blue-gray
    let buttonCursor = 'pointer';
    let buttonOpacity = 1;
    const isThisButtonClicked = clickedOptions.has(optionIndex);
    
    // Check if we should show initial colors (orange for incorrect, green for correct)
    // This is used when options should be color-coded from the start
    const showInitialColors = props.showInitialButtonColors === true;
    
    if (isThisButtonClicked) {
      // This button was clicked - show color based on correctness
      if (optionData.iscorrect) {
        // Correct answer - use green
        const greenColor = getColorVariable('--color-green');
        buttonBackgroundColor = greenColor || '#4CAF50'; // Fallback to standard green
      } else {
        // Incorrect answer - use salmon/orange
        const salmonColor = getColorVariable('--color-salmon');
        buttonBackgroundColor = salmonColor || '#FA8072'; // Fallback to standard salmon
      }
      buttonCursor = 'not-allowed';
      buttonOpacity = 1; // Keep full opacity for clicked buttons
    } else if (showInitialColors) {
      // Show initial colors based on correctness (before clicking)
      if (optionData.iscorrect) {
        // Correct answer - use green
        const greenColor = getColorVariable('--color-green');
        buttonBackgroundColor = greenColor || '#4CAF50'; // Fallback to standard green
      } else {
        // Incorrect answer - use orange
        const orangeColor = getColorVariable('--color-orange');
        buttonBackgroundColor = orangeColor || '#FFA500'; // Fallback to standard orange
      }
    } else if (allCorrectAnswersFound) {
      // All correct answers found - disable remaining unclicked buttons
      buttonCursor = 'not-allowed';
      buttonOpacity = 0.5;
    }
    
    // Layer 1: Button container (outer) - This has the background color
    const buttonWrapperStyle = {
      width: `${buttonWidth}%`,
      height: `${buttonHeight}%`,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: buttonBackgroundColor,
      borderRadius: '50gc', // Match next button borderRadius
      cursor: buttonCursor,
      opacity: buttonOpacity,
      boxSizing: 'border-box'
      // Note: transition is handled by CSS, not inline styles
    };
    
    // Convert borderRadius from gc to px if needed
    let processedBorderRadius = buttonWrapperStyle.borderRadius;
    if (typeof window.GridCellFontUtils !== 'undefined' && window.GridCellFontUtils.convertGcToPx) {
      processedBorderRadius = window.GridCellFontUtils.convertGcToPx(buttonWrapperStyle.borderRadius);
    }
    buttonWrapperStyle.borderRadius = processedBorderRadius;
    
    // Layer 2: Frame layer (middle) - Gradient overlay for 3D effect
    const frameGapPx = '5px'; // Same as next button
    const buttonFrameStyle = {
      position: 'absolute',
      top: frameGapPx,
      left: frameGapPx,
      right: frameGapPx,
      bottom: frameGapPx,
      borderRadius: 'inherit',
      pointerEvents: 'none',
      zIndex: 1,
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(0, 0, 0, 0.1) 100%)',
      boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.3), inset 0 -1px 3px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1)'
    };
    
    // Layer 3: Content layer (inner) - Text content
    const buttonContentStyle = {
      position: 'relative',
      zIndex: 2,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: processedContentFontSize,
      fontWeight: 'bold',
      textAlign: 'center',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      padding: '8%',
      boxSizing: 'border-box',
      overflow: 'hidden'
    };
    
    // Determine button content
    const buttonContent = [];
    const hasImage = optionData?.image && optionData.image !== '';
    const hasText = optionData?.text && optionData.text !== '';
    const hasTable = optionData?.table && optionData.table !== '';
    
    console.log(`🔍 createOptionButton ${optionIndex} - optionData.image:`, optionData?.image);
    console.log(`🔍 createOptionButton ${optionIndex} - optionData.text:`, optionData?.text);
    console.log(`🔍 createOptionButton ${optionIndex} - optionData.table:`, optionData?.table);
    console.log(`🔍 createOptionButton ${optionIndex} - hasImage:`, hasImage, 'hasText:', hasText, 'hasTable:', hasTable);
    
    // Add option table if provided (as 3x2 grid layout)
    if (hasTable) {
      console.log(`🔍 createOptionButton ${optionIndex} - Adding table grid`);
      const tableData = optionData.tableData || {};
      
      // Create 3x2 grid layout
      const gridCells = [];
      for (let row = 1; row <= 3; row++) {
        for (let col = 1; col <= 2; col++) {
          const cellKey = `row${row}col${col}`;
          const cellValue = tableData[cellKey] || '';
          const isHeader = row === 1;
          
          gridCells.push(
            React.createElement('div', {
              key: cellKey,
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #fff',
                backgroundColor: 'transparent',
                color: '#fff',
                fontSize: isHeader ? '20gc' : '18gc',
                fontWeight: isHeader ? 'bold' : 'normal',
                textAlign: 'center',
                padding: '4px',
                boxSizing: 'border-box',
                overflow: 'hidden',
                wordBreak: 'break-word'
              }
            }, cellValue)
          );
        }
      }
      
      buttonContent.push(
        React.createElement('div', {
          key: 'option-table-grid',
          style: {
            width: '100%',
            height: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr 1fr',
            gap: '0',
            marginBottom: hasText ? '5px' : '0',
            flexShrink: 0,
            overflow: 'hidden'
          }
        }, gridCells)
      );
    }
    
    // Add option image if provided
    if (hasImage) {
      console.log(`🔍 createOptionButton ${optionIndex} - Adding image`);
      buttonContent.push(
        React.createElement('img', {
          key: 'option-image',
          src: optionData.image,
          alt: optionData.text || `Option ${optionIndex + 1}`,
          style: {
            maxWidth: '85%',
            maxHeight: (hasText || hasTable) ? '60%' : '75%', // More space if image-only, less if both
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            marginBottom: (hasText || hasTable) ? '5px' : '0',
            display: 'block',
            flexShrink: 0
          }
        })
      );
    }
    
    // Add option text if provided
    if (hasText) {
      console.log(`🔍 createOptionButton ${optionIndex} - Adding text:`, optionData.text);
      // Convert LaTeX fractions to HTML
      const convertedText = convertLatexFractions(optionData.text);
      // Check if text contains HTML (fractions or other HTML tags)
      const containsHTML = convertedText !== optionData.text || /<[^>]+>/.test(convertedText);
      
      buttonContent.push(
        React.createElement('span', {
          key: 'option-text',
          style: {
            display: 'block',
            width: '100%',
            textAlign: 'center',
            lineHeight: '1.3',
            flexShrink: 0,
            wordBreak: 'break-word',
            overflow: 'hidden',
            fontSize: processedOptionButtonTextSize,
            fontWeight: 'normal'
          },
          ...(containsHTML ? { dangerouslySetInnerHTML: { __html: convertedText } } : {})
        }, containsHTML ? null : convertedText)
      );
    }
    
    // If neither image, text, nor table, show fallback
    if (!hasImage && !hasText && !hasTable) {
      console.log(`🔍 createOptionButton ${optionIndex} - Using fallback text`);
      buttonContent.push(
        React.createElement('span', {
          key: 'option-text',
          style: {
            display: 'block',
            width: '100%',
            textAlign: 'center',
            lineHeight: '1.3',
            fontSize: processedOptionButtonTextSize,
            fontWeight: 'normal'
          }
        }, `Option ${optionIndex + 1}`)
      );
    }
    
    console.log(`🔍 createOptionButton ${optionIndex} - buttonContent length:`, buttonContent.length);
    
    return React.createElement('div', {
      key: `option-${optionIndex}`,
      style: buttonContainerStyle
    }, 
      React.createElement('div', {
        key: 'wrapper',
        className: 'applet-button-container option-button-container',
        style: buttonWrapperStyle,
        'data-option-index': optionIndex,
        'data-is-correct': optionData?.iscorrect || false,
        'data-selected': isThisButtonClicked,
        'data-all-correct-found': allCorrectAnswersFound,
        onClick: () => handleOptionClick(optionIndex, optionData)
      }, [
        // Frame layer
        React.createElement('div', {
          key: 'frame',
          className: 'applet-button-frame option-button-frame',
          style: buttonFrameStyle
        }),
        // Content layer
        React.createElement('div', {
          key: 'content',
          className: 'applet-button-content option-button-content',
          style: buttonContentStyle
        }, buttonContent)
      ])
    );
  };
  
  // Function to render options row content based on subtype
  const renderOptionsContent = () => {
    console.log('🔍 renderOptionsContent - options array:', options);
    console.log('🔍 renderOptionsContent - options.length:', options?.length);
    
    if (!optionsConfig) {
      // Default content if no config
      return props.content || '';
    }
    
    const { numberOfOptions, hasImage, imageColumnWidth, optionsColumnWidth, buttonHeightPercent: configButtonHeightPercent, buttonWidthPercent: configButtonWidthPercent, layoutType } = optionsConfig;
    // Use prop overrides if provided, otherwise use config values
    const buttonWidthPercent = optionButtonWidth !== null ? optionButtonWidth : configButtonWidthPercent;
    const buttonHeightPercent = optionButtonHeight !== null ? optionButtonHeight : configButtonHeightPercent;
    console.log('🔍 renderOptionsContent - numberOfOptions from config:', numberOfOptions);
    console.log('🔍 renderOptionsContent - layoutType:', layoutType);
    console.log('🔍 renderOptionsContent - buttonWidthPercent:', buttonWidthPercent, '(from prop:', optionButtonWidth, 'config:', configButtonWidthPercent, ')');
    console.log('🔍 renderOptionsContent - buttonHeightPercent:', buttonHeightPercent, '(from prop:', optionButtonHeight, 'config:', configButtonHeightPercent, ')');
    
    // Check if this is an image stack variant
    const hasImageStack = optionsConfig.hasImageStack || false;
    
    if (hasImage || hasImageStack) {
      // Layout with image/image-stack column and options column (QTI2/QTI4/QTIS2/QTIS4)
      
      // Render image column content
      const imageColumnContent = [];
      
      if (hasImageStack && imageStack && imageStack.length > 0) {
        // Use ImageStackComponent for QTIS variants
        const ImageStackComponent = window.ImageStackComponent?.ImageStackComponent;
        
        if (ImageStackComponent) {
          // Apply layer replacements if provided (use dynamic state if available, otherwise use prop)
          let processedImageStack = [...imageStack];
          const replacementsToUse = dynamicImageStackLayerReplacements.length > 0 
            ? dynamicImageStackLayerReplacements 
            : (imageStackLayerReplacements || []);
          if (replacementsToUse && replacementsToUse.length > 0) {
            replacementsToUse.forEach(replacement => {
              const { layerId, src } = replacement;
              if (processedImageStack[layerId]) {
                processedImageStack[layerId] = {
                  ...processedImageStack[layerId],
                  src: src
                };
              }
            });
          }
          
          // Calculate coordinates for image stack (fill the image column area)
          const stackCoordinates = imageStackCoordinates || [0, 0, 100, 100];
          
          // Create a key that changes when replacements change to force re-render
          const imageStackKey = `question-image-stack-${JSON.stringify(replacementsToUse)}`;
          
          imageColumnContent.push(
            React.createElement(ImageStackComponent, {
              key: imageStackKey,
              id: `${quizId}-image-stack`,
              elementName: `${quizId}-image-stack`,
              currentPage: 1,
              coordinates: stackCoordinates,
              zIndex: elementZIndex + 1,
              images: processedImageStack
            })
          );
        } else {
          console.warn('⚠️ ImageStackComponent not available. Cannot render QTIS variant.');
          imageColumnContent.push('Image Stack not available');
        }
      } else if (hasImage && image) {
        // Use standard image for QTI variants
        imageColumnContent.push(
          React.createElement('img', {
            key: 'question-image',
            src: image,
            alt: imageText || '',
            style: {
              maxWidth: '90%',
              maxHeight: imageText ? '80%' : '90%',
              objectFit: 'contain',
              display: 'block'
            }
          })
        );
      }
      
      if (imageText && !hasImageStack) {
        imageColumnContent.push(
          React.createElement('div', {
            key: 'image-text',
            style: {
              marginTop: '10px',
              fontSize: '0.9em',
              textAlign: 'center',
              color: contentColor
            }
          }, imageText)
        );
      }
      
      // If no image or imageText provided, show empty content
      if (imageColumnContent.length === 0) {
        imageColumnContent.push('');
      }
      
      return [
        // Image column
        React.createElement('div', {
          key: 'image-column',
          className: 'quiz-image-column',
          style: {
            width: `${imageColumnWidth}%`,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            padding: '10px'
          }
        }, imageColumnContent),
        
        // Options column
        React.createElement('div', {
          key: 'options-column',
          className: 'quiz-options-column',
          style: {
            width: `${optionsColumnWidth}%`,
            height: '100%',
            display: 'flex',
            flexDirection: layoutType === 'rows' ? 'column' : 'row',
            boxSizing: 'border-box'
          }
        }, Array.from({ length: numberOfOptions }, (_, i) => {
          const optionData = options[i] || {};
          return createOptionButton(i, optionData, buttonHeightPercent, buttonWidthPercent);
        }))
      ];
    } else {
      // Layout with only options columns (QT2/QT4/QT4R)
      if (layoutType === 'rows') {
        // Row-based layout for QT4R
        return React.createElement('div', {
          key: 'options-container',
          className: 'quiz-options-container',
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box'
          }
        }, Array.from({ length: numberOfOptions }, (_, i) => {
          const optionData = options[i] || {};
          return createOptionButton(i, optionData, buttonHeightPercent, buttonWidthPercent);
        }));
      } else {
        // Column-based layout for QT2/QT4
        return Array.from({ length: numberOfOptions }, (_, i) => {
          const optionData = options[i] || {};
          return createOptionButton(i, optionData, buttonHeightPercent, buttonWidthPercent);
        });
      }
    }
  };

  // Row 2: Options Row (configurable height)
  const optionsRowStyle = {
    flex: `0 0 ${optionsRowHeight}%`,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: processedContentFontSize,
    color: contentColor,
    boxSizing: 'border-box',
    minHeight: 0
  };

  // Row 3: Feedback Row (configurable height)
  // Get feedback styles based on state
  const getFeedbackStyles = (state) => {
    const baseStyle = {
      flex: `0 0 ${feedbackRowHeight}%`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: processedContentFontSize,
      boxSizing: 'border-box',
      minHeight: 0,
      padding: '2.5%',
      position: 'relative'
    };

    switch (state) {
      case 'normal':
        return {
          ...baseStyle,
          color: '#ffffff',
          backgroundColor: 'transparent',
          border: '3px dashed #ffffff'
        };
      case 'correct':
        return {
          ...baseStyle,
          color: '#00FF7F', // Vibrant green text color
          backgroundColor: 'transparent', // Transparent background
          border: 'none' // No outer border
        };
      case 'incorrect':
        return {
          ...baseStyle,
          color: '#FF6B6B', // Vibrant salmon text color
          backgroundColor: 'transparent', // Transparent background
          border: 'none' // No outer border
        };
      case 'default':
      default:
        return {
          ...baseStyle,
          color: 'transparent',
          backgroundColor: 'transparent',
          border: 'none'
        };
    }
  };

  const feedbackRowStyle = getFeedbackStyles(currentFeedbackState);

  return React.createElement('div', {
    id: elementId,
    className: 'quiz-panel',
    style: finalStyles,
    'data-element-type': 'quiz-panel',
    'data-quiz-type': quizType,
    'data-quiz-subtype': quizSubtype,
    'data-grid-position': position?.gridPosition,
    'data-key-concepts': JSON.stringify(keyConcepts),
    'data-options': JSON.stringify(options),
    'data-image': image,
    'data-image-text': imageText
  }, [
    // Row 0: Header Row
    headerText ? React.createElement('div', {
      key: 'header-row',
      className: 'quiz-header-row',
      style: headerRowStyle
    }, [
      headerText,
      React.createElement('div', {
        key: 'header-underline',
        style: {
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          height: processedHeaderUnderlineThickness,
          backgroundColor: headerUnderlineColor,
          marginTop: '8px'
        }
      })
    ]) : null,
    
    // Row 1: Question Row
    React.createElement('div', {
      key: 'question-row',
      className: 'quiz-question-row',
      style: questionRowStyle
    }, questionText && questionText.includes('<br>') ? 
      React.createElement('span', {
        dangerouslySetInnerHTML: { __html: questionText }
      }) : 
      (questionText || '')),
    
    // Row 2: Options Row
    React.createElement('div', {
      key: 'options-row',
      className: 'quiz-options-row',
      style: optionsRowStyle
    }, renderOptionsContent()),
    
    // Row 3: Feedback Row
    React.createElement('div', {
      key: 'feedback-row',
      className: 'quiz-feedback-row',
      style: feedbackRowStyle,
      'data-feedback-state': currentFeedbackState
    }, [
      // Add inset border for correct and incorrect states
      (currentFeedbackState === 'correct' || currentFeedbackState === 'incorrect') ? React.createElement('div', {
        key: 'inset-border',
        style: {
          position: 'absolute',
          top: '2.5%',
          left: '2.5%',
          right: '2.5%',
          bottom: '2.5%',
          border: currentFeedbackState === 'correct' ? '2px dashed #00AA55' : '2px dashed #CC4444',
          borderRadius: '4px',
          pointerEvents: 'none'
        }
      }) : null,
      // Add checkmark icon for correct state
      currentFeedbackState === 'correct' ? React.createElement('span', {
        key: 'checkmark-icon',
        style: {
          fontSize: '1.2em',
          marginRight: '10px',
          color: '#00FF7F'
        }
      }, '✓') : null,
      // Add cross icon for incorrect state
      currentFeedbackState === 'incorrect' ? React.createElement('span', {
        key: 'cross-icon',
        style: {
          fontSize: '1.2em',
          marginRight: '10px',
          color: '#FF6B6B'
        }
      }, '✗') : null,
      // Feedback text
      React.createElement('span', {
        key: 'feedback-text'
      }, currentFeedbackText || '')
    ])
  ]);
});

/**
 * Calculations Detail Component - Exact replica of InformationAnalysisComponent with updated headers
 */
const CalculationsDetailComponent = React.memo((props) => {
  const elementId = React.useId();
  const { 
    position, 
    processedStyles, 
    elementZIndex, 
    componentHeader = '26gc',
    sectionHeader = '24gc',
    bodyTextSize = '22gc',
    bulletSize = '8gc',
    factsArray = [
      { text: "Formula Used 1" },
      { text: "Formula Used 2" }
    ],
    valueArray = [
      { text: "Given Value 1" }
    ],
    toFindArray = [
      { text: "Calculation Step 1" },
      { text: "Calculation Step 2" }
    ],
    backgroundColor = '#0A0A1A',
    backgroundColorOpacity = 0.5,
    cardBackgroundColor = '#1A1A2E',
    cardBackgroundOpacity = 0.5,
    border,
    borderRadius = '15gc',
    sectionLeftBorderRadius = '10gc',
    padding = '20gc',
    cardPadding = '10gc 20gc',
    cardSpacing = '16gc',
    textColor = '#E0E0E0',
    factsColor = '#FFD700',
    valueColor = '#00FF7F',
    toFindColor = '#8A2BE2',
    accentBarWidth = '4gc',
    sectionMarginBottom = '8gc',
    sectionMarginLeft = '12gc',
    listMarginLeft = '12gc',
    listItemMarginBottom = '4gc',
    bulletMarginRight = '8gc'
  } = props;
  
  // State for dynamic updates
  const [dynamicFactsArray, setDynamicFactsArray] = React.useState(factsArray);
  const [dynamicValueArray, setDynamicValueArray] = React.useState(valueArray);
  const [dynamicToFindArray, setDynamicToFindArray] = React.useState(toFindArray);

  // Listen for updateCalculationDetails events
  React.useEffect(() => {
    const handleUpdateCalculationDetails = (event) => {
      console.log('🔍 [CalculationsDetail] Received updateCalculationDetails event:', event.detail);
      const { pageNumber, factsArray: newFactsArray, valueArray: newValueArray, toFindArray: newToFindArray } = event.detail;
      
      // Append new data to existing arrays instead of replacing
      if (newFactsArray && newFactsArray.length > 0) {
        const newFacts = Array.isArray(newFactsArray) && typeof newFactsArray[0] === 'object'
          ? newFactsArray
          : newFactsArray.map(fact => ({ text: fact, color: '#FFD700' }));
        console.log('🔍 [CalculationsDetail] Appending to factsArray:', newFacts);
        setDynamicFactsArray(prevArray => {
          const existingTexts = prevArray.map(item => item.text);
          const uniqueNewFacts = newFacts.filter(fact => !existingTexts.includes(fact.text));
          const updatedArray = [...prevArray, ...uniqueNewFacts];
          console.log('🔍 [CalculationsDetail] Updated factsArray:', updatedArray);
          return updatedArray;
        });
      }
      
      if (newValueArray && newValueArray.length > 0) {
        const newValues = Array.isArray(newValueArray) && typeof newValueArray[0] === 'object'
          ? newValueArray
          : newValueArray.map(value => ({ text: value, color: '#00FF7F' }));
        console.log('🔍 [CalculationsDetail] Appending to valueArray:', newValues);
        setDynamicValueArray(prevArray => {
          const existingTexts = prevArray.map(item => item.text);
          const uniqueNewValues = newValues.filter(value => !existingTexts.includes(value.text));
          const updatedArray = [...prevArray, ...uniqueNewValues];
          console.log('🔍 [CalculationsDetail] Updated valueArray:', updatedArray);
          return updatedArray;
        });
      }
      
      if (newToFindArray && newToFindArray.length > 0) {
        const newToFind = Array.isArray(newToFindArray) && typeof newToFindArray[0] === 'object'
          ? newToFindArray
          : newToFindArray.map(toFind => ({ text: toFind, color: '#8A2BE2' }));
        console.log('🔍 [CalculationsDetail] Appending to toFindArray:', newToFind);
        setDynamicToFindArray(prevArray => {
          const existingTexts = prevArray.map(item => item.text);
          const uniqueNewToFind = newToFind.filter(toFind => !existingTexts.includes(toFind.text));
          const updatedArray = [...prevArray, ...uniqueNewToFind];
          console.log('🔍 [CalculationsDetail] Updated toFindArray:', updatedArray);
          return updatedArray;
        });
      }
    };

    window.addEventListener('updateCalculationDetails', handleUpdateCalculationDetails);
    
    return () => {
      window.removeEventListener('updateCalculationDetails', handleUpdateCalculationDetails);
    };
  }, []);

  // Use dynamic arrays if they have been updated, otherwise use props
  const currentFactsArray = dynamicFactsArray.length > 0 ? dynamicFactsArray : factsArray;
  const currentValueArray = dynamicValueArray.length > 0 ? dynamicValueArray : valueArray;
  const currentToFindArray = dynamicToFindArray.length > 0 ? dynamicToFindArray : toFindArray;
  
  console.log('🔍 CalculationsDetailComponent RENDERED!');
  console.log('🔍 CalculationsDetailComponent props:', props);
  console.log('🔍 CalculationsDetailComponent position:', position);
  console.log('🔍 CalculationsDetailComponent processedStyles:', processedStyles);
  console.log('🔍 CalculationsDetailComponent currentFactsArray:', currentFactsArray);
  console.log('🔍 CalculationsDetailComponent currentValueArray:', currentValueArray);
  console.log('🔍 CalculationsDetailComponent currentToFindArray:', currentToFindArray);
  
  // Helper function to convert hex to rgba with opacity
  const hexToRgba = (hex, opacity) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };
  
  // Process border property if it contains gc units
  let processedBorder = border;
  if (border && border.includes('gc')) {
    const borderParts = border.split(' ');
    if (borderParts.length >= 3) {
      const width = borderParts[0];
      const style = borderParts[1];
      const color = borderParts.slice(2).join(' ');
      
      if (width.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
        const processedWidth = window.GridCellFontUtils.processGcProperty(width, 'borderWidth');
        processedBorder = `${processedWidth} ${style} ${color}`;
      }
    }
  }

  // Process other gc properties
  let processedBorderRadius = borderRadius;
  if (borderRadius && borderRadius.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedBorderRadius = window.GridCellFontUtils.processGcProperty(borderRadius, 'borderRadius');
  }

  let processedPadding = padding;
  if (padding && padding.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedPadding = window.GridCellFontUtils.processGcProperty(padding, 'padding');
  }

  let processedCardPadding = cardPadding;
  if (cardPadding && cardPadding.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedCardPadding = window.GridCellFontUtils.processGcProperty(cardPadding, 'padding');
  }

  let processedCardSpacing = cardSpacing;
  if (cardSpacing && cardSpacing.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedCardSpacing = window.GridCellFontUtils.processGcProperty(cardSpacing, 'marginBottom');
  }

  let processedAccentBarWidth = accentBarWidth;
  if (accentBarWidth && accentBarWidth.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedAccentBarWidth = window.GridCellFontUtils.processGcProperty(accentBarWidth, 'width');
  }

  let processedSectionLeftBorderRadius = sectionLeftBorderRadius;
  if (sectionLeftBorderRadius && sectionLeftBorderRadius.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedSectionLeftBorderRadius = window.GridCellFontUtils.processGcProperty(sectionLeftBorderRadius, 'borderRadius');
  }

  let processedSectionMarginBottom = sectionMarginBottom;
  if (sectionMarginBottom && sectionMarginBottom.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedSectionMarginBottom = window.GridCellFontUtils.processGcProperty(sectionMarginBottom, 'marginBottom');
  }

  let processedSectionMarginLeft = sectionMarginLeft;
  if (sectionMarginLeft && sectionMarginLeft.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedSectionMarginLeft = window.GridCellFontUtils.processGcProperty(sectionMarginLeft, 'marginLeft');
  }

  let processedListMarginLeft = listMarginLeft;
  if (listMarginLeft && listMarginLeft.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedListMarginLeft = window.GridCellFontUtils.processGcProperty(listMarginLeft, 'marginLeft');
  }

  let processedListItemMarginBottom = listItemMarginBottom;
  if (listItemMarginBottom && listItemMarginBottom.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedListItemMarginBottom = window.GridCellFontUtils.processGcProperty(listItemMarginBottom, 'marginBottom');
  }

  let processedBulletMarginRight = bulletMarginRight;
  if (bulletMarginRight && bulletMarginRight.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedBulletMarginRight = window.GridCellFontUtils.processGcProperty(bulletMarginRight, 'marginRight');
  }

  let processedBulletSize = bulletSize;
  if (bulletSize && bulletSize.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedBulletSize = window.GridCellFontUtils.processGcProperty(bulletSize, 'width');
  }

  let processedComponentHeader = componentHeader;
  if (componentHeader && componentHeader.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedComponentHeader = window.GridCellFontUtils.processGcProperty(componentHeader, 'fontSize');
  }

  let processedSectionHeader = sectionHeader;
  if (sectionHeader && sectionHeader.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedSectionHeader = window.GridCellFontUtils.processGcProperty(sectionHeader, 'fontSize');
  }

  let processedBodyTextSize = bodyTextSize;
  if (bodyTextSize && bodyTextSize.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedBodyTextSize = window.GridCellFontUtils.processGcProperty(bodyTextSize, 'fontSize');
  }

  // Use the position and processedStyles passed from math-applet.js
  const finalStyles = {
    ...(position?.css || {}),
    ...(processedStyles || {}),
    zIndex: elementZIndex || 50,
    backgroundColor: hexToRgba(backgroundColor, backgroundColorOpacity),
    ...(processedBorder ? { border: processedBorder } : {}),
    ...(processedBorderRadius ? { borderRadius: processedBorderRadius } : {}),
    ...(processedPadding ? { padding: processedPadding } : {}),
    display: 'flex',
    flexDirection: 'column'
  };

  const headerStyle = {
    ...(processedComponentHeader ? { fontSize: processedComponentHeader } : {}),
    color: textColor,
    marginBottom: processedCardSpacing,
    fontWeight: '600'
  };

  const cardStyle = {
    backgroundColor: hexToRgba(cardBackgroundColor, cardBackgroundOpacity),
    borderRadius: processedBorderRadius,
    ...(processedSectionLeftBorderRadius ? { 
      borderTopLeftRadius: processedSectionLeftBorderRadius,
      borderBottomLeftRadius: processedSectionLeftBorderRadius
    } : {}),
    padding: processedCardPadding,
    marginBottom: processedCardSpacing,
    display: 'flex',
    alignItems: 'flex-start',
    position: 'relative'
  };

  const accentBarStyle = (color) => ({
    width: processedAccentBarWidth,
    backgroundColor: color,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: processedSectionLeftBorderRadius ? 
      `${processedSectionLeftBorderRadius} 0 0 ${processedSectionLeftBorderRadius}` : 
      `${processedBorderRadius} 0 0 ${processedBorderRadius}`
  });

  const sectionHeaderStyle = (color) => ({
    ...(processedSectionHeader ? { fontSize: processedSectionHeader } : {}),
    color: color,
    fontWeight: '600',
    marginBottom: processedSectionMarginBottom || '8px',
    marginLeft: processedAccentBarWidth ? `calc(${processedAccentBarWidth} + ${processedSectionMarginLeft || '12px'})` : (processedSectionMarginLeft || '12px')
  });

  const listStyle = {
    marginLeft: processedAccentBarWidth ? `calc(${processedAccentBarWidth} + ${processedListMarginLeft || '12px'})` : (processedListMarginLeft || '12px'),
    padding: 0,
    listStyle: 'none'
  };

  const listItemStyle = (color) => ({
    ...(processedBodyTextSize ? { fontSize: processedBodyTextSize } : {}),
    color: textColor,
    marginBottom: processedListItemMarginBottom || '4px',
    display: 'flex',
    alignItems: 'center'
  });

  const bulletStyle = (color) => ({
    width: processedBulletSize || '6px',
    height: processedBulletSize || '6px',
    backgroundColor: color,
    borderRadius: '50%',
    marginRight: processedBulletMarginRight || '8px',
    flexShrink: 0
  });

  const renderCard = (title, items, color) => {
    if (!items || items.length === 0) return null;
    
    return React.createElement('div', {
      key: title,
      style: cardStyle
    }, [
      React.createElement('div', {
        key: 'accent-bar',
        style: accentBarStyle(color)
      }),
      React.createElement('div', {
        key: 'content'
      }, [
        React.createElement('h3', {
          key: 'title',
          style: sectionHeaderStyle(color)
        }, title),
        React.createElement('ul', {
          key: 'list',
          style: listStyle
        }, items.map((item, index) => {
          return React.createElement('li', {
            key: index,
            style: listItemStyle(color)
          }, [
            React.createElement('span', {
              key: 'bullet',
              style: bulletStyle(color)
            }),
            React.createElement('span', {
              key: 'text',
              style: { color: item.color || textColor }
            }, item.text)
          ]);
        }))
      ])
    ]);
  };

  // Create cards array, filtering out null values
  const cards = [
    renderCard('Key Formula Used', currentFactsArray, factsColor),
    renderCard('Given', currentValueArray, valueColor),
    renderCard('Calculation Steps', currentToFindArray, toFindColor)
  ].filter(Boolean);

  return React.createElement('div', {
    id: elementId,
    className: 'calculations-detail-panel',
    style: finalStyles,
    'data-element-type': 'calculations-detail-panel',
    'data-grid-position': position?.gridPosition
  }, [
    React.createElement('h2', {
      key: 'header',
      style: headerStyle
    }, 'CALCULATION DETAILS'),
    ...cards
  ]);
});

/**
 * Compute Box Component - Step-by-step calculation display
 */
const ComputeBoxComponent = React.memo((props) => {
  const elementId = React.useId();
  const { 
    position, 
    processedStyles, 
    elementZIndex, 
    stepNumber = 1,
    stepText = 'Apply the formula',
    instruction = 'The area of a circle is calculated using the formula: A = πr²',
    stepCards = [
    ],
    summaryText = 'We\'ve calculated the area of the circular pool to be 113.04 square meters.',
    // Header row props (new 10% header row)
    headerText = '', // Text for the header row
    headerRowFontSize = '24gc',
    headerRowTextColor = '#ffffff',
    headerRowBackgroundColor = 'transparent',
    headerRowBorder = 'none',
    headerRowBorderRadius = '0gc',
    headerRowPadding = '20gc',
    headerRowUnderlineColor = '#00A0A0',
    headerRowUnderlineThickness = '2gc',
    // Existing styling props
    headerBackgroundColor = '#008080',
    cardBackgroundColor = '#2C3E50',
    summaryBackgroundColor = '#008080',
    textColor = '#ffffff',
    instructionColor = '#E0E0E0',
    headerFontSize = '24gc',
    instructionFontSize = '20gc',
    cardFontSize = '24gc',
    summaryFontSize = '24gc',
    borderRadius = '12gc',
    padding = '20gc',
    cardSpacing = '12gc',
    headerPadding = '16gc 20gc',
    cardPadding = '12gc 16gc',
    summaryPadding = '16gc 20gc',
    backgroundColor = '#0A0A1A',
    backgroundColorOpacity = 0.5
  } = props;
  
  console.log('🔍 ComputeBoxComponent RENDERED!');
  console.log('🔍 ComputeBoxComponent props:', props);
  console.log('🔍 ComputeBoxComponent stepNumber:', stepNumber);
  console.log('🔍 ComputeBoxComponent stepCards:', stepCards);

  // Helper function to convert hex to rgba with opacity
  const hexToRgba = (hex, opacity) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Process gc units for font sizes
  let processedHeaderFontSize = headerFontSize;
  if (headerFontSize && headerFontSize.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedHeaderFontSize = window.GridCellFontUtils.processGcProperty(headerFontSize, 'fontSize');
  }

  let processedInstructionFontSize = instructionFontSize;
  if (instructionFontSize && instructionFontSize.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedInstructionFontSize = window.GridCellFontUtils.processGcProperty(instructionFontSize, 'fontSize');
  }

  let processedCardFontSize = cardFontSize;
  if (cardFontSize && cardFontSize.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedCardFontSize = window.GridCellFontUtils.processGcProperty(cardFontSize, 'fontSize');
  }

  let processedSummaryFontSize = summaryFontSize;
  if (summaryFontSize && summaryFontSize.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedSummaryFontSize = window.GridCellFontUtils.processGcProperty(summaryFontSize, 'fontSize');
  }

  // Process header row properties
  let processedHeaderRowFontSize = headerRowFontSize;
  if (headerRowFontSize && headerRowFontSize.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedHeaderRowFontSize = window.GridCellFontUtils.processGcProperty(headerRowFontSize, 'fontSize');
  }

  let processedHeaderRowBorder = headerRowBorder;
  if (headerRowBorder && headerRowBorder.includes('gc')) {
    const borderParts = headerRowBorder.split(' ');
    if (borderParts.length >= 3) {
      const width = borderParts[0];
      const style = borderParts[1];
      const color = borderParts.slice(2).join(' ');
      
      if (width.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
        const processedWidth = window.GridCellFontUtils.processGcProperty(width, 'borderWidth');
        processedHeaderRowBorder = `${processedWidth} ${style} ${color}`;
      }
    }
  }

  let processedHeaderRowBorderRadius = headerRowBorderRadius;
  if (headerRowBorderRadius && headerRowBorderRadius.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedHeaderRowBorderRadius = window.GridCellFontUtils.processGcProperty(headerRowBorderRadius, 'borderRadius');
  }

  let processedHeaderRowPadding = headerRowPadding;
  if (headerRowPadding && headerRowPadding.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedHeaderRowPadding = window.GridCellFontUtils.processGcProperty(headerRowPadding, 'padding');
  }

  let processedHeaderRowUnderlineThickness = headerRowUnderlineThickness;
  if (headerRowUnderlineThickness && headerRowUnderlineThickness.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedHeaderRowUnderlineThickness = window.GridCellFontUtils.processGcProperty(headerRowUnderlineThickness, 'borderWidth');
  }

  // Process gc units for other properties
  let processedBorderRadius = borderRadius;
  if (borderRadius && borderRadius.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedBorderRadius = window.GridCellFontUtils.processGcProperty(borderRadius, 'borderRadius');
  }

  let processedPadding = padding;
  if (padding && padding.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedPadding = window.GridCellFontUtils.processGcProperty(padding, 'padding');
  }

  let processedCardSpacing = cardSpacing;
  if (cardSpacing && cardSpacing.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedCardSpacing = window.GridCellFontUtils.processGcProperty(cardSpacing, 'marginBottom');
  }

  let processedHeaderPadding = headerPadding;
  if (headerPadding && headerPadding.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedHeaderPadding = window.GridCellFontUtils.processGcProperty(headerPadding, 'padding');
  }

  let processedCardPadding = cardPadding;
  if (cardPadding && cardPadding.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedCardPadding = window.GridCellFontUtils.processGcProperty(cardPadding, 'padding');
  }

  let processedSummaryPadding = summaryPadding;
  if (summaryPadding && summaryPadding.includes('gc') && window.GridCellFontUtils && window.GridCellFontUtils.processGcProperty) {
    processedSummaryPadding = window.GridCellFontUtils.processGcProperty(summaryPadding, 'padding');
  }

  const finalStyles = {
    ...(position?.css || {}),
    ...(processedStyles || {}),
    zIndex: elementZIndex || 50,
    backgroundColor: hexToRgba(backgroundColor, backgroundColorOpacity),
    borderRadius: processedBorderRadius,
    padding: processedPadding,
    display: 'flex',
    flexDirection: 'column',
    gap: processedCardSpacing
  };

  const headerStyle = {
    backgroundColor: headerBackgroundColor,
    borderRadius: processedBorderRadius,
    padding: processedHeaderPadding,
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const stepNumberStyle = {
    backgroundColor: '#00A0A0', // Slightly lighter than header
    color: textColor,
    borderRadius: '50%',
    width: `calc(${processedHeaderFontSize} + 12px)`,
    height: `calc(${processedHeaderFontSize} + 12px)`,
    minWidth: '32px',
    minHeight: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: processedHeaderFontSize,
    fontWeight: 'bold',
    flexShrink: 0
  };

  const stepTextStyle = {
    color: textColor,
    fontSize: processedHeaderFontSize,
    fontWeight: 'bold',
    flex: 1
  };

  const instructionStyle = {
    color: instructionColor,
    fontSize: processedInstructionFontSize,
    margin: 0,
    lineHeight: '1.4'
  };

  const cardStyle = {
    backgroundColor: cardBackgroundColor,
    borderRadius: processedBorderRadius,
    padding: processedCardPadding,
    color: textColor,
    fontSize: processedCardFontSize,
    lineHeight: '1.4'
  };

  const summaryStyle = {
    backgroundColor: summaryBackgroundColor,
    borderRadius: processedBorderRadius,
    padding: processedSummaryPadding,
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  // Header row style (10% height)
  const headerRowStyle = {
    flex: '0 0 10%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    fontSize: processedHeaderRowFontSize,
    color: headerRowTextColor,
    backgroundColor: headerRowBackgroundColor,
    border: processedHeaderRowBorder,
    borderRadius: processedHeaderRowBorderRadius,
    padding: processedHeaderRowPadding,
    fontWeight: 'bold',
    boxSizing: 'border-box',
    minHeight: 0,
    position: 'relative'
  };

  const iconStyle = {
    color: textColor,
    fontSize: processedSummaryFontSize,
    fontWeight: 'bold',
    width: `calc(${processedSummaryFontSize} + 8px)`,
    height: `calc(${processedSummaryFontSize} + 8px)`,
    minWidth: '24px',
    minHeight: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    flexShrink: 0
  };

  const summaryTextStyle = {
    color: textColor,
    fontSize: processedSummaryFontSize,
    lineHeight: '1.4',
    flex: 1
  };

  return React.createElement('div', {
    id: elementId,
    className: 'compute-box',
    style: finalStyles,
    'data-element-type': 'compute-box',
    'data-grid-position': position?.gridPosition
  }, [
    // Header Row (10% height)
    headerText ? React.createElement('div', {
      key: 'header-row',
      className: 'compute-box-header-row',
      style: headerRowStyle
    }, [
      headerText,
      React.createElement('div', {
        key: 'header-underline',
        style: {
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          height: processedHeaderRowUnderlineThickness,
          backgroundColor: headerRowUnderlineColor,
          marginTop: '8px'
        }
      })
    ]) : null,
    
    // Main Content (90% height)
    React.createElement('div', {
      key: 'main-content',
      style: {
        flex: '0 0 90%',
        display: 'flex',
        flexDirection: 'column',
        gap: processedCardSpacing,
        boxSizing: 'border-box'
      }
    }, [
      // Header Section
      React.createElement('div', {
        key: 'header',
        style: headerStyle
      }, [
      React.createElement('div', {
        key: 'step-number',
        style: stepNumberStyle
      }, stepNumber),
      React.createElement('div', {
        key: 'step-text',
        style: stepTextStyle
      }, stepText)
    ]),

    // Instruction
    React.createElement('p', {
      key: 'instruction',
      style: instructionStyle
    }, instruction),

    // Step Cards
    ...stepCards.map((cardText, index) => 
      React.createElement('div', {
        key: `card-${index}`,
        style: cardStyle
      }, cardText)
    ),

    // Summary Section
    React.createElement('div', {
      key: 'summary',
      style: summaryStyle
    }, [
      React.createElement('div', {
        key: 'icon',
        style: iconStyle
      }, 'i'),
      React.createElement('div', {
        key: 'summary-text',
        style: summaryTextStyle
      }, summaryText)
    ])
    ]) // Close main-content div
  ].filter(Boolean)); // Filter out null header row if not provided
});

/**
 * Legacy Header Component (kept for backward compatibility)
 */
const HeaderComponent = React.memo((props) => {
  const elementId = React.useId();
  const processedStyles = GridCellFontUtils.processGcStyles(props);
  
  return React.createElement('div', {
    id: elementId,
    className: 'header-container math-app-header',
    style: processedStyles,
    'data-element-type': 'header'
  }, props.text || 'Math Learning Platform');
});

/**
 * Footer Component
 */
const FooterComponent = React.memo((props) => {
  const elementId = React.useId();
  
  return React.createElement('div', {
    id: elementId,
    className: 'footer-container',
    style: GridCellFontUtils.processGcStyles(props),
    'data-element-type': 'footer'
  });
});

/**
 * Left Sidebar Component
 */
const LeftSidebarComponent = React.memo((props) => {
  const elementId = React.useId();
  
  return React.createElement('div', {
    id: elementId,
    className: 'left-sidebar-container',
    style: GridCellFontUtils.processGcStyles(props),
    'data-element-type': 'left-sidebar'
  });
});

/**
 * Right Sidebar Component
 */
const RightSidebarComponent = React.memo((props) => {
  const elementId = React.useId();
  
  return React.createElement('div', {
    id: elementId,
    className: 'right-sidebar-container',
    style: GridCellFontUtils.processGcStyles(props),
    'data-element-type': 'right-sidebar'
  });
});

/**
 * Main Content Component
 */
const MainContentComponent = React.memo((props) => {
  const elementId = React.useId();
  
  return React.createElement('div', {
    id: elementId,
    className: 'main-content-container',
    style: GridCellFontUtils.processGcStyles(props),
    'data-element-type': 'main-content'
  });
});

/**
 * Full Content Component
 */
const FullContentComponent = React.memo((props) => {
  const elementId = React.useId();
  
  return React.createElement('div', {
    id: elementId,
    className: 'full-content-container',
    style: GridCellFontUtils.processGcStyles(props),
    'data-element-type': 'full-content'
  });
});

/**
 * Modal Center Component
 */
const ModalCenterComponent = React.memo((props) => {
  const elementId = React.useId();
  
  return React.createElement('div', {
    id: elementId,
    className: 'modal-center-container',
    style: GridCellFontUtils.processGcStyles(props),
    'data-element-type': 'modal-center'
  });
});

// Layout Elements Configuration
const LayoutElements = {
  header: {
    type: 'textbox',
    coordinates: [1, 1, 128, 4],
    zIndex: 'var(--z-header)',
    props: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      fontSize: '24px',
      fontWeight: 'bold',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('header', (props, elementId) => {
      return React.createElement(HeaderComponent, props);
    })
  },
  
  footer: {
    type: 'container',
    coordinates: [1, 68, 128, 72],
    zIndex: 'var(--z-content)',
    props: {},
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('footer', (props, elementId) => {
      return React.createElement(FooterComponent, props);
    })
  },

  leftSidebar: {
    type: 'container',
    coordinates: [1, 9, 32, 67],
    zIndex: 'var(--z-content)',
    props: {},
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('sidebar', (props, elementId) => {
      return React.createElement(LeftSidebarComponent, props);
    })
  },
  
  rightSidebar: {
    type: 'container',
    coordinates: [97, 9, 128, 67],
    zIndex: 'var(--z-content)',
    props: {},
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('sidebar', (props, elementId) => {
      return React.createElement(RightSidebarComponent, props);
    })
  },
  
  mainContent: {
    type: 'container',
    coordinates: [33, 9, 96, 67],
    zIndex: 'var(--z-content)',
    props: {},
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('container', (props, elementId) => {
      return React.createElement(MainContentComponent, props);
    })
  },
  
  fullContent: {
    type: 'container',
    coordinates: [1, 9, 128, 67],
    zIndex: 'var(--z-content)',
    props: {},
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('container', (props, elementId) => {
      return React.createElement(FullContentComponent, props);
    })
  },
  
  modalCenter: {
    type: 'container',
    coordinates: [36, 16, 100, 60],
    zIndex: 'var(--z-elevated)',
    props: {},
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('modal', (props, elementId) => {
      return React.createElement(ModalCenterComponent, props);
    })
  }
};

// Export components and configuration
window.LayoutComponents = {
  HeaderComponent,
  ProblemSolveHeaderComponent,
  LogoComponent,
  QuestionComponent,
  Page1HeaderComponent,
  StaticImageComponent,
  DivisionProblemDisplayComponent,
  InformationAnalysisComponent,
  ConceptSummaryComponent,
  CalculationsDetailComponent,
  ComputeBoxComponent,
  TeacherNoteComponent,
  SectionHeaderComponent,
  TabNavigationComponent,
  QuizPanelComponent,
  FooterComponent,
  LeftSidebarComponent,
  RightSidebarComponent,
  MainContentComponent,
  FullContentComponent,
  ModalCenterComponent,
  LayoutElements
};

console.log('✅ Layout components loaded successfully');
