import { streamRouter } from './stream.js';
import { segmentRouter } from './segment.js';
import { usersRouter } from "./users.js";
import { authRouter } from "./auth.js";
import { stripeRouter } from "./stripe.js";

const mountRoutes = (app) => {
    app.use('/api/', streamRouter);
    app.use('/api/segment', segmentRouter);
    app.use('/api/users', usersRouter);
    app.use('/api/auth', authRouter);
    app.use('/api/payment', stripeRouter);
}

export default mountRoutes;
