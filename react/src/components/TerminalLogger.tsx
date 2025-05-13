// TerminalLogger.tsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { io, Socket } from "socket.io-client";

const TerminalWrapper = styled.div`
  background-color: black;
  color: #00ff00;
  font-family: monospace;
  padding: 1rem;
  height: 100vh;
  overflow-y: auto;
`;

const TerminalLogger: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [sockets, setSockets] = useState<{ socket?: Socket; socket1?: Socket; }>({});

  const timezone = (date: Date) => {
    return date.toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
    });
  };

  useEffect(() => {
    const SOCKET_HOST = "localhost"; 
    const SOCKET_PORT = 4001;
    const SOCKET_EVENTS = ["message", "event"];

    const SOCKET_URL = `${SOCKET_HOST}:${SOCKET_PORT}`;

    const socket = io(`ws://${SOCKET_URL}`, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    SOCKET_EVENTS.forEach((eventName)=>{
      socket.on(eventName, (data:any) => {
        appendLog(`${SOCKET_URL} - ${eventName}: ${JSON.stringify(data, null, 2)} [${timezone(new Date())}]\n`);
      });
    });

    socket.on("connect", ()=>{
      appendLog(`${SOCKET_URL} socket on!`);
      // console.log(`${SOCKET_HOST}:${SOCKET_PORT} socket on!`);
    });
    socket.on("disconnect", ()=>{
      appendLog(`${SOCKET_URL} socket off!`);
      // console.log(`${SOCKET_HOST}:${SOCKET_PORT} socket off!`);
    });

    setSockets({ socket });

    return () => {
      socket.disconnect();
    };
  }, []);

  const appendLog = (text: string) => {
    setLogs((prevLogs) => [...prevLogs, text]);
  };

  return (
    <TerminalWrapper>
      {logs.map((log, idx) => (
        <div key={idx}>{log}</div>
      ))}
    </TerminalWrapper>
  );
};

export default TerminalLogger;
