import React, { useEffect, useState } from 'react';
import { Typography, Box, CircularProgress, Alert, Divider } from '@mui/material';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import DiscFullIcon from '@mui/icons-material/DiscFull';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';
import SettingsIcon from '@mui/icons-material/Settings';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import axios from 'axios';
import API_URL from '../config';
import MetricCharts from '../components/MetricCharts';

interface MetricData { time: string; value: number; }
interface SystemInfo {
    uptime: string; load1: number; load5: number; load15: number;
    processesRunning: number; processesBlocked: number;
    temperature: { value: number; status: string; available: boolean };
}
interface ContainerInfo { name: string; cpu: number; memory: number; }

const THRESHOLDS = {
    cpu: { warning: 60, critical: 80 },
    memory: { warning: 70, critical: 85 },
    disk: { warning: 75, critical: 90 },
};

const getStatusColor = (value: number, thresholds = { warning: 60, critical: 80 }) => {
    if (value >= thresholds.critical) return '#f44336';
    if (value >= thresholds.warning) return '#ff9800';
    return '#4caf50';
};

const getOverallStatus = (cpu: number, mem: number, disk: number) => {
    if (cpu >= 80 || mem >= 85 || disk >= 90) return { color: '#f44336', label: 'Degraded Performance' };
    if (cpu >= 60 || mem >= 70 || disk >= 75) return { color: '#ff9800', label: 'Elevated Usage' };
    return { color: '#4caf50', label: 'All Systems Operational' };
};

const Overview: React.FC = () => {
    const [cpuData, setCpuData] = useState<MetricData[]>([]);
    const [memData, setMemData] = useState<MetricData[]>([]);
    const [diskData, setDiskData] = useState<MetricData[]>([]);
    const [containers, setContainers] = useState<ContainerInfo[]>([]);
    const [systemInfo, setSystemInfo] = useState<SystemInfo>({
        uptime: 'Loading...', load1: 0, load5: 0, load15: 0, processesRunning: 0, processesBlocked: 0,
        temperature: { value: 0, status: 'N/A', available: false }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const getTimeRangeParams = () => {
        const end = Math.floor(Date.now() / 1000);
        const start = end - 3600;
        return { start, end, step: '15s' };
    };

    const fetchMetrics = async () => {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const { start, end, step } = getTimeRangeParams();

        try {
            const [cpuRes, memRes, diskRes, uptimeRes, loadRes, procRes, containersRes, tempRes] = await Promise.all([
                axios.get(`${API_URL}/api/metrics/cpu?start=${start}&end=${end}&step=${step}`, { headers }),
                axios.get(`${API_URL}/api/metrics/memory?start=${start}&end=${end}&step=${step}`, { headers }),
                axios.get(`${API_URL}/api/metrics/disk?start=${start}&end=${end}&step=${step}`, { headers }),
                axios.get(`${API_URL}/api/metrics/uptime`, { headers }),
                axios.get(`${API_URL}/api/metrics/load`, { headers }),
                axios.get(`${API_URL}/api/metrics/processes`, { headers }),
                axios.get(`${API_URL}/api/metrics/containers`, { headers }),
                axios.get(`${API_URL}/api/metrics/temperature`, { headers }),
            ]);
            setCpuData(cpuRes.data);
            setMemData(memRes.data);
            setDiskData(diskRes.data);
            setContainers(containersRes.data.containers || []);
            setSystemInfo({
                uptime: uptimeRes.data.uptime,
                load1: loadRes.data.load1, load5: loadRes.data.load5, load15: loadRes.data.load15,
                processesRunning: procRes.data.running, processesBlocked: procRes.data.blocked,
                temperature: tempRes.data,
            });
            setLastUpdated(new Date());
        } catch (err) {
            setError('Failed to fetch Overview metrics.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 15000);
        return () => clearInterval(interval);
    }, []);

    const getCurrentValue = (data: MetricData[]) => data.length > 0 ? data[data.length - 1].value : 0;

    const cpuVal = getCurrentValue(cpuData);
    const memVal = getCurrentValue(memData);
    const diskVal = getCurrentValue(diskData);
    const overallStatus = getOverallStatus(cpuVal, memVal, diskVal);

    const timeSinceUpdate = () => {
        const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
        if (seconds < 5) return 'just now';
        if (seconds < 60) return `${seconds}s ago`;
        return `${Math.floor(seconds / 60)}m ago`;
    };

    const [, setTick] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setTick(p => p + 1), 1000);
        return () => clearInterval(t);
    }, []);

    if (loading && cpuData.length === 0) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Box>
            {/* Status Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FiberManualRecordIcon sx={{ fontSize: 12, color: overallStatus.color }} />
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {overallStatus.label}
                    </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    Updated {timeSinceUpdate()}
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* System Info Row — flat with subtle dividers */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0, mb: 4, flexWrap: 'wrap' }}>
                <StatItem
                    icon={<AccessTimeIcon sx={{ fontSize: 16, color: '#5794f2' }} />}
                    label="Uptime"
                    value={systemInfo.uptime}
                />
                <Divider orientation="vertical" flexItem sx={{ mx: 3, borderColor: 'rgba(255,255,255,0.06)' }} />
                <StatItem
                    icon={<SpeedIcon sx={{ fontSize: 16, color: '#5794f2' }} />}
                    label="Load Average"
                    value={`${systemInfo.load1} / ${systemInfo.load5} / ${systemInfo.load15}`}
                    sublabel="1 / 5 / 15 min"
                />
                <Divider orientation="vertical" flexItem sx={{ mx: 3, borderColor: 'rgba(255,255,255,0.06)' }} />
                <StatItem
                    icon={<SettingsIcon sx={{ fontSize: 16, color: '#ff9830' }} />}
                    label="Processes"
                    value={`${systemInfo.processesRunning}`}
                    sublabel={`${systemInfo.processesBlocked} blocked`}
                    suffix="running"
                />
                <Divider orientation="vertical" flexItem sx={{ mx: 3, borderColor: 'rgba(255,255,255,0.06)' }} />
                <StatItem
                    icon={<StorageIcon sx={{ fontSize: 16, color: '#73bf69' }} />}
                    label="Containers"
                    value={`${containers.length}`}
                    suffix="running"
                />
                <Divider orientation="vertical" flexItem sx={{ mx: 3, borderColor: 'rgba(255,255,255,0.06)' }} />
                <StatItem
                    icon={<ThermostatIcon sx={{ fontSize: 16, color: systemInfo.temperature.available ? (systemInfo.temperature.value > 80 ? '#f44336' : '#8b949e') : '#8b949e' }} />}
                    label="Temperature"
                    value={systemInfo.temperature.available ? `${systemInfo.temperature.value}°C` : 'N/A'}
                    sublabel={systemInfo.temperature.status}
                />
            </Box>

            {/* Metric values — large bold numbers, no borders, no badges */}
            <Box sx={{ display: 'flex', gap: 6, mb: 4, flexWrap: 'wrap' }}>
                <MetricValue
                    icon={<MemoryIcon sx={{ fontSize: 16, color: '#8b949e' }} />}
                    label="CPU"
                    value={cpuVal}
                    color={getStatusColor(cpuVal, THRESHOLDS.cpu)}
                />
                <MetricValue
                    icon={<StorageIcon sx={{ fontSize: 16, color: '#8b949e' }} />}
                    label="Memory"
                    value={memVal}
                    color={getStatusColor(memVal, THRESHOLDS.memory)}
                />
                <MetricValue
                    icon={<DiscFullIcon sx={{ fontSize: 16, color: '#8b949e' }} />}
                    label="Disk"
                    value={diskVal}
                    color={getStatusColor(diskVal, THRESHOLDS.disk)}
                />
            </Box>

            <Divider sx={{ mb: 4, borderColor: 'rgba(255,255,255,0.06)' }} />

            {/* Charts */}
            <MetricCharts
                cpuData={cpuData}
                memData={memData}
                diskData={diskData}
                rxData={[]} txData={[]}
                thresholds={THRESHOLDS}
                tabValue={0}
            />
        </Box>
    );
};

/* ── Inline Sub-Components ── */

const StatItem: React.FC<{ icon: React.ReactNode; label: string; value: string; sublabel?: string; suffix?: string }> = ({ icon, label, value, sublabel, suffix }) => (
    <Box sx={{ minWidth: 100 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            {icon}
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
            </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2 }}>
                {value}
            </Typography>
            {suffix && (
                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    {suffix}
                </Typography>
            )}
        </Box>
        {sublabel && (
            <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', mt: 0.25 }}>
                {sublabel}
            </Typography>
        )}
    </Box>
);

const MetricValue: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> = ({ icon, label, value, color }) => (
    <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            {icon}
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
            </Typography>
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: '2rem', color, lineHeight: 1.1 }}>
            {value.toFixed(1)}%
        </Typography>
    </Box>
);

export default Overview;
