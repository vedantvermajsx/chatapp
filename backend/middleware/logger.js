export const requestLogger = (req, res, next) => {
    const method = req.method;
    const url = req.originalUrl;

    if (url !== "/health") {
        console.log(`${method} ${url}`);
    }

    next();
};
