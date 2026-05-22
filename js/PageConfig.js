/**
 * Page Configuration
 *
 * - Grid positioning and element generation
 * - Page-specific UI element configurations
 * - Question-dependent element updates
 */

// ===== PAGE CONFIGURATION =====
// Page configuration with grid positioning and element generation

// ===== PAGE NAVIGATION CONFIGURATION =====
/**
 * Page Navigation Configuration
 * Maps each page number to its previous and next page numbers
 * - prev: previous page number (null for first page)
 * - next: next page number (null for last page)
 */
const pageNavigation = {
  1: { prev: null, next: 2 },    // Division problem intro (dynamic dividend ÷ divisor)
  2: { prev: 1, next: null },    // Exact replica of page 13 (Long Division Default, dark theme)
};

/**
 * Get all page numbers in navigation order
 * @returns {number[]} Array of page numbers in order
 */
const getPageNumbers = () => {
  const pages = [];
  
  // Find the first page (where prev is null)
  let firstPage = null;
  for (const pageNum in pageNavigation) {
    if (pageNavigation[pageNum].prev === null) {
      firstPage = parseInt(pageNum, 10);
      break;
    }
  }
  
  if (firstPage === null) {
    console.warn('⚠️ No first page found in pageNavigation');
    return [];
  }
  
  // Traverse from first page to last
  let currentPage = firstPage;
  while (currentPage && pageNavigation[currentPage]) {
    pages.push(currentPage);
    currentPage = pageNavigation[currentPage].next;
  }

  return pages;
};

/**
 * Calculate total number of pages from pageNavigation
 * @returns {number} Total number of pages
 */
const getTotalPages = () => {
  return getPageNumbers().length;
};

/**
 * Get page number from dot position (1-based)
 * @param {number} dotPosition - Dot position (1 to totalPages)
 * @returns {number} Actual page number
 */
const getPageFromDotPosition = (dotPosition) => {
  const pages = getPageNumbers();
  return pages[dotPosition - 1] || pages[0];
};

/**
 * Get dot position from page number (1-based)
 * @param {number} pageNumber - Actual page number
 * @returns {number} Dot position (1 to totalPages)
 */
const getDotPositionFromPage = (pageNumber) => {
  const pages = getPageNumbers();
  const index = pages.indexOf(pageNumber);
  return index >= 0 ? index + 1 : 1;
};

/**
 * Extract page number from element ID
 * @param {string} id - Element ID (e.g., 'page1-next-button', 'page2-previous-button')
 * @returns {number} Extracted page number (defaults to 1 if not found)
 */
const extractPageNumberFromId = (id) => {
  if (!id) return 1;
  const match = id.match(/page(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
};

/**
 * Helper function to navigate to a page
 * @param {number} targetPage - The page number to navigate to
 * @param {string} direction - 'next' or 'previous' (for logging)
 */
const navigateToPage = (targetPage, direction = "unknown") => {
  if (typeof window !== "undefined") {
    if (window.changePageAndNotify) {
      window.changePageAndNotify(targetPage);
    } else if (window.navigateToPage) {
      window.navigateToPage(targetPage);
    } else {
      // Fallback: dispatch page change event
      window.dispatchEvent(
        new CustomEvent("pageChanged", { detail: { page: targetPage } })
      );
      console.log(
        `📄 [Navigation] ${direction} - Dispatched page change event to page ${targetPage}`
      );
    }
  }
};

// ===== HELPER FUNCTIONS =====

/**
 * Helper function for i18n text (accessible globally within this module)
 * @param {string} key - Translation key
 * @param {string} fallback - Fallback text if translation not found
 * @param {Object} params - Parameters for interpolation
 * @returns {string} Translated or fallback text
 */
const getI18nText = (key, fallback, params = {}) => {
  return typeof i18n !== "undefined" ? i18n.t(key, params) : fallback;
};

/**
 * Get page navigation info (previous and next pages)
 * @param {number} pageNumber - Current page number
 * @returns {Object|null} Navigation object with prevPage and nextPage, or null if not found
 */
const getPageNavigation = (pageNumber) => {
  return pageNavigation[pageNumber] || null;
};

/**
 * Check if previous button should be disabled
 * @param {number} pageNumber - Current page number
 * @returns {boolean} True if previous button should be disabled
 */
const isPrevButtonDisabled = (pageNumber) => {
  const nav = getPageNavigation(pageNumber);
  return !nav || nav.prev === null;
};

/**
 * Get next button text based on page number
 * @param {number} pageNumber - Current page number
 * @returns {string} Text to display on next button
 */
const getNextButtonText = (pageNumber) => {
  if (pageNumber === 1) {
    return getI18nText('pages.page1.startButton', 'Start');
  }
  const nav = getPageNavigation(pageNumber);
  // If there's no next page, show "Start Over" or similar
  if (!nav || nav.next === null) {
    return getI18nText("buttons.startOver", "Start Over");
  }
  // Otherwise show the standard next button text
  return getI18nText("buttons.next", "»");
};

// ===== GRID POSITION PAGES =====

const createOptimizedGridPositionPages = () => {
  // Helper function to get current question data (optimized)
  const getCurrentQuestionData = () => {
    const currentIndex =
      typeof window !== "undefined" && window.currentQuestionIndex !== undefined
        ? window.currentQuestionIndex
        : 0;
    const currentQuestion = {
      minuend: 5,
      subtrahend: 3,
      missing: "subtrahend",
    };
    return { currentIndex, currentQuestion };
  };

  const questionBottom_Y = 200;
  const questionTextSize = '28gc';

  // Return optimized GridPositionPages
  return {

    // ===== PAGE 1: DIVISION PROBLEM INTRO (dynamic dividend ÷ divisor) =====
    1: [
      // Header: "What is <dividend>÷ <divisor>? Solve using Tiered Division…" (orange) – Page1HeaderComponent reads from window.question
      {
        id: 'page1-header',
        name: 'page1-header',
        coordinates: [25, 50, 1575, 150],
        zIndex: 'var(--z-elevated)',
        type: 'custom',
        props: {
          componentType: 'Page1Header'
        }
      },

      // Division Problem Display - blocks for dividend ÷ divisor (dynamic)
      {
        id: 'page1-division-problem-display',
        name: 'division-problem-display',
        type: 'custom',
        coordinates: [300, 270, 1300, 430],
        zIndex: 50,
        props: {
          componentType: 'DivisionProblemDisplay'
        }
      },

      // Start button - same style as next button (150gc down, black font)
      {
        id: 'page1-start-button',
        name: 'next-button',
        type: 'button',
        coordinates: [600, 570, 1000, 670],
        zIndex: 'var(--z-button)',
        props: {
          text: getI18nText('pages.page1.startButton', 'Start'),
          color: 'black',
          ignorePageCompletion: true,
          onClick: () => {
            if (typeof window !== 'undefined' && window.changePageAndNotify) {
              window.changePageAndNotify(2);
            }
          }
        }
      },

      // Instruction text
      {
        id: 'page1-instruction',
        name: 'instruction-text',
        type: 'custom',
        coordinates: [5, 800, 1595, 900],
        zIndex: 50,
        props: {
          componentType: 'TeacherNoteComponent',
          text: getI18nText('pages.page1.instruction', "Tap 'Start' Button"),
          textSize: '20gc',
          textColor: '#ffffff',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '8px'
        }
      }
    ],

    // ===== PAGE 2: EXACT REPLICA OF PAGE 13 (Long Division Default, dark theme) =====
    2: [
      // Header: "What is <dividend>÷ <divisor>?" only (no second line)
      {
        id: 'page2-header',
        name: 'page2-header',
        coordinates: [25, 20, 1575, 80],
        zIndex: 'var(--z-elevated)',
        type: 'custom',
        props: {
          componentType: 'Page1Header',
          showSecondLine: false
        }
      },

      // Instruction text (same bg/opacity as long division component, white text); receives guided hint from LongDivisionGrid when guidedHintTargetId matches
      {
        id: 'div-instruction',
        name: 'div-instruction',
        type: 'custom',
        coordinates: [25, 100, 450, 800],
        zIndex: 50,
        props: {
          componentType: 'TeacherNoteComponent',
          text: getI18nText('pages.page2.divInstruction', 'Guided mode: follow the hints and fill in each step. Same dark theme styling.'),
          textSize: '20gc',
          textColor: '#ffffff',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          border: 'none',
          borderRadius: '8px',
          padding: '15px',
          guidedHintTargetId: 'div-instruction'
        }
      },

      // Long Division Grid - Guided Mode (Dark Theme, same styles as default)
      // dividend and divisor from window.question[currentQuestionIndex] via props function
      {
        id: 'page2-division-grid-default',
        name: 'division-grid-default',
        type: 'custom',
        coordinates: [475, 100, 1300, 700],
        zIndex: 'var(--z-elevated)',
        props: () => {
          const currentIndex = typeof window !== 'undefined' && window.currentQuestionIndex !== undefined ? window.currentQuestionIndex : 0;
          const qList = (typeof window !== 'undefined' && window.question) ? window.question : [];
          const q = (qList && qList[currentIndex]) ? qList[currentIndex] : { dividend: 96, divisor: 3 };
          const dividend = q.dividend != null ? q.dividend : 96;
          const divisor = q.divisor != null ? q.divisor : 3;
          return {
          componentType: 'LongDivisionGrid',
          dividend,
          divisor,
          showRemainder: true,
          decimalPlaces: 0,
          preventLeadingZeroQuotient: true,
          showMultiplicationTable: true,
          multiplicationTableCoordinates: [1325, 100, 1575, 775],
          multiplicationTableHeader: true,
          multiplicationTableFontSize: '20gc',
          multiplicationTableRowsClickable: true,
          showWorkings: true,
          interactive: true,
          mode: 'guided',
          guidedHintTarget: 'div-instruction', // show guided hint in external component div-instruction (not in div-guided-hint)
          guidedConfig: {
            showHints: true,
            autoAdvance: true,
            bringDownMode: 'both',
            autoFillSubtract: true,
            showDigitPanel: true,
            digitPanelCoordinates: [475, 705, 1300, 800],
            digitPanelOrientation: 'horizontal'
          },
          minusSignPosition: 'indonesia',
          gridAlignment: 'center',
          showStepHighlight: true,
          disabled: false,
          minimalMode: false,
          incorrectCount: 0,
          hiddenCells: [],
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          theme: 'dark-theme',
          cellSize: '44gc',
          fontSize: '30gc',
          cellBackgroundColor: 'white',
          containerBorder: '2px solid #ddd',
          showContainerBorder: false,
          lineColor: '#333',
          lineThickness: '2gc',
          cellBorderColor: '#ddd',
          cellBorderWidth: '1px',
          cellBorderStyle: 'solid',
          cellBorderRadius: '3gc',
          containerPadding: '11gc',
          containerBorderRadius: '5gc',
          cellGap: '5gc',
          cellBoxShadow: '0 6px 12px rgba(0,0,0,0.25)',
          rowGap: '6gc',
          lineSpacing: '3gc',
          bracketWidth: '7gc',
          bracketStrokeWidth: '1gc',
          bracketBorderRadius: '4gc',
          lineHeight: '1gc',
          lineBorderRadius: '1gc',
          lineMarginTop: '4gc',
          lineMarginBottom: '4gc',
          helperTextFontSize: '18gc',
          helperTextColor: 'rgba(255,255,255,0.45)',
          helperTextMarginRight: '15gc',
          dividendToPartialProductGap: '1gc',
          showHelperText: true,
          showArrows: true,
          showRemainderLabel: false,
          showFinalAnswer: false,
          arrowStrokeWidth: '1gc',
          arrowColor: 'rgba(170,170,170,0.65)',
          quotientRowMarginBottom: '3gc',
          subtractRowMarginTop: '5gc',
          differenceRowMarginTop: '5gc',
          dividendCellColor: '#8950A3',
          partialProductRowColor: 'rgba(255,255,255,0.45)',
          partialProductRowBackground: 'transparent',
          partialProductCellColor: '#433470',
          subtractionBarColor: 'rgba(255,255,255,0.85)',
          subtractionBarThickness: '3px',
          subtractionBarStyle: 'solid',
          partialRemainderColor: '#8950A3',
          bringDownCellColor: '#8950A3',
          quotientStyle: {},
          dividendStyle: {},
          divisorStyle: {},
          workingStyle: {},
          remainderStyle: {},
          onComplete: null,
          onCheck: null,
          onReset: null,
          onSelectionChange: null,
          onInputChange: null,
          onInputValidation: null,
          onPracticeValidate: null,
          onPracticeComplete: null,
          onStepComplete: null,
          onGuidedComplete: () => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('quizCompleted', {
                detail: {
                  pageNumber: window.getCurrentPage ? window.getCurrentPage() : 2,
                  componentId: 'page2-division-grid-default'
                }
              }));
            }
          },
          onDividendChange: null,
          onDivisorChange: null,
          onAnimationStep: null,
          onAnimationComplete: null,
          onDragDropValidate: null,
          onDragDropComplete: null,
          practiceConfig: {},
          animationConfig: {},
          dragDropConfig: {},
          inputCells: [],
          hintText: ''
          };
        }
      },

      // Instruction hint (white 36gc). When all points correctly tapped: last question → "Tap » to continue", else → "Tap » to solve the next division challenge."
      {
        id: 'page2-instruction-text',
        name: 'page2-instruction-text',
        type: 'custom',
        coordinates: [155, 820, 1445, 895],
        zIndex: 50,
        props: () => {
          try {
            // Use __longDivisionComplete so we only show "Tap »..." after user actually completed the division (avoids showing on load when PageCompletionManager may not have quiz in DOM yet)
            const divisionComplete = typeof window !== 'undefined' && window.__longDivisionComplete === true;
            const qList = (typeof window !== 'undefined' && window.question) ? window.question : [];
            const currentIndex = typeof window !== 'undefined' && window.currentQuestionIndex !== undefined ? window.currentQuestionIndex : 0;
            const isLastRecord = qList.length > 0 && currentIndex >= qList.length - 1;
            const text = divisionComplete
              ? (isLastRecord ? getI18nText('pages.page2.instructionTapContinue', 'Tap » to start again') : getI18nText('pages.page2.instructionTapNextChallenge', 'Tap » to solve the next division challenge.'))
              : getI18nText('pages.page2.instructionDefault', 'Follow the instructions/ use multiplication table and fill in each step.');
            return {
              componentType: 'TeacherNoteComponent',
              text,
              textSize: '36gc',
              textColor: '#ffffff',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              padding: '15px'
            };
          } catch (e) {
            return {
              componentType: 'TeacherNoteComponent',
              text: getI18nText('pages.page2.instructionDefault', 'Follow the instructions/ use multiplication table and fill in each step.'),
              textSize: '36gc',
              textColor: '#ffffff',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              padding: '15px'
            };
          }
        }
      },

      // Previous button
      {
        id: 'page2-previous-button',
        name: 'previous-button',
        type: 'button',
        coordinates: [5, 820, 150, 895],
        zIndex: 'var(--z-button)',
        props: {
          text: getI18nText('buttons.previous', '«'),
          onClick: () => {
            if (typeof window === 'undefined') return;
            // Route through AppAPI when AI mode is active so the event bus fires a
            // page.changed event that the bridge can relay to the tutor backend.
            // Without this, back-button clicks bypass AppAPI entirely and the
            // Playwright-controlled browser never syncs to page 1.
            if (window.AppAPI && typeof window.AppAPI.actions?.clickPrevious === 'function') {
              window.AppAPI.actions.clickPrevious();
            } else if (window.changePageAndNotify) {
              window.changePageAndNotify(1);
            }
          }
        }
      },

      // Next button: last question → page 1 with full reset; else → next record on page 2 with state reset
      {
        id: 'page2-next-button',
        name: 'next-button',
        type: 'button',
        coordinates: [1450, 820, 1595, 895],
        zIndex: 'var(--z-button)',
        props: {
          text: getI18nText('buttons.next', '»'),
          onClick: () => {
            if (typeof window === 'undefined' || !window.changePageAndNotify) return;
            const qList = window.question || [];
            const currentIndex = window.currentQuestionIndex !== undefined ? window.currentQuestionIndex : 0;
            const isLastRecord = qList.length > 0 && currentIndex >= qList.length - 1;

            // Reset division and page-2 related state in both cases
            if (window.PageCompletionManager) {
              window.PageCompletionManager.setPageCompleted(2, false);
            }
            if (window.__longDivisionComplete !== undefined) delete window.__longDivisionComplete;
            if (window.__longDivisionGuidedHint !== undefined) delete window.__longDivisionGuidedHint;

            if (isLastRecord) {
              window.currentQuestionIndex = 0;
              window.page1complete = false;
              window.objectsremoved = 0;
              window.changePageAndNotify(1);
            } else {
              window.currentQuestionIndex = currentIndex + 1;
              window.changePageAndNotify(2);
            }
          }
        }
      },

      // Tap hint image near next button (opacity 45%); shows when page 2 is completed (same logic as Next button)
      {
        id: 'page2-tap-hint',
        name: 'page2-tap-hint',
        type: 'custom',
        coordinates: [1450, 820, 1500, 895],
        zIndex: 45,
        props: {
          componentType: 'TapGifComponent',
          imageSrc: 'assets/tap.gif',
          opacity: 0.45
        }
      }
    ],
  };
};

// ===== INITIALIZATION AND EXPORT =====

/**
 * Initialize Page Config
 */
const initializePageConfig = () => {
  console.log("🚀 Initializing PageConfig");

  // Create GridPositionPages
  const optimizedPages = createOptimizedGridPositionPages();

  // Make available globally
  if (typeof window !== "undefined") {
    // Store the page configuration globally
    window.GridPositionPages = optimizedPages;
    window.gridPositions = window.GridPositionPages;

    // Expose page navigation configuration globally
    window.pageNavigation = pageNavigation;

    // Expose page mapping functions globally
    window.getPageNumbers = getPageNumbers;
    window.getPageFromDotPosition = getPageFromDotPosition;
    window.getDotPositionFromPage = getDotPositionFromPage;

    // Initialize essential window functions
    console.log("🔄 [PageConfig] Initializing window functions...");

    try {
      // Create the question manager functions directly
      const advanceToNextQuestion = () => {
        return new Promise((resolve) => {
          console.log(
            "🔄 [Navigation] advanceToNextQuestion called (DIRECT IMPLEMENTATION)"
          );
          console.log(
            "🔄 [Navigation] Treating as APP RELOAD with next question"
          );

          // Simplified navigation - always reset to 0
          const { currentIndex } = getCurrentQuestionData();
          const newIndex = 0;
          console.log(
            "🔄 [Navigation]",
            getI18nText("messages.navigationReset", "Resetting to question 1")
          );

          // CRITICAL: Update question index FIRST (before any store operations)
          window.currentQuestionIndex = newIndex;
          console.log(
            "✅ [Navigation] Updated window.currentQuestionIndex to:",
            newIndex
          );

          // Reset global window variables
          window.page1complete = false;
          window.objectsremoved = 0;

          console.log(
            "✅ [Navigation]",
            getI18nText(
              "messages.navigationComplete",
              "Complete app reset completed - ready for new question"
            )
          );
          resolve(newIndex);
        });
      };

      const updateQuestionDependentElements = () => {
        console.log("🔄 [UI] Updating question-dependent elements");

        // Trigger React re-render by forcing app update
        if (typeof window.forceAppUpdate === "function") {
          window.forceAppUpdate();
          console.log("✅ [UI] Triggered React re-render via forceAppUpdate");
        } else {
          console.warn(
            "⚠️ [UI] forceAppUpdate not available, React may not re-render"
          );
        }

        // Page 2 removed - no longer needed

        console.log("✅ [UI] updateQuestionDependentElements completed");
      };

      const getNextButtonText = () => {
        // Always show "Start Over" since we only have one question now
        return getI18nText("buttons.startOver", "Start Over");
      };

      // Assign functions to window
      window.advanceToNextQuestion = advanceToNextQuestion;
      window.updateQuestionDependentElements = updateQuestionDependentElements;
      window.getNextButtonText = getNextButtonText;

      console.log("✅ [PageConfig] Direct function assignment completed");
      console.log(
        "🔍 [PageConfig] window.advanceToNextQuestion type:",
        typeof window.advanceToNextQuestion
      );
      console.log(
        "🔍 [PageConfig] window.updateQuestionDependentElements type:",
        typeof window.updateQuestionDependentElements
      );
    } catch (error) {
      console.error(
        "❌ [PageConfig] Error in direct function assignment:",
        error
      );
    }

    // Add global function to manually clear page states (for testing)
    window.clearAllPageStates = () => {
      console.log("🧹 [PageConfig] Manually clearing page states");
      try {
        // Reset global variables
        window.page1complete = false;
        window.objectsremoved = 0;
        window.currentQuestionIndex = 0;

        console.log("✅ [PageConfig] Page states cleared successfully");

        // Reload the page to start fresh
        if (
          confirm(
            getI18nText(
              "messages.pageStatesCleared",
              "Page states have been cleared. Reload the page to start fresh?"
            )
          )
        ) {
          window.location.reload();
        }
      } catch (error) {
        console.error("❌ [PageConfig] Error clearing page states:", error);
      }
    };

    // Function to copy text from source element to destination element by ID
    // sourceId: ID of the element to read text from (e.g., 'page2-map-table-R1C1' - a table cell)
    // destinationId: ID of the element to update (e.g., 'page2-number-pad' - number pad target, or any other element ID)
    window.updateTargetIDText = (sourceId, destinationId, retryCount = 0) => {
      try {
        const maxRetries = 5;
        const retryDelay = 200;
        
        const attemptUpdate = () => {
          const sourceElement = document.getElementById(sourceId);
          
          if (sourceElement) {
            const sourceText = sourceElement.textContent?.trim() || sourceElement.innerText?.trim() || '';
            console.log(`🎯 [PageConfig] Reading text from source ${sourceId}:`, sourceText);
            
            // Try to update number pad target first (if destination is a number pad)
            if (window.numberPadCallbacks && window.numberPadCallbacks[destinationId]) {
              window.numberPadCallbacks[destinationId].updateTarget(sourceText);
              console.log(`✅ [PageConfig] Updated number pad ${destinationId} target to:`, sourceText);
              return;
            }
            
            // Otherwise, update destination element's text content
            const destinationElement = document.getElementById(destinationId);
            if (destinationElement) {
              destinationElement.textContent = sourceText;
              destinationElement.innerText = sourceText;
              console.log(`✅ [PageConfig] Updated element ${destinationId} text to:`, sourceText);
            } else {
              // Retry if destination element not found yet
              if (retryCount < maxRetries) {
                console.log(`🔄 [PageConfig] Destination element ${destinationId} not found, retrying... (${retryCount + 1}/${maxRetries})`);
                setTimeout(() => {
                  window.updateTargetIDText(sourceId, destinationId, retryCount + 1);
                }, retryDelay);
              } else {
                console.warn(`⚠️ [PageConfig] Destination element not found: ${destinationId} after ${maxRetries} retries`);
              }
            }
          } else {
            // Retry if source element not found yet
            if (retryCount < maxRetries) {
              console.log(`🔄 [PageConfig] Source element ${sourceId} not found, retrying... (${retryCount + 1}/${maxRetries})`);
              setTimeout(() => {
                window.updateTargetIDText(sourceId, destinationId, retryCount + 1);
              }, retryDelay);
            } else {
              console.warn(`⚠️ [PageConfig] Source element not found: ${sourceId} after ${maxRetries} retries`);
            }
          }
        };
        
        // Initial delay to ensure DOM is ready
        if (retryCount === 0) {
          setTimeout(attemptUpdate, retryDelay);
        } else {
          attemptUpdate();
        }
      } catch (error) {
        console.error('❌ [PageConfig] Error updating target text:', error);
      }
    };

    // Listen for page changes to update number pad target on page 2
    // DISABLED: Elements don't exist in this applet
    /*
    if (typeof window !== 'undefined') {
      window.addEventListener('pageChanged', (event) => {
        const pageNumber = event.detail?.page;
        if (pageNumber === 2) {
          // Copy text from table cell R1C1 (row 1, column 1) to number pad target
          // sourceId: 'page2-map-table-R1C1' - the table cell to read from
          // destinationId: 'page2-number-pad' - the number pad to update
          window.updateTargetIDText('page2-map-table-R1C1', 'page2-number-pad');
        }
      });
    }
    */

    console.log(
      "✅ PageConfig initialized - pages and functions available globally"
    );
    console.log(
      "💡 [PageConfig] Use window.clearAllPageStates() to manually clear page states"
    );
    console.log(
      "💡 [PageConfig] Use window.updateTargetIDText(sourceId, destinationId) to copy text from any source element to any destination element"
    );
  }

  return optimizedPages;
};

// Initialize immediately
console.log("🔄 [PageConfig] About to call initializePageConfig...");
const OptimizedGridPositionPages = initializePageConfig();
console.log(
  "🔄 [PageConfig] initializePageConfig completed, result:",
  typeof OptimizedGridPositionPages
);

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    OptimizedGridPositionPages,
  };
} else {
  // Browser global export
  window.PageConfigOptimized = {
    OptimizedGridPositionPages,
  };
}

console.log("🎉 PageConfig optimization complete!");

// ===== AI SURFACE REGISTRATION =====
// Surfaces register themselves whenever the active page changes.
// Inert when window.AppAPI is not present (e.g. AI scaffolding not loaded).
(function () {
  if (typeof window === 'undefined') return;

  function syncSurfaces(page) {
    if (!window.AppAPI || !window.AppAPI._registry) return;

    // Drop any surface from the previous page (registry's forPage filter is by scope,
    // we only need the current page mounted at any time).
    const list = window.AppAPI._registry.list();
    for (const s of list) {
      if (!s.scope || s.scope.page !== page) {
        window.AppAPI._unregisterSurface(s.id);
      }
    }

    // Mount fresh surfaces for the new page.
    if (page === 1 && typeof window.Page1Surface === 'function') {
      window.AppAPI._registerSurface(new window.Page1Surface());
    } else if (page === 2 && typeof window.Page2Surface === 'function') {
      window.AppAPI._registerSurface(new window.Page2Surface());
    }
  }

  window.addEventListener('pageChanged', (e) => {
    const page = (e && e.detail && e.detail.page) || 1;
    syncSurfaces(page);
  });

  // Initial sync after applet boots (math-applet.js dispatches pageChanged on first nav).
  // Belt-and-braces: also sync on DOMContentLoaded if no event has fired yet.
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const cp = (typeof window.getCurrentPage === 'function') ? window.getCurrentPage() : 1;
      syncSurfaces(cp);
    }, 200);
  });
})();
