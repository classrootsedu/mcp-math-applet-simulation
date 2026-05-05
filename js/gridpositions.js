/**
 * GRID POSITIONS SYSTEM
 * ====================
 * Page-based grid positioning system using single coordinate arrays
 * All text is internationalized via data.js
 * Uses linear scaling instead of breakpoint-based responsive design
 */



// Debug function to verify positioning calculations
const debugGridPositioning = (elementName = null) => {
    console.log('🔍 Grid Positioning Debug Report');
    console.log('================================');
    
    const gridElements = elementName ? 
        document.querySelectorAll(`[data-grid-position="${elementName}"]`) :
        document.querySelectorAll('[data-grid-position]');
    
    gridElements.forEach(element => {
        const gridPosition = element.getAttribute('data-grid-position');
        const coordinates = element.getAttribute('data-coordinates');
        const rect = element.getBoundingClientRect();
        const containerRect = document.querySelector('.main-container').getBoundingClientRect();
        
        // Calculate expected positions based on current grid system
        const [x1, y1, x2, y2] = coordinates.slice(1, -1).split(', ').map(Number);
        const config = GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision];
        const expectedLeft = ((x1 - 1) / config.cols) * 100;
        const expectedTop = ((y1 - 1) / config.rows) * 100;
        const expectedWidth = ((x2 - x1 + 1) / config.cols) * 100;
        const expectedHeight = ((y2 - y1 + 1) / config.rows) * 100;
        
        // Calculate actual positions as percentages
        const actualLeft = ((rect.left - containerRect.left) / containerRect.width) * 100;
        const actualTop = ((rect.top - containerRect.top) / containerRect.height) * 100;
        const actualWidth = (rect.width / containerRect.width) * 100;
        const actualHeight = (rect.height / containerRect.height) * 100;
        
        console.log(`\n📍 Element: ${gridPosition}`);
        console.log(`   Coordinates: ${coordinates}`);
        console.log(`   Expected: left=${expectedLeft.toFixed(2)}%, top=${expectedTop.toFixed(2)}%, width=${expectedWidth.toFixed(2)}%, height=${expectedHeight.toFixed(2)}%`);
        console.log(`   Actual:   left=${actualLeft.toFixed(2)}%, top=${actualTop.toFixed(2)}%, width=${actualWidth.toFixed(2)}%, height=${actualHeight.toFixed(2)}%`);
        
        const leftDiff = Math.abs(expectedLeft - actualLeft);
        const topDiff = Math.abs(expectedTop - actualTop);
        const widthDiff = Math.abs(expectedWidth - actualWidth);
        const heightDiff = Math.abs(expectedHeight - actualHeight);
        
        if (leftDiff > 0.1 || topDiff > 0.1 || widthDiff > 0.1 || heightDiff > 0.1) {
            console.log(`   ⚠️  MISMATCH: left=${leftDiff.toFixed(2)}%, top=${topDiff.toFixed(2)}%, width=${widthDiff.toFixed(2)}%, height=${heightDiff.toFixed(2)}%`);
        } else {
            console.log(`   ✅ ALIGNED`);
        }
    });
    
    console.log('\n📏 Grid System Info:');
    const config = GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision];
    console.log(`   Precision: ${GridPrecisionConfig.currentPrecision}x`);
    console.log(`   Dimensions: ${config.cols}x${config.rows}`);
    console.log(`   Container Size: ${document.querySelector('.main-container').getBoundingClientRect().width}x${document.querySelector('.main-container').getBoundingClientRect().height}`);
    
    return true;
};

// Import GridPrecisionConfig for grid calculations
// Dependencies: GridPrecisionConfig, StandardElements, GridCellFontUtils, GridPositionPages
// These should be loaded before this file

// Standard positioning template for consistent placement across all pages
// Now acts as a proxy to StandardElements to maintain backward compatibility
const StandardPositions = StandardElements;

// Main grid positioning class
class GridPositions {
    constructor() {
        // Get current precision from GridPrecisionConfig
        const currentPrecision = GridPrecisionConfig.currentPrecision;
        const precisionSettings = GridPrecisionConfig.precisionSettings[currentPrecision];
        
        // Initialize with current precision values
        this.gridDimensions = {
            columns: precisionSettings.cols,
            rows: precisionSettings.rows,
            precision: currentPrecision
        };
        
        console.log(`🎯 Grid dimensions initialized with precision ${currentPrecision}: ${precisionSettings.cols}x${precisionSettings.rows}`);
        
        // Base screen dimensions for scaling (16:9 aspect ratio)
        this.baseScreenDimensions = {
            width: 1600,
            height: 900
        };
        
        // Cache for performance
        this.cache = new Map();
        this.lastScreenSize = { width: 0, height: 0 };
        
        // Initialize
        this.updateScreenDimensions();
        this.setupResizeListener();
        this.syncWithGridCellUnits();
    }
    
    /**
     * Update grid dimensions based on current precision
     */
    updateGridDimensions() {
        try {
            // Use synchronous import from top of file
            const currentPrecision = GridPrecisionConfig.currentPrecision;
            const precisionSettings = GridPrecisionConfig.precisionSettings[currentPrecision];
            
            if (precisionSettings) {
                this.gridDimensions = {
                    columns: precisionSettings.cols,
                    rows: precisionSettings.rows,
                    precision: currentPrecision
                };
                console.log(`🎯 Grid dimensions updated to precision ${currentPrecision}: ${precisionSettings.cols}x${precisionSettings.rows}`);
                this.cache.clear(); // Clear cache when dimensions change
                
                // Force refresh if available
                if (typeof window !== 'undefined' && window.forceRefreshConfig) {
                    window.forceRefreshConfig();
                }
            }
        } catch (error) {
            console.warn('⚠️ Error updating grid dimensions:', error);
        }
    }
    
    /**
     * Force refresh grid dimensions and clear cache
     */
    forceRefreshGridDimensions() {
        console.log('🔄 Forcing grid dimensions refresh...');
        this.cache.clear();
        this.updateGridDimensions();
    }
    
    /**
     * Update screen dimensions and clear cache if changed
     */
    updateScreenDimensions() {
        const currentSize = {
            width: typeof window !== 'undefined' ? window.innerWidth : 1600,
            height: typeof window !== 'undefined' ? window.innerHeight : 900
        };
        
        if (currentSize.width !== this.lastScreenSize.width || 
            currentSize.height !== this.lastScreenSize.height) {
            this.lastScreenSize = currentSize;
            this.cache.clear();
        }
    }
    
    /**
     * Setup resize listener with throttling
     */
    setupResizeListener() {
        if (typeof window !== 'undefined') {
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.updateScreenDimensions();
                }, 100);
            });
        }
    }
    
    /**
     * Calculate linear scale factor based on screen size
     */
    getScaleFactor() {
        const screenWidth = typeof window !== 'undefined' ? window.innerWidth : this.baseScreenDimensions.width;
        const screenHeight = typeof window !== 'undefined' ? window.innerHeight : this.baseScreenDimensions.height;
        
        const widthScale = screenWidth / this.baseScreenDimensions.width;
        const heightScale = screenHeight / this.baseScreenDimensions.height;
        
        return Math.min(widthScale, heightScale);
    }
    
    /**
     * Get position data for any element from StandardPositions
     */
    getElement(elementName) {
        const cacheKey = `element_${elementName}_${this.lastScreenSize.width}x${this.lastScreenSize.height}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const element = StandardPositions[elementName];
        if (!element) {
            console.warn(`Element "${elementName}" not found in StandardPositions`);
            return null;
        }
        
        // Calculate coordinates based on element type
        let coordinates = element.coordinates;
        if (element.type === 'grid') {
            coordinates = this.calculateGridCoordinates(element);
        }
        
        const position = this.convertToCSS(coordinates, elementName, 'standard', element.type);
        this.cache.set(cacheKey, position);
        return position;
    }
    
    /**
     * Get position data for a standard element (alias for backward compatibility)
     */
    getStandardElement(elementName) {
        return this.getElement(elementName);
    }
    
    /**
     * Get position data for a screen-specific element (alias for backward compatibility)
     */
    getScreenElement(elementName) {
        return this.getElement(elementName);
    }
    
    /**
     * Create a custom element with coordinates
     */
    createCustomElement(coordinates, description = '') {
        return this.convertToCSS(coordinates, 'custom', 'custom', description);
    }
    
    /**
     * Calculate grid coordinates for grid-type elements
     */
    calculateGridCoordinates(gridElement) {
        const [x1, y1] = gridElement.coordinates;
        const { gridStructure, defaultCellSize, columnOverrides } = gridElement.props;
        
        // Calculate total grid width accounting for column overrides
        let totalGridWidthInCells = 0;
        for (let col = 1; col <= gridStructure.columns; col++) {
            const colWidth = columnOverrides[`col${col}`]?.columns || defaultCellSize.columns;
            totalGridWidthInCells += colWidth;
        }
        
        // Calculate bottom coordinates based on actual grid dimensions
        const gridHeightInCells = gridStructure.rows * defaultCellSize.rows;
        const gridWidthInCells = totalGridWidthInCells;
        
        const x2 = x1 + gridWidthInCells - 1;
        const y2 = y1 + gridHeightInCells - 1;
        
        console.log(`🔍 [Grid Coordinates] ${gridElement.type || 'Unknown'} element:`);
        console.log(`  Top-left: [${x1}, ${y1}]`);
        console.log(`  Grid: ${gridStructure.rows}×${gridStructure.columns} (${gridHeightInCells}×${gridWidthInCells} cells)`);
        console.log(`  Column overrides:`, columnOverrides);
        console.log(`  Total width: ${totalGridWidthInCells} cells`);
        console.log(`  Bottom-right: [${x2}, ${y2}]`);
        console.log(`  Final: [${x1}, ${y1}, ${x2}, ${y2}] (x1,y1,x2,y2)`);
        
        return [x1, y1, x2, y2];
    }
    
    /**
     * Convert grid coordinates to CSS positioning with linear scaling
     */
    convertToCSS(coordinates, elementName, type, elementType = '') {
        const [x1, y1, x2, y2] = coordinates;
        
        // Define old variable names for compatibility
        const topRow = y1;
        const topCol = x1;
        const bottomRow = y2;
        const bottomCol = x2;
        
        // Calculate base percentages
        const baseLeft = ((x1 - 1) / this.gridDimensions.columns) * 100;
        const baseTop = ((y1 - 1) / this.gridDimensions.rows) * 100;
        const baseWidth = ((x2 - x1) / this.gridDimensions.columns) * 100;
        const baseHeight = ((y2 - y1) / this.gridDimensions.rows) * 100;
        
        // Debug logging for table elements and custom elements
        if (elementType === 'table' || elementType === 'custom' || elementName.includes('table')) {
            console.log(`🎯 [CSS Conversion] ${elementName}:`);
            console.log(`  - Input coordinates: [${x1}, ${y1}, ${x2}, ${y2}] (x1,y1,x2,y2)`);
            console.log(`  - Grid dimensions: ${this.gridDimensions.rows} × ${this.gridDimensions.columns}`);
            console.log(`  - Size calculation: width=${x2}-${x1}=${x2 - x1}, height=${y2}-${y1}=${y2 - y1}`);
            console.log(`  - CSS percentages: left=${baseLeft.toFixed(2)}%, top=${baseTop.toFixed(2)}%, width=${baseWidth.toFixed(2)}%, height=${baseHeight.toFixed(2)}%`);
            console.log(`  - Final CSS object:`, {
                position: 'absolute',
                left: `${baseLeft.toFixed(2)}%`,
                top: `${baseTop.toFixed(2)}%`, 
                width: `${baseWidth.toFixed(2)}%`,
                height: `${baseHeight.toFixed(2)}%`
            });
        }
        
        // Apply linear scaling
        const scaleFactor = this.getScaleFactor();
        const minScale = 0.5;
        const maxScale = 2.0;
        const adjustedScale = Math.max(minScale, Math.min(maxScale, scaleFactor));
        
        const left = baseLeft;
        const top = baseTop;
        const width = baseWidth;
        const height = baseHeight;
        
        // Get description from i18n if available
        let description = elementType;
        if (type !== 'custom' && typeof i18n !== 'undefined') {
            const key = `gridPositions.${type}Elements.${elementName}`;
            description = i18n.t(key) || elementType;
        }
        
        // Base CSS properties
        const baseCss = {
            position: 'absolute',
            left: `${left.toFixed(2)}%`,
            top: `${top.toFixed(2)}%`,
            width: `${width.toFixed(2)}%`,
            height: `${height.toFixed(2)}%`,
            '--scale-factor': adjustedScale.toFixed(3),
            margin: '0',
            padding: '0',
            boxSizing: 'border-box'
        };
        
        // Debug styles removed - use debugGridPositioning() for debugging
        
        return {
            coordinates: coordinates,
            css: baseCss,
            gridString: `R${topRow}C${topCol}-R${bottomRow}C${bottomCol}`,
            description: description,
            scaleFactor: adjustedScale,
            type: type,
            elementType: elementType,
            elementName: elementName
        };
    }
    
    /**
     * Apply positioning to a DOM element
     */
    applyPosition(element, positionName, type = 'standard') {
        this.updateScreenDimensions();
        
        const position = this.getElement(positionName);
        
        if (!position) {
            console.warn(`Position "${positionName}" not found`);
            return;
        }
        
        // Apply CSS styles
        Object.assign(element.style, position.css);
        
        // Add data attributes for debugging
        element.setAttribute('data-grid-position', positionName);
        element.setAttribute('data-grid-coordinates', position.gridString);
        element.setAttribute('data-grid-type', type);
        element.setAttribute('data-scale-factor', position.scaleFactor);
    }
    
    /**
     * Get current scale factor for manual adjustments
     */
    getCurrentScaleFactor() {
        return this.getScaleFactor();
    }
    
    /**
     * Sync precision with grid cell units system
     */
    syncWithGridCellUnits() {
        if (typeof gridCellUnits !== 'undefined') {
            gridCellUnits.setPrecision(this.gridDimensions.precision);
        }
    }
    
    /**
     * Clear cache (useful for debugging or manual refresh)
     */
    clearCache() {
        this.cache.clear();
        if (typeof gridCellUnits !== 'undefined') {
            gridCellUnits.clearCache();
        }
    }
}





// Helper functions for working with grid positions
const GridPositionUtils = {
    // Get all elements for a specific page
    getPageElements: (pageNumber) => {
        return GridPositionPages[pageNumber] || [];
    },

    // Get a specific element from a page
    getPageElement: (pageNumber, elementName) => {
        // console.log(`🔍 [getPageElement] Looking for element "${elementName}" on page ${pageNumber}`);
        const pageElements = GridPositionPages[pageNumber] || [];
        // console.log(`🔍 [getPageElement] Page ${pageNumber} elements:`, pageElements);
        // console.log(`🔍 [getPageElement] Available element names:`, pageElements.map(el => el.name));
        const foundElement = pageElements.find(element => element.name === elementName);
        // console.log(`🔍 [getPageElement] Found element:`, foundElement);
        return foundElement;
    },

    // Convert coordinates to CSS grid area
    // Coordinates format: [x1, y1, x2, y2] where:
    // - x1 = left column number, x2 = right column number
    // - y1 = top row number, y2 = bottom row number
    coordinatesToCSS: (coordinates) => {
        const [x1, y1, x2, y2] = coordinates;
        
        const config = GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision];
        
        const left = ((x1 - 1) / config.cols) * 100;
        const top = ((y1 - 1) / config.rows) * 100;
        const width = ((x2 - x1 + 1) / config.cols) * 100;
        const height = ((y2 - y1 + 1) / config.rows) * 100;
        
        return {
            position: 'absolute',
            left: `${left.toFixed(2)}%`,
            top: `${top.toFixed(2)}%`,
            width: `${width.toFixed(2)}%`,
            height: `${height.toFixed(2)}%`
        };
    },

    // Update element position in StandardPositions
    updateElementPosition: (elementName, coordinates) => {
        if (StandardPositions[elementName]) {
            const element = StandardPositions[elementName];
            
            // For grid elements, only allow updating top coordinates
            if (element.type === 'grid') {
                if (coordinates.length === 2) {
                    element.coordinates = coordinates; // [topRow, topCol]
                } else {
                    console.warn(`Grid elements only accept [topRow, topCol] coordinates. Got:`, coordinates);
                    return;
                }
            } else {
                element.coordinates = coordinates; // [x1, y1, x2, y2]
            }
            
            // Clear cache to force recalculation
            if (typeof gridPositions !== 'undefined') {
                gridPositions.clearCache();
            }
        }
    },

    // Add new element to StandardPositions
    addElement: (elementName, elementData) => {
        const newElement = {
            type: elementData.type || 'container',
            coordinates: elementData.coordinates || [1, 1, 2, 2],
            zIndex: elementData.zIndex || 100,
            props: elementData.props || {}
        };
        
        // Validate coordinates based on type
        if (newElement.type === 'grid') {
            if (newElement.coordinates.length === 4) {
                // Convert to grid format [x1, y1]
                newElement.coordinates = [newElement.coordinates[0], newElement.coordinates[1]];
                console.log(`🔄 Converted grid coordinates to [${newElement.coordinates.join(', ')}] format`);
            }
        }
        
        StandardPositions[elementName] = newElement;
        
        // Clear cache to force recalculation
        if (typeof gridPositions !== 'undefined') {
            gridPositions.clearCache();
        }
    },

    // Remove element from StandardPositions
    removeElement: (elementName) => {
        if (StandardPositions[elementName]) {
            delete StandardPositions[elementName];
            // Clear cache to force recalculation
            if (typeof gridPositions !== 'undefined') {
                gridPositions.clearCache();
            }
        }
    },

    // Get element by name from StandardPositions
    getElement: (elementName) => {
        return StandardPositions[elementName] || null;
    },

    // Get all available elements
    getAllElements: () => {
        return Object.keys(StandardPositions).map(name => {
            const element = StandardPositions[name];
            const description = typeof i18n !== 'undefined' ? 
                i18n.t(`gridPositions.standardElements.${name}`) : 
                name;
            
            // Show different coordinate format for grids
            let coordinatesDisplay;
            if (element.type === 'grid') {
                coordinatesDisplay = `[${element.coordinates.join(', ')}] (auto-calculated bottom)`;
            } else {
                coordinatesDisplay = `[${element.coordinates.join(', ')}]`;
            }
            
            return {
                name,
                description,
                coordinates: coordinatesDisplay,
                zIndex: element.zIndex,
                elementType: element.type,
                type: 'standard'
            };
        });
    },

    // Validate grid coordinates
    isValidGridCoordinate: (coord) => {
        if (Array.isArray(coord) && coord.length === 2) {
            const [row, col] = coord;
            const config = GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision];
            return row >= 1 && row <= config.rows && col >= 1 && col <= config.cols;
        }
        return false;
    },

    // Validate grid coordinate range
    isValidGridRange: (coordinates) => {
        if (Array.isArray(coordinates) && coordinates.length === 4) {
            const [x1, y1, x2, y2] = coordinates;
            const config = GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision];
            
            return y1 >= 1 && y1 <= config.rows &&
                   x1 >= 1 && x1 <= config.cols &&
                   y2 >= 1 && y2 <= config.rows &&
                   x2 >= 1 && x2 <= config.cols &&
                   y1 <= y2 && x1 <= x2;
        }
        return false;
    },

    // Create element from StandardPositions with custom text
    createStandardElement: (standardName, customProps = {}) => {
        const standardElement = StandardPositions[standardName];
        if (!standardElement) {
            console.warn(`Standard element "${standardName}" not found`);
            return null;
        }

        return {
            name: standardName,
            ...standardElement,
            props: {
                ...standardElement.props,
                ...customProps
            }
        };
    },

    // Create dialog with i18n text
    createDialogElement: (textKey, customProps = {}) => {
        const dialogElement = StandardPositions.dialogBubble;
        return {
            name: 'dialog-bubble',
            ...dialogElement,
            props: {
                ...dialogElement.props,
                get text() {
                    return typeof i18n !== 'undefined' ? i18n.t(textKey) : `[Missing: ${textKey}]`;
                },
                ...customProps
            }
        };
    },

    // Test Functions
    // ==============

    // Test grid cell font conversion system
    testGridCellFontConversion: () => {
        console.log('🧪 Testing Grid Cell Font Conversion');
        console.log('====================================');
        
        const testValues = ['100gc', '190gc', '400gc', '800gc', '1000gc'];
        
        testValues.forEach(value => {
            const converted = GridCellFontUtils.convertGcToPixels(value);
            console.log(`${value} -> ${converted}`);
        });
        
        console.log('\n📊 Current Grid Configuration:');
        console.log(`Precision: ${GridPrecisionConfig.currentPrecision}x`);
        console.log(`Grid: ${GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].cols}x${GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].rows}`);
        if (typeof window !== 'undefined') {
            console.log(`Screen: ${window.innerWidth}x${window.innerHeight}`);
            console.log(`Cell Height: ${window.innerHeight / GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].rows}px`);
        }
        
        console.log('\n🎯 Dialog Options Test:');
        const dialogOptions = StandardPositions.dialogBubble.props.options;
        console.log('Standard Dialog Options:', dialogOptions);
        
        const pageElement = GridPositionUtils.getPageElement(1, 'dialog-bubble');
        if (pageElement) {
            console.log('Page Dialog Options:', pageElement.props.options);
        }
        
        // Test direct conversion of 800gc
        console.log('\n🧪 Direct 800gc Test:');
        const direct800gc = GridCellFontUtils.convertGcToPixels('800gc');
        console.log('Direct 800gc conversion:', direct800gc);
        
        return true;
    },

    // Test cellStyles gc unit conversion (deprecated)
    testCellStylesConversion: () => {
        console.log('🧪 Testing CellStyles GC Unit Conversion');
        console.log('========================================');
        
        console.log('\n✅ Test completed (deprecated)');
        return true;
    },

    // Test grid border configurations (deprecated)
    testGridBorders: () => {
        console.log('🧪 Testing Grid Border Configurations');
        console.log('====================================');
        
        console.log('\n🎨 Modern table styling options:');
        console.log('1. containerStyles: { border: "1px solid #ccc", borderRadius: "5gc" }');
        console.log('2. cellStyles: { border: "1px solid rgba(0,0,0,0.1)", padding: "5gc" }');
        console.log('3. animations: { enabled: true, type: "scale", duration: "0.2s" }');
        console.log('4. behavior: { clickable: true, hoverable: true, selectable: false }');
        
        return true;
    },

    // Test grid configuration gc unit conversion
    testGridConfigConversion: () => {
        console.log('🧪 Testing Grid Configuration GC Unit Conversion');
        console.log('===============================================');
        
        // Test the processGridConfig function directly
        const testGridConfig = {
            gridStructure: {
                columns: 4,
                rows: 6
            },
            defaultCellSize: {
                rows: '200gc',      // Test gc conversion in defaultCellSize
                columns: '150gc'    // Test gc conversion in defaultCellSize
            },
            columnOverrides: {
                'col1': {
                    columns: '100gc',   // Test gc conversion in columnOverrides
                    rows: 8
                },
                'col2': {
                    columns: 12,
                    rows: '250gc'       // Test gc conversion in columnOverrides
                }
            },
            rowOverrides: {
                'row1': {
                    rows: '180gc',      // Test gc conversion in rowOverrides
                    columns: 10
                },
                'row2': {
                    rows: 15,
                    columns: '120gc'    // Test gc conversion in rowOverrides
                }
            }
        };
        
        console.log('Original grid configuration:', testGridConfig);
        
        const processed = GridCellFontUtils.processGridConfig(testGridConfig);
        console.log('Processed grid configuration:', processed);
        
        // Test with table configuration
        console.log('\n📋 Testing Table Configuration:');
        
        // Test with page 1 configuration  
        console.log('\n📋 Testing Page 1 Table Configuration:');
        const page1Table = GridPositionUtils.getPageElement(1, 'visual-rep-table');
        if (page1Table) {
            const page1Options = typeof page1Table.props === 'function' ? page1Table.props() : page1Table.props;
            console.log('Page 1 gridStructure:', page1Options.gridStructure);
            console.log('Page 1 defaultCellSize:', page1Options.defaultCellSize);
            console.log('Page 1 columnOverrides:', page1Options.columnOverrides);
            console.log('Page 1 rowOverrides:', page1Options.rowOverrides);
        } else {
            console.log('No table element found on page 1');
        }
        
        console.log('\n✅ Grid configuration gc conversion test completed');
        return true;
    },

    // Test cellOverrides gc unit conversion
    testCellOverridesConversion: () => {
        console.log('🧪 Testing CellOverrides GC Unit Conversion');
        console.log('===========================================');
        
        // Test the processCellOverrides function directly
        const testCellOverrides = {
            '1,1': {
                content: 'Test A',
                textStyles: {
                    fontSize: '400gc',
                    padding: '100gc',
                    color: '#ff0000'
                }
            },
            '1,2': {
                content: 'Test B',
                style: {
                    borderRadius: '75gc',
                    backgroundColor: 'blue',
                    margin: '50gc'
                }
            },
            '1,3': {
                content: 'Test C',
                textStyles: {
                    fontSize: '300gc'
                },
                style: {
                    padding: '25gc'
                }
            }
        };
        
        console.log('Original cellOverrides:', testCellOverrides);
        
        const processed = GridCellFontUtils.processCellOverrides(testCellOverrides);
        console.log('Processed cellOverrides:', processed);
        
        // Test with page 1 configuration (modern table system)
        console.log('\n📋 Testing Page 1 Table CellOverrides:');
        const page1Table = GridPositionUtils.getPageElement(1, 'visual-rep-table');
        if (page1Table) {
            const tableOptions = typeof page1Table.props === 'function' ? page1Table.props() : page1Table.props;
            console.log('Page 1 cellOverrides (should be processed):', tableOptions.cellOverrides);
        } else {
            console.log('No table element found on page 1');
        }
        
        return true;
    },

    // Test column width calculations for page-specific grids
    testColumnWidths: () => {
        console.log('🧪 Testing Column Width Calculations (Page-Specific)');
        console.log('====================================================');
        
        // Using modern table system
        console.log('ℹ️ Using modern table system');
        return true;
    },

    // Test defaultCellSize values in React components
    testDefaultCellSizeValues: () => {
        console.log('🧪 Testing DefaultCellSize Values in React Components');
        console.log('===================================================');
        
        // Using modern table system
        console.log('ℹ️ Using modern table system');
        
        console.log('\n✅ DefaultCellSize values test completed');
        return true;
    },

};



// GridBuilder class removed - was unused

// Page Management Utilities
const PageUtils = {
    // Get available pages
    getAvailablePages: () => {
        const allKeys = Object.keys(GridPositionPages);
        const numericKeys = allKeys.filter(key => !isNaN(Number(key)) && Number(key) > 0);
        return numericKeys.map(Number).sort((a, b) => a - b);
    },
    
    // Get page element count
    getPageElementCount: (pageNumber) => {
        const pageElements = GridPositionPages[pageNumber];
        return pageElements ? pageElements.length : 0;
    },
    
    // Get page summary
    getPageSummary: (pageNumber) => {
        const pageElements = GridPositionPages[pageNumber];
        if (!pageElements) return null;
        
        const elementTypes = {};
        pageElements.forEach(element => {
            elementTypes[element.type] = (elementTypes[element.type] || 0) + 1;
        });
        
        return {
            pageNumber,
            elementCount: pageElements.length,
            elementTypes,
            elements: pageElements.map(el => el.name)
        };
    },
    
    // Get all page summaries
    getAllPageSummaries: () => {
        return PageUtils.getAvailablePages().map(pageNumber => 
            PageUtils.getPageSummary(pageNumber)
        );
    },
    

    

    

    

    
    // Debug page information
    debugPageInfo: (pageNumber = null) => {
        const pages = pageNumber ? [pageNumber] : PageUtils.getAvailablePages();
        
        console.log('📄 Page Information Debug');
        console.log('========================');
        
        pages.forEach(page => {
            const summary = PageUtils.getPageSummary(page);
            console.log(`\n📋 Page ${page}:`);
            console.log(`   Elements: ${summary.elementCount}`);
            console.log(`   Types:`, summary.elementTypes);
            console.log(`   Elements:`, summary.elements.join(', '));
        });
    }
};

// ============================================================================
// Unified Navigation System
// ============================================================================

/**
 * NavigationManager - Unified, Dynamic Navigation System
 * 
 * A single source of truth for all navigation logic that combines:
 * - Page-specific navigation embedded in GridPositionPages
 * - Global navigation defaults
 * - Dynamic navigation rules and callbacks
 * - Integration with navigation system for button states
 * 
 * Features:
 * - Auto-discovery of navigation configs from page elements
 * - Intelligent fallback to sequential navigation
 * - Dynamic page resolution with conditions
 * - Centralized callback management
 * - Simplified API for common navigation patterns
 * - Automatic flag-based button state management
 */
class NavigationManager {
    constructor() {
        this.defaults = {
            nextPage: 'auto',
            previousPage: 'auto',
            nextEnabled: 'auto', // Now uses flag system
            previousEnabled: 'auto', // Now uses flag system
            circularNavigation: false,
            showButtons: true,
            buttonLabels: {
                next: () => typeof i18n !== 'undefined' ? i18n.t('buttons.next') : 'Next',
                previous: () => typeof i18n !== 'undefined' ? i18n.t('buttons.previous') : 'Previous'
            }
        };
        
        this.globalCallbacks = {
            beforeNavigate: [],
            afterNavigate: [],
            onPageLoad: []
        };
        
        this.pageOverrides = new Map();
        this.conditionalRules = new Map();
        this.flagManager = null; // Will be set during integration
    }
    
    // ====================================================================
    // Configuration Methods
    // ====================================================================
    
    /**
     * Set global default navigation behavior
     */
    setDefaults(config) {
        this.defaults = { ...this.defaults, ...config };
        return this;
    }
    
    /**
     * Update button states for navigation
     */
    updateNavigationStates() {
        // Add callback to sync button states on navigation
        this.addGlobalCallback('afterNavigate', (fromPage, toPage, direction) => {
            this.updateButtonStatesForPage(toPage);
        });
        
        console.log('🔗 NavigationManager button states configured');
        return this;
    }
    
    /**
     * Update button states for a page based on navigation logic
     */
    updateButtonStatesForPage(pageNumber) {
        if (!this.flagManager) return;
        
        // Update previous button state
        const canGoPrevious = this.resolvePreviousPage(pageNumber) !== null;
        this.flagManager.setFlag(pageNumber, 'prevEnabled', canGoPrevious);
        
        // Next button is controlled by page logic (starts disabled)
        // Page-specific logic will enable when appropriate
        if (this.flagManager.getFlag(pageNumber, 'nextEnabled') === undefined) {
            this.flagManager.setFlag(pageNumber, 'nextEnabled', false);
        }
        
        console.log(`🔄 Updated button states for page ${pageNumber}: prev=${canGoPrevious}`);
    }
    
    /**
     * Add global navigation callbacks
     */
    addGlobalCallback(type, callback) {
        if (this.globalCallbacks[type]) {
            this.globalCallbacks[type].push(callback);
        }
        return this;
    }
    
    /**
     * Set page-specific navigation rules
     */
    setPageNavigation(pageNumber, config) {
        this.pageOverrides.set(pageNumber, config);
        return this;
    }
    
    /**
     * Add conditional navigation rules
     */
    addConditionalRule(name, condition, navigationConfig) {
        this.conditionalRules.set(name, { condition, config: navigationConfig });
        return this;
    }
    
    // ====================================================================
    // Configuration Discovery
    // ====================================================================
    
    /**
     * Get navigation configuration from page elements (new method)
     */
    getPageElementNavigation(pageNumber) {
        const pageElements = GridPositionPages[pageNumber];
        if (!pageElements) return null;
        
        const navElement = pageElements.find(el => 
            el.type === 'navigation' && el.name === 'navigation'
        );
        
        return navElement?.props || null;
    }
    
    /**
     * Resolve complete navigation configuration for a page
     */
    getPageNavigation(pageNumber, context = {}) {
        // Priority order:
        // 1. Conditional rules (highest priority)
        // 2. Page element configuration
        // 3. Page overrides set via API
        // 4. Global defaults (lowest priority)
        
        let config = { ...this.defaults };
        
        // Apply page overrides
        if (this.pageOverrides.has(pageNumber)) {
            config = { ...config, ...this.pageOverrides.get(pageNumber) };
        }
        
        // Apply page element configuration
        const pageElementConfig = this.getPageElementNavigation(pageNumber);
        if (pageElementConfig) {
            config = { ...config, ...pageElementConfig };
        }
        
        // Apply conditional rules
        for (const [name, rule] of this.conditionalRules) {
            if (rule.condition(pageNumber, context)) {
                config = { ...config, ...rule.config };
                console.log(`🎯 Applied conditional rule: ${name} for page ${pageNumber}`);
                break; // Apply first matching rule only
            }
        }
        
        return config;
    }
    
    // ====================================================================
    // Navigation Resolution
    // ====================================================================
    
    /**
     * Resolve next page with intelligent auto-detection
     */
    resolveNextPage(currentPage, context = {}) {
        const config = this.getPageNavigation(currentPage, context);
        return this._resolvePage(config.nextPage, currentPage, 'next', context);
    }
    
    /**
     * Resolve previous page with intelligent auto-detection
     */
    resolvePreviousPage(currentPage, context = {}) {
        const config = this.getPageNavigation(currentPage, context);
        return this._resolvePage(config.previousPage, currentPage, 'previous', context);
    }
    
    /**
     * Internal page resolution logic
     */
    _resolvePage(pageSpec, currentPage, direction, context) {
        if (pageSpec === null) return null;
        
        if (typeof pageSpec === 'number') {
            return pageSpec;
        }
        
        if (typeof pageSpec === 'function') {
            return pageSpec(currentPage, context);
        }
        
        if (pageSpec === 'auto') {
            return this._autoResolvePage(currentPage, direction, context);
        }
        
        if (pageSpec === 'circular') {
            const availablePages = PageUtils.getAvailablePages();
            return direction === 'next' ? 
                availablePages[0] : 
                availablePages[availablePages.length - 1];
        }
        
        return null;
    }
    
    /**
     * Auto-resolve page based on available pages
     */
    _autoResolvePage(currentPage, direction, context) {
        const availablePages = PageUtils.getAvailablePages();
        const currentIndex = availablePages.indexOf(currentPage);
        
        if (currentIndex === -1) return null;
        
        if (direction === 'next') {
            const nextIndex = currentIndex + 1;
            if (nextIndex < availablePages.length) {
                return availablePages[nextIndex];
            }
            
            // Check for circular navigation
            const config = this.getPageNavigation(currentPage, context);
            return config.circularNavigation ? availablePages[0] : null;
        } else {
            const prevIndex = currentIndex - 1;
            if (prevIndex >= 0) {
                return availablePages[prevIndex];
            }
            
            // Check for circular navigation
            const config = this.getPageNavigation(currentPage, context);
            return config.circularNavigation ? availablePages[availablePages.length - 1] : null;
        }
    }
    
    // ====================================================================
    // Button State Management
    // ====================================================================
    
    /**
     * Check if next button should be enabled
     */
    isNextEnabled(currentPage, context = {}) {
        // Use flag manager if available
        if (this.flagManager && this.flagManager.hasPage(currentPage)) {
            return this.flagManager.getFlag(currentPage, 'nextEnabled');
        }
        
        // Fallback to configuration-based logic
        const config = this.getPageNavigation(currentPage, context);
        return this._resolveButtonState(config.nextEnabled, currentPage, 'next', context);
    }
    
    /**
     * Check if previous button should be enabled
     */
    isPreviousEnabled(currentPage, context = {}) {
        // Use flag manager if available
        if (this.flagManager && this.flagManager.hasPage(currentPage)) {
            return this.flagManager.getFlag(currentPage, 'prevEnabled');
        }
        
        // Fallback to configuration-based logic
        const config = this.getPageNavigation(currentPage, context);
        return this._resolveButtonState(config.previousEnabled, currentPage, 'previous', context);
    }
    
    /**
     * Resolve button enabled state (fallback method)
     */
    _resolveButtonState(enabledSpec, currentPage, direction, context) {
        if (typeof enabledSpec === 'boolean') {
            return enabledSpec;
        }
        
        if (typeof enabledSpec === 'function') {
            return enabledSpec(currentPage, context);
        }
        
        if (enabledSpec === 'auto') {
            // Auto-enable if there's a valid target page
            const targetPage = direction === 'next' ? 
                this.resolveNextPage(currentPage, context) :
                this.resolvePreviousPage(currentPage, context);
            return targetPage !== null;
        }
        
        return true; // Default to enabled
    }
    
    /**
     * Get button labels for current page
     */
    getButtonLabels(currentPage, context = {}) {
        const config = this.getPageNavigation(currentPage, context);
        
        return {
            next: typeof config.buttonLabels?.next === 'function' ? 
                config.buttonLabels.next(currentPage, context) :
                (config.buttonLabels?.next || this.defaults.buttonLabels.next()),
            previous: typeof config.buttonLabels?.previous === 'function' ?
                config.buttonLabels.previous(currentPage, context) :
                (config.buttonLabels?.previous || this.defaults.buttonLabels.previous())
        };
    }
    
    // ====================================================================
    // Navigation Execution
    // ====================================================================
    
    /**
     * Execute navigation with full callback support
     */
    navigate(fromPage, direction, context = {}) {
        const targetPage = direction === 'next' ? 
            this.resolveNextPage(fromPage, context) :
            this.resolvePreviousPage(fromPage, context);
        
        if (targetPage === null) {
            console.warn(`🚫 Navigation blocked: No ${direction} page from ${fromPage}`);
            return null;
        }
        
        const config = this.getPageNavigation(fromPage, context);
        
        // Execute before navigation callbacks
        this._executeCallbacks('beforeNavigate', [fromPage, targetPage, direction, context]);
        if (config.beforeNavigate) {
            config.beforeNavigate(fromPage, targetPage, direction, context);
        }
        
        console.log(`🔄 [NavigationManager] ${fromPage} → ${targetPage} (${direction})`);
        
        // The actual page change is handled by the calling component
        // This method just handles the logic and callbacks
        
        // Execute after navigation callbacks
        this._executeCallbacks('afterNavigate', [fromPage, targetPage, direction, context]);
        if (config.afterNavigate) {
            config.afterNavigate(fromPage, targetPage, direction, context);
        }
        
        return targetPage;
    }
    
    /**
     * Execute callbacks of a specific type
     */
    _executeCallbacks(type, args) {
        this.globalCallbacks[type]?.forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`🚨 Navigation callback error (${type}):`, error);
            }
        });
    }
    
    /**
     * Execute page load callbacks
     */
    executePageLoadCallbacks(pageNumber, context = {}) {
        const config = this.getPageNavigation(pageNumber, context);
        
        // Execute global onPageLoad callbacks
        this._executeCallbacks('onPageLoad', [pageNumber, context]);
        
        // Execute page-specific onPageLoad callback
        if (config.onPageLoad) {
            try {
                config.onPageLoad(pageNumber, context);
            } catch (error) {
                console.error(`🚨 Page load callback error (page ${pageNumber}):`, error);
            }
        }
    }
    
    // ====================================================================
    // Convenience Methods
    // ====================================================================
    
    /**
     * Quick setup for sequential navigation
     */
    setupSequential(pages, options = {}) {
        pages.forEach((pageNum, index) => {
            const config = {
                nextPage: index < pages.length - 1 ? pages[index + 1] : null,
                previousPage: index > 0 ? pages[index - 1] : null,
                ...options
            };
            this.setPageNavigation(pageNum, config);
        });
        return this;
    }
    
    /**
     * Quick setup for circular navigation
     */
    setupCircular(pages, options = {}) {
        return this.setupSequential(pages, { 
            circularNavigation: true, 
            ...options 
        });
    }
    
    /**
     * Setup quiz navigation pattern
     */
    setupQuiz(startPage, endPage, options = {}) {
        const config = {
            nextEnabled: (page, context) => {
                // Enable next only if quiz is completed
                return context.quizCompleted === true;
            },
            buttonLabels: {
                next: (page, context) => context.quizCompleted ? 'Continue' : 'Complete Quiz First'
            },
            ...options
        };
        
        for (let page = startPage; page <= endPage; page++) {
            this.setPageNavigation(page, config);
        }
        return this;
    }
    
    // ====================================================================
    // Debugging and Analysis
    // ====================================================================
    
    /**
     * Debug navigation configuration
     */
    debugNavigation(pageNumber = null) {
        console.log('🧭 Navigation System Debug');
        console.log('==========================');
        
        if (pageNumber !== null) {
            this._debugSinglePage(pageNumber);
        } else {
            const pages = PageUtils.getAvailablePages();
            pages.forEach(page => this._debugSinglePage(page));
        }
    }
    
    /**
     * Debug single page navigation
     */
    _debugSinglePage(pageNumber) {
        const config = this.getPageNavigation(pageNumber);
        const elementConfig = this.getPageElementNavigation(pageNumber);
        const overrideConfig = this.pageOverrides.get(pageNumber);
        
        console.log(`\n📄 Page ${pageNumber}:`);
        console.log(`   Config Source: ${elementConfig ? 'Page Elements' : overrideConfig ? 'API Override' : 'Defaults'}`);
        console.log(`   Next: ${config.nextPage} (enabled: ${config.nextEnabled})`);
        console.log(`   Previous: ${config.previousPage} (enabled: ${config.previousEnabled})`);
        console.log(`   Circular: ${config.circularNavigation}`);
        console.log(`   Show Buttons: ${config.showButtons}`);
        
        // Test resolution
        const nextPage = this.resolveNextPage(pageNumber);
        const prevPage = this.resolvePreviousPage(pageNumber);
        console.log(`   Resolved Next: ${nextPage}`);
        console.log(`   Resolved Previous: ${prevPage}`);
    }
    
    /**
     * Get navigation summary
     */
    getNavigationSummary() {
        const pages = PageUtils.getAvailablePages();
        const summary = {
            totalPages: pages.length,
            pagesWithNavigation: 0,
            pagesWithOverrides: this.pageOverrides.size,
            pagesWithElementConfig: 0,
            conditionalRules: this.conditionalRules.size,
            globalCallbacks: Object.keys(this.globalCallbacks).reduce((sum, key) => 
                sum + this.globalCallbacks[key].length, 0)
        };
        
        pages.forEach(pageNum => {
            const elementConfig = this.getPageElementNavigation(pageNum);
            if (elementConfig) {
                summary.pagesWithElementConfig++;
            }
            
            const config = this.getPageNavigation(pageNum);
            if (config.nextPage !== 'auto' || config.previousPage !== 'auto') {
                summary.pagesWithNavigation++;
            }
        });
        
                 return summary;
     }
}

// ============================================================================
// Legacy Compatibility Layer
// ============================================================================

/**
 * NavigationUtils - Legacy compatibility wrapper
 * Provides backward compatibility for existing code
 */
class NavigationUtils extends NavigationManager {
    constructor() {
        super();
        // Set up legacy default configuration
        this.setDefaults({
            circularNavigation: true
        });
    }
    
    // Legacy method compatibility
    getPageConfig(pageNumber, context = {}) {
        return this.getPageNavigation(pageNumber, context);
    }
    
    getPageElementNavigationConfig(pageNumber) {
        return this.getPageElementNavigation(pageNumber);
    }
    
    getNextPage(currentPage, availablePages, flags = {}) {
        return this.resolveNextPage(currentPage, flags);
    }
    
    getPreviousPage(currentPage, availablePages) {
        return this.resolvePreviousPage(currentPage);
    }
    
    isNextEnabled(currentPage, flags = {}) {
        return super.isNextEnabled(currentPage, flags);
    }
    
    isPreviousEnabled(currentPage, flags = {}) {
        return super.isPreviousEnabled(currentPage, flags);
    }
    
    navigate(fromPage, toPage, direction, flags = {}) {
        // Legacy navigate expects toPage parameter, new system calculates it
        return super.navigate(fromPage, direction, flags);
    }
    
    debugConfig(pageNumber = null) {
        return this.debugNavigation(pageNumber);
    }
}


// ============================================================================
// End of Page Navigation Configuration System
// ============================================================================

// Create global instances
console.log('🔧 [GridPositions] Creating gridPositions instance...');
console.log('🔧 [GridPositions] Dependencies check:', {
    GridPrecisionConfig: typeof GridPrecisionConfig !== 'undefined',
    StandardElements: typeof StandardElements !== 'undefined',
    GridCellFontUtils: typeof GridCellFontUtils !== 'undefined',
    GridPositionPages: typeof GridPositionPages !== 'undefined'
});

const gridPositions = new GridPositions();
const navigationManager = new NavigationManager();
const navigationUtils = new NavigationUtils(); // Legacy compatibility

console.log('🔧 [GridPositions] Instances created successfully');

// Integration with navigation system
const integrateNavigationSystem = () => {
    // Setup navigation states
    navigationManager.updateNavigationStates();
    
    // Setup initial button states for all pages
    PageUtils.getAvailablePages().forEach(pageNumber => {
        navigationManager.updateButtonStatesForPage(pageNumber);
    });
    
    console.log('🔗 Navigation system integrated successfully');
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GridPositions,
        GridPositionPages,
        GridPositionUtils,
        GridPrecisionConfig,
        StandardPositions,
        GridCellFontUtils,
        PageUtils,
        NavigationManager,
        NavigationUtils,
        gridPositions,
        navigationManager,
        navigationUtils,
        debugGridPositioning
    };
} else {
    window.GridPositions = GridPositions;
    // Only set GridPositionPages if it's not already defined (avoid overwriting PageConfig.js)
    if (typeof window.GridPositionPages === 'undefined') {
        window.GridPositionPages = GridPositionPages;
    }
    window.GridPositionUtils = GridPositionUtils;
    window.GridPrecisionConfig = GridPrecisionConfig;
    window.StandardPositions = StandardPositions;
    window.GridCellFontUtils = GridCellFontUtils;
    window.PageUtils = PageUtils;
    window.NavigationManager = NavigationManager;
    window.NavigationUtils = NavigationUtils;
    window.gridPositions = gridPositions;
    window.navigationManager = navigationManager;
    window.navigationUtils = navigationUtils; // Legacy compatibility
    // window.debugGridPositioning = debugGridPositioning;
    // window.testGridCellFontConversion = GridPositionUtils.testGridCellFontConversion;
    // window.testColumnWidths = GridPositionUtils.testColumnWidths;
    // window.testCellOverridesConversion = GridPositionUtils.testCellOverridesConversion;
    // window.testCellStylesConversion = GridPositionUtils.testCellStylesConversion;
    // window.testGridBorders = GridPositionUtils.testGridBorders;
    // window.testGridConfigConversion = GridPositionUtils.testGridConfigConversion;
    // window.testDefaultCellSizeValues = GridPositionUtils.testDefaultCellSizeValues;

    window.integrateNavigationSystem = integrateNavigationSystem;
    window.GridPositionUtils = GridPositionUtils;
    
    // Add global function to force refresh grid dimensions
    window.forceRefreshGridDimensions = () => {
        if (gridPositions && typeof gridPositions.forceRefreshGridDimensions === 'function') {
            gridPositions.forceRefreshGridDimensions();
        } else {
            console.warn('⚠️ GridPositions not available for refresh');
        }
    };
    
    // Auto-integrate flag manager when available
    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', () => {
            // Try integration after a short delay to ensure all scripts are loaded
            setTimeout(integrateNavigationSystem, 100);
        });
    }
    
    // GridPositionUtils.testColumnWidths();
}

// Make all utilities globally available
window.GridPositionUtils = GridPositionUtils;
window.gridPositions = gridPositions;
// Only set GridPositionPages if it's not already defined (avoid overwriting PageConfig.js)
if (typeof window.GridPositionPages === 'undefined') {
    window.GridPositionPages = GridPositionPages;
}
window.StandardPositions = StandardPositions;
window.PageUtils = PageUtils;
window.NavigationManager = NavigationManager;
window.NavigationUtils = NavigationUtils; 
