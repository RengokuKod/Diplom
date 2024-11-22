const express = require('express');
   const bodyParser = require('body-parser');
   const cors = require('cors');
   const mysql = require('mysql2');

   const app = express();
   const PORT = process.env.PORT || 3000;

   app.use(cors());
   app.use(bodyParser.json());

   // Настройки подключения к базе данных
   const db = mysql.createConnection({
       host: 'localhost',
       user: 'root',
       password: 'Q1qqqqqq!',
  
   });

   // Подключение к базе данных
   db.connect((err) => {
       if (err) throw err;
       console.log('Подключение к MySQL успешно установлено');
   });
   app.post('api/create/db',(req ,res) => {
const createDatabaseQuery=`
Create Database Diplom`;
});
   // Создание таблицы users
   app.post('/api/migrate', (req, res) => {
       const createTableQuery = `
       Use Diplom;
           CREATE TABLE IF NOT EXISTS users (
               id INT AUTO_INCREMENT PRIMARY KEY,
               username VARCHAR(255) NOT NULL,
               email VARCHAR(255) NOT NULL,
               password VARCHAR(255) NOT NULL,
               role VARCHAR(50),
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
           )
       `;
       db.query(createTableQuery, (err, result) => {
           if (err) throw err;
           res.send('Таблица users была создана или уже существует');
       });
   });

   // Получение пользователей
   app.get('/api/users', (req, res) => {
       db.query('SELECT * FROM users', (err, results) => {
           if (err) throw err;
           res.json(results);
       });
   });

   app.listen(PORT, () => {
       console.log(`Сервер запущен на порту ${PORT}`);
   });