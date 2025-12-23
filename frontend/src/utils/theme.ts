// Theme colors for AgriHub
export const theme = {
  colors: {
    // Earth tones
    primary: '#4CAF50',      // Green
    primaryDark: '#388E3C',
    secondary: '#8D6E63',    // Brown
    accent: '#FFA726',       // Orange
    
    // Soil/earth colors
    earth: '#6D4C41',
    soil: '#5D4037',
    leaf: '#66BB6A',
    
    // Neutrals
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#212121',
    textSecondary: '#757575',
    
    // Status
    success: '#4CAF50',
    warning: '#FFA726',
    error: '#F44336',
    info: '#2196F3',
    
    // UI
    border: '#E0E0E0',
    disabled: '#BDBDBD',
    shadow: '#000000',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 999,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};
