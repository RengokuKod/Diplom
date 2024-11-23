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
       password: 'Q1qqqqqq',
  
   });

   // Подключение к базе данных
   db.connect((err) => {
       if (err) throw err;
       console.log('Подключение к MySQL успешно установлено');
   });
   app.post('/api/create/db', (req, res) => {
    const createDatabaseQuery = `CREATE DATABASE IF NOT EXISTS Diplom`;
    db.query(createDatabaseQuery, (err, result) => {
        if (err) throw err;
        res.send('База данных Diplom была создана или уже существует');
    });
});

   // Создание таблицы users
app.post('/api/migrate', (req, res) => {
    // Создаем таблицу (без команды USE)
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // Сначала переключитесь на базу данных Diplom
    db.query('USE Diplom', (err) => {
        if (err) {
            // Если возникла ошибка, отправляем сообщение об ошибке
            return res.status(500).send('Ошибка при переключении на базу данных');
        }

        // Теперь создаем таблицу
        db.query(createTableQuery, (err, result) => {
            if (err) {
                // Если возникла ошибка при создании таблицы, отправляем сообщение об ошибке
                return res.status(500).send('Ошибка при создании таблицы');
            }

            // Успешно создали или таблица уже существует
            res.send('Таблица users была создана или уже существует');
        });
    });
});

   // Получение пользователей
   
   app.get('/api/users', (req, res) => {
    db.query('USE Diplom', (err) => {
        if (err) {
            // Если возникла ошибка, отправляем сообщение об ошибке
            return res.status(500).send('Ошибка при переключении на базу данных');
        }
       db.query('SELECT * FROM users', (err, results) => {
           if (err) throw err;
           res.json(results);
       });
    });
   });

   app.listen(PORT, () => {
       console.log(`Сервер запущен на порту ${PORT}`);
   });