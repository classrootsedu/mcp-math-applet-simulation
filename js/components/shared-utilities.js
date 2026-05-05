/**
 * Shared Utilities for React 18 Components
 * 
 * This file contains common utilities and helper functions used across all components:
 * - Element factory creation with React 18 optimizations
 * - Error boundaries and loading fallbacks
 * - Context providers and hooks
 * - Common styling utilities
 */

/**
 * Creates a memoized element factory with React 18 optimizations
 * @param {string} elementType - Type of element
 * @param {Function} createFn - Element creation function
 * @returns {Function} Optimized element factory
 */
const createOptimizedElementFactory = (elementType, createFn) => {
  return React.memo(React.forwardRef((props, ref) => {
    const elementId = React.useId();
    const [isPending, startTransition] = React.useTransition();
    const deferredProps = React.useDeferredValue(props);
    
    // Use insertion effect for DOM manipulations that need to happen before layout
    React.useInsertionEffect(() => {
      if (ref?.current && elementType === 'table') {
        // Optimize table rendering with insertion effect
        ref.current.setAttribute('data-element-type', elementType);
      }
    }, [elementType, ref]);
    
    const element = React.useMemo(() => {
      return createFn(deferredProps, elementId);
    }, [deferredProps, elementId]);
    
    return element;
  }));
};

/**
 * Creates a memoized element creation function with React 18 optimizations
 * @param {string} elementType - Type of element being created
 * @param {Function} createFn - Element creation function
 * @returns {Function} Optimized element creator
 */
const createOptimizedElementCreator = (elementType, createFn) => {
  return React.memo((props) => {
    const elementId = React.useId();
    const [isPending, startTransition] = React.useTransition();
    const deferredProps = React.useDeferredValue(props);
    
    // Memoize the element creation to prevent unnecessary re-renders
    const element = React.useMemo(() => {
      try {
        return createFn(deferredProps, elementId);
      } catch (error) {
        console.error(`❌ [${elementType}] Creation error:`, error);
        return null;
      }
    }, [deferredProps, elementId]);
    
    return React.createElement(ElementErrorBoundary, {
      elementName: elementType,
      key: elementId
    }, element);
  });
};

/**
 * Suspense Loading Component for Heavy Elements
 */
const ElementLoadingFallback = React.memo(({ elementType = 'element' }) => {
  const loadingId = React.useId();
  
  return React.createElement('div', {
    className: 'element-loading-fallback',
    'aria-labelledby': loadingId
  }, [
    React.createElement('div', {
      key: 'spinner',
      className: 'spinner'
    }),
    React.createElement('span', { 
      key: 'message',
      id: loadingId 
    }, `Loading ${elementType}...`)
  ]);
});

/**
 * Enhanced Error Boundary for Element Creation
 */
const ElementErrorBoundary = React.memo(({ children, elementName, fallback }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const errorId = React.useId();
  
  React.useEffect(() => {
    if (hasError) {
      console.error(`❌ [ElementErrorBoundary] Error in ${elementName}:`, error);
    }
  }, [hasError, error, elementName]);
  
  const retry = React.useCallback(() => {
    if (retryCount < 3) {
      startTransition(() => {
        setHasError(false);
        setError(null);
        setRetryCount(prev => prev + 1);
      });
    }
  }, [retryCount]);
  
  if (hasError) {
    return fallback || React.createElement('div', {
      id: errorId,
      className: 'element-error-boundary'
    }, [
      React.createElement('div', { key: 'title' }, `Error in ${elementName}`),
      retryCount < 3 && React.createElement('button', {
        key: 'retry',
        onClick: retry
      }, `Retry (${3 - retryCount} attempts left)`)
    ]);
  }
  
  return children;
});

/**
 * Suspense wrapper for heavy element creation
 */
const SuspenseElementWrapper = React.memo(({ children, elementType, fallback }) => {
  const loadingFallback = fallback || React.createElement('div', {
    className: 'element-suspense-fallback'
  }, [
    React.createElement('div', {
      key: 'spinner',
      className: 'spinner'
    }),
    React.createElement('span', { key: 'text' }, `Loading ${elementType}...`)
  ]);
  
  return React.createElement(React.Suspense, { fallback: loadingFallback }, children);
});

/**
 * Element Context for sharing element state across components
 */
const ElementContext = React.createContext({
  elements: new Map(),
  updateElement: () => {},
  removeElement: () => {}
});

/**
 * Element Provider Component
 */
const ElementProvider = ({ children }) => {
  const [elements, setElements] = React.useState(new Map());
  
  const updateElement = React.useCallback((elementId, updates) => {
    startTransition(() => {
      setElements(prev => {
        const newElements = new Map(prev);
        const existing = newElements.get(elementId) || {};
        newElements.set(elementId, { ...existing, ...updates });
        return newElements;
      });
    });
  }, []);
  
  const removeElement = React.useCallback((elementId) => {
    startTransition(() => {
      setElements(prev => {
        const newElements = new Map(prev);
        newElements.delete(elementId);
        return newElements;
      });
    });
  }, []);
  
  const contextValue = React.useMemo(() => ({
    elements,
    updateElement,
    removeElement
  }), [elements, updateElement, removeElement]);
  
  return React.createElement(ElementContext.Provider, {
    value: contextValue
  }, children);
};

/**
 * Hook to use element context
 */
const useElements = () => {
  const context = React.useContext(ElementContext);
  if (!context) {
    throw new Error('useElements must be used within an ElementProvider');
  }
  return context;
};

// Export all utilities
window.SharedUtilities = {
  createOptimizedElementFactory,
  createOptimizedElementCreator,
  ElementLoadingFallback,
  ElementErrorBoundary,
  SuspenseElementWrapper,
  ElementContext,
  ElementProvider,
  useElements
};

console.log('✅ Shared utilities loaded successfully');
