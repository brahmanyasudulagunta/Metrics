import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Chip, Alert, CircularProgress, Button, alpha, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Divider, Grid } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import axios from 'axios';
import API_URL from '../config';
import { tokens } from '../theme';

interface OptimizationData {
    namespace: string;
    pod: string;
    deployment: string;
    requested_mb: number;
    used_mb: number;
    waste_mb: number;
    requested_cpu: number;
    used_cpu: number;
    waste_cpu: number;
}

interface OptResponse {
    optimizations: OptimizationData[];
    total_waste_mb: number;
    total_waste_cpu: number;
    estimated_monthly_waste_usd: number;
    error?: string;
}

const Optimization: React.FC = () => {
    const [data, setData] = useState<OptResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [applying, setApplying] = useState<string | null>(null);
    const [applyDialog, setApplyDialog] = useState<{ open: boolean, opt: OptimizationData | null }>({ open: false, opt: null });

    const fetchOptimization = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/metrics/optimization`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.error) {
                setError(res.data.error);
            } else {
                setData(res.data);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch optimization data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOptimization();
    }, []);

    const handleApply = (opt: OptimizationData) => {
        if (!opt.deployment) {
            alert("Could not identify deployment name for this pod.");
            return;
        }
        setApplyDialog({ open: true, opt });
    };

    const executeApply = async () => {
        const opt = applyDialog.opt;
        if (!opt) return;
        setApplyDialog({ open: false, opt: null });

        const newCpu = Math.max((opt.used_cpu * 1.5), 0.1).toFixed(3);
        const newMem = Math.max((opt.used_mb * 1.5), 64).toFixed(0);

        setApplying(opt.pod);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                deployment: opt.deployment,
                namespace: opt.namespace,
                cpu_limit: `${newCpu}`,
                memory_limit: `${newMem}Mi`
            };
            await axios.post(`${API_URL}/api/metrics/optimization/apply`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTimeout(fetchOptimization, 1000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to apply optimization.');
        } finally {
            setApplying(null);
        }
    };

    if (loading && !data) {
        return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: tokens.accent.blue }} /></Box>;
    }

    const { optimizations = [], total_waste_mb = 0, total_waste_cpu = 0, estimated_monthly_waste_usd = 0 } = data || {};

    // Sort optimizations by total waste impact
    const displayList = [...optimizations].sort((a, b) => (b.waste_mb + b.waste_cpu * 1000) - (a.waste_mb + a.waste_cpu * 1000));

    // Calculate Efficiency (Mockup logic for visual flair based on waste)
    const efficiencyScore = Math.max(100 - (total_waste_cpu * 5), 45).toFixed(1);

    return (
        <Box>
            {/* Header Area */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: tokens.text.primary, letterSpacing: '-0.02em' }}>
                    Optimization
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" endIcon={<KeyboardArrowDownIcon />} sx={{ color: tokens.text.secondary, borderColor: tokens.border.default, borderRadius: 2, '&:hover': { bgcolor: tokens.bg.elevated, borderColor: tokens.border.subtle } }}>
                        Timeframe: <Typography component="span" sx={{ color: tokens.text.primary, ml: 1, fontWeight: 600 }}>Last 30 Days</Typography>
                    </Button>
                    <Button variant="outlined" endIcon={<KeyboardArrowDownIcon />} sx={{ color: tokens.text.secondary, borderColor: tokens.border.default, borderRadius: 2, '&:hover': { bgcolor: tokens.bg.elevated, borderColor: tokens.border.subtle } }}>
                        Cluster: <Typography component="span" sx={{ color: tokens.text.primary, ml: 1, fontWeight: 600 }}>All Clusters</Typography>
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* KPI Widgets */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 5 }}>

                {/* Efficiency Ring Card */}
                <Paper sx={{ p: 3, bgcolor: tokens.bg.surface, borderRadius: 3, border: `1px solid ${tokens.border.default}`, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>Overall Efficiency</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1, position: 'relative', height: 120 }}>
                        <Box sx={{ position: 'absolute', width: 110, height: 110, borderRadius: '50%', border: `8px solid ${alpha(tokens.accent.blue, 0.2)}` }} />
                        <Box sx={{ position: 'absolute', width: 110, height: 110, borderRadius: '50%', border: `8px solid ${tokens.accent.blue}`, borderLeftColor: 'transparent', borderBottomColor: 'transparent', transform: 'rotate(45deg)' }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: tokens.text.primary }}>{efficiencyScore}%</Typography>
                            <Typography sx={{ color: tokens.accent.green, fontSize: '0.75rem', fontWeight: 600 }}>+5.1% ↑</Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* Status Card */}
                <Paper sx={{ p: 3, bgcolor: tokens.bg.surface, borderRadius: 3, border: `1px solid ${tokens.border.default}`, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3 }}>Active Clusters</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 3 }}>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: tokens.text.primary, mr: 1, lineHeight: 1 }}>32</Typography>
                        <Typography variant="body1" sx={{ color: tokens.text.muted }}>Active</Typography>
                    </Box>
                    <Divider sx={{ borderColor: tokens.border.default, mb: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ color: tokens.accent.blue, fontWeight: 600 }}>2 Idle</Typography>
                        <Typography sx={{ color: tokens.text.muted, fontSize: '0.75rem', bgcolor: tokens.bg.elevated, px: 1, borderRadius: 1 }}>ℹ</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ color: tokens.accent.yellow, fontWeight: 600 }}>1 Warning</Typography>
                        <WarningAmberIcon sx={{ color: tokens.accent.yellow, fontSize: 16 }} />
                    </Box>
                </Paper>

                {/* Resource Utilization Bars */}
                <Paper sx={{ p: 3, bgcolor: tokens.bg.surface, borderRadius: 3, border: `1px solid ${tokens.border.default}`, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Total CPU Wasted</Typography>
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography sx={{ color: tokens.text.muted, fontSize: '0.85rem' }}>CPU Cores</Typography>
                            <Typography sx={{ color: tokens.text.primary, fontWeight: 600 }}>{total_waste_cpu.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ width: '100%', height: 24, bgcolor: tokens.bg.elevated, borderRadius: 1, overflow: 'hidden' }}>
                            <Box sx={{ height: '100%', width: '65%', background: `linear-gradient(90deg, ${tokens.accent.green} 0%, ${tokens.accent.blue} 100%)` }} />
                        </Box>
                    </Box>

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>Total RAM Wasted</Typography>
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography sx={{ color: tokens.text.muted, fontSize: '0.85rem' }}>Memory (GB)</Typography>
                            <Typography sx={{ color: tokens.text.primary, fontWeight: 600 }}>{(total_waste_mb / 1024).toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ width: '100%', height: 24, bgcolor: tokens.bg.elevated, borderRadius: 1, overflow: 'hidden' }}>
                            <Box sx={{ height: '100%', width: '82%', background: `linear-gradient(90deg, ${tokens.accent.green} 0%, ${tokens.accent.blue} 100%)` }} />
                        </Box>
                    </Box>
                </Paper>

                {/* Savings Widget */}
                <Paper sx={{ p: 3, bgcolor: tokens.bg.base, borderRadius: 3, border: `1px solid ${alpha(tokens.accent.blue, 0.3)}`, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Box sx={{ position: 'absolute', top: '-50%', right: '-50%', width: '200%', height: '200%', background: `radial-gradient(circle, ${alpha(tokens.accent.blue, 0.15)} 0%, transparent 60%)`, pointerEvents: 'none' }} />
                    <Typography variant="subtitle2" color="text.secondary" sx={{ position: 'relative', zIndex: 1, mb: 2, textAlign: 'center' }}>Estimated Savings</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: tokens.text.primary, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                        ${estimated_monthly_waste_usd.toFixed(0)}
                    </Typography>
                    <Typography sx={{ color: tokens.accent.blue, textAlign: 'center', position: 'relative', zIndex: 1, mt: 1, fontWeight: 600 }}>
                        / month
                    </Typography>
                </Paper>
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Optimized Resources</Typography>

            {/* Modernized List View */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {displayList.length === 0 ? (
                    <Paper sx={{ p: 6, textAlign: 'center', bgcolor: tokens.bg.surface, borderRadius: 3, border: `1px dashed ${tokens.border.default}` }}>
                        <CheckCircleOutlineIcon sx={{ fontSize: 48, color: tokens.accent.green, mb: 2, opacity: 0.8 }} />
                        <Typography variant="h6" color="text.primary">Your cluster is highly optimized!</Typography>
                        <Typography color="text.muted" sx={{ mt: 1 }}>No significant resource waste detected across your workloads.</Typography>
                    </Paper>
                ) : (
                    displayList.map((opt, i) => {
                        const monthlySavings = ((opt.waste_cpu * 20) + (opt.waste_mb / 1024 * 5)).toFixed(2);
                        const isCritical = opt.waste_mb > 500 || opt.waste_cpu > 0.5;

                        return (
                            <Paper key={i} sx={{
                                p: 3,
                                bgcolor: tokens.bg.surface,
                                borderRadius: 3,
                                border: `1px solid ${tokens.border.default}`,
                                transition: 'all 0.2s ease',
                                '&:hover': { bgcolor: tokens.bg.elevated, borderColor: tokens.border.subtle, transform: 'translateY(-2px)', boxShadow: `0 8px 24px rgba(0,0,0,0.2)` }
                            }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, alignItems: 'center' }}>

                                    {/* Workload Info */}
                                    <Box>
                                        <Typography variant="caption" sx={{ color: tokens.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resource</Typography>
                                        <Typography sx={{ fontWeight: 600, color: tokens.text.primary, fontSize: '1.05rem', mt: 0.5 }}>{opt.deployment || opt.pod}</Typography>

                                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: tokens.text.muted, display: 'block', mb: 0.5 }}>Namespace</Typography>
                                                <Chip label={opt.namespace} size="small" sx={{ bgcolor: alpha(tokens.accent.blue, 0.1), color: tokens.accent.blue, fontWeight: 600, borderRadius: 1 }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: tokens.text.muted, display: 'block', mb: 0.5 }}>Status</Typography>
                                                <Chip label={isCritical ? 'High Waste' : 'Active'} size="small" sx={{ bgcolor: isCritical ? alpha(tokens.accent.yellow, 0.1) : alpha(tokens.accent.green, 0.1), color: isCritical ? tokens.accent.yellow : tokens.accent.green, fontWeight: 600, borderRadius: 1 }} />
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Stats (CPU/RAM) */}
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: tokens.text.muted, textTransform: 'uppercase' }}>CPU Waste</Typography>
                                                <Typography sx={{ fontWeight: 700, color: tokens.text.primary, fontSize: '1.1rem' }}>{opt.waste_cpu.toFixed(2)} <Typography component="span" sx={{ color: tokens.text.muted, fontSize: '0.8rem' }}>Cores</Typography></Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: tokens.text.muted, textTransform: 'uppercase' }}>RAM Waste</Typography>
                                                <Typography sx={{ fontWeight: 700, color: tokens.text.primary, fontSize: '1.1rem' }}>{opt.waste_mb.toFixed(0)} <Typography component="span" sx={{ color: tokens.text.muted, fontSize: '0.8rem' }}>MB</Typography></Typography>
                                            </Box>
                                        </Box>

                                        {/* Abstract mini chart (decorative) */}
                                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: 24, opacity: 0.8 }}>
                                            {[40, 70, 45, 90, 60, 85, 30, 50, 80, 100, 40, 20].map((h, j) => (
                                                <Box key={j} sx={{ width: 6, height: `${h}%`, bgcolor: j > 8 ? tokens.border.default : tokens.accent.blue, borderRadius: 1 }} />
                                            ))}
                                        </Box>
                                    </Box>

                                    {/* Action Area */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' }, justifyContent: 'center' }}>
                                        <Typography variant="caption" sx={{ color: tokens.text.muted, mb: 1 }}>Potential Savings</Typography>
                                        <Typography sx={{ color: tokens.accent.blue, fontWeight: 600, mb: 2 }}>Save ${monthlySavings}/mo</Typography>

                                        <Button
                                            variant="outlined"
                                            disabled={applying === opt.pod || !opt.deployment}
                                            onClick={() => handleApply(opt)}
                                            sx={{
                                                borderRadius: '20px',
                                                px: 3,
                                                py: 1,
                                                borderColor: tokens.border.default,
                                                color: tokens.text.primary,
                                                textTransform: 'none',
                                                '&:hover': { bgcolor: alpha(tokens.text.primary, 0.05), borderColor: tokens.text.secondary }
                                            }}
                                        >
                                            {applying === opt.pod ? <CircularProgress size={20} sx={{ color: tokens.text.primary }} /> : 'Resize Instance'}
                                        </Button>
                                    </Box>

                                </Box>
                            </Paper>
                        );
                    })
                )}
            </Box>

            {/* Confirmation Dialog */}
            <Dialog open={applyDialog.open} onClose={() => setApplyDialog({ ...applyDialog, open: false })} PaperProps={{ sx: { bgcolor: tokens.bg.surface, backgroundImage: 'none', border: `1px solid ${tokens.border.default}` } }}>
                <DialogTitle sx={{ color: tokens.text.primary }}>Confirm Instance Resize</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: tokens.text.secondary }}>
                        Are you sure you want to apply AI optimization for <strong>{applyDialog.opt?.deployment}</strong>? This will scale down the limits to match historical usage.
                    </DialogContentText>
                    <Box sx={{ mt: 3, p: 2, bgcolor: tokens.bg.base, borderRadius: 2, border: `1px solid ${tokens.border.subtle}` }}>
                        <Typography sx={{ fontFamily: 'monospace', color: tokens.accent.blue, mb: 1 }}>
                            New CPU Limit: ~{Math.max(((applyDialog.opt?.used_cpu || 0) * 1.5), 0.1).toFixed(3)} cores
                        </Typography>
                        <Typography sx={{ fontFamily: 'monospace', color: tokens.accent.green }}>
                            New RAM Limit: ~{Math.max(((applyDialog.opt?.used_mb || 0) * 1.5), 64).toFixed(0)} MB
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={() => setApplyDialog({ ...applyDialog, open: false })} sx={{ color: tokens.text.muted }}>Cancel</Button>
                    <Button onClick={executeApply} variant="contained" sx={{ bgcolor: tokens.accent.blue, color: '#000', '&:hover': { bgcolor: tokens.accent.blueHover }, fontWeight: 600 }}>Apply Resize</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Optimization;
