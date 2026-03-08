import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Paper, Box, Alert } from '@mui/material';
import MetricsLogo from './MetricsLogo';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import { tokens } from '../theme';

interface LoginProps {
  setAuth: (auth: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ setAuth }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/login`, { username, password });
      localStorage.setItem('token', response.data.access_token);
      setAuth(true);

      if (response.data.must_change_password) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.');
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
          <MetricsLogo sx={{ fontSize: 48, filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.6))', mb: 1.5 }} />
          <Typography variant="h5" sx={{ color: tokens.text.primary, fontWeight: 700, mb: 0.5 }}>
            Metrics
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.text.muted }}>
            Sign in to your dashboard
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" noValidate onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Username</Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Password</Typography>
          <TextField
            fullWidth
            size="small"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Button
            fullWidth
            variant="contained"
            type="submit"
            sx={{
              bgcolor: tokens.accent.blue,
              '&:hover': { bgcolor: tokens.accent.blueHover },
              py: 1.25,
              fontWeight: 600,
              boxShadow: 'none',
            }}
          >
            Sign In
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
