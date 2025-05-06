module.exports = {
    db: {
      user: 'postgres',
      host: 'localhost',
      database: 'mydb',
      password: '0000',
      port: 5432,
    },
    tablesToWatch: ['member', 'channel_info', 'channel_status', 'channel_roi'], // 메인 뷰 테이블 리스트
  };
  