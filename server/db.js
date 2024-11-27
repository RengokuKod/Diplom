const mysql = require('mysql2');

// Создаем пул соединений
const pool = mysql.createPool({
    host: 'localhost', // Адрес сервера базы данных
    user: 'rengoku', // Имя пользователя
    password: 'Q1qqqqqq!', // Пароль
    database: '', // Без указания базы данных
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Функция для получения соединения из пула
const getConnection = (callback) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка при подключении к базе данных:', err);
            return callback(err);
        }
        callback(null, connection);
    });
};

module.exports = {
    getConnection
};