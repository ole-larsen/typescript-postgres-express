import { Service } from "./services/app.service";
import { APP_SERVICE } from "./services/app.constants";
import * as core from "express-serve-static-core";

// 1. Create new services
// 2. Connect services to db
// 3. setup app from services
// 4. config routes for app
// 5. serve app

new Service().bootstrap();

export default Service.getService<core.Express>(APP_SERVICE);
