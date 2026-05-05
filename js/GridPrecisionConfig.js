// Grid Precision Configuration
const GridPrecisionConfig = {
    currentPrecision: 100, // This project uses 100x precision
    precisionSettings: {
        1: { cols: 16, rows: 9 },   // Normal: 16x9
        2: { cols: 32, rows: 18 },  // 2x: 32x18  
        3: { cols: 48, rows: 27 },  // 3x: 48x27
        4: { cols: 64, rows: 36 },  // 4x: 64x36
        5: { cols: 80, rows: 45 },  // 5x: 80x45
        6: { cols: 96, rows: 54 },  // 6x: 96x54
        7: { cols: 112, rows: 63 }, // 7x: 112x63
        8: { cols: 128, rows: 72 }, // 8x: 128x72
        10: { cols: 160, rows: 90 },  // 10x: 160x90
        100: { cols: 1600, rows: 900 },  // 100x: 1600x900
        10000: { cols: 160000, rows: 90000 }  // 10000x: 160000x90000
    },
    
    // Helper function to convert coordinates between precision levels
    convertCoordinates: (fromPrecision, toPrecision, coord) => {
        const match = coord.match(/R(\d+)C(\d+)/);
        if (!match) return coord;
        
        const [, row, col] = match;
        const multiplier = toPrecision / fromPrecision;
        
        // Convert to new precision
        const newRow = Math.round(parseInt(row) * multiplier);
        const newCol = Math.round(parseInt(col) * multiplier);
        
        return `R${newRow}C${newCol}`;
    }
};

// Make GridPrecisionConfig globally available
window.GridPrecisionConfig = GridPrecisionConfig;