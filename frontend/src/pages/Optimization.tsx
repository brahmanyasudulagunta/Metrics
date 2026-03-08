import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Alert, CircularProgress } from '@mui/material';
import SavingsIcon from '@mui/icons-material/Savings';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import axios from 'axios';
import API_URL from '../config';
import { tokens } from '../theme';

interface OptimizationData {
    namespace: string;
    pod: string;
    container: string;
    requested_mb: number;
    used_mb: number;
    waste_mb: number;
}

interface OptResponse {
    optimizations: OptimizationData[];
    total_waste_mb: number;
    estimated_monthly_waste_usd: number;
    error?: string;
}

const Optimization: React.FC = () => {
    const [data, setData] = useState<OptResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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

    if (loading) {
        return (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    const { optimizations = [], total_waste_mb = 0, estimated_monthly_waste_usd = 0 } = data || {};

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 3 }}>Resource Optimization</Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
                <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="subtitle2">Total Memory Wasted</Typography>
                    <Typography variant="h4" sx={{ color: tokens.accent.yellow, fontWeight: 700 }}>
                        {(total_waste_mb / 1024).toFixed(2)} GB
                    </Typography>
                </Paper>
                <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="subtitle2">Estimated Monthly Waste</Typography>
                    <Typography variant="h4" sx={{ color: tokens.accent.red, fontWeight: 700 }}>
                        ${estimated_monthly_waste_usd}
                    </Typography>
                </Paper>
            </Box>

            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Namespace / Pod</TableCell>
                            <TableCell>Container</TableCell>
                            <TableCell>Requested (MB)</TableCell>
                            <TableCell>Used (MB)</TableCell>
                            <TableCell>Waste (MB)</TableCell>
                            <TableCell>Recommendation</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {optimizations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                    <DoneAllIcon sx={{ fontSize: 48, mb: 1, opacity: 0.6, color: tokens.accent.green }} />
                                    <Typography sx={{ color: tokens.text.muted }}>Your cluster is highly optimized! No significant waste detected.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            optimizations.map((opt, i) => (
                                <TableRow key={i} hover>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 500 }}>{opt.pod}</Typography>
                                        <Typography variant="caption">{opt.namespace}</Typography>
                                    </TableCell>
                                    <TableCell>{opt.container}</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{opt.requested_mb} MB</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{opt.used_mb} MB</TableCell>
                                    <TableCell>
                                        <Typography sx={{ color: tokens.accent.yellow, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <WarningAmberIcon fontSize="small" />
                                            {opt.waste_mb} MB
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            color="primary"
                                            label={`Reduce to ~${(opt.used_mb * 1.5).toFixed(0)}MB`}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default Optimization;
