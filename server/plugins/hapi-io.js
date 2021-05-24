"use strict";

const socketIO = require("socket.io");

module.exports = {
  name: "hapiio",
  version: "1.0.0",
  register: function (server, options) {
    // Create a route for example

    const io = socketIO(server.listener, options);
    server.expose("io", io);

    return Promise.resolve();
  },
};
