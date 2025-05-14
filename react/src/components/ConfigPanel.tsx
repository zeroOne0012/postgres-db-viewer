import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useConfigStore } from '../store/configStore';
import axios from 'axios';
import { BASE_URL } from '../api/config';

interface ConfigPanelProps {
    onToast?: (message: string, isOk: boolean) => void;
    onIpUpdate?: (ip: string) => void;
}

export default function ConfigPanel({ onToast, onIpUpdate }: ConfigPanelProps) {
  const { dbConfig, tablesToWatch, tableRoutes, setDbConfig, setTablesToWatch, setTableRoutes } = useConfigStore();
  const [tableList, setTableList] = useState('');
  const [tableRouteList, setTableRouteList] = useState('');
  const [form, setForm] = useState({
    host: '',
    port: 5432,
    user: '',
    password: '',
    database: '',
  });



  useEffect(() => {
    axios.get(`${BASE_URL}/config`)
      .then(res => {
        const { dbConfig, tablesToWatch, tablesToWatchInNewPage } = res.data;
        const safeDbConfig = dbConfig || {};
        const safeTables = Array.isArray(tablesToWatch) ? tablesToWatch : [];

        setForm(safeDbConfig);
        setTableList(safeTables.join(', '));
        setDbConfig(safeDbConfig);
        setTablesToWatch(safeTables);
        setTableRouteList(tablesToWatchInNewPage);
      })
      .catch(err => console.error('초기 설정값 불러오기 실패:', err));
  }, []); // isOpen이 true일 때마다 실행됨
  

  const handleChange = (e:any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const tables = tableList.split(',').map((t) => t.trim()).filter(Boolean);
      const sendData = {
        dbConfig: {
          ...form,
          port: Number(form.port),
        },
        tablesToWatch: tables,
        tablesToWatchInNewPage: tableRouteList,
      };      
      // console.log(sendData);
      onIpUpdate?.(sendData.dbConfig.host);


      await axios.post(`${BASE_URL}/update-config`, sendData);
      setDbConfig(form);
      setTablesToWatch(tables);

      const parsedRoutes = tableRouteList
      .split(',')
      .map(s => s.trim())
      .map(entry => {
        let [path, table, primary, button] = entry.split('/');
        path = "/"+path;
        return { path, table, primary, button };
      })
      .filter(r => r.path && r.table && r.primary && r.button);
    
      setTableRoutes(parsedRoutes);



    //   onToast('설정이 성공적으로 반영되었습니다.', true);
    //   -> Cannot invoke an object which is possibly 'undefined'
      onToast?.('DB connection succeeded!', true);
    } catch (err) {
      console.error(err);
    //   setMessage('설정 적용 실패');
      onToast?.('DB connection failed!', false);
    }
  };

  return (
    <Panel>
      <Label>Host</Label><Input name="host" value={form.host} onChange={handleChange}/>
      <Label>Port</Label><Input name="port" type="number" value={form.port}  onChange={handleChange}/>
      <Label>User</Label><Input name="user" value={form.user} onChange={handleChange}/>
      <Label>Password</Label><Input name="password" type="password" value={form.password}  onChange={handleChange}/>
      <Label>Database</Label><Input name="database" value={form.database} onChange={handleChange}/>

      <Label>Tables to Watch (tableA, tableB/c1/*c2 == tableA, tableB(c1 ASC, c2 DESC))</Label>
      <Input value={tableList} onChange={(e) => setTableList(e.target.value)} />

      <Label>Tables to Watch in new page (path/table/primary/button)</Label>
      <Input
        placeholder="logs/system_log/idx/View Logs, event/history/idx/View Events"
        value={tableRouteList}
        onChange={(e)=>setTableRouteList(e.target.value)}
      />

      <Button onClick={handleSubmit}>Connect</Button>
      {/* {message && <p>{message}</p>} */}
    </Panel>
  );
}

const Panel = styled.div`
  padding: 0.3rem;
//   background: #222;
//   color: white;
//   border: 1px solid #444;
  border-radius: 8px;
  max-width: 600px;
  margin: 0.2rem auto;
`;

const Label = styled.label`
  display: block;
  margin-top: 0.75rem;
`;

const Input = styled.input`
  width: 98%;
  padding: 0.5rem;
  background: #333;
  color: white;
  border: none;
  border-radius: 4px;
`;

const Button = styled.button`
  margin-top: 1.5rem;
  background:rgb(199, 202, 0);
  border: none;
  padding: 0.5rem 1rem;
  color: white;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
`;