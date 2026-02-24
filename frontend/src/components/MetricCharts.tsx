import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface MetricData {
    time: string;
    value: number;
}

interface ChartThresholds {
    warning: number;
    critical: number;
}

interface MetricChartsProps {
    cpuData: MetricData[];
    memData: MetricData[];
    diskData: MetricData[];
    rxData: MetricData[];
    txData: MetricData[];
    thresholds: {
        cpu: ChartThresholds;
        memory: ChartThresholds;
        disk: ChartThresholds;
    };
    tabValue: number;
}

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    const index = Math.min(i, sizes.length - 1);
    return `${(bytes / Math.pow(k, index)).toFixed(2)} ${sizes[index]}`;
};

const PercentageTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <Paper sx={{ p: 1.5, bgcolor: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.75rem', color: '#8b949e' }}>{label}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: payload[0].color || payload[0].stroke, mr: 1 }} />
                    <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.85rem' }}>
                        {payload[0].value.toFixed(2)}%
                    </Typography>
                </Box>
            </Paper>
        );
    }
    return null;
}

const NetworkTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <Paper sx={{ p: 1.5, bgcolor: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.75rem', color: '#8b949e' }}>{label}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: payload[0].color || payload[0].stroke, mr: 1 }} />
                    <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.85rem' }}>
                        {formatBytes(payload[0].value)}
                    </Typography>
                </Box>
            </Paper>
        );
    }
    return null;
}

const formatPercent = (value: number) => `${value}%`;

const formatNetworkTick = (value: number) => {
    if (value === 0) return '0';
    const k = 1000;
    if (value < k) return `${value.toFixed(0)}B`;
    if (value < k * k) return `${(value / k).toFixed(0)}k`;
    return `${(value / (k * k)).toFixed(1)}M`;
};

const ChartPanel: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <Box sx={{ flex: '1 1 48%', minWidth: 320 }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: 'text.secondary', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
        </Typography>
        {children}
    </Box>
);

const MetricCharts: React.FC<MetricChartsProps> = ({
    cpuData,
    memData,
    diskData,
    rxData,
    txData,
    thresholds,
    tabValue,
}) => {
    return (
        <Box>
            {tabValue === 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    <ChartPanel title="CPU Usage">
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={cpuData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#5794f2" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#5794f2" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis dataKey="time" stroke="transparent" tick={{ fill: '#555', fontSize: 11 }} tickLine={false} />
                                <YAxis tickFormatter={formatPercent} domain={[0, 100]} stroke="transparent" tick={{ fill: '#555', fontSize: 11 }} tickLine={false} />
                                <Tooltip content={<PercentageTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
                                <Legend wrapperStyle={{ paddingTop: 10, fontSize: '0.75rem' }} />
                                {thresholds.cpu.warning > 0 && <ReferenceLine y={thresholds.cpu.warning} stroke="rgba(255,152,0,0.3)" strokeDasharray="5 5" />}
                                {thresholds.cpu.critical > 0 && <ReferenceLine y={thresholds.cpu.critical} stroke="rgba(244,67,54,0.3)" strokeDasharray="5 5" />}
                                <Area type="monotone" dataKey="value" name="CPU" stroke="#5794f2" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCpu)" activeDot={{ r: 4, strokeWidth: 0 }} isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartPanel>
                    <ChartPanel title="Memory Usage">
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={memData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#73bf69" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#73bf69" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis dataKey="time" stroke="transparent" tick={{ fill: '#555', fontSize: 11 }} tickLine={false} />
                                <YAxis tickFormatter={formatPercent} domain={[0, 100]} stroke="transparent" tick={{ fill: '#555', fontSize: 11 }} tickLine={false} />
                                <Tooltip content={<PercentageTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
                                <Legend wrapperStyle={{ paddingTop: 10, fontSize: '0.75rem' }} />
                                {thresholds.memory.warning > 0 && <ReferenceLine y={thresholds.memory.warning} stroke="rgba(255,152,0,0.3)" strokeDasharray="5 5" />}
                                {thresholds.memory.critical > 0 && <ReferenceLine y={thresholds.memory.critical} stroke="rgba(244,67,54,0.3)" strokeDasharray="5 5" />}
                                <Area type="monotone" dataKey="value" name="Memory" stroke="#73bf69" strokeWidth={1.5} fillOpacity={1} fill="url(#colorMem)" activeDot={{ r: 4, strokeWidth: 0 }} isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartPanel>
                    <ChartPanel title="Disk Usage">
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={diskData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorDisk" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff9830" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#ff9830" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis dataKey="time" stroke="transparent" tick={{ fill: '#555', fontSize: 11 }} tickLine={false} />
                                <YAxis tickFormatter={formatPercent} domain={[0, 100]} stroke="transparent" tick={{ fill: '#555', fontSize: 11 }} tickLine={false} />
                                <Tooltip content={<PercentageTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
                                <Legend wrapperStyle={{ paddingTop: 10, fontSize: '0.75rem' }} />
                                {thresholds.disk.warning > 0 && <ReferenceLine y={thresholds.disk.warning} stroke="rgba(255,152,0,0.3)" strokeDasharray="5 5" />}
                                {thresholds.disk.critical > 0 && <ReferenceLine y={thresholds.disk.critical} stroke="rgba(244,67,54,0.3)" strokeDasharray="5 5" />}
                                <Area type="monotone" dataKey="value" name="Disk" stroke="#ff9830" strokeWidth={1.5} fillOpacity={1} fill="url(#colorDisk)" activeDot={{ r: 4, strokeWidth: 0 }} isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartPanel>
                </Box>
            )}

            {tabValue === 1 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    <ChartPanel title="Network Receive">
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={rxData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00ced1" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#00ced1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis dataKey="time" stroke="transparent" tick={{ fill: '#555', fontSize: 11 }} tickLine={false} />
                                <YAxis tickFormatter={formatNetworkTick} stroke="transparent" tick={{ fill: '#555', fontSize: 11 }} tickLine={false} />
                                <Tooltip content={<NetworkTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
                                <Legend wrapperStyle={{ paddingTop: 10, fontSize: '0.75rem' }} />
                                <Area type="monotone" dataKey="value" name="RX" stroke="#00ced1" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRx)" activeDot={{ r: 4, strokeWidth: 0 }} isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartPanel>
                    <ChartPanel title="Network Transmit">
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={txData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8a2be2" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#8a2be2" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis dataKey="time" stroke="transparent" tick={{ fill: '#555', fontSize: 11 }} tickLine={false} />
                                <YAxis tickFormatter={formatNetworkTick} stroke="transparent" tick={{ fill: '#555', fontSize: 11 }} tickLine={false} />
                                <Tooltip content={<NetworkTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
                                <Legend wrapperStyle={{ paddingTop: 10, fontSize: '0.75rem' }} />
                                <Area type="monotone" dataKey="value" name="TX" stroke="#8a2be2" strokeWidth={1.5} fillOpacity={1} fill="url(#colorTx)" activeDot={{ r: 4, strokeWidth: 0 }} isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartPanel>
                </Box>
            )}
        </Box>
    );
};

export default MetricCharts;
