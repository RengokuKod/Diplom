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
       user: 'rengoku',
       password: 'Q1qqqqqq!',
  
   });

   // Подключение к базе данных
   db.connect((err) => {
       if (err) throw err;
       console.log('Подключение к MySQL успешно установлено');
   });
   

   // Создание таблицы users
   app.post('/api/migrate', (req, res) => {
    const createDatabaseQuery = `CREATE DATABASE IF NOT EXISTS Diplom`;
    
    db.query(createDatabaseQuery, (err, result) => {
        if (err) {
            console.error('Ошибка при создании базы данных:', err); // Выводим ошибку в терминал
            return res.status(500).send('Ошибка при создании базы данных'); // Отправляем ответ в случае ошибки
        }

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                имя_пользователя VARCHAR(255) NOT NULL,
                электронная_почта VARCHAR(255) NOT NULL,
                пароль VARCHAR(255) NOT NULL,
                роль VARCHAR(50),
                дата_создания TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS product (
                id INT AUTO_INCREMENT PRIMARY KEY,
                название VARCHAR(255) NOT NULL,
                описание TEXT,
                цена DECIMAL(10, 2) NOT NULL,
                запасы INT,
                категория_id INT,
                дата_создания TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                дата_обновления TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                статус VARCHAR(50)
            );
            CREATE TABLE IF NOT EXISTS corzina (
                id INT AUTO_INCREMENT PRIMARY KEY,
                пользователь_id INT,
                продукт_id INT,
                количество INT NOT NULL,
                дата_создания TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                дата_обновления TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                идентификатор_сессии VARCHAR(255),
                заказ_id INT
            );
            CREATE TABLE IF NOT EXISTS zakaz (
                id INT AUTO_INCREMENT PRIMARY KEY,
                статус VARCHAR(50),
                дата_создания TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                пользователь_id INT,
                итого DECIMAL(10, 2) NOT NULL,
                дата_обновления TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                адрес_доставки VARCHAR(255),
                способ_оплаты VARCHAR(50)
            );
            CREATE TABLE IF NOT EXISTS otziv (
                id INT AUTO_INCREMENT PRIMARY KEY,
                рейтинг INT,
                пользователь_id INT,
                продукт_id INT,
                комментарий TEXT,
                дата_создания TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                дата_обновления TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                статус VARCHAR(50)
            );
            CREATE TABLE IF NOT EXISTS category (
                id INT AUTO_INCREMENT PRIMARY KEY,
                название VARCHAR(255) NOT NULL,
                описание TEXT,
                дата_создания TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                дата_обновления TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                создатель VARCHAR(100),
                обновлено_пользователем VARCHAR(100),
                количество_продуктов INT,
                статус VARCHAR(50)
            );
            ALTER TABLE product ADD CONSTRAINT product_fk5 FOREIGN KEY (категория_id) REFERENCES category(id);
            ALTER TABLE corzina ADD CONSTRAINT corzina_fk0 FOREIGN KEY (пользователь_id) REFERENCES users(id);
            ALTER TABLE corzina ADD CONSTRAINT corzina_fk2 FOREIGN KEY (продукт_id) REFERENCES product(id);
            ALTER TABLE corzina ADD CONSTRAINT corzina_fk7 FOREIGN KEY (заказ_id) REFERENCES zakaz(id);
            ALTER TABLE zakaz ADD CONSTRAINT zakaz_fk3 FOREIGN KEY (пользователь_id) REFERENCES users(id);
            ALTER TABLE otziv ADD CONSTRAINT otziv_fk2 FOREIGN KEY (пользователь_id) REFERENCES users(id);
            ALTER TABLE otziv ADD CONSTRAINT otziv_fk3 FOREIGN KEY (продукт_id) REFERENCES product(id);
        `;
        
        // Сначала переключитесь на базу данных Diplom
        db.query('USE Diplom', (err) => {
            if (err) {
                console.error('Ошибка при переключении на базу данных:', err); // Выводим ошибку в терминал
                return res.status(500).send('Ошибка при переключении на базу данных'); // Отправляем ответ в случае ошибки
            }
            
            // Теперь создаем таблицы
            db.query(createTableQuery, (err, result) => {
                if (err) {
                    console.error('Ошибка при создании таблицы:', err); // Выводим ошибку в терминал
                    return res.status(500).send('Ошибка при создании таблицы'); // Отправляем ответ в случае ошибки
                }
                
                // Успешно создали базы данных и таблицы
                res.send('База данных и таблицы были успешно созданы или уже существуют');
            });
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