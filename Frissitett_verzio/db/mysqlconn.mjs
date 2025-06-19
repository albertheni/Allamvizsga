import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost', // XAMPP alapértelmezett host
  user: 'root',     // XAMPP alapértelmezett felhasználó
  password: '',     // XAMPP alapértelmezett jelszó (üres, hacsak nem változtattad meg)
  database: 'sutivarazs_db', // Az imént létrehozott adatbázis
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;