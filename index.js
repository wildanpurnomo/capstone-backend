const express = require('express');
const app = express();

// Enable trust proxy (resolving some https issue)
app.enable('trust proxy');

// Cookie parser
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// HTTPS Redirection
const { redirectToSecure } = require('./lib/https');
app.use(redirectToSecure);

// BodyParser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
const { handleCors } = require('./lib/cors');
app.use(handleCors);

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

// use REST API router
const authRouter = require('./routes/authRoutes');
app.use('/api', authRouter);

// Use Error Middleware
const { handleError } = require('./lib/error');
app.use((err, req, res, next) => {
    handleError(err, res);
});

// Start server upon connected to DB
const mongoose = require('mongoose');
const dbUri = process.env.EXPRESS_MONGODB_URI || "mongodb://localhost/masihsukadia";
mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
    .then((result) => {
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.log(error);
    });



