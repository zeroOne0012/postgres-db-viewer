import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

import {BASE_URL} from "../api/config";
import {LOG_PATH,HISTORY_PATH} from "../api/path";

export default function(){
  const urlLocation = useLocation();  // 현재 경로 추적
  const navigate = useNavigate();  // navigate 사용

  const [ip, setIp] = useState<string>("localhost");
  const [isSqlPanelVisible, setIsSqlPanelVisible] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [isOk, setIsOk] = useState<boolean>(false);

  const getTitle = () => {
    if (urlLocation.pathname === "/") {
      return `Real-Time DB ${ip && `(${ip})`}`;
    }
    if (urlLocation.pathname === LOG_PATH) {
      return "System Log";
    }
    if (urlLocation.pathname === HISTORY_PATH) {
      return "Event Histories";
    }
    // console.log("location.pathname: ", urlLocation.pathname);
    return "Real-Time DB";
  };

  const toggleSqlPanel = () => {
    setIsSqlPanelVisible((prevState) => !prevState);
  };

  const sendSql = async () => {
    const query = (document.getElementById("sql-input") as HTMLTextAreaElement).value;
    if (!query.trim()) return;
    
    try {
      const res = await axios.post(`${BASE_URL}/execute-sql`, { query });
      if (res.status === 200) {
        setToastMessage("SQL execution succeeded!");
        setIsOk(true); // sql 성공
        const data = res.data; 
        console.log(data.result.rows);
      } else {
        setIsOk(false); // sql 실패
        setToastMessage("sql execution failed!");
      }
    } catch (error) {
      setIsOk(false); // sql 실패
      setToastMessage("sql execution failed!");
      console.error("SQL failed:", error);
    } finally {
      // 토스트 3초 뒤 제거
      setTimeout(() => {
        setToastMessage("");
      }, 3000);
    }
  };

  // 가리키는 DB의 HOST(IP) 받아오기
  useEffect(()=>{
    axios.get(`${BASE_URL}/ip`)
    .then(res => {
      setIp(res.data);
    })
    .catch(err => console.error('failed to load db-ip-address:', err));
  }, []);

  // SQL 패널 관련 단축키
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSqlPanelVisible) {
        toggleSqlPanel();  // ESC 키로 SQL 패널 닫음
        return;
      }
      const inputElement = document.getElementById("sql-input") as HTMLTextAreaElement;
      if (e.ctrlKey && e.key === "Enter" && inputElement === document.activeElement) {
        sendSql();  // Ctrl + Enter 입력 시 SQL 쿼리 전송(실행)
        return;
      }
    };
  
    document.addEventListener("keydown", handleEscKey);
  
    return () => {
      document.removeEventListener("keydown", handleEscKey);  // cleanup
    };
  }, [isSqlPanelVisible]);  // isSqlPanelVisible 상태가 바뀔 때마다 리스너가 반영됨
  
  // Tab / Shift+Tab으로 탭 전환
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const paths = ['/', LOG_PATH, HISTORY_PATH];
      const currentIndex = paths.indexOf(location.pathname);
  
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % paths.length;
        navigate(paths[nextIndex]);
      } else if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + paths.length) % paths.length;
        navigate(paths[prevIndex]);
      }
    };
  
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [location.pathname, navigate]);
  

  return (
    <HeaderWrapper>
      <Title>{getTitle()}</Title>
      {/* <Button bgColor="#00a1e0" onClick={() => (location.href = '/')}>View Database</Button> */}
      <Button 
        active={location.pathname === "/"}
        onClick={() => navigate('/')}
      >
        View Database
      </Button>
      <Button
        active={location.pathname === LOG_PATH}  // 현재 위치한 경로에 해당하는는 버튼 색상 변경
        onClick={() => navigate(LOG_PATH)}
      >
        View System Log
      </Button>
      <Button
        active={location.pathname === HISTORY_PATH}  
        onClick={() => navigate(HISTORY_PATH)}
      >
        View Event Histories
      </Button>
      <Button bgColor="rgba(21, 255, 0, 0.63)" onClick={toggleSqlPanel}>Execute SQL</Button>
      <SqlPanel isVisible={isSqlPanelVisible}>
        <SqlHeader>
          <strong>SQL Query Executer</strong>
          <SqlButton onClick={toggleSqlPanel}>X</SqlButton>
        </SqlHeader>
        {/* <SqlTextArea placeholder='ex: SELECT now();'>update member set nickname='test' where email='user@email.com' returning *;</SqlTextArea> */}
        <SqlTextArea id="sql-input" placeholder='ex: SELECT now();'/>
        <SqlButton onClick={sendSql}>확인</SqlButton>
      </SqlPanel>
      <Overlay isVisible={isSqlPanelVisible} onClick={toggleSqlPanel}/>
      <Toast isOk = {isOk} isVisible={toastMessage !== ""}>{toastMessage}</Toast> 
    </HeaderWrapper>
  );
};

// export default Header;


const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 3rem;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  width: 500px;
  white-space: nowrap;
`;

const Button = styled.button<{ bgColor?: string, active?: boolean }>`
  background-color: ${(props) => (props.active ? '#00a1e0' : props.bgColor || '#2c2c2c')};
  color: #fff;
  font-weight: bold;
  border: none;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${(props)=>(props.active ? '#00a1e0' : props.bgColor || '#424242')};
    transform: scale(1.1);
  }
`;

const SqlPanel = styled.div<{ isVisible: boolean }>`
  display: ${(props) => (props.isVisible ? 'block' : 'none')};
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 999;
  background: #1c1c1c;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1rem;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
  box-sizing: border-box;
`;

const SqlHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  color: #0f0;
`;

const SqlTextArea = styled.textarea`
  width: 97%;
  height: 120px;
  background: #000;
  color: #0f0;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 0.5rem;
  font-family: monospace;
  resize: vertical;
`;

const SqlButton = styled.button`
  margin-top: 0.5rem;
  background: #333;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
`;

const Toast = styled.div<{ isVisible: boolean, isOk: boolean }>`
  visibility: ${(props) => (props.isVisible ? 'visible' : 'hidden')};
  opacity: ${(props) => (props.isVisible ? 1 : 0)};
  min-width: 250px;
  background-color: ${(props)=>(props.isOk ? "#0a0":"#c00")};
  color: #fff;
  text-align: center;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  transition: opacity 0.3s ease-in-out;
`;

const Overlay = styled.div<{ isVisible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 998;
  display: ${(props) => (props.isVisible ? 'block' : 'none')};
`;