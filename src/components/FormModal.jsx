import React from 'react';
import { Close } from '@mui/icons-material';
import './FormModal.css';

const FormModal = ({
    isOpen,
    onClose,
    title,
    children,
    onSubmit,
    loading = false,
    submitLabel = 'Salvar',
    cancelLabel = 'Cancelar',
    maxWidth = '600px',
    showFooter = true
}) => {
    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="form-modal-overlay" onClick={handleOverlayClick}>
            <div className="form-modal-container" style={{ maxWidth }}>
                <div className="form-modal-header">
                    <h2>{title}</h2>
                    <button className="form-modal-close" onClick={onClose} disabled={loading}>
                        <Close />
                    </button>
                </div>

                <div className="form-modal-content">
                    {children}
                </div>

                {showFooter && (
                    <div className="form-modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={onSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    Salvando...
                                </>
                            ) : submitLabel}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormModal;
