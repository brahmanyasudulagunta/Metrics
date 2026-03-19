import React, { useState } from 'react';
import { TextField, Button, Typography, Paper, Box, Alert } from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import { tokens } from '../theme';

const ChangePassword: React.FC = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = async () => {
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 4) {
            setError('Password must be at least 4 characters.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/change-password`, { new_password: newPassword }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to change password. Please try again.');
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: tokens.bg.base,
            px: 3,
        }}>
            <Paper sx={{
                p: 5,
                width: '100%',
                maxWidth: 420,
                borderRadius: '12px',
            }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <LockResetIcon sx={{ fontSize: 48, color: tokens.accent.yellow, mb: 1 }} />
                    <Typography variant="h5" sx={{ color: tokens.text.primary, fontWeight: 700, mb: 0.5 }}>
                        Change Password
                    </Typography>
                    <Typography variant="body2" sx={{ color: tokens.text.muted }}>
                        Please set a new password to continue
                    </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box component="form" noValidate onSubmit={(e) => { e.preventDefault(); handleChange(); }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>New Password</Typography>
                    <TextField
                        fullWidth
                        size="small"
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoFocus
                        sx={{ mb: 2 }}
                    />
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Confirm Password</Typography>
                    <TextField
                        fullWidth
                        size="small"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        sx={{ mb: 3 }}
                    />
                    <Button
                        fullWidth
                        variant="contained"
                        type="submit"
                        sx={{
                            bgcolor: tokens.accent.yellow,
                            color: tokens.bg.base,
                            '&:hover': { bgcolor: '#e5a829' },
                            py: 1.25,
                            fontWeight: 600,
                            boxShadow: 'none',
                        }}
                    >
                        Update Password
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default ChangePassword;
