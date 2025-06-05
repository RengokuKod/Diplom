const mysql = require('mysql2');

// Определяем имя базы данных
const DB_NAME = 'alexmi49_diplom';
if (!DB_NAME) {
    console.error('Ошибка: Имя базы данных не указано в конфигурации db.js');
    process.exit(1);
}

// Создаем пул соединений
const pool = mysql.createPool({
    host: 'alexmi49.beget.tech',
    user: 'alexmi49_diplom',
    password: 'Q1qqqqqq',
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000
});

// Функция для получения соединения из пула
const getConnection = (callback) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка при подключении к базе данных:', err);
            return callback(err);
        }
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                console.error(`Ошибка выбора базы данных ${DB_NAME}:`, err);
                connection.release();
                return callback(err);
            }
            callback(null, connection);
        });
    });
};

// Проверка подключения при старте
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Не удалось подключиться к базе данных:', err);
        process.exit(1);
    }
    console.log('Подключение к серверу базы данных успешно установлено');
    connection.query('USE ??', [DB_NAME], (err) => {
        if (err) {
            console.error(`Ошибка выбора базы данных ${DB_NAME}:`, err);
            connection.release();
            process.exit(1);
        }
        console.log(`База данных ${DB_NAME} выбрана`);
        connection.release();
    });
});

module.exports = {
    getConnection,
    pool, // Экспортируем пул для прямых запросов, если нужно
    DB_NAME // Экспортируем имя базы данных для использования в server.js
};