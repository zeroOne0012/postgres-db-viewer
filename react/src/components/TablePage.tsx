import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { BASE_URL } from "../api/config";

type Data = Record<string, Array<Record<string, any>> | { error: string }>;

export default function DataPanel() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let intervalId: number;

    // const fetchData = async () => {
    //   try {
    //     const res = await fetch(`${BASE_URL}/data`);
    //     const json = await res.json();
    //     setData(json);
    //   } catch (err) {
    //     console.error("failed to load data:", err);
    //   }
    // };
    const fetchData = async () => {
        try {
          const res = await axios.get(`${BASE_URL}/data`);
          setData(res.data);
        } catch (err) {
          console.error("failed to load data:", err);
        }
    };

    fetchData();
    intervalId = setInterval(fetchData, 100);

    return () => clearInterval(intervalId);
  }, []);

  if (!data) return <Wrapper>Loading...</Wrapper>;

  return (
    <Wrapper>
      {Object.entries(data).map(([tableName, rows]) => (
        <TableBlock key={tableName}>
          <TableTitle>{tableName.split("/")[0]}</TableTitle>
          {Array.isArray(rows) && rows.length > 0 ? (
            <StyledTable>
              <thead>
                <tr>
                  {Object.keys(rows[0]).map((header) => (
                    <Th key={header}>{header}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((cell, i) => (
                      <Td key={i}>
                      {cell === null || cell === undefined
                        ? "null"
                        : typeof cell === "boolean"
                        ? cell.toString()
                        : cell}
                    </Td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          ) : "error" in rows ? (
            <ErrorMsg>Error: {rows.error}</ErrorMsg>
          ) : (
            <p>No data</p>
          )}
        </TableBlock>
      ))}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
`;

const TableBlock = styled.div`
  background: #1c1c1c;
  padding: 1rem;
  border-radius: 8px;
  min-width: 300px;
  max-width: 100%;
  overflow-x: auto;
`;

const TableTitle = styled.h2`
  margin-top: 0;
  font-size: 1.2rem;
  color: #0f0;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  background: #333;
  border: 1px solid #333;
  padding: 0.5rem;
  text-align: left;
  white-space: nowrap;
`;

const Td = styled.td`
  background: #222;
  border: 1px solid #333;
  padding: 0.5rem;
  white-space: nowrap;
`;

const ErrorMsg = styled.p`
  color: red;
`;