import React from 'react';
import { Box, Skeleton, Stack } from '@mui/material';

/**
 * Loading para conteúdo específico (tabelas, cards, etc.)
 * Usa Skeleton do MUI para melhor UX
 */
const ContentLoader = ({
    type = 'table', // 'table', 'card', 'list'
    rows = 5
}) => {
    if (type === 'table') {
        return (
            <Stack spacing={1}>
                <Skeleton variant="rectangular" height={40} /> {/* Header */}
                {Array.from({ length: rows }).map((_, index) => (
                    <Skeleton key={index} variant="rectangular" height={50} />
                ))}
            </Stack>
        );
    }

    if (type === 'card') {
        return (
            <Box>
                <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="40%" />
            </Box>
        );
    }

    if (type === 'list') {
        return (
            <Stack spacing={2}>
                {Array.from({ length: rows }).map((_, index) => (
                    <Box key={index} display="flex" gap={2}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Box flex={1}>
                            <Skeleton variant="text" width="40%" />
                            <Skeleton variant="text" width="60%" />
                        </Box>
                    </Box>
                ))}
            </Stack>
        );
    }

    return null;
};

export default ContentLoader;
