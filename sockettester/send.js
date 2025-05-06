const io = require("socket.io-client")
const {FIRST_IP, SECOND_IP} = require("./config");

// const analysis = io(`ws://${SECOND_IP}:4001/analysis`)
// analysis.emit("message", { test: "test", text: "Hello, server!" });



// const all = io(`ws://${SECOND_IP}:4001/all`)
// all.emit("event", { channel: 1, status: 1, time:"123456123456" });

const all = io(`ws://${SECOND_IP}:4001/all`)
all.emit("status", { server: 1, status: 1 });

console.log("send!")