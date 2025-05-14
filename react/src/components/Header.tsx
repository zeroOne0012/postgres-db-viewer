import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import {BASE_URL} from "../api/config";
import ConfigPanel from './ConfigPanel';
import { useConfigStore } from '../store/configStore'; 
import ToastContainer from './ToastContainer';
import { useToastStore } from '../store/toastStore';

export default function(){
  const urlLocation = useLocation();  // 현재 경로 추적
  const navigate = useNavigate();  // navigate 사용
  const [ip, setIp] = useState<string>("localhost");
  const { isSqlPanelVisible, setIsSqlPanelVisible, isConfigVisible, setIsConfigVisible, tableRoutes, isInsertPanelVisible, setTableRoutes } = useConfigStore(); // for panels & menu buttons
  const { toasts, addToast, removeToast } = useToastStore();

  const getTitle = () => {
    if (urlLocation.pathname === "/") {
      return `Real-Time DB ${ip && `(${ip})`}`;
    }
    // if (urlLocation.pathname === LOG_PATH) {
    //   return "System Log";
    // }
    // if (urlLocation.pathname === HISTORY_PATH) {
    //   return "Event Histories";
    // }

    const match = tableRoutes.find(r => r.path === urlLocation.pathname);
    if (match) return match.button;

    // console.log("location.pathname: ", urlLocation.pathname);
    return "Real-Time DB";
  };


  const sendSql = async () => {
    const query = (document.getElementById("sql-input") as HTMLTextAreaElement).value;
    if (!query.trim()) return;
    
    try {
      const res = await axios.post(`${BASE_URL}/execute-sql`, { query });
      if (res.status === 200) {
        addToast("SQL execution succeeded!", true); // sql 성공
        const data = res.data; 
        console.log(data.result.rows); // 결과 출력
      } else {
        addToast("SQL execution failed!", false); // sql 실패
      }
    } catch (error) {
      addToast("SQL execution failed!", false); // sql 실패
      console.error("SQL failed:", error); // 실패 사유 출력
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

  // SQL / DB 패널 열기 단축키
  useEffect(()=>{
    const handleKey = (e: KeyboardEvent) =>{
      if(!isConfigVisible&&!isSqlPanelVisible){
        if (e.ctrlKey && (e.key === 'e' || e.key === 'E')) {
          e.preventDefault(); // 브라우저 기본 동작 막음
          setIsSqlPanelVisible(true);
          return;
        } else if(e.ctrlKey && (e.key === 'd' || e.key === 'D')){
          e.preventDefault(); // 브라우저 기본 동작 막음
          setIsConfigVisible(true);
          return;
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  });

  // SQL 패널 관련 단축키
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSqlPanelVisible) {
        setIsSqlPanelVisible(false);  // ESC 키로 SQL 패널 닫음
        return;
      }
      if (e.key === "Escape" && isConfigVisible) {
        setIsConfigVisible(false);  // ESC 키로 DB Config 패널 닫음
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
  }, [isSqlPanelVisible, isConfigVisible]);  // isSqlPanelVisible 상태가 바뀔 때마다 리스너가 반영됨
  
  // Tab / Shift+Tab으로 탭 전환
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isConfigVisible||isSqlPanelVisible||isInsertPanelVisible) return; // !! ConfigPanel 열려 있으면 페이지 전환 금지

      const staticPaths = ['/'];
      const dynamicPaths = tableRoutes.map(r => r.path);
      const paths = [...staticPaths, ...dynamicPaths];

      const currentIndex = paths.indexOf(urlLocation.pathname);
  
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
  }, [urlLocation.pathname, navigate, isConfigVisible, isSqlPanelVisible, tableRoutes, isInsertPanelVisible]);
  
    useEffect(() => {
    axios.get(`${BASE_URL}/config`)
      .then(res => {
        const { tablesToWatchInNewPage } = res.data;

        const parsedRoutes = tablesToWatchInNewPage
        .split(',')
        .map((s:string) => s.trim())
        .map((entry:string) => {
          let [path, table, primary, button] = entry.split('/');
          path = "/"+path;
          return { path, table, primary, button };
        })
        .filter((r:{ path: string; table: string; primary: string; button: string }) => r.path && r.table && r.primary && r.button);
        setTableRoutes(parsedRoutes);
      })
      .catch(err => console.error('초기 설정값 불러오기 실패:', err));
  }, []); // isOpen이 true일 때마다 실행됨

  return (
    <HeaderWrapper>
      <Title>{getTitle()}</Title>
      {/* <Button bgColor="#00a1e0" onClick={() => (location.href = '/')}>View Database</Button> */}
      <Button 
        active={urlLocation.pathname === "/"}
        onClick={() => navigate('/')}
      >
        View Database
      </Button>
      {tableRoutes.map(({ path, button }) => (
        <Button
          key={path}
          active={urlLocation.pathname === path}
          onClick={() => navigate(path)}
        >
          {button}
        </Button>
      ))}
      <Button bgColor="rgba(21, 255, 0, 0.63)" onClick={()=>setIsSqlPanelVisible(true)}>Execute SQL</Button>

      <Button bgColor="rgb(199, 202, 0)" onClick={() => setIsConfigVisible(true)}>DB Config</Button>

      {/* 토스트 */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {isConfigVisible && (
        <>
          <Overlay isVisible={true} onClick={() => setIsConfigVisible(false)} />
          <ConfigPanelWrapper>
          <DbConfigHeader>
            <h2>DB Config</h2>
            <SqlButton onClick={()=>setIsConfigVisible(false)}>X</SqlButton>
          </DbConfigHeader>
            <ConfigPanel
              onToast={(msg: string, success: boolean) => {
                addToast(msg, success);
              }}
              onIpUpdate={(newIp: string) => setIp(newIp)}
            />
          </ConfigPanelWrapper>
        </>
      )}



      <SqlPanel isVisible={isSqlPanelVisible}>
        <SqlHeader>
          <strong>SQL Query Executer</strong>
          <SqlButton onClick={()=>setIsSqlPanelVisible(false)}>X</SqlButton>
        </SqlHeader>
        <SqlTextArea id="sql-input" placeholder='ex: SELECT now();'/>
        <SqlButton onClick={sendSql}>확인</SqlButton>
      </SqlPanel>
      <Overlay isVisible={isSqlPanelVisible} onClick={()=>setIsSqlPanelVisible(false)}/>
    </HeaderWrapper>
  );
};


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

const DbConfigHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0rem;
  color: rgb(199, 202, 0);
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


const ConfigPanelWrapper = styled.div`
  display: block;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 999;
  background: #222;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1rem;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 0 20px rgba(255, 200, 0, 0.3);
  box-sizing: border-box;
  `;
  // background: #1c1c1c;