import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Componente de Loading Spinner Padronizado
 * Pode ser usado inline ou como página inteira
 */
const LoadingSpinner = ({
    message = 'Carregando...',
    size = 40,
    fullPage = false,
    minHeight = '200px'
}) => {
    const content = (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            gap={2}
            minHeight={fullPage ? '100vh' : minHeight}
            width="100%"
        >
            <CircularProgress size={size} />
            {message && (
                <Typography variant="body2" color="text.secondary">
                    {message}
                </Typography>
            )}
        </Box>
    );

    return content;
};

export default LoadingSpinner;
