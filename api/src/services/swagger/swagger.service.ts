import swaggerJSDoc from "swagger-jsdoc";
import {Config} from "../../infrastructure/util/secrets";
export const getSwaggerOptions = (config: Config): swaggerJSDoc.Options => {
    return {
        "swaggerDefinition": {
            "info": {
                "title": "Application API",
                "description": "API Backend Information",
                "version": "1.0.0"
            },
            "servers": [
                {
                    "url": `//${config.app.domain}:${config.app.port}/api/v1`,
                    "description": "API V1"
                }
            ],
            "tags": [
                {
                    "name": "private"
                },
                {
                    "name": "public"
                }
            ],
            "securityDefinitions": {
                "Bearer": {
                    "type": "apiKey",
                    "name": "Authorization",
                    "in": "header"
                }
            },
            "basePath": "/",
            "paths": {
                "/api/ping": {
                    "get": {
                        "produces": [
                            "application/json"
                        ],
                        "tags": [
                            "public"
                        ],
                        "responses": {
                            "200": {
                                "description": "ping response",
                                "schema": {
                                    "$ref": "#/definitions/ping"
                                }
                            },
                            "500": {
                                "description": "When some error occurs",
                                "schema": {
                                    "$ref": "#/definitions/error"
                                }
                            }
                        }
                    }
                },
            },
            "definitions": {
                "ping": {
                    "type": "object",
                    "required": [
                        "ping"
                    ],
                    "properties": {
                        "ping": {
                            "description": "{ping:pong}",
                            "type": "string",
                            "enum": [
                                "pong"
                            ]
                        }
                    }
                },
                "error": {
                    "type": "object",
                    "required": [
                        "message",
                        "code",
                        "error"
                    ],
                    "properties": {
                        "code": {
                            "type": "string",
                            "example": "service error"
                        },
                        "error": {
                            "type": "boolean"
                        },
                        "message": {
                            "type": "string",
                            "example": "something went wrong"
                        }
                    }
                },
                "success": {
                    "type": "object",
                    "required": [
                        "error"
                    ],
                    "properties": {
                        "error": {
                            "type": "boolean",
                            "description": "success response",
                            "example": false
                        }
                    }
                },
                "ok": {
                    "type": "object",
                    "required": [
                        "result"
                    ],
                    "properties": {
                        "result": {
                            "description": "Result of method execution OK in case of success",
                            "type": "string",
                            "enum": [
                                "ok"
                            ]
                        }
                    }
                },
                "parameters": {},
                "schemas": {
                    /*
                     "id": {
                     "type": "string", // data type
                     "description": "An id of a todo", // desc
                     "example": "tyVgf" // example of an id
                     },
                     // error model
                     , */
                }
            }
        },
        apis: ["./api/src/app.main.ts", "./api/build/src/app.main.js"]
    };
};
