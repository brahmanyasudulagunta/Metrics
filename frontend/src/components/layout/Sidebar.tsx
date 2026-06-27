import React from 'react';
import {
    Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, Divider, alpha
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ExploreIcon from '@mui/icons-material/Explore';
import SavingsIcon from '@mui/icons-material/Savings';
import SettingsIcon from '@mui/icons-material/Settings';
import CloudIcon from '@mui/icons-material/Cloud';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import MetricsLogo from '../MetricsLogo';
import { useLocation, useNavigate } from 'react-router-dom';
import { tokens } from '../../theme';

export const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Analytics', icon: <ExploreIcon />, path: '/dashboard/explore' },
    { text: 'Infrastructure', icon: <CloudIcon />, path: '/dashboard/kubernetes' },
    { text: 'Resource Optimization', icon: <SavingsIcon />, path: '/dashboard/optimization' },
    { text: 'Alerting', icon: <NotificationsActiveIcon />, path: '/dashboard/alerts' },
];

export const drawerWidth = 260;

interface SidebarProps {
    isMobile: boolean;
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile, mobileOpen, setMobileOpen }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleNavigation = (path: string) => {
        navigate(path);
        if (isMobile) setMobileOpen(false);
    };

    const isSelected = (path: string) =>
        location.pathname === path || (location.pathname === '/' && path === '/dashboard');

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: tokens.bg.surface, borderRight: `1px solid ${tokens.border.default}`, pt: isMobile ? 3 : 0 }}>
            {isMobile && (
                <Box sx={{ display: 'flex', alignItems: 'center', px: 3, mb: 3, gap: 1.5 }}>
                    <MetricsLogo sx={{ fontSize: 32, color: tokens.accent.blue, filter: `drop-shadow(0 0 8px ${tokens.accent.blue})` }} />
                    <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', background: `linear-gradient(90deg, ${tokens.accent.blue} 0%, ${tokens.text.primary} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Metrics
                    </Typography>
                </Box>
            )}

            <List sx={{ px: 2, flexGrow: 1, mt: 2 }}>
                {menuItems.map((item) => (
                    <ListItemButton
                        key={item.text}
                        onClick={() => handleNavigation(item.path)}
                        selected={isSelected(item.path)}
                        sx={{
                            borderRadius: 2,
                            mb: 1,
                            py: 1.2,
                            transition: 'all 0.2s',
                            '&.Mui-selected': {
                                bgcolor: alpha(tokens.accent.blue, 0.1),
                                color: tokens.accent.blue,
                                border: `1px solid ${alpha(tokens.accent.blue, 0.2)}`,
                                '&:hover': { bgcolor: alpha(tokens.accent.blue, 0.15) },
                                '& .MuiListItemIcon-root': { color: tokens.accent.blue },
                            },
                            '&:hover': { bgcolor: tokens.bg.elevated },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40, color: tokens.text.muted }}>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                                fontSize: '0.9rem',
                                fontWeight: isSelected(item.path) ? 600 : 500,
                                color: isSelected(item.path) ? tokens.accent.blue : tokens.text.secondary
                            }}
                        />
                    </ListItemButton>
                ))}
            </List>

            <Box sx={{ p: 2 }}>
                <Divider sx={{ mb: 2, borderColor: tokens.border.default }} />
                <List disablePadding>
                    <ListItemButton onClick={() => handleNavigation('/dashboard/settings')} sx={{ borderRadius: 2, mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40, color: tokens.text.muted }}><SettingsIcon /></ListItemIcon>
                        <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: '0.9rem', color: tokens.text.secondary }} />
                    </ListItemButton>
                </List>
            </Box>
        </Box>
    );

    return (
        <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
            <Drawer
                variant={isMobile ? "temporary" : "permanent"}
                open={isMobile ? mobileOpen : true}
                onClose={() => setMobileOpen(false)}
                ModalProps={{ keepMounted: true }}
                sx={{
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none', bgcolor: tokens.bg.surface, mt: isMobile ? 0 : '72px', height: isMobile ? '100%' : 'calc(100vh - 72px)' },
                }}
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
};

export default Sidebar;
