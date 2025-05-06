const io = require("socket.io-client")


const MY_IP = "172.30.1.203";


const timezone = (date) =>{
    return date.toLocaleString("ko-KR", {
        timezone: "Asia/Seoul",
    });
};



const socket = io(`ws://${ANALYSIS_IP}:4003/output`, {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
})


socket.on("connect", ()=>{
    console.log("socket on!");
});
socket.on("disconnect", ()=>{
    console.log("socket off!");
});





socket.on("message", (data)=>{
    console.log("\n\nsocket - message", timezone(new Date()));
    console.log(data);
});


socket.emit("message", {"PORTS": "1", "DATA": "1"});