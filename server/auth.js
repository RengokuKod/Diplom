const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Регистрация пользователя
exports.register = (req, res) => {
    const { имя_пользователя, электронная_почта, пароль } = req.body;

    // Переключение на базу данных Diplom
    db.query('USE Diplom', (err) => {
        if (err) return res.status(500).send(err);
    });

    // Проверка на существование пользователя
    db.query('SELECT * FROM пользователи WHERE электронная_почта = ?', [электронная_почта], async (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length > 0) {
            return res.status(400).json({ error: 'Электронная почта уже зарегистрирована.' });
        }

        const hashedPassword = await bcrypt.hash(пароль, 10);
        db.query('INSERT INTO пользователи (имя_пользователя, электронная_почта, пароль) VALUES (?, ?, ?)', 
        [имя_пользователя, электронная_почта, hashedPassword],
        (err, results) => {
            if (err) return res.status(500).send(err);
            res.status(201).json({ message: 'Регистрация успешна.' });
        });
    });
};

// Вход пользователя
exports.login = (req, res) => {
    const { электронная_почта, пароль } = req.body;

    // Переключение на базу данных Diplom
    db.query('USE Diplom', (err) => {
        if (err) return res.status(500).send(err);
    });

    db.query('SELECT * FROM пользователи WHERE электронная_почта = ?', [электронная_почта], async (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) {
            return res.status(400).json({ error: 'Неверная электронная почта или пароль.' });
        }

        const пользователь = results[0];
        const isMatch = await bcrypt.compare(пароль, пользователь.пароль);
        if (!isMatch) {
            return res.status(400).json({ error: 'Неверная электронная почта или пароль.' });
        }

        const token = jwt.sign({ id: пользователь.id, роль: пользователь.роль }, 'your_jwt_secret', { expiresIn: '1h' });
        res.json({ token, пользователь: { id: пользователь.id, имя_пользователя: пользователь.имя_пользователя, электронная_почта: пользователь.электронная_почта, роль: пользователь.роль } });
    });
};

// Проверка токена
exports.checkAuth = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send('Токен не предоставлен.');

    jwt.verify(token, 'your_jwt_secret', (err, decoded) => {
        if (err) return res.status(401).send('Неверный токен.');
        req.userId = decoded.id;
        req.userRole = decoded.роль;
        next();
    });
};