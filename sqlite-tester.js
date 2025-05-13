const sqlite3 = require('sqlite3').verbose();

// DB 파일 생성
const db = new sqlite3.Database('dbconfig.db');

// db.all("select * from dbs", (err, rows)=>{
//     if(err){
//         console.log("SQLITE query failed!! ", err);
//         return;
//     }
    
//     console.log("SQLITE query result: ",rows);
// });


// db.all("update dbs set database='projects' where id=1", (err, rows)=>{
//     if(err){
//         console.log("SQLITE query failed!! ", err);
//         return;
//     }
    
//     console.log("SQLITE query result: ",rows);
// });
