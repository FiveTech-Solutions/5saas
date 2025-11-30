import React, { Component } from 'react';
import logger from '../utils/logger';
import { captureError } from '../utils/sentry';
import { Button, Typography, Box, Paper } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log to console
        logger.error('ErrorBoundary caught an error:', error, errorInfo);

        // Send to Sentry
        captureError(error, {
            componentStack: errorInfo.componentStack,
            errorBoundary: true,
        });

        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    minHeight="100vh"
                    bgcolor="#f5f5f5"
                    p={3}
                >
                    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, textAlign: 'center' }}>
                        <Typography variant="h4" color="error" gutterBottom>
                            Ops! Algo deu errado.
                        </Typography>
                        <Typography variant="body1" color="textSecondary" paragraph>
                            Desculpe, ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada.
                        </Typography>

                        {import.meta.env.DEV && this.state.error && (
                            <Box mt={2} mb={3} p={2} bgcolor="#ffebee" borderRadius={1} textAlign="left">
                                <Typography variant="caption" component="pre" style={{ overflowX: 'auto' }}>
                                    {this.state.error.toString()}
                                    <br />
                                    {this.state.errorInfo?.componentStack}
                                </Typography>
                            </Box>
                        )}

                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<RefreshIcon />}
                            onClick={this.handleReset}
                            sx={{ mt: 2 }}
                        >
                            Recarregar Página
                        </Button>
                    </Paper>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
