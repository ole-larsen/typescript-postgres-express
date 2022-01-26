import winston from "winston";

const options: winston.LoggerOptions = {
    level: "info",
    format: winston.format.json(),
    handleExceptions: true,
    defaultMeta: { service: "app-services" },
    transports: [
        new winston.transports.Console({
            level: process.env.NODE_ENV === "production" ? "error" : "debug",
            format: winston.format.combine(
                winston.format.timestamp({
                    format: "DD-MM-YYYY HH:mm:ss",
                }),
                winston.format.json(),
                winston.format.colorize({ all: true })
            )
        }),
        new winston.transports.File({ filename: "debug.log", level: "debug" })
    ]
};

const logger = winston.createLogger(options);

if (process.env.NODE_ENV !== "production") {
    logger.debug("Logging initialized at debug level");
}

export default logger;
