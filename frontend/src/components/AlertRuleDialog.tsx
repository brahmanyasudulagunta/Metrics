import React from 'react';
import { Dialog, DialogTitle, DialogContent, Box, FormControl, InputLabel, Select, MenuItem, TextField, Button } from '@mui/material';

export interface AlertRule {
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

export const ALERT_TEMPLATES = [
    { name: 'High CPU Usage', query: 'sum(rate(container_cpu_usage_seconds_total[5m]))', threshold: 0.8, condition: 'above' },
    { name: 'High Memory Usage', query: 'sum(container_memory_working_set_bytes) / 1024 / 1024 / 1024', threshold: 16, condition: 'above' },
    { name: 'Low Disk Space', query: '(node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100', threshold: 10, condition: 'below' },
    { name: 'Pod Restart Spike', query: 'sum(changes(kube_pod_container_status_restarts_total[10m]))', threshold: 5, condition: 'above' },
    { name: 'Custom Alert', query: '', threshold: 0, condition: 'above' }
];

interface AlertRuleDialogProps {
    open: boolean;
    editingAlertId: number | null;
    newAlert: Partial<AlertRule>;
    setNewAlert: (alert: Partial<AlertRule>) => void;
    onClose: () => void;
    onSave: () => void;
}

const AlertRuleDialog: React.FC<AlertRuleDialogProps> = ({ open, editingAlertId, newAlert, setNewAlert, onClose, onSave }) => {
    
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

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
                        onChange={e => setNewAlert({ ...newAlert, name: e.target.value })}
                        placeholder="e.g. High CPU Usage"
                    />
                    <TextField
                        label="Prometheus Query"
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={2}
                        value={newAlert.metric_query}
                        onChange={e => setNewAlert({ ...newAlert, metric_query: e.target.value })}
                        placeholder="e.g. sum(rate(container_cpu_usage_seconds_total[5m]))"
                        inputProps={{ style: { fontFamily: 'monospace' } }}
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel>Condition</InputLabel>
                            <Select
                                value={newAlert.condition}
                                label="Condition"
                                onChange={e => setNewAlert({ ...newAlert, condition: e.target.value as string })}
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
                            onChange={e => setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) })}
                        />
                    </Box>
                </Box>
            </DialogContent>
            <Box sx={{ p: 2, px: 3, display: 'flex', justifyContent: 'flex-end', gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button
                    variant="contained"
                    onClick={onSave}
                    disabled={!newAlert.name || !newAlert.metric_query}
                >
                    {editingAlertId ? 'Save Changes' : 'Create Alert'}
                </Button>
            </Box>
        </Dialog>
    );
};

export default AlertRuleDialog;
