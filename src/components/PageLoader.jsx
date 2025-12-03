import React from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * Loading para página inteira
 * Usado quando a página inteira está carregando
 */
const PageLoader = ({ message = 'Carregando página...' }) => {
    return <LoadingSpinner message={message} fullPage={true} size={50} />;
};

export default PageLoader;
