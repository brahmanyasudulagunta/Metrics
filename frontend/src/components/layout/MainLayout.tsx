import React, { useState, useEffect } from 'react';
import {
    Box, AppBar, Toolbar, Typography, Button, IconButton, Divider,
    Tooltip as MuiTooltip, Drawer, List, ListItemButton, ListItemIcon,
    ListItemText, useMediaQuery, useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ExploreIcon from '@mui/icons-material/Explore';
import SavingsIcon from '@mui/icons-material/Savings';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import CloudIcon from '@mui/icons-material/Cloud';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsIcon from '@mui/icons-material/Notifications';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import Popover from '@mui/material/Popover';
import Badge from '@mui/material/Badge';
import axios from 'axios';
import MetricsLogo from '../MetricsLogo';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface PortForward {
    local_port: string;
    pod_name: string;
    namespace: string;
    remote_port: number;
    age: number;
}

interface Alert {
    id: string;
    title: string;
    message: string;
    level: string;
}

interface MainLayoutProps {
    onLogout: () => void;
}
const MainLayout: React.FC<MainLayoutProps> = ({ onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [drawerOpen, setDrawerOpen] = useState(false);
    
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const notificationsOpen = Boolean(anchorEl);
    
    // Fetch generic notifications
    const [forwards, setForwards] = useState<PortForward[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await axios.get(`${API_URL}/api/metrics/notifications`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setForwards(res.data.forwards || []);
                setAlerts(res.data.alerts || []);
            } catch (err) {
                console.error("Failed to fetch notifications", err);
            }
        };
        
        // Fetch immediately, then poll
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleDismissNotification = async (type: string, id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // prevent link click
        if (type === 'port_forward') {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    await axios.post(`${API_URL}/api/metrics/port-forward/stop/${id}`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setForwards(prev => prev.filter(f => f.local_port !== id));
                }
            } catch (err) {
                console.error("Failed to stop port forward.", err);
            }
        } else if (type === 'alert') {
            // Future placeholder for alert dismissal endpoint
            setAlerts(prev => prev.filter(a => a.id !== id));
        }
    };

    const notifications = [
        ...alerts.map(a => ({ type: 'alert', id: a.id, data: a })),
        ...forwards.map(f => ({ type: 'port_forward', id: f.local_port, data: f }))
    ];

    const menuItems = [
        { text: 'Overview', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Explore', icon: <ExploreIcon />, path: '/dashboard/explore' },
        { text: 'Kubernetes', icon: <CloudIcon />, path: '/dashboard/kubernetes' },
        { text: 'Optimization', icon: <SavingsIcon />, path: '/dashboard/optimization' },
    ];

    const handleNavigation = (path: string) => {
        navigate(path);
        setDrawerOpen(false);
    };

    const isSelected = (path: string) =>
        location.pathname === path || (location.pathname === '/' && path === '/dashboard');

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Top Navigation Bar */}
            <AppBar position="fixed" sx={{
                bgcolor: '#161b22',
                borderBottom: '1px solid #30363d',
                boxShadow: 'none',
                zIndex: (theme) => theme.zIndex.drawer + 1
            }}>
                <Toolbar variant="dense" sx={{ minHeight: { xs: 56, sm: 72 }, px: 2, display: 'flex', justifyContent: 'space-between' }}>

                    {/* Left: Logo + Hamburger (mobile) or Nav Links (desktop) */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* Hamburger icon — mobile only */}
                        {isMobile && (
                            <IconButton
                                edge="start"
                                color="inherit"
                                onClick={() => setDrawerOpen(true)}
                                sx={{ mr: 1 }}
                            >
                                <MenuIcon />
                            </IconButton>
                        )}

                        <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mr: 4, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
                            <MetricsLogo sx={{ fontSize: 28, filter: 'drop-shadow(0 0 4px rgba(0,229,255,0.5))' }} />
                            Metrics
                        </Typography>

                        {/* Desktop nav buttons */}
                        {!isMobile && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {menuItems.map((item) => (
                                    <Button
                                        key={item.text}
                                        onClick={() => handleNavigation(item.path)}
                                        sx={{
                                            color: isSelected(item.path) ? '#fff' : '#c9d1d9',
                                            bgcolor: isSelected(item.path) ? '#1f6feb' : 'transparent',
                                            textTransform: 'none',
                                            fontWeight: isSelected(item.path) ? 'bold' : 'normal',
                                            px: 2,
                                            py: 0.5,
                                            borderRadius: 1,
                                            '&:hover': {
                                                bgcolor: isSelected(item.path) ? '#388bfd' : '#21262d'
                                            }
                                        }}
                                    >
                                        {React.cloneElement(item.icon, { sx: { mr: 1, fontSize: 20 } })}
                                        {item.text}
                                    </Button>
                                ))}
                            </Box>
                        )}
                    </Box>

                    {/* Right: Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MuiTooltip title="Notifications">
                            <IconButton 
                                size="small" 
                                sx={{ color: notifications.length > 0 ? '#58a6ff' : '#8b949e' }}
                                onClick={(e) => setAnchorEl(e.currentTarget)}
                            >
                                <Badge badgeContent={notifications.length} color="error" variant="dot">
                                    <NotificationsIcon fontSize="small" />
                                </Badge>
                            </IconButton>
                        </MuiTooltip>

                        <Popover
                            open={notificationsOpen}
                            anchorEl={anchorEl}
                            onClose={() => setAnchorEl(null)}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                            PaperProps={{
                                sx: { mt: 1.5, width: 340, bgcolor: '#161b22', border: '1px solid #30363d', backgroundImage: 'none' }
                            }}
                        >
                            <Box sx={{ p: 2, borderBottom: '1px solid #30363d', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <NotificationsIcon sx={{ color: '#8b949e', fontSize: 20 }} />
                                <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Notifications</Typography>
                            </Box>
                            
                            <List sx={{ p: 0, maxHeight: 300, overflow: 'auto' }}>
                                {notifications.length === 0 ? (
                                    <ListItemText sx={{ p: 3, textAlign: 'center', color: '#8b949e' }} primary="No active notifications." />
                                ) : (
                                    notifications.map((notif) => (
                                        <ListItemButton 
                                            key={`${notif.type}-${notif.id}`}
                                            onClick={() => {
                                                if (notif.type === 'port_forward') {
                                                    const token = localStorage.getItem('token') || '';
                                                    window.open(`${API_URL}/api/metrics/proxy/${notif.id}/?token=${token}`, '_blank');
                                                    setAnchorEl(null);
                                                }
                                            }}
                                            sx={{ borderBottom: '1px solid #21262d', '&:hover': { bgcolor: '#21262d' }, pr: 1 }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                {notif.type === 'port_forward' ? <AccountTreeIcon sx={{ color: '#3fb950', fontSize: 20 }} /> : <NotificationsIcon sx={{ color: '#d29922', fontSize: 20 }} />}
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary={notif.type === 'port_forward' ? `Port Forward: ${(notif.data as PortForward).pod_name}` : (notif.data as Alert).title}
                                                secondary={notif.type === 'port_forward' ? `${(notif.data as PortForward).remote_port} via Proxy` : (notif.data as Alert).message}
                                                primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }}
                                                secondaryTypographyProps={{ fontSize: '0.75rem', fontFamily: notif.type === 'port_forward' ? 'monospace' : 'inherit', color: '#8b949e' }}
                                            />
                                            <MuiTooltip title="Dismiss">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={(e) => handleDismissNotification(notif.type, notif.id, e)}
                                                    sx={{ color: '#8b949e', '&:hover': { color: '#f85149', bgcolor: 'rgba(248,81,73,0.1)' } }}
                                                >
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </MuiTooltip>
                                        </ListItemButton>
                                    ))
                                )}
                            </List>
                        </Popover>

                        <MuiTooltip title="Settings">
                            <IconButton size="small" sx={{ color: '#8b949e' }} onClick={() => navigate('/dashboard/settings')}>
                                <SettingsIcon fontSize="small" />
                            </IconButton>
                        </MuiTooltip>

                        {!isMobile && (
                            <MuiTooltip title="Help">
                                <IconButton 
                                    size="small" 
                                    sx={{ color: '#8b949e' }}
                                    onClick={() => window.open('https://kubernetes.io/docs/home/', '_blank')}
                                >
                                    <HelpOutlineIcon fontSize="small" />
                                </IconButton>
                            </MuiTooltip>
                        )}

                        <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1.5, borderColor: '#30363d' }} />

                        <MuiTooltip title="Logout">
                            <IconButton size="small" sx={{ color: '#f85149' }} onClick={onLogout}>
                                <LogoutIcon fontSize="small" />
                            </IconButton>
                        </MuiTooltip>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Mobile Drawer */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: {
                        width: 260,
                        bgcolor: '#161b22',
                        borderRight: '1px solid #30363d',
                    }
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: '1px solid #30363d' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MetricsLogo sx={{ fontSize: 24, filter: 'drop-shadow(0 0 4px rgba(0,229,255,0.5))' }} />
                        Metrics
                    </Typography>
                    <IconButton size="small" onClick={() => setDrawerOpen(false)} sx={{ color: '#8b949e' }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
                <List sx={{ pt: 1 }}>
                    {menuItems.map((item) => (
                        <ListItemButton
                            key={item.text}
                            onClick={() => handleNavigation(item.path)}
                            selected={isSelected(item.path)}
                            sx={{
                                mx: 1,
                                borderRadius: 1,
                                mb: 0.5,
                                '&.Mui-selected': {
                                    bgcolor: '#1f6feb',
                                    color: '#fff',
                                    '&:hover': { bgcolor: '#388bfd' },
                                    '& .MuiListItemIcon-root': { color: '#fff' },
                                },
                                '&:hover': { bgcolor: '#21262d' },
                            }}
                        >
                            <ListItemIcon sx={{ color: '#c9d1d9', minWidth: 36 }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.text}
                                primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isSelected(item.path) ? 600 : 400 }}
                            />
                        </ListItemButton>
                    ))}
                </List>
                <Box sx={{ flexGrow: 1 }} />
                <Divider sx={{ borderColor: '#30363d' }} />
                <List>
                    <ListItemButton onClick={() => { navigate('/dashboard/settings'); setDrawerOpen(false); }} sx={{ mx: 1, borderRadius: 1 }}>
                        <ListItemIcon sx={{ color: '#8b949e', minWidth: 36 }}><SettingsIcon /></ListItemIcon>
                        <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: '0.9rem' }} />
                    </ListItemButton>
                    <ListItemButton onClick={onLogout} sx={{ mx: 1, borderRadius: 1 }}>
                        <ListItemIcon sx={{ color: '#f85149', minWidth: 36 }}><LogoutIcon /></ListItemIcon>
                        <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.9rem', color: '#f85149' }} />
                    </ListItemButton>
                </List>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, pt: { xs: 9, sm: 11 } }}>
                <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
                    <Outlet /> {/* Renders the active nested route */}
                </Box>
            </Box>
        </Box>
    );
};

export default MainLayout;
