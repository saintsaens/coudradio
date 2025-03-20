import express from 'express';

const jsonParserLoader = (app) => {
  app.use((req, res, next) => {
    if (req.originalUrl === '/api/payment/webhook') {
      next(); // Skip JSON parsing for the webhook
    } else {
      express.json({ limit: '1mb' })(req, res, next); // Apply JSON parsing to all other routes
    }
  });
};

export default jsonParserLoader;
