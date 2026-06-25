import React, { useState, useEffect } from 'react';
import {
    Typography, Paper, Box, Switch, Button, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, CircularProgress, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { tokens } from '../theme';
import API_URL from '../config';
import axios from 'axios';
import AlertRuleDialog, { AlertRule } from '../components/AlertRuleDialog';

const AlertSettings: React.FC = () => {
    const [alerts, setAlerts] = useState<AlertRule[]>([]);
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

    const fetchAlerts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/alerts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAlerts(res.data);
        } catch (err) {
            console.error('Failed to fetch alerts:', err);
        }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
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
            const token = localStorage.getItem('token');
            const url = editingAlertId
                ? `${API_URL}/api/alerts/${editingAlertId}`
                : `${API_URL}/api/alerts`;
            const method = editingAlertId ? 'PUT' : 'POST';

            const res = await axios({
                method,
                url,
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                data: newAlert
            });
            
            if (res.status === 200 || res.status === 201 || res.status === 204) {
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

    const handleDeleteAlert = async (id: number) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/alerts/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAlerts();
        } catch (err) {
            console.error('Failed to delete alert:', err);
        }
    };

    const handleToggleAlert = async (alert: AlertRule) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/api/alerts/${alert.id}`,
                { is_enabled: !alert.is_enabled },
                { headers: { Authorization: `Bearer ${token}` } }
            );
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

            <AlertRuleDialog 
                open={openDialog}
                editingAlertId={editingAlertId}
                newAlert={newAlert}
                setNewAlert={setNewAlert}
                onClose={() => { setOpenDialog(false); setEditingAlertId(null); }}
                onSave={handleSaveAlert}
            />
        </Box>
    );
};

export default AlertSettings;
