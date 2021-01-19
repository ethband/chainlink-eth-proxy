import {createLogger, format, transports} from 'winston';

const layout = format.printf(({level, message, label, timestamp}) => {
    return `${timestamp} ${level}: ${message}`;
});

export const logger = createLogger({
    level: 'debug',
    handleExceptions: true,
    transports: [
        new transports.Console({
            format: format.combine(format.timestamp(), format.colorize(), layout),
        }),
    ],
});
