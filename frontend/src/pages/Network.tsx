import React, { useEffect, useState } from 'react';
import { Typography, Box, CircularProgress, Alert, Divider } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import axios from 'axios';
import API_URL from '../config';
import MetricCharts from '../components/MetricCharts';

interface MetricData { time: string; value: number; }

const Network: React.FC = () => {
    const [rxData, setRxData] = useState<MetricData[]>([]);
    const [txData, setTxData] = useState<MetricData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const getTimeRangeParams = () => {
        const end = Math.floor(Date.now() / 1000);
        const start = end - 3600;
        return { start, end, step: '15s' };
    };

    const fetchNetworkMetrics = async () => {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const { start, end, step } = getTimeRangeParams();

        try {
            const [rxRes, txRes] = await Promise.all([
                axios.get(`${API_URL}/api/metrics/network_rx?start=${start}&end=${end}&step=${step}`, { headers }),
                axios.get(`${API_URL}/api/metrics/network_tx?start=${start}&end=${end}&step=${step}`, { headers }),
            ]);
            setRxData(rxRes.data);
            setTxData(txRes.data);
        } catch (err) {
            setError('Failed to fetch Network metrics.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNetworkMetrics();
        const interval = setInterval(fetchNetworkMetrics, 15000);
        return () => clearInterval(interval);
    }, []);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B/s';
        const k = 1024;
        const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
        const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
        const index = Math.min(i, sizes.length - 1);
        return `${(bytes / Math.pow(k, index)).toFixed(2)} ${sizes[index]}`;
    };

    const getCurrentValue = (data: MetricData[]) => data.length > 0 ? data[data.length - 1].value : 0;

    if (loading && rxData.length === 0) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>Network</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Current throughput — flat, bold, no borders */}
            <Box sx={{ display: 'flex', gap: 6, mb: 4 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <ArrowDownwardIcon sx={{ fontSize: 16, color: '#8b949e' }} />
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Receive
                        </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '2rem', color: '#00ced1', lineHeight: 1.1 }}>
                        {formatBytes(getCurrentValue(rxData))}
                    </Typography>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <ArrowUpwardIcon sx={{ fontSize: 16, color: '#8b949e' }} />
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Transmit
                        </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '2rem', color: '#8a2be2', lineHeight: 1.1 }}>
                        {formatBytes(getCurrentValue(txData))}
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 4, borderColor: 'rgba(255,255,255,0.06)' }} />

            {/* Charts */}
            <MetricCharts
                cpuData={[]} memData={[]} diskData={[]}
                rxData={rxData}
                txData={txData}
                thresholds={{ cpu: { warning: 0, critical: 0 }, memory: { warning: 0, critical: 0 }, disk: { warning: 0, critical: 0 } }}
                tabValue={1}
            />
        </Box>
    );
};

export default Network;
