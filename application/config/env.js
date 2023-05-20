console.log(process.env.NODE_ENV)
switch (process.env.NODE_ENV) {
  case "production":
    console.log("starting production");
    module.exports = require("./prod.env");
    break;
  case "testing":
    console.log("starting testing");
    module.exports = require("./test.env");
    break;
  case "development":
    console.log("starting development");
    module.exports = require("./dev.env");
    break;
  default:
    console.log("starting default");
    module.exports = require("./dev.env");
    break;
}
