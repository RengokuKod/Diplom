const createTableQueries = [
    // Таблица users
    `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        имя_пользователя VARCHAR(255) NOT NULL UNIQUE,
        электронная_почта VARCHAR(255) NOT NULL UNIQUE,
        пароль VARCHAR(255) NOT NULL,
        роль ENUM('user', 'admin') DEFAULT 'user',
        фото VARCHAR(255),
        дата_создания DATE NOT NULL
    )`,

    // Таблица category
    `CREATE TABLE IF NOT EXISTS category (
        id INT AUTO_INCREMENT PRIMARY KEY,
        название VARCHAR(255) NOT NULL UNIQUE,
        описание TEXT,
        дата_создания DATE NOT NULL,
        создатель VARCHAR(255),
        количество_продуктов INT DEFAULT 0,
        фото VARCHAR(255)
    )`,

    // Таблица product
    `CREATE TABLE IF NOT EXISTS product (
        id INT AUTO_INCREMENT PRIMARY KEY,
        название VARCHAR(255) NOT NULL,
        описание TEXT,
        цена DECIMAL(10, 2) NOT NULL,
        запасы INT NOT NULL,
        категория VARCHAR(255) NOT NULL,
        категория_id INT,
        дата_создания DATE NOT NULL,
        фото VARCHAR(255),
        рэйтинг DECIMAL(3,1) DEFAULT 0.0,
        отзывов INT DEFAULT 0,
        вопросов INT DEFAULT 0,
        FOREIGN KEY (категория_id) REFERENCES category(id) ON DELETE SET NULL
    )`,

    // Таблица postavshik
    `CREATE TABLE IF NOT EXISTS postavshik (
        id INT AUTO_INCREMENT PRIMARY KEY,
        название VARCHAR(255) NOT NULL,
        рэйтинг DECIMAL(2,1) NOT NULL,
        количество_заказов INT NOT NULL,
        количество_курьеров INT NOT NULL,
        год_основания INT NOT NULL,
        телефон VARCHAR(20) NOT NULL,
        фото VARCHAR(255)
    )`,

    // Таблица otziv
    `CREATE TABLE IF NOT EXISTS otziv (
        id INT AUTO_INCREMENT PRIMARY KEY,
        рейтинг DECIMAL(2,1) NOT NULL,
        пользователь_id INT,
        продукт_id INT,
        комментарий TEXT,
        дата_создания DATE NOT NULL,
        фото VARCHAR(255),
        FOREIGN KEY (пользователь_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (продукт_id) REFERENCES product(id) ON DELETE CASCADE
    )`,

    // Таблица corzina (добавлен поставщик_id как внешний ключ)
    `CREATE TABLE IF NOT EXISTS corzina (
        id INT AUTO_INCREMENT PRIMARY KEY,
        пользователь_id INT NOT NULL,
        продукт_id INT NOT NULL,
        количество INT NOT NULL,
        дата_создания DATE NOT NULL,
        цена DECIMAL(10,2) NOT NULL,
        поставщик_id INT,
        FOREIGN KEY (пользователь_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (продукт_id) REFERENCES product(id) ON DELETE CASCADE,
        FOREIGN KEY (поставщик_id) REFERENCES postavshik(id) ON DELETE SET NULL
    )`,

    // Таблица zakaz (добавлен поставщик_id как внешний ключ)
    `CREATE TABLE IF NOT EXISTS zakaz (
        id INT AUTO_INCREMENT PRIMARY KEY,
        статус ENUM('оплачен', 'не_оплачен') DEFAULT 'не_оплачен',
        дата_создания DATE NOT NULL,
        пользователь_id INT NOT NULL,
        итого DECIMAL(10,2) NOT NULL,
        дата_обновления DATE NOT NULL,
        адрес_доставки VARCHAR(255) NOT NULL,
        способ_оплаты VARCHAR(50) NOT NULL,
        поставщик_id INT,
        дни_на_доставку INT,
        товары TEXT,
        трэк_номер VARCHAR(50),
        FOREIGN KEY (пользователь_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (поставщик_id) REFERENCES postavshik(id) ON DELETE SET NULL
    )`,

    // Таблица izbran (копия product с пользователь_id)
    `CREATE TABLE IF NOT EXISTS izbran (
        id INT AUTO_INCREMENT PRIMARY KEY,
        название VARCHAR(255) NOT NULL,
        описание TEXT,
        цена DECIMAL(10, 2) NOT NULL,
        запасы INT NOT NULL,
        категория VARCHAR(255) NOT NULL,
        категория_id INT,
        дата_создания DATE NOT NULL,
        фото VARCHAR(255),
        рэйтинг DECIMAL(3,1) DEFAULT 0.0,
        отзывов INT DEFAULT 0,
        вопросов INT DEFAULT 0,
        пользователь_id INT NOT NULL,
        FOREIGN KEY (пользователь_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (категория_id) REFERENCES category(id) ON DELETE SET NULL
    )`,

    // Таблица opisanie
    `CREATE TABLE IF NOT EXISTS opisanie (
        id INT AUTO_INCREMENT PRIMARY KEY,
        продукт_id INT,
        бренд VARCHAR(255),
        модель VARCHAR(255),
        вес DECIMAL(10,2),
        размеры VARCHAR(50),
        мощность INT,
        скорость VARCHAR(50),
        совместимость TEXT,
        гарантия INT,
        FOREIGN KEY (продукт_id) REFERENCES product(id) ON DELETE CASCADE
    )`,

    // Таблица vopros
    `CREATE TABLE IF NOT EXISTS vopros (
        id INT AUTO_INCREMENT PRIMARY KEY,
        продукт_id INT,
        пользователь_id INT,
        вопрос TEXT NOT NULL,
        дата_создания DATE NOT NULL,
        ответ TEXT,
        FOREIGN KEY (продукт_id) REFERENCES product(id) ON DELETE CASCADE,
        FOREIGN KEY (пользователь_id) REFERENCES users(id) ON DELETE SET NULL
    )`,

    // Триггеры для product
    `DELIMITER //
    CREATE TRIGGER update_product_rating_reviews
    AFTER INSERT ON otziv
    FOR EACH ROW
    BEGIN
        UPDATE product
        SET рэйтинг = (SELECT AVG(рейтинг) FROM otziv WHERE продукт_id = NEW.продукт_id),
            отзывов = (SELECT COUNT(*) FROM otziv WHERE продукт_id = NEW.продукт_id)
        WHERE id = NEW.продукт_id;
    END; //
    DELIMITER ;`,

    `DELIMITER //
    CREATE TRIGGER update_product_questions
    AFTER INSERT ON vopros
    FOR EACH ROW
    BEGIN
        UPDATE product
        SET вопросов = (SELECT COUNT(*) FROM vopros WHERE продукт_id = NEW.продукт_id)
        WHERE id = NEW.продукт_id;
    END; //
    DELIMITER ;`
];

module.exports = createTableQueries;