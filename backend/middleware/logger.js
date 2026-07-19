export const requestLogger = (req, res, next) => {
    const start = Date.now();
    const method = req.method;
    const url = req.originalUrl;

    if (url !== "/health") {
        console.log(`${method} ${url} [start]`);
    }

    res.on('finish', () => {
        const duration = Date.now() - start;
        if (url !== "/health") {
            console.log(`${method} ${url} [${res.statusCode}] (${duration}ms)`);
        }
    });

    next();
};
