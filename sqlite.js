const sqlite3 = require('sqlite3').verbose();

// DB 파일 생성
const db = new sqlite3.Database('dbconfig.db');

// 테이블 생성
db.serialize(() => {
  db.run(`
        CREATE TABLE IF NOT EXISTS dbs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT NOT NULL,
            host TEXT NOT NULL,
            database TEXT NOT NULL,
            password TEXT NOT NULL,
            port INTEGER NOT NULL,
            tables1 TEXT,
            tables2 TEXT
        );
    `);

  // 비어있으면 생성
  db.all("SELECT * FROM dbs", (err, rows) => {
    if (err) {
        console.error("SQLITE SELECT ERROR!! " + err);
        return;
    }
    if(rows.length===0){
        const stmt = db.prepare(`
            INSERT INTO dbs 
                (user, host, database, password, port, tables1, tables2) 
            VALUES
                (?, ?, ?, ?, ?, ?, ?)`);
        stmt.run("postgres","localhost","mydb","0000",5432,"member,article", "logs/private.system_log/idx/View Logs, events/history/idx/View Events");
        stmt.finalize();
    }
  });

  db.all("select * from dbs", (err, rows)=>{
    if(err){
        console.log("SQLITE 초기 데이터 확인 실패");
        return;
    }
    console.log("SQLITE: dbconfig",rows);
  });
});


const getConfig = ()=>{
    return new Promise((resolve, reject)=>{
        let config;
        let result;
        db.all("select * from dbs", (err, rows)=>{
            if(err){
                console.log("SQLITE dbconfig get 실패");
                return reject(err);
            }
            config = rows[0];
            config.tables1 = config.tables1?.split(",").map(r=>r.trim());
    
            result = {
                db: {
                    user: config.user,
                    host: config.host,
                    database: config.database,
                    password: config.password,
                    port: config.port,
                },
                tablesToWatch: config.tables1, // 메인 뷰 테이블 리스트
                tablesToWatchInNewPage: config.tables2, // 탭 분리 테이블 리스트
            }

            // console.log("debug.slite-js.get: ",result);
            resolve(result);
        });
    });
};

const postConfig = (newDbConfig, newTables1, newTables2)=>{
    return new Promise((resolve, reject) => {
        const id = 1; // 업데이트할 레코드 ID (예: 기본값 1)
    
        const sql = `
          UPDATE dbs SET
            user = ?,
            host = ?,
            database = ?,
            password = ?,
            port = ?,
            tables1 = ?,
            tables2 = ?
          WHERE id = ?
        `;
    
        const params = [
          newDbConfig.user,
          newDbConfig.host,
          newDbConfig.database,
          newDbConfig.password,
          newDbConfig.port,
          newTables1,
          newTables2,
          id
        ];
    
        db.run(sql, params, function (err) {
          if (err) {
            // console.error("SQLITE dbconfig post 실패:", err);
            return reject(err);
          }
    
        //   console.log("DB config updated:", this.changes);
          resolve({ changes: this.changes });
        });
    });
};

exports.default = db;
module.exports = {getConfig, postConfig};

// 종료
// db.close();