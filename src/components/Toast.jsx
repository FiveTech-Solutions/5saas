import React, { useEffect, useState } from 'react';
import { CheckCircle, Error, Warning, Info, Close } from '@mui/icons-material';
import './Toast.css';

const Toast = ({ message, type = 'info', duration = 5000, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const startTime = Date.now();
        const endTime = startTime + duration;

        const timer = setInterval(() => {
            const now = Date.now();
            const remaining = endTime - now;
            const newProgress = (remaining / duration) * 100;

            if (remaining <= 0) {
                clearInterval(timer);
                handleClose();
            } else {
                setProgress(newProgress);
            }
        }, 10);

        return () => clearInterval(timer);
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
        }, 300); // Match animation duration
    };

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle />;
            case 'error': return <Error />;
            case 'warning': return <Warning />;
            case 'info': return <Info />;
            default: return <Info />;
        }
    };

    return (
        <div className={`toast toast-${type} ${isExiting ? 'toast-exit' : 'toast-enter'}`}>
            <div className="toast-content">
                <div className="toast-icon">
                    {getIcon()}
                </div>
                <div className="toast-message">
                    {message}
                </div>
                <button className="toast-close" onClick={handleClose}>
                    <Close fontSize="small" />
                </button>
            </div>
            <div className="toast-progress-bar">
                <div
                    className="toast-progress-fill"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

export default Toast;
