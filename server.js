const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const { db, tablesToWatch } = require('./config');

const app = express();
const pool = new Pool(db);
const PORT = 5001;

app.use(cors());
app.use(express.static('public/dist')); // index.html

// query string을 받기 위해 필요
app.use(express.json());  
app.use(express.urlencoded({ extended: true }));  

app.get("/ip", (req,res)=>{
  res.send(db.host);
});


app.get('/data', async (req, res) => {
  const result = {};

  for (let table of tablesToWatch) {
    try {
        let query;
        if(table.includes("channel"))
            query = `SELECT * FROM "${table}" ORDER BY id ASC;`;
        else if (table==="member")
            query = `SELECT * FROM "${table}" ORDER BY admin DESC, email ASC;`;
        else
            query = `SELECT * FROM "${table}";`;
      const { rows } = await pool.query(query);
      result[table] = rows;
    } catch (err) {
      result[table] = { error: err.message };
    }
  }

  res.json(result);
});


// app.get('/systemlog', async (req, res) => {
//     const { page = 1, limit = 20 } = req.query;
//     const offset = (page - 1) * limit;
//     const result = {
//       rows: [],
//       total: 0
//     };
  
//     try {
//       const countQuery = `SELECT COUNT(*) FROM private.systemlog`;
//     //   const dataQuery = `SELECT idx, process, message, to_char(time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS.MS') time FROM private.systemlog ORDER BY idx DESC LIMIT $1 OFFSET $2`;
//       const dataQuery = `SELECT idx, process, message, to_char(time, 'YYYY-MM-DD HH24:MI:SS.MS') time FROM private.systemlog ORDER BY idx DESC LIMIT $1 OFFSET $2`;
  
//       const countResult = await pool.query(countQuery);
//       const dataResult = await pool.query(dataQuery, [limit, offset]);
  
//       result.total = parseInt(countResult.rows[0].count);
//       result.rows = dataResult.rows;
  
//       res.json(result);
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
// });

app.get('/get-table', async (req, res) => {
  const { page = 1, limit = 20, table, primary } = req.query;
  const offset = (page - 1) * limit;
  if (!table) { // primary key는 없을 수도 있음
      return res.status(400).json({ error: 'Table name is required' });
  }

  const result = {
      rows: [],
      total: 0
  };

  try {
      // primary 찾기 X, 직접 입력
      // 1. 테이블의 timestamp 컬럼 찾기
      let timestampQuery;
      let query_table;
      // (private)
      if(table.startsWith("private.")){
        timestampQuery = `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'private'
          AND table_name = $1
          AND data_type IN ('timestamp', 'timestamp without time zone');
        `;
        query_table = table.slice(8);
      } else{
      // (public)
        timestampQuery = `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = $1 AND data_type IN ('timestamp', 'timestamp without time zone')
        `;
        query_table = table;
      }
      const timestampResult = await pool.query(timestampQuery, [query_table]);
      const timestampColumns = timestampResult.rows.map(row => row.column_name);

      // 2. 데이터 조회 쿼리 작성
      let selectColumns = '*';  // 기본적으로 모든 컬럼 선택
      let orderBy = primary ? `${primary} DESC` : '';  // Primary key가 없으면 ORDER BY 생략
      let timestampFormatted = '';

      // 만약 timestamp 컬럼이 있으면, 이를 포맷팅하여 SELECT 절에 추가
      // console.log("TEST");
      if (timestampColumns.length > 0) {
        timestampFormatted = timestampColumns.map(col => 
          `to_char(${col} AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS.MS') AS ${col}`
        ).join(', ');
        selectColumns = `*, ${timestampFormatted}`;
      }
      
      // 3. 데이터와 카운트 쿼리
      // const countQuery = `SELECT COUNT(*) FROM public."${table}"`;
      const countQuery = `SELECT COUNT(*) FROM ${table}`;
      // FROM public."${table}"
      const dataQuery = `
      SELECT ${selectColumns}
      FROM ${table}
      ${orderBy ? `ORDER BY ${orderBy}` : ''}
      LIMIT $1 OFFSET $2
      `;
      
      // 4. 데이터 조회 및 응답 처리
      const countResult = await pool.query(countQuery);
      const dataResult = await pool.query(dataQuery, [limit, offset]);
      
      // console.log("QUERY_DEBUG"+dataQuery);
      result.total = parseInt(countResult.rows[0].count);
      result.rows = dataResult.rows;

      res.json(result);
  } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
  }
});




// sql 실행 라우터
app.post('/execute-sql', async (req, res) => {
    const { query } = req.body;
  
    if (typeof query !== 'string') return res.status(400).send('Invalid query');
  
    try {
      const result = await pool.query(query);
      res.status(200).json({ result });
    } catch (err) {
      console.error('SQL Error:', err);
      res.status(400).send('Query failed: ' + err);
    }
});
  

// 남은 모든 요청(= static 파일로 매칭 안 된 요청)은 index.html로
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, 'public', 'dist', 'index.html'));
});
// 버전 이슈로 '*' 안될 수 있음
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "dist", "index.html"));
// });
// '/'은 리액트 내의 / 가 아닌 경로에서 새로 고침 시 접속 안됨
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "dist", "index.html"));
// });



app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
