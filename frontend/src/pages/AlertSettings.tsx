import React, { useState, useEffect } from 'react';
import { 
    Typography, Paper, Box, Divider, 
    Switch, Button, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, TextField, CircularProgress,
    Select, MenuItem, FormControl, InputLabel, Tabs, Tab, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { tokens } from '../theme';
// import API_URL from '../config'; // Removed

interface AlertRule {
    id: number;
    name: string;
    metric_query: string;
    threshold: number;
    condition: string;
    duration: string;
    is_enabled: boolean;
    is_firing: boolean;
    last_value?: number;
    last_fired_at?: string;
    last_checked_at?: string;
    firing_details?: Record<string, string>;
}

// interface FiredAlert { // Removed
//     id: number;
//     alert_name: string;
//     value: number;
//     threshold: number;
//     condition: string;
//     fired_at: string;
//     labels: Record<string, string>;
// } // Removed

const AlertSettings: React.FC = () => {
    // const [tab, setTab] = useState(0); // Removed
    const [alerts, setAlerts] = useState<AlertRule[]>([]);
    // const [history, setHistory] = useState<FiredAlert[]>([]); // Removed
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingAlertId, setEditingAlertId] = useState<number | null>(null);
    const [newAlert, setNewAlert] = useState<Partial<AlertRule>>({
        name: '',
        metric_query: '',
        threshold: 0,
        condition: 'above',
        duration: '1m'
    });

    const API_URL = process.env.REACT_APP_API_URL || '';

    const fetchAlerts = async () => {
        try {
            const res = await fetch(`${API_URL}/api/alerts`);
            const data = await res.json();
            setAlerts(data);
        } catch (err) {
            console.error('Failed to fetch alerts:', err);
        }
    };

    // const fetchHistory = async () => { // Removed
    //     try {
    //         const res = await fetch(`${API_URL}/api/alerts/history`);
    //         const data = await res.json();
    //         setHistory(data);
    //     } catch (err) {
    //         console.error('Failed to fetch history:', err);
    //     }
    // }; // Removed

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            // await Promise.all([fetchAlerts(), fetchHistory()]); // Modified
            await fetchAlerts();
            setLoading(false);
        };
        const interval = setInterval(fetchAlerts, 10000); // Poll every 10s for status updates
        load();
        return () => clearInterval(interval);
    }, []);

    const handleEditOpen = (alert: AlertRule) => {
        setEditingAlertId(alert.id);
        setNewAlert({
            name: alert.name,
            metric_query: alert.metric_query,
            threshold: alert.threshold,
            condition: alert.condition,
            duration: alert.duration
        });
        setOpenDialog(true);
    };

    const handleSaveAlert = async () => {
        try {
            const url = editingAlertId 
                ? `${API_URL}/api/alerts/${editingAlertId}`
                : `${API_URL}/api/alerts`;
            const method = editingAlertId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAlert)
            });
            if (res.ok) {
                setOpenDialog(false);
                setEditingAlertId(null);
                setNewAlert({
                    name: '',
                    metric_query: '',
                    threshold: 0,
                    condition: 'above',
                    duration: '1m'
                });
                fetchAlerts();
            }
        } catch (err) {
            console.error('Failed to save alert:', err);
        }
    };

    const ALERT_TEMPLATES = [
        { name: 'High CPU Usage', query: 'sum(rate(container_cpu_usage_seconds_total[5m]))', threshold: 0.8, condition: 'above' },
        { name: 'High Memory Usage', query: 'sum(container_memory_working_set_bytes) / 1024 / 1024 / 1024', threshold: 16, condition: 'above' },
        { name: 'Low Disk Space', query: '(node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100', threshold: 10, condition: 'below' },
        { name: 'Pod Restart Spike', query: 'sum(changes(kube_pod_container_status_restarts_total[10m]))', threshold: 5, condition: 'above' },
        { name: 'Custom Alert', query: '', threshold: 0, condition: 'above' }
    ];

    const applyTemplate = (templateName: string) => {
        const template = ALERT_TEMPLATES.find(t => t.name === templateName);
        if (template) {
            setNewAlert({
                ...newAlert,
                name: template.name === 'Custom Alert' ? '' : template.name,
                metric_query: template.query,
                threshold: template.threshold,
                condition: template.condition
            });
        }
    };

    const handleDeleteAlert = async (id: number) => {
        try {
            await fetch(`${API_URL}/api/alerts/${id}`, { method: 'DELETE' });
            fetchAlerts();
        } catch (err) {
            console.error('Failed to delete alert:', err);
        }
    };

    const handleToggleAlert = async (alert: AlertRule) => {
        try {
            await fetch(`${API_URL}/api/alerts/${alert.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_enabled: !alert.is_enabled })
            });
            fetchAlerts();
        } catch (err) {
            console.error('Failed to toggle alert:', err);
        }
    };

    const getRelativeTime = (dateString?: string) => {
        if (!dateString) return '';
        const now = new Date();
        const then = new Date(dateString);
        const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

        if (diffInSeconds < 5) return 'just now';
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>Active Alert Rules</Typography>
                        <Typography variant="caption" sx={{ color: tokens.text.muted }}>
                            Real-time status of your monitoring thresholds.
                        </Typography>
                    </Box>
                    <Button 
                        startIcon={<AddIcon />} 
                        variant="contained" 
                        size="small"
                        onClick={() => setOpenDialog(true)}
                        sx={{ textTransform: 'none', height: 32 }}
                    >
                        New Alert
                    </Button>
                </Box>
                
                {loading && alerts.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={24} /></Box>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Alert Rule</TableCell>
                                    <TableCell>Threshold</TableCell>
                                    <TableCell>Current Status</TableCell>
                                    <TableCell>Latest Check</TableCell>
                                    <TableCell>Enabled</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {alerts.map(alert => (
                                    <TableRow key={alert.id} hover sx={{ 
                                        bgcolor: alert.is_firing ? 'rgba(255, 77, 77, 0.03)' : 'inherit'
                                    }}>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{alert.name}</Typography>
                                            {alert.is_firing && alert.firing_details && typeof alert.firing_details === 'object' && (
                                                <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {Object.entries(alert.firing_details).slice(0, 3).map(([k, v]) => (
                                                        <Chip key={k} label={`${k}=${v}`} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
                                                    ))}
                                                    {Object.keys(alert.firing_details).length > 3 && (
                                                        <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>...</Typography>
                                                    )}
                                                </Box>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ color: tokens.text.muted }}>
                                            {alert.condition === 'above' ? '>' : '<'} {alert.threshold}
                                        </TableCell>
                                        <TableCell>
                                            {alert.is_firing ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Chip 
                                                        label="FIRING" 
                                                        size="small" 
                                                        sx={{ 
                                                            bgcolor: tokens.accent.red, 
                                                            color: 'white', 
                                                            fontWeight: 700, 
                                                            height: 20, 
                                                            fontSize: '0.65rem' 
                                                        }} 
                                                    />
                                                    <Box>
                                                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: tokens.accent.red }}>
                                                            {alert.last_value?.toFixed(2)}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.65rem', color: tokens.text.muted }}>
                                                            since {getRelativeTime(alert.last_fired_at)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            ) : (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Chip 
                                                        label="OK" 
                                                        size="small" 
                                                        variant="outlined"
                                                        sx={{ 
                                                            borderColor: tokens.accent.green, 
                                                            color: tokens.accent.green, 
                                                            height: 20, 
                                                            fontSize: '0.65rem' 
                                                        }} 
                                                    />
                                                    {alert.last_value !== undefined && alert.last_value !== null && (
                                                        <Typography sx={{ fontSize: '0.75rem', color: tokens.text.muted }}>
                                                            {alert.last_value.toFixed(2)}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem', color: tokens.text.muted }}>
                                            {getRelativeTime(alert.last_checked_at)}
                                        </TableCell>
                                        <TableCell>
                                            <Switch 
                                                size="small" 
                                                color="primary"
                                                checked={alert.is_enabled} 
                                                onChange={() => handleToggleAlert(alert)}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button 
                                                size="small" 
                                                onClick={() => handleEditOpen(alert)} 
                                                sx={{ mr: 1, textTransform: 'none', color: tokens.accent.blue, minWidth: 0 }}
                                            >
                                                Edit
                                            </Button>
                                            <Button 
                                                size="small" 
                                                color="error" 
                                                onClick={() => handleDeleteAlert(alert.id)}
                                                sx={{ textTransform: 'none', minWidth: 0 }}
                                            >
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {alerts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: tokens.text.muted }}>
                                            No alert rules configured.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setEditingAlertId(null); }} maxWidth="sm" fullWidth>
                <DialogTitle>{editingAlertId ? 'Edit Alert Rule' : 'Create New Alert'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel>Common Monitoring Templates</InputLabel>
                            <Select
                                value={newAlert.name && ALERT_TEMPLATES.find(t => t.name === newAlert.name) ? newAlert.name : 'Custom Alert'}
                                label="Common Monitoring Templates"
                                onChange={e => applyTemplate(e.target.value as string)}
                            >
                                {ALERT_TEMPLATES.map(t => (
                                    <MenuItem key={t.name} value={t.name}>{t.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField 
                            label="Alert Name" 
                            fullWidth 
                            variant="outlined"
                            value={newAlert.name} 
                            onChange={e => setNewAlert({...newAlert, name: e.target.value})}
                            placeholder="e.g. High CPU Usage"
                        />
                        <TextField 
                            label="Prometheus Query" 
                            fullWidth 
                            variant="outlined"
                            multiline
                            rows={2}
                            value={newAlert.metric_query} 
                            onChange={e => setNewAlert({...newAlert, metric_query: e.target.value})}
                            placeholder="e.g. sum(rate(container_cpu_usage_seconds_total[5m]))"
                            inputProps={{ style: { fontFamily: 'monospace' } }}
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Condition</InputLabel>
                                <Select
                                    value={newAlert.condition}
                                    label="Condition"
                                    onChange={e => setNewAlert({...newAlert, condition: e.target.value as string})}
                                >
                                    <MenuItem value="above">Value is Above</MenuItem>
                                    <MenuItem value="below">Value is Below</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField 
                                label="Threshold" 
                                type="number"
                                fullWidth 
                                variant="outlined"
                                value={newAlert.threshold} 
                                onChange={e => setNewAlert({...newAlert, threshold: parseFloat(e.target.value)})}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <Box sx={{ p: 2, px: 3, display: 'flex', justifyContent: 'flex-end', gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => { setOpenDialog(false); setEditingAlertId(null); }} color="inherit">Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSaveAlert}
                        disabled={!newAlert.name || !newAlert.metric_query}
                    >
                        {editingAlertId ? 'Save Changes' : 'Create Alert'}
                    </Button>
                </Box>
            </Dialog>
        </Box>
    );
};

export default AlertSettings;
