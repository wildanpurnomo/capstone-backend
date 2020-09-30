const express = require('express');
const app = express();

// BodyParser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
    let allowedOrigin = process.env.EXPRESS_ALLOWED_ORIGINS;
    if (allowedOrigin.includes(' ')) {
        allowedOrigin = allowedOrigin.split(' ');
    } else {
        allowedOrigin = [allowedOrigin];
    }
    let currentOrigin = req.headers.origin;
    if (allowedOrigin.indexOf(currentOrigin) > -1) {
        res.header('Access-Control-Allow-Origin', currentOrigin);
    }
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    next();
});


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



