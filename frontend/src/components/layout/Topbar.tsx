import React, { useState, useEffect } from 'react';
import {
    Box, AppBar, Toolbar, Typography, IconButton, Divider,
    Tooltip as MuiTooltip, List, ListItem, ListItemButton, ListItemIcon,
    ListItemText, InputBase, alpha, Menu, MenuItem, Popover, Badge
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import CloudIcon from '@mui/icons-material/Cloud';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import MetricsLogo from '../MetricsLogo';
import { useNavigate } from 'react-router-dom';
import { tokens } from '../../theme';
import API_URL from '../../config';
import { menuItems, drawerWidth } from './Sidebar';

interface Alert {
    id: string;
    title: string;
    message: string;
    level: string;
}

interface Action {
    id: string;
    title: string;
    message: string;
    timestamp: string;
}

interface TopbarProps {
    isMobile: boolean;
    setMobileOpen: (open: boolean) => void;
    onLogout: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ isMobile, setMobileOpen, onLogout }) => {
    const navigate = useNavigate();

    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const notificationsOpen = Boolean(anchorEl);

    const [profileAnchorEl, setProfileAnchorEl] = useState<HTMLElement | null>(null);
    const profileMenuOpen = Boolean(profileAnchorEl);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchAnchorEl, setSearchAnchorEl] = useState<HTMLElement | null>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const [alertNotifications, setAlertNotifications] = useState<Alert[]>([]);
    const [actionNotifications, setActionNotifications] = useState<Action[]>([]);
    
    const [pods, setPods] = useState<any[]>([]);

    useEffect(() => {
        const fetchPods = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await axios.get(`${API_URL}/api/metrics/pods`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPods(res.data.pods || []);
            } catch (err) {
                console.error("Failed to fetch pods for search", err);
            }
        };
        fetchPods();
    }, []);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await axios.get(`${API_URL}/api/notifications`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAlertNotifications(res.data.alerts || []);
                setActionNotifications(res.data.actions || []);
            } catch (err) {
                console.error("Failed to fetch notifications", err);
            }
        };
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleDismissNotification = async (type: string, id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const endpoint = type === 'alert' ? 'alerts/acknowledge' : 'notifications/acknowledge-action';
                await axios.post(`${API_URL}/api/${endpoint}/${id}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (type === 'alert') {
                    setAlertNotifications(prev => prev.filter(a => a.id !== id));
                } else {
                    setActionNotifications(prev => prev.filter(a => a.id !== id));
                }
            }
        } catch (err) {
            console.error(`Failed to acknowledge ${type}.`, err);
        }
    };

    const getAlertColor = (level: string) => {
        switch (level) {
            case 'critical': return tokens.accent.red;
            case 'warning': return tokens.accent.yellow;
            case 'info': return tokens.chart.cpu;
            default: return tokens.text.muted;
        }
    };

    const notifications = [
        ...alertNotifications.map(a => ({ type: 'alert', id: a.id, data: a })),
        ...actionNotifications.map(a => ({ type: 'action', id: a.id, data: a }))
    ];

    const handleNavigation = (path: string) => {
        navigate(path);
        if (isMobile) setMobileOpen(false);
    };

    const filteredMenuItems = menuItems.filter(item => item.text.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredPods = searchQuery ? pods.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5) : [];

    return (
        <>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: tokens.bg.surface, borderBottom: `1px solid ${tokens.border.default}`, boxShadow: 'none' }}>
                <Toolbar sx={{ minHeight: 72, px: { xs: 2, md: 4 }, display: 'flex', gap: 2 }}>
                    {isMobile && (
                        <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1, color: tokens.text.muted }}>
                            <MenuIcon />
                        </IconButton>
                    )}
                    
                    {/* Brand Logo in Header */}
                    {!isMobile && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: drawerWidth - 32, flexShrink: 0 }}>
                            <MetricsLogo sx={{ fontSize: 32, color: tokens.accent.blue, filter: `drop-shadow(0 0 8px ${tokens.accent.blue})` }} />
                            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', background: `linear-gradient(90deg, ${tokens.accent.blue} 0%, ${tokens.text.primary} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Metrics
                            </Typography>
                        </Box>
                    )}

                    {/* Global Search Bar */}
                    <Box sx={{
                        flexGrow: 1, maxWidth: 600, display: 'flex', alignItems: 'center',
                        bgcolor: tokens.bg.input, border: `1px solid ${tokens.border.default}`,
                        borderRadius: 2, px: 2, py: 0.75, transition: 'all 0.2s', ml: { xs: 0, md: 4 },
                        '&:focus-within': { borderColor: tokens.accent.blue, boxShadow: `0 0 0 1px ${tokens.accent.blue}` }
                    }}>
                        <SearchIcon sx={{ color: tokens.text.muted, fontSize: 20, mr: 1.5 }} />
                        <InputBase 
                            inputRef={searchInputRef}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setSearchAnchorEl(e.currentTarget);
                            }}
                            onFocus={(e) => {
                                if (searchQuery) setSearchAnchorEl(e.currentTarget);
                            }}
                            onBlur={() => setTimeout(() => setSearchAnchorEl(null), 200)}
                            placeholder="Search pages, pods... (⌘K)" 
                            sx={{ color: tokens.text.primary, width: '100%', fontSize: '0.9rem' }} 
                        />
                    </Box>

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Header Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <MuiTooltip title="Notifications">
                            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ color: notifications.length > 0 ? tokens.accent.blue : tokens.text.muted }}>
                                <Badge badgeContent={notifications.length} color="error" variant="dot">
                                    <NotificationsIcon fontSize="small" />
                                </Badge>
                            </IconButton>
                        </MuiTooltip>

                        {/* User Avatar & Menu Trigger */}
                        <Box
                            onClick={(e) => setProfileAnchorEl(e.currentTarget)}
                            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', p: 0.5, borderRadius: 2, '&:hover': { bgcolor: tokens.bg.elevated } }}
                        >
                            <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: tokens.bg.surface, border: `1px solid ${tokens.border.default}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: tokens.text.primary }}>A</Typography>
                            </Box>
                            {!isMobile && (
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: tokens.text.primary, lineHeight: 1 }}>Admin</Typography>
                                    <Typography sx={{ fontSize: '0.7rem', color: tokens.text.muted, mt: 0.5, lineHeight: 1 }}>System</Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Notifications Popover */}
            <Popover
                open={notificationsOpen}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { mt: 1.5, width: 360, bgcolor: tokens.bg.surface, border: `1px solid ${tokens.border.default}`, backgroundImage: 'none', borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' } }}
            >
                <Box sx={{ p: 2, borderBottom: `1px solid ${tokens.border.default}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationsIcon sx={{ color: tokens.text.muted, fontSize: 20 }} />
                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Notifications</Typography>
                </Box>
                <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
                    {notifications.length === 0 ? (
                        <ListItemText sx={{ p: 4, textAlign: 'center', color: tokens.text.muted }} primary="No active notifications." />
                    ) : (
                        notifications.map((notif) => (
                            <ListItemButton key={`${notif.type}-${notif.id}`} sx={{ borderBottom: `1px solid ${tokens.border.subtle}`, '&:hover': { bgcolor: tokens.bg.elevated }, py: 1.5 }}>
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {notif.type === 'alert' ? (
                                        <NotificationsIcon sx={{ color: getAlertColor((notif.data as Alert).level), fontSize: 20 }} />
                                    ) : (
                                        <HistoryIcon sx={{ color: tokens.accent.green, fontSize: 20 }} />
                                    )}
                                </ListItemIcon>
                                <ListItemText
                                    primary={(notif.data as (Alert | Action)).title}
                                    secondary={(notif.data as (Alert | Action)).message}
                                    primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600, color: tokens.text.primary }}
                                    secondaryTypographyProps={{ fontSize: '0.75rem', color: tokens.text.muted, mt: 0.5 }}
                                />
                                <MuiTooltip title="Dismiss">
                                    <IconButton size="small" onClick={(e) => handleDismissNotification(notif.type, notif.id, e)} sx={{ color: tokens.text.muted, '&:hover': { color: tokens.accent.red, bgcolor: alpha(tokens.accent.red, 0.1) } }}>
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </MuiTooltip>
                            </ListItemButton>
                        ))
                    )}
                </List>
            </Popover>

            {/* Profile Menu */}
            <Menu
                anchorEl={profileAnchorEl}
                open={profileMenuOpen}
                onClose={() => setProfileAnchorEl(null)}
                PaperProps={{ sx: { bgcolor: tokens.bg.surface, border: `1px solid ${tokens.border.default}`, mt: 1.5, minWidth: 160 } }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={() => { setProfileAnchorEl(null); onLogout(); }} sx={{ color: tokens.accent.red, py: 1.5, '&:hover': { bgcolor: alpha(tokens.accent.red, 0.1) } }}>
                    <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: tokens.accent.red }} /></ListItemIcon>
                    Logout
                </MenuItem>
            </Menu>

            {/* Search Results Popover */}
            <Popover
                open={Boolean(searchAnchorEl && searchQuery)}
                anchorEl={searchAnchorEl}
                onClose={() => setSearchAnchorEl(null)}
                disableAutoFocus
                disableEnforceFocus
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{ sx: { bgcolor: tokens.bg.surface, border: `1px solid ${tokens.border.default}`, mt: 1, minWidth: 400, maxWidth: 600, borderRadius: 2 } }}
            >
                <List disablePadding>
                    {filteredMenuItems.length > 0 && (
                        <Box sx={{ px: 2, py: 1 }}>
                            <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 600, letterSpacing: 1 }}>PAGES</Typography>
                        </Box>
                    )}
                    {filteredMenuItems.map(item => (
                        <ListItemButton 
                            key={item.path} 
                            onClick={() => { 
                                handleNavigation(item.path); 
                                setSearchQuery(''); 
                                setSearchAnchorEl(null); 
                            }}
                            sx={{ py: 1, '&:hover': { bgcolor: tokens.bg.elevated } }}
                        >
                            <ListItemIcon sx={{ color: tokens.text.muted, minWidth: 40 }}>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} primaryTypographyProps={{ color: tokens.text.primary, fontSize: '0.9rem' }} />
                        </ListItemButton>
                    ))}
                    
                    {filteredPods.length > 0 && (
                        <>
                            {filteredMenuItems.length > 0 && <Divider sx={{ my: 1, borderColor: tokens.border.default }} />}
                            <Box sx={{ px: 2, py: 1 }}>
                                <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 600, letterSpacing: 1 }}>KUBERNETES PODS</Typography>
                            </Box>
                            {filteredPods.map(pod => (
                                <ListItemButton 
                                    key={pod.name} 
                                    onClick={() => { 
                                        handleNavigation(`/dashboard/kubernetes/${pod.namespace}/${pod.name}`); 
                                        setSearchQuery(''); 
                                        setSearchAnchorEl(null); 
                                    }}
                                    sx={{ py: 1, '&:hover': { bgcolor: tokens.bg.elevated } }}
                                >
                                    <ListItemIcon sx={{ color: tokens.text.muted, minWidth: 40 }}><CloudIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText 
                                        primary={pod.name} 
                                        secondary={`Namespace: ${pod.namespace}`}
                                        primaryTypographyProps={{ color: tokens.text.primary, fontSize: '0.9rem' }} 
                                        secondaryTypographyProps={{ color: tokens.text.muted, fontSize: '0.75rem' }} 
                                    />
                                </ListItemButton>
                            ))}
                        </>
                    )}

                    {filteredMenuItems.length === 0 && filteredPods.length === 0 && (
                        <ListItem sx={{ py: 2 }}><ListItemText primary="No results found." primaryTypographyProps={{ color: tokens.text.muted, fontSize: '0.9rem' }} /></ListItem>
                    )}
                </List>
            </Popover>
        </>
    );
};

export default Topbar;
