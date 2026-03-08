import { createTheme, Theme } from '@mui/material';

// ── Design Tokens ──
// Centralized color tokens — use these instead of hardcoding hex values.
export const tokens = {
    bg: {
        base: '#0d1117',      // deepest background
        surface: '#161b22',   // cards, panels, nav
        elevated: '#1c2128',  // hover states, elevated surfaces
        input: '#0d1117',     // input fields
    },
    border: {
        default: '#30363d',
        subtle: '#21262d',
    },
    text: {
        primary: '#f0f6fc',
        secondary: '#e6edf3',
        muted: '#8b949e',
        faint: '#484f58',
    },
    accent: {
        blue: '#1f6feb',
        blueHover: '#388bfd',
        green: '#238636',
        greenHover: '#2ea043',
        red: '#da3633',
        redHover: '#f85149',
        yellow: '#d29922',
        purple: '#8a2be2',
        cyan: '#00ced1',
    },
    chart: {
        cpu: '#5794f2',
        memory: '#73bf69',
        disk: '#ff9830',
        danger: '#f2495c',
        network: {
            rx: '#00ced1',
            tx: '#8a2be2',
        },
    },
};

export const getTheme = (mode: 'light' | 'dark'): Theme => {
    return createTheme({
        palette: {
            mode,
            background: {
                default: tokens.bg.base,
                paper: tokens.bg.surface,
            },
            primary: { main: tokens.accent.blue },
            secondary: { main: tokens.accent.red },
            success: { main: tokens.accent.green },
            warning: { main: tokens.accent.yellow },
            info: { main: tokens.chart.cpu },
            error: { main: tokens.accent.red },
            text: {
                primary: tokens.text.secondary,
                secondary: tokens.text.muted,
            },
            divider: tokens.border.default,
        },
        typography: {
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
            h4: { fontSize: '1.5rem', fontWeight: 700, color: tokens.text.primary },
            h5: { fontSize: '1.25rem', fontWeight: 600, color: tokens.text.primary, letterSpacing: '-0.01em' },
            h6: { fontSize: '1.125rem', fontWeight: 600, color: tokens.text.primary },
            subtitle1: { fontSize: '0.875rem', fontWeight: 500, color: tokens.text.muted },
            subtitle2: {
                fontSize: '0.75rem',
                fontWeight: 600,
                color: tokens.text.muted,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.05em',
            },
            body1: { fontSize: '0.875rem', color: tokens.text.secondary },
            body2: { fontSize: '0.8125rem', color: tokens.text.muted },
            caption: { fontSize: '0.75rem', color: tokens.text.faint },
        },
        shape: {
            borderRadius: 8,
        },
        spacing: 8,
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        transition: 'background-color 0.2s ease',
                    },
                },
            },
            MuiPaper: {
                defaultProps: {
                    elevation: 0,
                },
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        backgroundColor: tokens.bg.surface,
                        border: `1px solid ${tokens.border.default}`,
                        borderRadius: 8,
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        backgroundColor: tokens.bg.surface,
                        border: `1px solid ${tokens.border.default}`,
                        borderRadius: 8,
                        boxShadow: 'none',
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        borderBottom: `1px solid ${tokens.border.default}`,
                        backgroundImage: 'none',
                        boxShadow: 'none',
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none' as const,
                        fontWeight: 500,
                        borderRadius: 6,
                        transition: 'background 0.2s, transform 0.1s',
                        '&:active': {
                            transform: 'scale(0.98)',
                        },
                    },
                },
            },
            MuiTableHead: {
                styleOverrides: {
                    root: {
                        '& .MuiTableCell-head': {
                            backgroundColor: tokens.bg.surface,
                            color: tokens.text.muted,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'uppercase' as const,
                            letterSpacing: '0.05em',
                            borderBottom: `1px solid ${tokens.border.default}`,
                            padding: '12px 16px',
                        },
                    },
                },
            },
            MuiTableBody: {
                styleOverrides: {
                    root: {
                        '& .MuiTableCell-body': {
                            fontSize: '0.875rem',
                            borderBottom: `1px solid ${tokens.border.subtle}`,
                            padding: '14px 16px',
                        },
                        '& .MuiTableRow-root:last-child .MuiTableCell-body': {
                            borderBottom: 'none',
                        },
                    },
                },
            },
            MuiTableRow: {
                styleOverrides: {
                    root: {
                        '&.MuiTableRow-hover:hover': {
                            backgroundColor: tokens.bg.elevated,
                        },
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        borderRadius: 20,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        letterSpacing: '0.03em',
                    },
                    outlinedPrimary: {
                        backgroundColor: 'rgba(31, 111, 235, 0.12)',
                        borderColor: 'rgba(31, 111, 235, 0.3)',
                    },
                },
            },
            MuiAlert: {
                styleOverrides: {
                    root: {
                        borderRadius: 6,
                        border: '1px solid',
                        fontSize: '0.8125rem',
                    },
                    standardError: {
                        backgroundColor: 'rgba(218, 54, 51, 0.1)',
                        borderColor: 'rgba(218, 54, 51, 0.3)',
                        color: tokens.accent.redHover,
                    },
                    standardInfo: {
                        backgroundColor: 'rgba(31, 111, 235, 0.1)',
                        borderColor: 'rgba(31, 111, 235, 0.3)',
                        color: tokens.chart.cpu,
                    },
                    standardWarning: {
                        backgroundColor: 'rgba(210, 153, 34, 0.1)',
                        borderColor: 'rgba(210, 153, 34, 0.3)',
                        color: tokens.accent.yellow,
                    },
                    standardSuccess: {
                        backgroundColor: 'rgba(35, 134, 54, 0.1)',
                        borderColor: 'rgba(35, 134, 54, 0.3)',
                        color: tokens.accent.greenHover,
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: tokens.bg.input,
                            borderRadius: 6,
                            '& fieldset': {
                                borderColor: tokens.border.default,
                            },
                            '&:hover fieldset': {
                                borderColor: tokens.text.faint,
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: tokens.accent.blue,
                            },
                        },
                        '& .MuiInputBase-input': {
                            color: tokens.text.secondary,
                            fontSize: '0.875rem',
                        },
                        '& .MuiInputLabel-root': {
                            color: tokens.text.muted,
                            fontSize: '0.875rem',
                        },
                    },
                },
            },
            MuiTabs: {
                styleOverrides: {
                    root: {
                        '& .MuiTab-root': {
                            textTransform: 'none' as const,
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            minWidth: 'auto',
                            padding: '8px 16px',
                        },
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        border: 'none',
                    },
                },
            },
        },
    });
};
