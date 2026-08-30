// EZNY — Vercel serverless entrypoint.
// O Express é exportado como handler; NÃO usar app.listen() na Vercel.
const app = require('../backend/server');

module.exports = app;
