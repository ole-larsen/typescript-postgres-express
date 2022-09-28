import winston from "winston";

const options: winston.LoggerOptions = {
    level: "info",
    format: winston.format.json(),
    handleExceptions: true,
    defaultMeta: { service: "app" },
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
export type Logger = winston.Logger
const logger: Logger = winston.createLogger(options);
if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
    logger.debug("logging initialized at debug level", { service: "logger" });
}
export default logger;
