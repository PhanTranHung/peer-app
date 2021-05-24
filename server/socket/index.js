const events = require("../../src/socketEvents.json");

const users = {};

module.exports = (io) => {
  //   console.log(io);

  io.engine.on(events.initial_headers, (headers, req) => {
    headers["Access-Control-Allow-Origin"] = "*";
  });

  io.engine.on(events.headers, (headers, req) => {
    headers["Access-Control-Allow-Origin"] = "*";
  });

  io.on(events.connect, (socket) => {
    if (!users[socket.id]) {
      users[socket.id] = socket.id;
      io.emit(events.new_connection, socket.id);
      io.emit(events.all_user, users);
      console.log("new connection", socket.id);
    }

    socket.on(events.call, (data) => {
      const { userToCall, signal } = data;
      io.to(userToCall).emit(events.calling, {
        signal,
        from: socket.id,
      });
    });

    socket.on(events.accept_call, (data) => {
      const { to, signal } = data;
      io.to(to).emit(events.call_accepted, {
        signal,
      });
    });

    socket.on(events.disconnect, () => {
      delete users[socket.id];
    });
  });
};
