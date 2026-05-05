// Dependencies: GridPrecisionConfig should be loaded before this file

// Grid Cell Font Utilities - Convert grid-cell units to pixels
const GridCellFontUtils = {
    // Process grid configuration objects that may contain gc units
    processGridConfig: (gridConfig) => {
        if (!gridConfig || typeof gridConfig !== 'object') {
            return gridConfig;
        }
        
        const processedConfig = { ...gridConfig };
        
        // Process defaultCellSize dimensions
        if (gridConfig.defaultCellSize) {
            processedConfig.defaultCellSize = { ...gridConfig.defaultCellSize };
            
            // Convert gc units in cell dimensions
            if (gridConfig.defaultCellSize.rows && typeof gridConfig.defaultCellSize.rows === 'string' && gridConfig.defaultCellSize.rows.endsWith('gc')) {
                const pixelValue = GridCellFontUtils.convertGcToPixels(gridConfig.defaultCellSize.rows, 'height');
                // Convert back to number for grid calculations (remove 'px')
                processedConfig.defaultCellSize.rows = parseInt(pixelValue.replace('px', ''));
                console.log(`🔄 [processGridConfig] Converted defaultCellSize.rows: ${gridConfig.defaultCellSize.rows} → ${processedConfig.defaultCellSize.rows}`);
            }
            
            if (gridConfig.defaultCellSize.columns && typeof gridConfig.defaultCellSize.columns === 'string' && gridConfig.defaultCellSize.columns.endsWith('gc')) {
                const pixelValue = GridCellFontUtils.convertGcToPixels(gridConfig.defaultCellSize.columns, 'width');
                // Convert back to number for grid calculations (remove 'px')
                processedConfig.defaultCellSize.columns = parseInt(pixelValue.replace('px', ''));
                console.log(`🔄 [processGridConfig] Converted defaultCellSize.columns: ${gridConfig.defaultCellSize.columns} → ${processedConfig.defaultCellSize.columns}`);
            }
        }
        
        // Process columnOverrides
        if (gridConfig.columnOverrides) {
            processedConfig.columnOverrides = { ...gridConfig.columnOverrides };
            
            Object.entries(gridConfig.columnOverrides).forEach(([columnKey, columnConfig]) => {
                if (columnConfig && typeof columnConfig === 'object') {
                    const processedColumnConfig = { ...columnConfig };
                    
                    // Convert gc units in column dimensions
                    if (columnConfig.columns && typeof columnConfig.columns === 'string' && columnConfig.columns.endsWith('gc')) {
                        const pixelValue = GridCellFontUtils.convertGcToPixels(columnConfig.columns, 'width');
                        processedColumnConfig.columns = parseInt(pixelValue.replace('px', ''));
                        console.log(`🔄 [processGridConfig] Converted ${columnKey}.columns: ${columnConfig.columns} → ${processedColumnConfig.columns}`);
                    }
                    
                    if (columnConfig.rows && typeof columnConfig.rows === 'string' && columnConfig.rows.endsWith('gc')) {
                        const pixelValue = GridCellFontUtils.convertGcToPixels(columnConfig.rows, 'height');
                        processedColumnConfig.rows = parseInt(pixelValue.replace('px', ''));
                        console.log(`🔄 [processGridConfig] Converted ${columnKey}.rows: ${columnConfig.rows} → ${processedColumnConfig.rows}`);
                    }
                    
                    processedConfig.columnOverrides[columnKey] = processedColumnConfig;
                }
            });
        }
        
        // Process rowOverrides  
        if (gridConfig.rowOverrides) {
            processedConfig.rowOverrides = { ...gridConfig.rowOverrides };
            
            Object.entries(gridConfig.rowOverrides).forEach(([rowKey, rowConfig]) => {
                if (rowConfig && typeof rowConfig === 'object') {
                    const processedRowConfig = { ...rowConfig };
                    
                    // Convert gc units in row dimensions
                    if (rowConfig.rows && typeof rowConfig.rows === 'string' && rowConfig.rows.endsWith('gc')) {
                        const pixelValue = GridCellFontUtils.convertGcToPixels(rowConfig.rows, 'height');
                        processedRowConfig.rows = parseInt(pixelValue.replace('px', ''));
                        console.log(`🔄 [processGridConfig] Converted ${rowKey}.rows: ${rowConfig.rows} → ${processedRowConfig.rows}`);
                    }
                    
                    if (rowConfig.columns && typeof rowConfig.columns === 'string' && rowConfig.columns.endsWith('gc')) {
                        const pixelValue = GridCellFontUtils.convertGcToPixels(rowConfig.columns, 'width');
                        processedRowConfig.columns = parseInt(pixelValue.replace('px', ''));
                        console.log(`🔄 [processGridConfig] Converted ${rowKey}.columns: ${rowConfig.columns} → ${processedRowConfig.columns}`);
                    }
                    
                    processedConfig.rowOverrides[rowKey] = processedRowConfig;
                }
            });
        }
        
        return processedConfig;
    },
    // Convert grid-cell units (gc) to pixels
    convertGcToPixels: (gcValue, propertyName = 'fontSize') => {
        if (typeof gcValue !== 'string' || !gcValue.endsWith('gc')) {
            return gcValue;
        }
        
        const gcUnits = parseInt(gcValue.replace('gc', ''));
        
        // Ensure we have valid window dimensions
        let containerHeight = 1080; // Default fallback
        if (typeof window !== 'undefined' && window.innerHeight) {
            containerHeight = window.innerHeight;
            if (containerHeight < 100) {
                // Fallback to reasonable defaults if window dimensions are too small
                containerHeight = 1080;
            }
        }
        
        // Use precision 100 as the reference for gc units
        // 1gc = size of 1 cell when precision is 100
        const referenceConfig = GridPrecisionConfig.precisionSettings[100]; // Always use precision 100 as reference
        const cellHeightAtPrecision100 = containerHeight / referenceConfig.rows; // 900 rows at precision 100
        const calculatedValue = cellHeightAtPrecision100 * gcUnits;
        
        // Apply bounds checking based on property type
        if (propertyName === 'fontSize') {
            // Font size bounds
            const minFontSize = 8;
            const maxFontSize = 200;
            const clampedFontSize = Math.max(minFontSize, Math.min(maxFontSize, Math.round(calculatedValue)));
            return `${clampedFontSize}px`;
        } else if (propertyName === 'lineHeight') {
            // Line height bounds - allow more flexibility
            const minLineHeight = 8;
            const maxLineHeight = 300; // Allow up to 300px for line height
            const clampedLineHeight = Math.max(minLineHeight, Math.min(maxLineHeight, Math.round(calculatedValue)));
            return `${clampedLineHeight}px`;
        } else if (propertyName === 'padding' || propertyName === 'paddingTop' || propertyName === 'paddingRight' || 
                   propertyName === 'paddingBottom' || propertyName === 'paddingLeft' || 
                   propertyName === 'margin' || propertyName === 'marginTop' || propertyName === 'marginRight' || 
                   propertyName === 'marginBottom' || propertyName === 'marginLeft') {
            // Padding/margin bounds - allow much larger values
            const minPadding = 0;
            const maxPadding = 1000; // Allow up to 1000px for padding/margin
            const clampedPadding = Math.max(minPadding, Math.min(maxPadding, Math.round(calculatedValue)));
            return `${clampedPadding}px`;
        } else if (propertyName === 'borderRadius') {
            // Border radius bounds
            const minRadius = 0;
            const maxRadius = 500; // Allow up to 500px for border radius
            const clampedRadius = Math.max(minRadius, Math.min(maxRadius, Math.round(calculatedValue)));
            return `${clampedRadius}px`;
        } else {
            // For other properties, apply moderate bounds
            const minValue = 0;
            const maxValue = 2000; // Allow up to 2000px for other properties
            const clampedValue = Math.max(minValue, Math.min(maxValue, Math.round(calculatedValue)));
            return `${clampedValue}px`;
        }
    },
    
    // Process any CSS property that can use gc units
    processGcProperty: (value, propertyName) => {
        if (typeof value === 'string' && value.endsWith('gc')) {
            return GridCellFontUtils.convertGcToPixels(value, propertyName);
        }
        return value;
    },
    
    // Process cellOverrides to convert all gc units in both style and textStyles
    processCellOverrides: (cellOverrides) => {
        if (!cellOverrides || typeof cellOverrides !== 'object') {
            return cellOverrides;
        }
        
        const processedCellOverrides = {};
        
        Object.entries(cellOverrides).forEach(([cellKey, cellOverride]) => {
            const processedOverride = { ...cellOverride };
            
            // Process 'style' property if it exists
            if (cellOverride.style) {
                processedOverride.style = GridCellFontUtils.processGcStyles(cellOverride.style);
                console.log(`🔄 [processCellOverrides] Processed style for cell ${cellKey}:`, processedOverride.style);
            }
            
            // Process 'textStyles' property if it exists
            if (cellOverride.textStyles) {
                processedOverride.textStyles = GridCellFontUtils.processGcStyles(cellOverride.textStyles);
                console.log(`🔄 [processCellOverrides] Processed textStyles for cell ${cellKey}:`, processedOverride.textStyles);
            }
            
            processedCellOverrides[cellKey] = processedOverride;
        });
        
        return processedCellOverrides;
    },

    // Process an entire style object to convert all gc units
    processGcStyles: (styles) => {
        if (!styles || typeof styles !== 'object') {
            return styles;
        }
        
        const processedStyles = { ...styles };
        
        const gcProperties = [
            'fontSize', 'lineHeight', 'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
            'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
            'borderRadius', 'width', 'height', 'letterSpacing',
            'top', 'right', 'bottom', 'left', 'borderWidth',
            'tabBorderRadius', 'buttonBorderRadius', 'tabMarginRight', 'buttonPadding',
            'textSize', 'leftMargin', 'rightMargin', 'iconMarginLeft',
            'componentHeader', 'sectionHeader', 'bodyTextSize', 'cardPadding', 'cardSpacing', 'accentBarWidth', 'sectionLeftBorderRadius', 'bulletSize', 'textColor', 'backgroundColor', 'borderRadius', 'padding', 'dotSize', 'gap', 'underlineThickness',
            'sectionMarginBottom', 'sectionMarginLeft', 'listMarginLeft', 'listItemMarginBottom', 'bulletMarginRight'
        ];
        
        // Process fontSize first
        if (processedStyles.fontSize) {
            processedStyles.fontSize = GridCellFontUtils.processGcProperty(processedStyles.fontSize, 'fontSize');
        }
        
        // Process other properties
        gcProperties.forEach(prop => {
            if (prop !== 'fontSize' && prop !== 'lineHeight' && processedStyles[prop]) {
                processedStyles[prop] = GridCellFontUtils.processGcProperty(processedStyles[prop], prop);
            }
        });
        
        // Process lineHeight (can be regular gc unit or special ratio processing)
        if (processedStyles.lineHeight) {
            const originalLineHeight = processedStyles.lineHeight;
            if (typeof originalLineHeight === 'string' && originalLineHeight.endsWith('gc')) {
                // If lineHeight is already processed above, don't process it again
                // Check if it's a ratio (like '1.2') or a gc unit (like '300gc')
                const isRatioFormat = /^\d+(\.\d+)?$/.test(originalLineHeight);
                if (!isRatioFormat) {
                    // It's a gc unit, convert to ratio
                    const lineHeightPx = parseFloat(GridCellFontUtils.convertGcToPixels(originalLineHeight, 'lineHeight'));
                    let fontSizePx = 16;
                    
                    if (typeof processedStyles.fontSize === 'string' && processedStyles.fontSize.endsWith('px')) {
                        fontSizePx = parseFloat(processedStyles.fontSize);
                    }
                    
                    const ratio = lineHeightPx / fontSizePx;
                    processedStyles.lineHeight = ratio.toFixed(2);
                }
            }
        }
        
        return processedStyles;
    }
};

// Make GridCellFontUtils globally available
window.GridCellFontUtils = GridCellFontUtils;