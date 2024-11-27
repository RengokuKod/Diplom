const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const seedDatabase = require('./seed'); // Импортируем функцию seedDatabase
const db = require('./db'); // Импортируем пул соединений
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Подключение к серверу базы данных (без указания базы данных)
db.getConnection((err, connection) => {
    if (err) {
        throw err;
    }
    console.log('Подключение к серверу базы данных успешно установлено');
    connection.release(); // Освобождаем соединение сразу после проверки
});

// Эндпоинт для миграции базы данных (создание таблиц и добавление внешних ключей)
app.post('/api/migrate', (req, res) => {
    const createDatabaseQuery = `CREATE DATABASE IF NOT EXISTS Diplom`;

    // Создаем базу данных, если она не существует
    db.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка при подключении к базе данных:', err);
            return res.status(500).send('Ошибка при подключении к базе данных');
        }

        connection.query(createDatabaseQuery, (err) => {
            if (err) {
                console.error('Ошибка при создании базы данных:', err);
                return res.status(500).send('Ошибка при создании базы данных');
            }

            // Переключаемся на базу данных Diplom
            connection.query('USE Diplom', (err) => {
                if (err) {
                    console.error('Ошибка при переключении на базу данных:', err);
                    return res.status(500).send('Ошибка при переключении на базу данных');
                }

                // Создаем таблицы
                const createTableQueries = [
                    `CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        имя_пользователя VARCHAR(255) NOT NULL,
                        электронная_почта VARCHAR(255) NOT NULL,
                        пароль VARCHAR(255) NOT NULL,
                        роль VARCHAR(50),
                        дата_создания TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );`,
                    `CREATE TABLE IF NOT EXISTS category (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        название VARCHAR(255) NOT NULL,
                        описание TEXT,
                        дата_создания TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        дата_обновления TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        создатель VARCHAR(100),
                        обновлено_пользователем VARCHAR(100),
                        количество_продуктов INT,
                        статус ENUM('активно', 'неактивно') NOT NULL
                    );`,
                    `CREATE TABLE IF NOT EXISTS product (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        название VARCHAR(255) NOT NULL,
                        описание TEXT,
                        цена DECIMAL(10, 2) NOT NULL,
                        запасы INT,
                        категория_id INT,
                        дата_создания TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        дата_обновления TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        статус ENUM('доступно', 'недоступно') NOT NULL,
                        FOREIGN KEY (категория_id) REFERENCES category(id)
                    );`,
                    `CREATE TABLE IF NOT EXISTS corzina (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        пользователь_id INT,
                        продукт_id INT,
                        количество INT NOT NULL,
                        дата_создания TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        дата_обновления TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        идентификатор_сессии VARCHAR(255),
                        заказ_id INT,
                        FOREIGN KEY (пользователь_id) REFERENCES users(id),
                        FOREIGN KEY (продукт_id) REFERENCES product(id),
                        FOREIGN KEY (заказ_id) REFERENCES zakaz(id)
                    );`,
                    `CREATE TABLE IF NOT EXISTS zakaz (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        статус ENUM('ожидание', 'завершен', 'отменен') NOT NULL,
                        дата_создания TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        пользователь_id INT,
                        итого DECIMAL(10, 2) NOT NULL,
                        дата_обновления TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        адрес_доставки VARCHAR(255),
                        способ_оплаты ENUM('наличные', 'кредитная_карта', 'paypal') NOT NULL,
                        FOREIGN KEY (пользователь_id) REFERENCES users(id)
                    );`,
                    `CREATE TABLE IF NOT EXISTS otziv (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        рейтинг INT,
                        пользователь_id INT,
                        продукт_id INT,
                        комментарий TEXT,
                        дата_создания TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        дата_обновления TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        статус ENUM('одобрено', 'ожидание', 'отклонено') NOT NULL,
                        FOREIGN KEY (пользователь_id) REFERENCES users(id),
                        FOREIGN KEY (продукт_id) REFERENCES product(id)
                    );`
                ];

                // Выполнение запросов на создание таблиц
                const executeQueries = (queries, index = 0, callback) => {
                    if (index >= queries.length) {
                        return callback();
                    }

                    connection.query(queries[index], (err) => {
                        if (err) {
                            console.error('Ошибка при выполнении запроса:', err);
                            return res.status(500).send('Ошибка при выполнении запроса');
                        }
                        executeQueries(queries, index + 1, callback);
                    });
                };

                executeQueries(createTableQueries, 0, () => {
                    console.log('Все таблицы созданы.');
                    res.status(200).send('Миграция завершена успешно.');
                });
            });
        });
    });
});

// Эндпоинт для заполнения базы данных
app.post('/api/seed', (req, res) => {
    seedDatabase(db, (err) => {
        if (err) {
            console.error('Ошибка при заполнении базы данных:', err);
            return res.status(500).send('Ошибка при заполнении базы данных');
        }
        res.send('База данных успешно заполнена!');
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});