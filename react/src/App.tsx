import React, { useEffect, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NotFound from './components/NotFound';
import Header from './components/Header';
import TablePage from "./components/TablePage";
import SingleTable from "./components/SingleTable";
import TerminalLogger from "./components/TerminalLogger";
import { useConfigStore } from './store/configStore';


const GlobalStyle = createGlobalStyle`
  body {
    font-family: 'Segoe UI', sans-serif;
    background: #111;
    color: #eee;
    /* margin: 0; */
    padding: 2rem;
  }
`;

function App() {
  const { tableRoutes } = useConfigStore();
	
  return (
    <>
    <GlobalStyle/>
		<div className='App'>
			<BrowserRouter>
				<Header />
				<Routes>
					<Route path="/" element={<TablePage />}></Route>
					{/* <Route path={HISTORY_PATH} element={<SingleTable table="history" primary="idx"/>}></Route>
					<Route path={LOG_PATH} element={<SingleTable table="private.system_log" primary="idx"/>}></Route> */}
					            
					{tableRoutes.map(({ path, table, primary }) => (
					<Route
						key={path}
						path={path}
						element={<SingleTable table={table} primary={primary} />}
					/>
					))}
					
					<Route path="/socket" element={<TerminalLogger/>}></Route>
					{/* 일치하는 라우트가 없는 경우 Not-Found */}
					<Route path="*" element={<NotFound />}></Route>
				</Routes>
			</BrowserRouter>
		</div>
    </>
  );
}

export default App;
