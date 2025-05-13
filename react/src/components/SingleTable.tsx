import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { BASE_URL } from "../api/config";

interface RowData {
  [key: string]: any;
}
interface ApiResponse {
  rows: RowData[];
  total: number;
}
interface SignleTableProps{
  table:string;
  primary:string;
}
const limit = 20;

export default function SingleTable({table, primary}:SignleTableProps) {
  const [rows, setRows] = useState<RowData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const totalPages = Math.ceil(total / limit);
  const maxPagesShown = 10;
  const startPage = Math.floor((page - 1) / maxPagesShown) * maxPagesShown + 1;
  const endPage = Math.min(startPage + maxPagesShown - 1, totalPages);

  const fetchData = async (currentPage = page) => {
    try {
      const res = await axios.get<ApiResponse>(`${BASE_URL}/get-table`, {
        params: { page: currentPage, limit, table, primary },
      });
      setRows(res.data.rows);
      setTotal(res.data.total);
      setIsError(false);
    } catch (err) {
      // console.error("failed to load data:", err);
      setIsError(true);
    } finally{
      setIsLoading(false);
    }
  };

//   useEffect(() => {
//     const interval = setInterval(fetchData, 1000);
//     return () => clearInterval(interval);
//   }, [page]);
useEffect(() => {
  fetchData(page);
    const interval = setInterval(() => {
      fetchData(page);  // 페이지 변경에 관계없이 주기적으로 데이터 갱신
    }, 200);
  
    return () => clearInterval(interval);
  }, [page, table]);  // 빈 배열로 설정하여 컴포넌트 마운트 시 한 번만 실행

  // useEffect(() => {
  //   // 페이지 변경 시마다 데이터 갱신
  //   fetchData();
  // }, [page]);  // page가 바뀔 때마다 실행
  ///


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && page > 1) {
        setPage((p) => p - 1);
      } else if (e.key === "ArrowRight" && page < totalPages) {
        setPage((p) => p + 1);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [page, totalPages]);

  if (isLoading) return <Container>Loading...</Container>;
  if (isError) return <Container>Failed To Get Data</Container>;
  if (!isLoading && rows.length===0) return <Container>No Data</Container>;
  
  const headers = Object.keys(rows[0] || {});

  return (
    <Container>
      <Table>
        <colgroup>
          {headers.map((_, idx) =>
            // idx === 2 ? (
            //   <col key={idx} style={{ width: "400px" }} />
            // ) : idx === 3 ? (
            //   <col key={idx} style={{ width: "60px" }} />
            // ) : 
            (
              <col key={idx} style={{ width: "30px" }} />
            )
          )}
        </colgroup>
        <thead>
          <tr>
            {headers.map((h) => (
              <Th key={h}>{h}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {headers.map((h, i) => (
                <Td key={i}>
                  {row[h] === null
                    ? "null"
                    : typeof row[h] === "boolean"
                    ? row[h].toString()
                    : row[h]}
                </Td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>

      <Pagination>
        {startPage > 1 && (
          <>
            <PageButton onClick={() => setPage(1)}>« First</PageButton>
            <PageButton onClick={() => setPage(startPage - 1)}>◀ Prev</PageButton>
          </>
        )}
        {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
          const pageNum = startPage + i;
          return (
            <PageButton
              key={pageNum}
              onClick={() => setPage(pageNum)}
              active={pageNum === page}
            >
              {pageNum}
            </PageButton>
          );
        })}
        {endPage < totalPages && (
          <>
            <PageButton onClick={() => setPage(endPage + 1)}>Next ▶</PageButton>
            <PageButton onClick={() => setPage(totalPages)}>Last »</PageButton>
          </>
        )}
      </Pagination>
    </Container>
  );
}


const Container = styled.div`
  font-family: monospace;
  background: #111;
  color: #eee;
  // padding: 1rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
  table-layout: fixed;
`;

const Th = styled.th`
  background: #222;
  border: 1px solid #444;
  padding: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 120px;
  position: sticky;
  top: 0;
`;

const Td = styled.td`
  background: #1a1a1a;
  border: 1px solid #444;
  padding: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 120px;
`;

const Pagination = styled.div`
  margin-top: 1rem;
  text-align: center;
`;

const PageButton = styled.button<{ active?: boolean }>`
  background: ${({ active }) => (active ? "#0f0" : "#333")};
  color: ${({ active }) => (active ? "#111" : "#eee")};
  border: none;
  padding: 0.5rem 1rem;
  margin: 0 0.25rem;
  cursor: pointer;

  &:hover {
    background: #555;
  }
`;
