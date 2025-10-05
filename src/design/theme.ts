// Vaporwave Design System
export const theme = {
  colors: {
    // Backgrounds
    bg: {
      primary: '#16141a',
      secondary: '#1e1b26',
      tertiary: '#2a2733',
      overlay: 'rgba(22, 20, 26, 0.85)',
    },
    // Neon accents
    neon: {
      cyan: '#06ffa5',
      pink: '#ff006e',
      purple: '#7209b7',
      magenta: '#f72585',
      yellow: '#ffd60a',
      blue: '#4361ee',
    },
    // Gradients
    gradient: {
      bass: 'linear-gradient(135deg, #4361ee 0%, #7209b7 100%)',
      drums: 'linear-gradient(135deg, #ff006e 0%, #f72585 100%)',
      conductor: 'linear-gradient(135deg, #7209b7 0%, #06ffa5 100%)',
      primary: 'linear-gradient(135deg, #06ffa5 0%, #4361ee 100%)',
      secondary: 'linear-gradient(135deg, #ff006e 0%, #7209b7 100%)',
    },
    // States
    state: {
      success: '#06ffa5',
      error: '#ff006e',
      warning: '#ffd60a',
    },
  },
  shadows: {
    glow: {
      cyan: '0 0 20px rgba(6, 255, 165, 0.5)',
      pink: '0 0 20px rgba(255, 0, 110, 0.5)',
      purple: '0 0 20px rgba(114, 9, 183, 0.5)',
      strong: '0 0 40px rgba(6, 255, 165, 0.8)',
    },
    elevation: {
      low: '0 4px 12px rgba(0, 0, 0, 0.3)',
      mid: '0 8px 24px rgba(0, 0, 0, 0.4)',
      high: '0 16px 48px rgba(0, 0, 0, 0.5)',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontMono: '"Fira Code", "SF Mono", Monaco, monospace',
  },
}
