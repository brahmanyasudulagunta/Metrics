import React, { useState } from 'react';
import { 
    Box, Typography, Paper, Tabs, Tab, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, Button,
    Dialog, DialogTitle, DialogContent, 
    DialogContentText, DialogActions, TextField, Fade
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import LaunchIcon from '@mui/icons-material/Launch';
import { Pod, Deployment, Service, PortForward } from './types';
import { tokens } from '../../theme';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../config';

interface NamespaceViewProps {
    namespace: string;
    pods: Pod[];
    deployments: Deployment[];
    services: Service[];
    formatDate: (iso: string | null) => string;
    getStatusColor: (status: string) => string;
    onDeletePod: (pod: Pod) => Promise<void>;
    onRestartDeployment: (dep: Deployment) => Promise<void>;
    onScaleDeployment: (dep: Deployment, replicas: number) => Promise<void>;
    tab: number;
    setTab: (tab: number) => void;
}

const NamespaceView: React.FC<NamespaceViewProps> = ({ 
    namespace, pods, deployments, services, formatDate, getStatusColor,
    onDeletePod, onRestartDeployment, onScaleDeployment, tab, setTab
}) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const cluster = searchParams.get('cluster');
    const [deletePodDialog, setDeletePodDialog] = useState<{ open: boolean, pod: Pod | null }>({ open: false, pod: null });
    const [restartDepDialog, setRestartDepDialog] = useState<{ open: boolean, dep: Deployment | null }>({ open: false, dep: null });
    const [scaleDepDialog, setScaleDepDialog] = useState<{ open: boolean, dep: Deployment | null, replicas: string }>({ open: false, dep: null, replicas: '' });
    
    // Port Forward State
    const [forwards, setForwards] = useState<PortForward[]>([]);
    const [portForwardDialog, setPortForwardDialog] = useState<{ 
        open: boolean, 
        podName: string,
        serviceName: string,
        namespace: string,
        remotePort: string, 
        localPort: string,
        loading: boolean,
        error: string
    }>({ 
        open: false, 
        podName: '',
        serviceName: '',
        namespace: '',
        remotePort: '', 
        localPort: '',
        loading: false,
        error: ''
    });

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchForwards = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/metrics/port-forward/list`, { headers });
            setForwards(res.data.forwards || []);
        } catch (err) {}
    };

    React.useEffect(() => {
        fetchForwards();
        const interval = setInterval(fetchForwards, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleStartPortForward = async () => {
        setPortForwardDialog(prev => ({ ...prev, loading: true, error: '' }));
        try {
            await axios.post(`${API_URL}/api/metrics/port-forward/start`, {
                namespace: portForwardDialog.namespace,
                pod_name: portForwardDialog.podName || undefined,
                service_name: portForwardDialog.serviceName || undefined,
                remote_port: parseInt(portForwardDialog.remotePort, 10),
                local_port: portForwardDialog.localPort
            }, { headers });
            setPortForwardDialog(prev => ({ ...prev, open: false, loading: false }));
            fetchForwards();
        } catch (err: any) {
            setPortForwardDialog(prev => ({ 
                ...prev, 
                loading: false, 
                error: err.response?.data?.detail || 'Failed to start port forward.' 
            }));
        }
    };

    const handleStopPortForward = async (localPort: string) => {
        try {
            await axios.post(`${API_URL}/api/metrics/port-forward/stop/${localPort}`, {}, { headers });
            fetchForwards();
        } catch (err) {}
    };

    const handleDeletePod = async () => {
        if (deletePodDialog.pod) {
            await onDeletePod(deletePodDialog.pod);
            setDeletePodDialog({ open: false, pod: null });
        }
    };

    const handleRestartDep = async () => {
        if (restartDepDialog.dep) {
            await onRestartDeployment(restartDepDialog.dep);
            setRestartDepDialog({ open: false, dep: null });
        }
    };

    const handleScaleDep = async () => {
        if (scaleDepDialog.dep) {
            const r = parseInt(scaleDepDialog.replicas, 10);
            if (!isNaN(r)) {
                await onScaleDeployment(scaleDepDialog.dep, r);
                setScaleDepDialog({ open: false, dep: null, replicas: '' });
            }
        }
    };

    return (
        <Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tab} onChange={(e, v) => setTab(v)}>
                    <Tab label="Pods" />
                    <Tab label="Deployments" />
                    <Tab label="Services" />
                </Tabs>
            </Box>

            <Fade in={tab === 0}>
                <Box sx={{ display: tab === 0 ? 'block' : 'none' }}>
                    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Restarts</TableCell>
                                    <TableCell>Age</TableCell>
                                    <TableCell align="left" sx={{ width: 150 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pods.map(pod => (
                                    <TableRow key={pod.name} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/dashboard/kubernetes/${pod.namespace}/${pod.name}${cluster ? `?cluster=${cluster}` : ''}`)}>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 500, color: tokens.accent.blue, '&:hover': { textDecoration: 'underline' } }}>{pod.name}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ color: getStatusColor(pod.status), fontWeight: 600 }}>{pod.status}</TableCell>
                                        <TableCell>{pod.restarts}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{formatDate(pod.age)}</TableCell>
                                        <TableCell align="left" onClick={(e) => e.stopPropagation()}>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button size="small" color="error" variant="contained" onClick={() => setDeletePodDialog({ open: true, pod })} sx={{ textTransform: 'none' }}>Delete</Button>
                                                {(() => {
                                                    const active = forwards.find(f => f.pod_name === pod.name && f.namespace === pod.namespace);
                                                    if (active) {
                                                        return (
                                                            <Button size="small" variant="contained" color="inherit" onClick={() => handleStopPortForward(active.local_port)} sx={{ textTransform: 'none', bgcolor: '#30363d' }}>Stop</Button>
                                                        );
                                                    }
                                                    return <Button size="small" variant="contained" color="primary" onClick={() => setPortForwardDialog({ ...portForwardDialog, open: true, podName: pod.name, serviceName: '', namespace: pod.namespace, remotePort: '80', localPort: '8080' })} sx={{ textTransform: 'none' }}>Forward</Button>;
                                                })()}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {pods.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: tokens.text.muted }}>No pods found.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Fade>

            <Fade in={tab === 1}>
                <Box sx={{ display: tab === 1 ? 'block' : 'none' }}>
                    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Ready</TableCell>
                                    <TableCell>Age</TableCell>
                                    <TableCell align="left" sx={{ width: 200 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {deployments.map(d => (
                                    <TableRow key={d.name} hover>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 500, color: tokens.accent.blue }}>{d.name}</Typography>
                                        </TableCell>
                                        <TableCell>{d.ready}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{formatDate(d.age)}</TableCell>
                                        <TableCell align="left">
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button size="small" variant="contained" color="warning" onClick={() => setRestartDepDialog({ open: true, dep: d })} sx={{ textTransform: 'none', color: '#000', bgcolor: tokens.accent.yellow }}>Restart</Button>
                                                <Button size="small" variant="contained" color="primary" onClick={() => setScaleDepDialog({ open: true, dep: d, replicas: d.ready.split('/')[1] || "0" })} sx={{ textTransform: 'none' }}>Scale</Button>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                 {deployments.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: tokens.text.muted }}>No deployments found.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Fade>

            <Fade in={tab === 2}>
                <Box sx={{ display: tab === 2 ? 'block' : 'none' }}>
                    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Cluster IP</TableCell>
                                    <TableCell>Ports</TableCell>
                                    <TableCell align="left" sx={{ width: 150 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {services.map(s => (
                                    <TableRow key={s.name} hover>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 500, color: tokens.accent.blue }}>{s.name}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{s.cluster_ip}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                                            {s.ports.split(', ').map((p, idx) => (
                                                <Typography key={idx} sx={{ fontSize: '0.8125rem', fontFamily: 'monospace', mb: 0.5 }}>{p}</Typography>
                                            ))}
                                        </TableCell>
                                        <TableCell align="left" onClick={(e) => e.stopPropagation()}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                {s.ports.split(', ').map((p, idx) => {
                                                    const portNum = p.split(':')[1]?.split('/')[0] || p.split(':')[0];
                                                    const active = forwards.find(f => f.namespace === s.namespace && f.remote_port === parseInt(portNum, 10)); // Simplified pod matching for SVC
                                                    
                                                    return (
                                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: '24px' }}>
                                                            {!active ? (
                                                                <Button size="small" sx={{ minWidth: 0, p: '4px 10px', fontSize: '0.8125rem', textTransform: 'none' }} variant="contained" color="primary" onClick={() => {
                                                                    setPortForwardDialog({ ...portForwardDialog, open: true, namespace: s.namespace, remotePort: portNum, localPort: portNum, podName: '', serviceName: s.name, error: '' });
                                                                }}>Forward</Button>
                                                            ) : (
                                                                <Button size="small" variant="contained" color="inherit" onClick={() => handleStopPortForward(active.local_port)} sx={{ textTransform: 'none', p: '4px 10px', fontSize: '0.8125rem', bgcolor: '#30363d' }}>Stop</Button>
                                                            )}
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                 {services.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: tokens.text.muted }}>No services found.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Fade>

            {/* Dialogs */}
            <Dialog open={deletePodDialog.open} onClose={() => setDeletePodDialog({ ...deletePodDialog, open: false })}>
                <DialogTitle>Delete Pod</DialogTitle>
                <DialogContent>
                    <DialogContentText>Are you sure you want to delete pod <strong>{deletePodDialog.pod?.name}</strong>?</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeletePodDialog({ ...deletePodDialog, open: false })} color="inherit">Cancel</Button>
                    <Button onClick={handleDeletePod} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={restartDepDialog.open} onClose={() => setRestartDepDialog({ ...restartDepDialog, open: false })}>
                <DialogTitle>Restart Deployment</DialogTitle>
                <DialogContent>
                    <DialogContentText>Are you sure you want to restart deployment <strong>{restartDepDialog.dep?.name}</strong>?</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRestartDepDialog({ ...restartDepDialog, open: false })} color="inherit">Cancel</Button>
                    <Button onClick={handleRestartDep} color="warning" variant="contained">Restart</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={scaleDepDialog.open} onClose={() => setScaleDepDialog({ ...scaleDepDialog, open: false })}>
                <DialogTitle>Scale Deployment</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>Enter new replica count for deployment <strong>{scaleDepDialog.dep?.name}</strong>:</DialogContentText>
                    <TextField autoFocus margin="dense" label="Replicas" type="number" fullWidth variant="outlined" value={scaleDepDialog.replicas} onChange={(e) => setScaleDepDialog({ ...scaleDepDialog, replicas: e.target.value })} inputProps={{ min: 0 }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setScaleDepDialog({ ...scaleDepDialog, open: false })} color="inherit">Cancel</Button>
                    <Button onClick={handleScaleDep} color="primary" variant="contained">Scale</Button>
                </DialogActions>
            </Dialog>

            {/* Port Forward Dialog */}
            <Dialog open={portForwardDialog.open} onClose={() => setPortForwardDialog({ ...portForwardDialog, open: false })} maxWidth="xs" fullWidth>
                <DialogTitle>Port Forward {portForwardDialog.serviceName ? 'Service' : 'Pod'}</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Access {portForwardDialog.serviceName ? `service` : `pod`} <strong>{portForwardDialog.serviceName || portForwardDialog.podName || '...'}</strong> from the dashboard.
                    </DialogContentText>
                    
                    {portForwardDialog.error && <Typography color="error" sx={{ mb: 2, fontSize: '0.85rem' }}>{portForwardDialog.error}</Typography>}
                    
                    {!portForwardDialog.podName && !portForwardDialog.serviceName && (
                        <TextField
                            label="Pod Name"
                            fullWidth
                            variant="outlined"
                            margin="normal"
                            value={portForwardDialog.podName}
                            onChange={(e) => setPortForwardDialog({ ...portForwardDialog, podName: e.target.value })}
                        />
                    )}

                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        <TextField
                            label="Remote Port"
                            type="number"
                            fullWidth
                            variant="outlined"
                            value={portForwardDialog.remotePort}
                            onChange={(e) => setPortForwardDialog({ ...portForwardDialog, remotePort: e.target.value })}
                            helperText="Port inside the pod"
                        />
                        <TextField
                            label="Local Port"
                            type="number"
                            fullWidth
                            variant="outlined"
                            value={portForwardDialog.localPort}
                            onChange={(e) => setPortForwardDialog({ ...portForwardDialog, localPort: e.target.value })}
                            helperText="Port on localhost"
                        />
                    </Box>
                    
                    <Typography variant="caption" sx={{ mt: 2, display: 'block', color: tokens.text.muted }}>
                        The {portForwardDialog.serviceName ? `service` : `pod`} will be accessible at: <br/>
                        <code>http://localhost:{portForwardDialog.localPort || '<port>'}</code>
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setPortForwardDialog({ ...portForwardDialog, open: false })} color="inherit">Cancel</Button>
                    <Button 
                        onClick={handleStartPortForward} 
                        color="primary" 
                        variant="contained" 
                        disabled={portForwardDialog.loading || !(portForwardDialog.podName || portForwardDialog.serviceName) || !portForwardDialog.remotePort || !portForwardDialog.localPort}
                    >
                        {portForwardDialog.loading ? 'Starting...' : 'Start Forwarding'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default NamespaceView;
