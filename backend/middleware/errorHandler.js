import { NotFoundError, ValidationError } from '../errors.js';

export const errorHandler = (err, req, res, _next) => {
    if (err instanceof NotFoundError) {
        return res.status(404).json({ error: err.message });
    }
    if (err instanceof ValidationError) {
        return res.status(400).json({ error: err.message });
    }
    console.error(`[${req.method} ${req.path}]`, err);
    return res.status(500).json({ error: 'Internal server error' });
};
