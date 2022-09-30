/// <reference types="express" />

import {AnyDayVariable} from "app";

/**
 * This type definition augments existing definition
 * from @types/express-flash
 */
declare namespace Express {
    export interface Request {
        flash(event: string, message: AnyDayVariable): AnyDayVariable;
    }
}

interface Flash {
    flash(type: string, message: AnyDayVariable): void;
}

declare module "express-flash";

