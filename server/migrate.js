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
        название VARCHAR(255) NOT NULL,
        описание TEXT,
        дата_создания DATE NOT NULL,
        создатель VARCHAR(255),
        количество_продуктов INT,
        фото VARCHAR(255)
    )`,

    // Таблица product
    `CREATE TABLE IF NOT EXISTS product (
        id INT AUTO_INCREMENT PRIMARY KEY,
        название VARCHAR(255) NOT NULL,
        описание TEXT,
        цена DECIMAL(10,2) NOT NULL,
        запасы INT NOT NULL,
        категория VARCHAR(255),
        категория_id INT,
        дата_создания DATE NOT NULL,
        фото VARCHAR(255),
        рэйтинг DECIMAL(3,1) DEFAULT 0,
        отзывов INT DEFAULT 0,
        вопросов INT DEFAULT 0,
        FOREIGN KEY (категория_id) REFERENCES category(id) ON DELETE SET NULL
    )`,

    // Таблица opisanie
    `CREATE TABLE IF NOT EXISTS opisanie (
        id INT AUTO_INCREMENT PRIMARY KEY,
        продукт_id INT NOT NULL,
        бренд VARCHAR(255),
        модель VARCHAR(255),
        вес DECIMAL(5,1),
        размеры VARCHAR(255),
        мощность INT,
        скорость VARCHAR(255),
        совместимость TEXT,
        гарантия INT,
        фото_папка VARCHAR(255),
        FOREIGN KEY (продукт_id) REFERENCES product(id) ON DELETE CASCADE
    )`,

    // Таблица postavshik
    `CREATE TABLE IF NOT EXISTS postavshik (
        id INT AUTO_INCREMENT PRIMARY KEY,
        название VARCHAR(255) NOT NULL,
        рэйтинг DECIMAL(3,1),
        количество_заказов INT,
        количество_курьеров INT,
        год_основания INT,
        телефон VARCHAR(20),
        фото VARCHAR(255)
    )`,

    // Таблица otziv
    `CREATE TABLE IF NOT EXISTS otziv (
        id INT AUTO_INCREMENT PRIMARY KEY,
        рейтинг DECIMAL(3,1) NOT NULL,
        пользователь_id INT,
        продукт_id INT NOT NULL,
        комментарий TEXT,
        дата_создания DATE NOT NULL,
        фото VARCHAR(255),
        FOREIGN KEY (пользователь_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (продукт_id) REFERENCES product(id) ON DELETE CASCADE
    )`,

    // Таблица vopros
    `CREATE TABLE IF NOT EXISTS vopros (
        id INT AUTO_INCREMENT PRIMARY KEY,
        продукт_id INT NOT NULL,
        пользователь_id INT,
        вопрос TEXT NOT NULL,
        дата_создания DATE NOT NULL,
        ответ TEXT,
        FOREIGN KEY (пользователь_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (продукт_id) REFERENCES product(id) ON DELETE CASCADE
    )`,

    // Таблица contact
    `CREATE TABLE IF NOT EXISTS contact (
        id INT AUTO_INCREMENT PRIMARY KEY,
        имя VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        сообщение TEXT NOT NULL,
        выполнено ENUM('да', 'нет') DEFAULT 'нет',
        дата_создания DATE NOT NULL
    )`,

    // Таблица corzina
    `CREATE TABLE IF NOT EXISTS corzina (
        id INT AUTO_INCREMENT PRIMARY KEY,
        пользователь_id INT,
        продукт_id INT,
        количество INT NOT NULL,
        дата_создания DATE NOT NULL,
        цена DECIMAL(10,2) NOT NULL,
        поставщик_id INT,
        FOREIGN KEY (пользователь_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (продукт_id) REFERENCES product(id) ON DELETE CASCADE,
        FOREIGN KEY (поставщик_id) REFERENCES postavshik(id) ON DELETE CASCADE
    )`,

    // Таблица zakaz
    `CREATE TABLE IF NOT EXISTS zakaz (
        id INT AUTO_INCREMENT PRIMARY KEY,
        статус ENUM('не_оплачен', 'оплачен', 'в_доставке', 'доставлен', 'отменён') DEFAULT 'не_оплачен',
        дата_создания DATE NOT NULL,
        пользователь_id INT,
        итого DECIMAL(10,2) NOT NULL,
        дата_обновления DATE,
        адрес_доставки TEXT NOT NULL,
        способ_оплаты VARCHAR(255) NOT NULL,
        поставщик_id INT,
        дни_на_доставку INT,
        товары JSON,
        трэк_номер VARCHAR(255),
        FOREIGN KEY (пользователь_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (поставщик_id) REFERENCES postavshik(id) ON DELETE SET NULL
    )`,

    // Таблица izbran
    `CREATE TABLE IF NOT EXISTS izbran (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        название VARCHAR(255) NOT NULL,
        описание TEXT,
        цена DECIMAL(10,2) NOT NULL,
        запасы INT NOT NULL,
        категория VARCHAR(255),
        категория_id INT,
        дата_создания DATE NOT NULL,
        фото VARCHAR(255),
        рэйтинг DECIMAL(3,1) DEFAULT 0,
        отзывов INT DEFAULT 0,
        вопросов INT DEFAULT 0,
        пользователь_id INT,
        FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
        FOREIGN KEY (категория_id) REFERENCES category(id) ON DELETE SET NULL,
        FOREIGN KEY (пользователь_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    // Триггер update_product_rating_reviews
    `CREATE TRIGGER update_product_rating_reviews
    AFTER INSERT ON otziv
    FOR EACH ROW
    BEGIN
        UPDATE product
        SET рэйтинг = (
            SELECT AVG(рейтинг)
            FROM otziv
            WHERE продукт_id = NEW.продукт_id
        ),
        отзывов = (
            SELECT COUNT(*)
            FROM otziv
            WHERE продукт_id = NEW.продукт_id
        )
        WHERE id = NEW.продукт_id;
    END`
];

module.exports = createTableQueries;