import React from 'react';
import { 
    Typography, Paper, Box, Divider, List, ListItem, ListItemText, 
    Switch, ListItemSecondaryAction
} from '@mui/material';
import AlertSettings from './AlertSettings';

const Settings: React.FC = () => {
    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 1 }}>Settings</Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>
                Manage your dashboard preferences and alerting configurations.
            </Typography>

            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>General Preferences</Typography>
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

            <Typography variant="subtitle2" sx={{ mb: 2 }}>Alerting</Typography>
            <AlertSettings />
        </Box>
    );
};

export default Settings;
