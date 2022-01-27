/**
 * Naming this file express-session.d.ts causes imports from "express-session"
 * to reference this file and not the node_modules package.
 */

import session from "api/src/types/express-session-types";

declare module "express-session" {
    export interface SessionData {
        returnTo: string;
    }
}
