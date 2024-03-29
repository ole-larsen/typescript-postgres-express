export const HttpExceptionMessages = {
  ROUTE_NOT_FOUND: "route not found",
  ERROR_GA2FA_NO_CODE: "no 2FA code was provided",
  ERROR_GA2FA_INCORRECT_CODE: "2FA code is incorrect",
  ERROR_VALIDATION: "unauthorized",
  ERROR_AUTH_EMPTY_CREDENTIALS: "no credentials provided",
  ERROR_AUTH_EMPTY_PASSWORD_CREDENTIALS: "empty password",
  ERROR_AUTH_PASSWORD_NOT_MATCH_CREDENTIALS: "password is not match",
  ERROR_AUTH_USERNAME: "user with this username already exist",
  ERROR_AUTH_EMAIL: "user with this email already exist",
  ERROR_AUTH_EMPTY_EMAIL: "email must be provided",
  ERROR_AUTH_INVALID_EMAIL: "user with this email address does not exist",
  ERROR_AUTH_INVALID_RESET_TOKEN: "invalid reset token",
  INCORRECT_CREDENTIALS: "incorrect credentials",
  WRONG_PASSWORD: "wrong password",
  ID_NOT_PROVIDED: "id was not provided",
  EMAIL_NOT_PROVIDED: "email was not provided",
  USERNAME_ALREADY_USED: "username already used",
  USER_NOT_FOUND: "user not found",
  USER_ALREADY_EXISTS: "user already exists",
  ACCOUNT_NOT_FOUND: "account not found",
  ACCOUNT_ALREADY_EXISTS: "account already exists",
  ROLE_NOT_FOUND: "role not found",
  ROLE_ALREADY_EXISTS: "role already exists",
  TASK_NOT_FOUND: "task not found",
  TASK_ALREADY_EXISTS: "task already exists"
};

export const HttpStatus = {
  CONTINUE: 100,
  SWITCHING_PROTOCOLS: 101,
  PROCESSING: 102,
  EARLYHINTS: 103,
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NON_AUTHORITATIVE_INFORMATION: 203,
  NO_CONTENT: 204,
  RESET_CONTENT: 205,
  PARTIAL_CONTENT: 206,
  AMBIGUOUS: 300,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  SEE_OTHER: 303,
  NOT_MODIFIED: 304,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  REQUESTED_RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  I_AM_A_TEAPOT: 418,
  MISDIRECTED: 421,
  UNPROCESSABLE_ENTITY: 422,
  FAILED_DEPENDENCY: 424,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505
};

