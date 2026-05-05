/**
 * Components Index - React 18 Optimized
 * 
 * This file serves as the main entry point for all components.
 * It ensures proper loading order and provides a centralized way to access all components.
 * 
 * Loading order is important:
 * 1. shared-utilities.js (utilities and context)
 * 2. layout-components.js (basic layout elements)
 * 3. interaction-components.js (buttons, character, dialog)
 * 4. progress-components.js (progress dots)
 * 5. partitioned-rectangle-component.js (complex layout component)
 * 6. number-pad-component.js (most complex component)
 * 7. elements-registry.js (aggregates everything into StandardElements and ElementsUtils)
 */

console.log('🔄 Loading components in order...');

// Components are loaded via script tags in HTML, this file just provides documentation
// and ensures all components are available globally

// Verify all components are loaded
const checkComponentsLoaded = () => {
  const requiredComponents = [
    'SharedUtilities',
    'LayoutComponents', 
    'InteractionComponents',
    'ProgressComponents',
    'PartitionedRectangleComponent',
    'NumberPadComponent',
    'QuadrilateralComponent',
    'AngleMarkerComponent',
    'PropertyIndicatorComponent',
    'PropertyPanelComponent',
    'StageComponent',
    'CalculationStepsComponent',
    'LongDivisionGrid',
    'LongAdditionGrid',
    'LongSubtractionGrid',
    'StandardElements',
    'ElementsUtils'
  ];
  
  const missingComponents = requiredComponents.filter(name => !window[name]);
  
  if (missingComponents.length > 0) {
    console.warn('⚠️ Missing components:', missingComponents);
    return false;
  }
  
  console.log('✅ All components loaded successfully');
  console.log('📊 Available StandardElements:', Object.keys(window.StandardElements || {}));
  console.log('🔧 Available ElementsUtils:', Object.keys(window.ElementsUtils || {}));
  return true;
};

// Export a function to check if all components are loaded
window.checkComponentsLoaded = checkComponentsLoaded;

// Auto-check when this file loads (with longer delay to ensure all components are initialized)
setTimeout(() => {
  const result = checkComponentsLoaded();
  if (!result) {
    // If components are still missing, check again after a longer delay
    setTimeout(() => {
      const result2 = checkComponentsLoaded();
      if (!result2) {
        // Final check after even longer delay for async components
        setTimeout(checkComponentsLoaded, 1000);
      }
    }, 500);
  }
}, 300);

console.log('✅ Components index loaded successfully');
