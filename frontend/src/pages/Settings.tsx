import React from 'react';
import { Typography, Paper, Box, Divider, List, ListItem, ListItemText, Switch, ListItemSecondaryAction, Button } from '@mui/material';
import { tokens } from '../theme';

const Settings: React.FC = () => {
    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 1 }}>Settings</Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>
                Manage your dashboard preferences and account configurations.
            </Typography>

            <Paper sx={{ p: 3, mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Preferences</Typography>
                <Divider sx={{ mb: 2 }} />
                <List disablePadding>
                    <ListItem disableGutters>
                        <ListItemText
                            primary="Auto-Refresh Data"
                            secondary="Automatically fetch new metrics every 15 seconds."
                            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                            secondaryTypographyProps={{ fontSize: '0.8125rem' }}
                        />
                        <ListItemSecondaryAction>
                            <Switch edge="end" defaultChecked color="primary" />
                        </ListItemSecondaryAction>
                    </ListItem>
                </List>
            </Paper>

            <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Alerting (Coming Soon)</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" sx={{ mb: 2 }}>
                    Configure threshold alerts and notification channels (Email, Slack, webhook).
                </Typography>
                <Button variant="outlined" disabled sx={{ borderRadius: 1 }}>Configure Alerts</Button>
            </Paper>
        </Box>
    );
};

export default Settings;
