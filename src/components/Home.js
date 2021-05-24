import React, { useEffect, useState } from "react";
import SimplePeer from "simple-peer";
import io from "socket.io-client";
import events from "../socketEvents.json";

const getUserMedia = (video = true, audio = true) => {
  return navigator.mediaDevices.getUserMedia({ video, audio });
};

const Home = () => {
  const myVideo = React.useRef(null);
  const clientVideo = React.useRef(null);
  const socket = React.useRef();
  const peer = React.useRef();
  const streamRef = React.useRef();

  const [notice, setNotice] = useState("Click to call...");
  const [users, setUsers] = useState({});
  const [caller, setCaller] = useState();
  const [callerSignal, setCallerSignal] = useState();
  const [incomimgCall, setIncommingCall] = useState();

  const createPeer = (targetID, options = {}) => {
    if (!navigator.getUserMedia)
      return setNotice("This page is not security, use HTTPS instead");
    const p = new SimplePeer(options);

    p.on("signal", (data) => {
      if (!socket.current) return;
      if (options.initiator)
        return socket.current.emit(events.call, {
          userToCall: targetID,
          signal: data,
        });
      return socket.current.emit(events.accept_call, {
        to: targetID,
        signal: data,
      });
    });

    p.on("connect", () => {
      // wait for 'connect' event before using the data channel
      debugger;
      const sender = options.initiator ? "initiator" : "abc";

      p.send("from: " + sender + " hey Bro, how is it going? ");
      // console.log("connected", streamRef);
      // /* if (options.initiator)  */ p.addStream(streamRef.current);
    });

    p.on("stream", (stream) => {
      clientVideo.current.srcObject = stream;
    });

    p.on("data", (data) => {
      console.log("got a messag: " + data);
    });

    return p;
  };

  const createSocket = (options) => {
    const sk = io(process.env.REACT_APP_ENDPOINT, options);
    // addSocketEvents(sk);
    console.log("init socket", process.env.REACT_APP_ENDPOINT);
    sk.on(events.connect, () => {
      console.log("socketId: ", sk.id, "\nconnected: ", sk.connected);
    });
    sk.on(events.connect_error, (e) => {
      console.error("SocketIO client error", e);
    });
    sk.on(events.new_connection, (id) => {
      console.log("new user: ", id);
    });
    sk.on(events.all_user, (users) => {
      console.log("alluser", users);
      setUsers(users);
    });

    sk.on(events.calling, ({ signal, from }) => {
      console.log("events.calling");
      setCaller(from);
      setCallerSignal(signal);
      setIncommingCall(true);

      // console.log("someone is calling you", from);
      // if (!peer.current) peer.current = createPeer(from);
      // return peer.current.signal(signal);
    });

    sk.on(events.call_accepted, ({ signal }) => {
      return peer.current.signal(signal);
    });

    return sk;
  };

  const callUser = (id) => {
    console.log("Call User", id);
    getUserMedia()
      .then((stream) => {
        streamRef.current = stream;
        myVideo.current.srcObject = stream;
        peer.current = createPeer(id, {
          initiator: true,
          trickle: false,
          stream: stream,
        });
      })
      .catch((e) => {
        console.log("Something went wrong!", e);
      });
  };

  const acceptCall = () => {
    console.log("Accept Call");
    getUserMedia()
      .then((stream) => {
        streamRef.current = stream;
        myVideo.current.srcObject = stream;
        peer.current = createPeer(caller, { stream: stream });
        peer.current.signal(callerSignal);
      })
      .catch((e) => {
        console.log("Something went wrong!", e);
      });

    setIncommingCall(false);
  };

  const denyCall = () => {};

  useEffect(() => {
    socket.current = createSocket({
      transports: ["websocket"],
      rejectUnauthorized: false,
    });
    return socket.current.disconnect;
  }, []);

  return (
    <div className="body">
      <div className={`popup ${incomimgCall && "visible"}`}>
        <div className="popup-message">{`${caller} want to make a video call with you`}</div>
        <div className="actions">
          <button onClick={acceptCall}>Accept</button>
          <button onClick={denyCall}>Deny</button>
        </div>
      </div>
      <div className="container">
        <div className="row">
          <div className="me">
            <video ref={myVideo} playsInline muted autoPlay />
          </div>

          <div className="buttons">
            <div>{notice}</div>
            <div>
              {Object.values(users).map(
                (id) =>
                  socket.current.id !== id && (
                    <button
                      key={id}
                      disabled={peer.current && socket.current}
                      onClick={() => callUser(id)}
                    >
                      {id}
                    </button>
                  )
              )}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="other">
            <video ref={clientVideo} playsInline autoPlay />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
