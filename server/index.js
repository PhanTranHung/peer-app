"use strict";

const Hapi = require("@hapi/hapi");
const hapiio = require("./plugins/hapi-io");
const Socket = require("./socket");
const Fs = require("fs");

const startServer = async (server) => {
  await server.start();
  console.log("Server running on %s", server.info.uri);
  return server;
};

const registerPlugins = async (server) => {
  await server.register({
    plugin: hapiio,
    options: { transports: ["websocket"] },
  });
};

const initServer = () => {
  const server = Hapi.Server({
    port: 7000,
    // host: "localhost",
    tls: {
      cert: Fs.readFileSync("./localhost.crt"),
      key: Fs.readFileSync("./localhost.key"),
    },
  });

  return server;
};

const init = async () => {
  const server = initServer();
  await registerPlugins(server);
  Socket(server.plugins.hapiio.io);

  server.route({
    method: "GET",
    path: "/",
    handler: (request, h) => {
      return "Hello World!";
    },
  });

  await startServer(server);
};

init();

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});
