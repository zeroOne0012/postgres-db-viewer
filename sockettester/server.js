const io = require("socket.io-client")

console.log("sockets on!")

const {FIRST_IP, SECOND_IP} = require("./config");

const timezone = (date) =>{
    return date.toLocaleString("ko-KR", {
        timezone: "Asia/Seoul",
    });
};



const dio = io(`ws://${FIRST_IP}:4003/output`)
//
dio.on("message", (data)=>{
    console.log("\n\ndio - message", timezone(new Date()));
    console.log(data);
});




const all = io(`ws://${SECOND_IP}:4001/all`)
//
all.on("event", (data)=>{
    console.log("\n\nall - event", timezone(new Date()));
    console.log(data);
});
//
all.on("status", (data)=>{
    console.log("\n\nall - status", timezone(new Date()));
    console.log(data);
});




const analysis = io(`ws://${SECOND_IP}:4001/analysis`)
//
analysis.on("message", (data)=>{
    console.log("\n\nanalysis - message", timezone(new Date()));
    console.log(data);
});