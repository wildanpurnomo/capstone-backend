const express = require('express');
const app = express();

// BodyParser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Host Vue SPA in public/dist directory
const history = require('connect-history-api-fallback');
app.use(history({
    rewrites: [
        {
            from: /^\/api\/.*$/,
            to: (context) => {
                return context.parsedUrl.path
            }
        }
    ]
}));
app.use(express.static('public/dist'));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/dist'));
});

// Use Morgan Logger
const logger = require('morgan');
app.use(logger('dev'));

// Use Error Middleware
const { handleError } = require('./lib/error');
app.use((err, req, res, next) => {
    handleError(err, res);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

