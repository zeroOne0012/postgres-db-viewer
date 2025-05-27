const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
// const { db, tablesToWatch, tablesToWatchInNewPage } = require('./config');
const {getConfig, postConfig} = require("./sqlite");

const app = express();
const PORT = 5000;
 
let currentTablesToWatch;
let curruntTablesToWatchInNewPage;
let dbPassword;
let dbHost;
let pool;

(async () => { // dbconfig data (from sqlite)
  const { db, tablesToWatch, tablesToWatchInNewPage } = await getConfig();
  pool = new Pool(db);
  dbPassword = db.password;
  dbHost = db.host;
  currentTablesToWatch = [...tablesToWatch];
  curruntTablesToWatchInNewPage = tablesToWatchInNewPage;
})();

app.use(cors());
app.use(express.static('public/dist')); // index.html

// query string을 받기 위해 필요
app.use(express.json());  
app.use(express.urlencoded({ extended: true }));  

app.get("/ip", (req,res)=>{
  res.send(dbHost);
});

app.get('/data', async (req, res) => {
  const result = {};

  for (let table of currentTablesToWatch) {
    try {
        let query = `SELECT * FROM "${table}" ;`;
        if(table.includes("/")){ // 정렬 시 기준 column 이름 '/' 로 구분하여 전달
          const t = table.split("/");
          for(let i=0; i<t.length; i++){ // 다중 조건 정렬 가능
            if(i==0){
              query = `SELECT * FROM "${t[i]}" `;
            }else{ 
              let sort = "ASC";
              let column = t[i];

              // column 이름 앞에 * 붙이면 DESC, 기본 ASC
              if(t[i].startsWith("*")){
                sort = "DESC";
                column = t[i].slice(1);
              }

              if(i==1)
                query+=`ORDER BY ${column} ${sort} `;
              else
                query+=`, ${column} ${sorrt} `;
            }
          }
          query+=";";
        }

        // if(table.includes("channel"))
        //   query = `SELECT * FROM "${table}" ORDER BY id ASC;`;
        // else if (table==="member")
        //   query = `SELECT * FROM "${table}" ORDER BY admin DESC, email ASC;`;
        // else
        //   query = `SELECT * FROM "${table}";`;
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


let isPoolEnded = false;
let isEnding = false;

app.post('/update-config', async (req, res) => {
  // console.log("config update API 호출");
  const { dbConfig, tablesToWatch, tablesToWatchInNewPage } = req.body;
  // console.log(dbConfig);
  try {
    // 동시 요청 방지
    if (isEnding) {
      return res.status(429).json({ message: 'Pool is currently being reconfigured. Please try again shortly.' });
    }
    
    isEnding = true;

    if (!isPoolEnded) {
      await pool.end(); // 이전 pool 종료
      isPoolEnded = true;
    }

    // 새로운 연결
    pool = new Pool(dbConfig);
    isPoolEnded = false;

    await pool.query('SELECT 1'); // 연결 테스트

    tabesToWatchString = tablesToWatch.join(",");
    postConfig(dbConfig, tabesToWatchString, tablesToWatchInNewPage)
    .then(res => console.log("SQLITE dbconfig updated:", res))
    .catch(err => console.error("SQLITE dbconfig update failed:", err));

    // 업데이트 반영
    currentTablesToWatch = tablesToWatch;
    curruntTablesToWatchInNewPage = tablesToWatchInNewPage;
    res.json({ message: 'Config updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update config', error: err.message });
  } finally {
    isEnding = false; // 플래그 해제
  }
});

// 필요시 현재 설정 확인
app.get('/config', (req, res) => {
  // res.json({ dbConfig: pool.options, tablesToWatch: currentTablesToWatch });
  res.json({
    dbConfig: {
      host: pool.options.host,
      port: pool.options.port,
      user: pool.options.user,
      database: pool.options.database,
      password: dbPassword,
    },
    tablesToWatch: currentTablesToWatch,
    tablesToWatchInNewPage: curruntTablesToWatchInNewPage,
  });
});

// 수정 (PUT /row)
app.put('/row', async (req, res) => {
  const { table, old, row } = req.body;
  if (!table || !old || !row) return res.status(400).json({ error: 'Invalid request' });

  const fields = Object.keys(row);
  const setClause = fields.map((key, i) => `"${key}" = $${i + 1}`).join(', ');
  const setValues = fields.map((key) => row[key]);

  const whereKeys = Object.keys(old);
  let whereClauseParts = [];
  let whereValues = [];
  let paramIndex = fields.length + 1;

  whereKeys.forEach((key) => {
    if (old[key] === null || old[key] === undefined) {
      whereClauseParts.push(`"${key}" IS NULL`);
    } else {
      whereClauseParts.push(`"${key}" = $${paramIndex++}`);
      whereValues.push(old[key]);
    }
  });

  const sql = `UPDATE "${table}" SET ${setClause} WHERE ${whereClauseParts.join(' AND ')}`;
  const values = [...setValues, ...whereValues];

  // console.log("update sql:", sql);
  // console.log("values:", values);

  try {
    const result = await pool.query(sql, values);
    res.json({ updated: result.rowCount });
  } catch (err) {
    console.error("Update failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// 삭제 (DELETE /row)
app.delete('/row', async (req, res) => {
  const { table, rows } = req.body;

  if (!table || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const keys = Object.keys(rows[0]); // 모든 row가 같은 구조라고 가정
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  rows.forEach((row) => {
    const clause = keys.map((key) => {
      if (row[key] === null || row[key] === undefined) {
        return `"${key}" IS NULL`;
      } else {
        values.push(row[key]);
        return `"${key}" = $${paramIndex++}`;
      }
    }).join(' AND ');
    conditions.push(`(${clause})`);
  });

  const sql = `DELETE FROM "${table}" WHERE ${conditions.join(' OR ')}`;
  // console.log("delete sql:", sql);
  // console.log("values:", values);

  try {
    const result = await pool.query(sql, values);
    res.json({ deleted: result.rowCount });
  } catch (err) {
    console.error('Delete failed:', err);
    res.status(500).json({ error: err.message });
  }
});


// POST /row
// app.post('/row', async (req, res) => {
//   const { table, row } = req.body;
//   if (!table || !row || typeof row !== 'object') {
//     return res.status(400).json({ error: 'Invalid request' });
//   }

//   const keys = Object.keys(row);
//   const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
//   const values = keys.map((key) => row[key]);

//   const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
//   // console.log(sql,values);

//   try {
//     const result = await pool.query(sql, values);
//     res.json({ inserted: result.rows[0] });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


app.post('/row', async (req, res) => {
  const { table, rows } = req.body;

  if (!table || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const fields = Object.keys(rows[0]);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;

  try {
    const client = await pool.connect();

    for (const row of rows) {
      const values = fields.map((f) => row[f]);
      await client.query(sql, values);
    }

    client.release();
    res.json({ inserted: rows.length });
  } catch (err) {
    console.error('Insert failed:', err);
    res.status(500).json({ error: `Insert failed: ${err}` });
  }
});


app.get("/columns", async (req, res, next) => {
  const table = req.query.table;
  if (!table) return res.status(400).json({ error: "Missing table parameter" });

  try {
    const result = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [table]);

    const columnNames = result.rows.map(r => r.column_name);
    res.json(columnNames);
  } catch (err) {
    next(err);
  }
});


//--------------------------------------------//
  

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
