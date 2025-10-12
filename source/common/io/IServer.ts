import http from "node:http";
import https from "node:https";

export type CustomServer = http.Server | https.Server;
