const app = require('../dist/app').default;

// Vercel owns the HTTP server lifecycle. Keeping Express in one function
// prevents every TypeScript source file from becoming a separate function.
module.exports = app;
