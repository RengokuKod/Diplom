const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const seedDatabase = require('./seed');
const db = require('./db');
const app = express();
const PORT = process.env.PORT || 3000;
const createTableQueries = require('./migrate');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretKey = 'your_secret_key';
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);
const puppeteer = require('puppeteer');

// Get database name from db.js configuration
const DB_NAME = db.DB_NAME;
if (!DB_NAME) {
    console.error('Ошибка: Имя базы данных не указано в конфигурации db.js');
    process.exit(1);
}

app.use(cors());
app.use(bodyParser.json());

// Подключение к серверу базы данных
db.getConnection((err, connection) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err);
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

// Глобальная переменная для отслеживания прогресса скачивания изображений
let downloadStatus = {
    total: 0,
    completed: 0,
    errors: 0,
    active: false,
    message: ''
};

// Middleware для логирования запросов
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Middleware для обработки ошибок
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Ошибка:`, err.stack);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
});

// Эндпоинт для миграции
app.post('/api/migrate', (req, res) => {
    console.log('Начало миграции');
    db.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка подключения:', err);
            return res.status(500).json({ success: false, message: 'Ошибка подключения к базе данных' });
        }
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                console.error(`Ошибка выбора базы данных ${DB_NAME}:`, err);
                return res.status(500).json({ success: false, message: 'Ошибка выбора базы данных' });
            }

            let queryIndex = 0;
            const executeNextQuery = () => {
                if (queryIndex >= createTableQueries.length) {
                    connection.release();
                    console.log('Миграция успешно завершена');
                    return res.json({ success: true, message: 'Миграция выполнена' });
                }

                const query = createTableQueries[queryIndex];
                connection.query(query, (err) => {
                    if (err) {
                        connection.release();
                        console.error(`Ошибка миграции на запросе ${queryIndex + 1}:`, err);
                        return res.status(500).json({ success: false, message: `Ошибка миграции: ${err.message}` });
                    }
                    queryIndex++;
                    executeNextQuery();
                });
            };

            executeNextQuery();
        });
    });
});

// Эндпоинт для сидирования
app.post('/api/seed', (req, res) => {
    console.log('Начало сидирования');
    seedDatabase(db, (err) => {
        if (err) {
            console.error('Ошибка сидирования:', err);
            return res.status(500).json({ success: false, message: 'Ошибка сидирования базы данных' });
        }
        console.log('Сидирование успешно завершено');
        res.json({ success: true, message: 'Сидирование выполнено' });
    });
});

// Функция для скачивания изображения
async function downloadImage(url, filePath) {
    const response = await axios({
        method: 'get',
        url: url,
        responseType: 'arraybuffer'
    });
    await writeFile(filePath, response.data);
}

// Эндпоинт для инициации скачивания изображений
app.post('/api/download-images', async (req, res) => {
    if (downloadStatus.active) {
        return res.status(400).json({
            success: false,
            message: 'Скачивание уже выполняется'
        });
    }

    try {
        // Получаем все продукты из базы данных
        db.getConnection(async (err, connection) => {
            if (err) return res.status(500).json({
                success: false,
                message: 'Ошибка подключения к базе данных'
            });

            connection.query('USE ??', [DB_NAME], (err) => {
                if (err) {
                    connection.release();
                    return res.status(500).json({
                        success: false,
                        message: 'Ошибка переключения базы данных'
                    });
                }

                connection.query('SELECT id, название, категория FROM product', async (err, products) => {
                    if (err) {
                        connection.release();
                        return res.status(500).json({
                            success: false,
                            message: 'Ошибка получения списка продуктов'
                        });
                    }

                    connection.release();

                    // Инициализируем статус скачивания
                    downloadStatus = {
                        total: products.length * 5, // 5 изображений на каждый продукт
                        completed: 0,
                        errors: 0,
                        active: true,
                        message: 'Начато скачивание изображений'
                    };

                    // Отправляем ответ клиенту
                    res.json({
                        success: true,
                        message: 'Скачивание изображений начато',
                        total: downloadStatus.total
                    });

                    // Запускаем процесс скачивания в фоне
                    downloadImagesForProducts(products);
                });
            });
        });
    } catch (error) {
        console.error('Ошибка при инициации скачивания:', error);
        downloadStatus.active = false;
        res.status(500).json({
            success: false,
            message: 'Ошибка при запуске скачивания',
            error: error.message
        });
    }
});

// Функция для скачивания изображений для списка продуктов
async function downloadImagesForProducts(products) {
    const browser = await puppeteer.launch({ headless: true });

    for (const product of products) {
        try {
            // Создаем путь к папке продукта
            const productPath = path.join(__dirname, '../public/assets', product.категория, product.название);

            // Проверяем, существует ли папка
            try {
                await access(productPath);
                downloadStatus.message = `Пропускаем ${product.название} - папка уже существует`;
                downloadStatus.completed += 5; // Пропускаем 5 изображений
                continue;
            } catch (err) {
                // Папка не существует, создаем ее
                await mkdir(productPath, { recursive: true });
            }

            // Генерируем URL для DNS (примерный формат)
            const searchQuery = encodeURIComponent(product.название);
            const dnsUrl = `https://www.dns-shop.ru/search/?q=${searchQuery}&category=${product.категория}`;

            downloadStatus.message = `Обработка товара: ${product.название}`;

            // Используем Puppeteer для парсинга изображений
            const page = await browser.newPage();
            await page.goto(dnsUrl, { waitUntil: 'networkidle2', timeout: 30000 });

            // Получаем ссылки на изображения (примерный селектор)
            const imageUrls = await page.evaluate(() => {
                const images = Array.from(document.querySelectorAll('.product-card__image img'));
                return images.slice(0, 5).map(img => img.src.replace('/small/', '/big/'));
            });

            await page.close();

            // Скачиваем изображения
            for (let i = 0; i < imageUrls.length; i++) {
                try {
                    const imagePath = path.join(productPath, `${i+1}.jpg`);
                    await downloadImage(imageUrls[i], imagePath);
                    downloadStatus.completed++;
                    downloadStatus.message = `Скачано ${i+1}/5 изображений для ${product.название}`;
                } catch (err) {
                    console.error(`Ошибка при скачивании изображения ${i+1} для продукта ${product.название}:`, err);
                    downloadStatus.errors++;
                    downloadStatus.message = `Ошибка при скачивании изображения ${i+1} для ${product.название}`;
                }
            }

            // Обновляем путь к фото в базе данных
            db.getConnection((err, connection) => {
                if (err) return;

                connection.query('USE ??', [DB_NAME], (err) => {
                    if (err) {
                        connection.release();
                        return;
                    }

                    const newPhotoPath = `/assets/${product.категория}/${product.название}/1.jpg`;
                    connection.query('UPDATE product SET фото = ? WHERE id = ?', [newPhotoPath, product.id], (err) => {
                        connection.release();
                        if (err) {
                            console.error('Ошибка обновления фото продукта:', err);
                            downloadStatus.message = `Ошибка обновления БД для ${product.название}`;
                        }
                    });
                });
            });

        } catch (error) {
            console.error(`Ошибка при обработке продукта ${product.название}:`, error);
            downloadStatus.errors += 5;
            downloadStatus.message = `Ошибка обработки товара ${product.название}`;
        }
    }

    await browser.close();
    downloadStatus.active = false;
    downloadStatus.message = `Скачивание завершено. Успешно: ${downloadStatus.completed}, Ошибки: ${downloadStatus.errors}`;
    console.log('Скачивание изображений завершено. Итого:', downloadStatus);
}

// Эндпоинт для проверки прогресса скачивания
app.get('/api/download-progress', (req, res) => {
    res.json(downloadStatus);
});

// GET для users
app.get('/api/users', (req, res) => {
    db.getConnection((err, connection) => {
        if (err) return res.status(500).send('Ошибка подключения');
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                return res.status(500).send('Ошибка переключения');
            }
            const query = `
                SELECT id, 
                       имя_пользователя AS username, 
                       электронная_почта AS email, 
                       пароль AS password, 
                       роль AS role, 
                       дата_создания AS created_at, 
                       фото AS photo 
                FROM users`;
            connection.query(query, (err, results) => {
                connection.release();
                if (err) return res.status(500).send('Ошибка запроса');
                res.json(results);
            });
        });
    });
});

// GET для otzivs
app.get('/api/otzivs', (req, res) => {
    const { productId } = req.query;
    db.getConnection((err, connection) => {
        if (err) return res.status(500).send('Ошибка подключения');
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                return res.status(500).send('Ошибка переключения');
            }
            const query = `
                SELECT otziv.id, 
                       otziv.рейтинг AS rating, 
                       users.имя_пользователя AS username, 
                       product.название AS product_name, 
                       otziv.комментарий AS comment, 
                       otziv.дата_создания AS created_at, 
                       otziv.фото AS photo 
                FROM otziv
                LEFT JOIN users ON otziv.пользователь_id = users.id
                LEFT JOIN product ON otziv.продукт_id = product.id
                ${productId ? 'WHERE otziv.продукт_id = ?' : ''}`;
            connection.query(query, productId ? [productId] : [], (err, results) => {
                connection.release();
                if (err) return res.status(500).send('Ошибка запроса');
                res.json(results);
            });
        });
    });
});

// GET для categories
app.get('/api/categories', (req, res) => {
    db.getConnection((err, connection) => {
        if (err) return res.status(500).send('Ошибка подключения');
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                return res.status(500).send('Ошибка переключения');
            }
            const query = `
                SELECT id, 
                       название AS name, 
                       описание AS description, 
                       дата_создания AS created_at, 
                       создатель AS creator, 
                       количество_продуктов AS product_count, 
                       фото AS photo 
                FROM category`;
            connection.query(query, (err, results) => {
                connection.release();
                if (err) return res.status(500).send('Ошибка запроса');
                res.json(results);
            });
        });
    });
});

// GET для products
app.get('/api/products', (req, res) => {
    const { categoryName, sortBy, sortOrder, minPrice, maxPrice, minRating, maxRating } = req.query;

    db.getConnection((err, connection) => {
        if (err) return res.status(500).send('Ошибка подключения');
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                return res.status(500).send('Ошибка переключения');
            }

            let query = `
                SELECT 
                    product.id, 
                    product.название AS name, 
                    product.описание AS description, 
                    product.цена AS price, 
                    product.запасы AS stock, 
                    product.категория AS category, 
                    category.название AS category_name, 
                    product.дата_создания AS created_at, 
                    product.фото AS photo,
                    COALESCE(AVG(otziv.рейтинг), 0) AS rating,
                    COUNT(DISTINCT otziv.id) AS reviews,
                    COUNT(DISTINCT vopros.id) AS questions
                FROM product 
                LEFT JOIN category ON product.категория_id = category.id
                LEFT JOIN otziv ON product.id = otziv.продукт_id
                LEFT JOIN vopros ON product.id = vopros.продукт_id
                WHERE product.категория = ?`;

            const queryParams = [categoryName];

            if (minPrice) {
                query += ' AND product.цена >= ?';
                queryParams.push(minPrice);
            }
            if (maxPrice) {
                query += ' AND product.цена <= ?';
                queryParams.push(maxPrice);
            }
            if (minRating) {
                query += ' AND COALESCE(AVG(otziv.рейтинг), 0) >= ?';
                queryParams.push(minRating);
            }
            if (maxRating) {
                query += ' AND COALESCE(AVG(otziv.рейтинг), 0) <= ?';
                queryParams.push(maxRating);
            }

            query += ' GROUP BY product.id, product.название, product.описание, product.цена, product.запасы, product.категория, category.название, product.дата_создания, product.фото';

            if (sortBy) {
                const order = sortOrder === 'desc' ? 'DESC' : 'ASC';
                query += ` ORDER BY ${sortBy} ${order}`;
            }

            connection.query(query, queryParams, (err, results) => {
                connection.release();
                if (err) return res.status(500).send('Ошибка запроса: ' + err.message);
                res.json(results);
            });
        });
    });
});



// GET для поиска продуктов
app.get('/api/products/search', (req, res) => {
    const { query, categoryName } = req.query;

    console.log('Search request received:', { query, categoryName });

    if (!query) {
        return res.status(400).json({ message: 'Query parameter is required' });
    }

    db.getConnection((err, connection) => {
        if (err) return res.status(500).send('Ошибка подключения');
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                return res.status(500).send('Ошибка переключения');
            }

            const queryWords = query.toString().toLowerCase().split(/\s+/).filter(word => word.length > 0);
            let sqlQuery = `
                SELECT 
                    product.id, 
                    product.название AS name, 
                    product.описание AS description, 
                    product.цена AS price, 
                    product.запасы AS stock, 
                    product.категория AS category, 
                    category.название AS category_name, 
                    product.дата_создания AS created_at, 
                    product.фото AS photo,
                    COALESCE(AVG(otziv.рейтинг), 0) AS rating,
                    COUNT(DISTINCT otziv.id) AS reviews,
                    COUNT(DISTINCT vopros.id) AS questions
                FROM product 
                LEFT JOIN category ON product.категория_id = category.id
                LEFT JOIN otziv ON product.id = otziv.продукт_id
                LEFT JOIN vopros ON product.id = vopros.продукт_id
                WHERE 1=1
            `;
            const queryParams = [];

            queryWords.forEach(word => {
                sqlQuery += ' AND LOWER(product.название) LIKE ?';
                queryParams.push(`%${word}%`);
            });

            if (categoryName) {
                sqlQuery += ' AND product.категория = ?';
                queryParams.push(categoryName.toString());
            }

            sqlQuery += `
                GROUP BY product.id, product.название, product.описание, product.цена, product.запасы, product.категория, category.название, product.дата_создания, product.фото
                ORDER BY product.название
            `;

            connection.query(sqlQuery, queryParams, (err, results) => {
                connection.release();
                if (err) return res.status(500).send('Ошибка запроса: ' + err.message);
                console.log('Search results:', results);
                res.json(results);
            });
        });
    });
});

// GET для corzina
app.get('/api/corzina', (req, res) => {
    const { userId } = req.query;
    db.getConnection((err, connection) => {
        if (err) return res.status(500).send('Ошибка подключения');
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                return res.status(500).send('Ошибка переключения');
            }
            const query = `
                SELECT corzina.id, 
                       users.имя_пользователя AS username, 
                       product.название AS product_name, 
                       corzina.количество AS quantity, 
                       corzina.дата_создания AS created_at, 
                       corzina.цена AS price, 
                       postavshik.название AS supplier_name,
                       corzina.продукт_id AS productId,
                       product.фото AS photo, -- Убедимся, что возвращается относительный путь
                       (SELECT GROUP_CONCAT(название) FROM postavshik) AS suppliers_list
                FROM corzina
                LEFT JOIN users ON corzina.пользователь_id = users.id
                LEFT JOIN product ON corzina.продукт_id = product.id
                LEFT JOIN postavshik ON corzina.поставщик_id = postavshik.id
                WHERE corzina.пользователь_id = ?`;
            connection.query(query, [userId], (err, results) => {
                connection.release();
                if (err) return res.status(500).send('Ошибка запроса');
                res.json(results);
            });
        });
    });
});

// GET для izbran
app.get('/api/izbran', (req, res) => {
    const { userId } = req.query;
    db.getConnection((err, connection) => {
        if (err) return res.status(500).send('Ошибка подключения');
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                return res.status(500).send('Ошибка переключения');
            }
            const query = `
                SELECT 
                    izbran.id, 
                    izbran.product_id AS productId, 
                    izbran.название AS name, 
                    izbran.описание AS description, 
                    izbran.цена AS price, 
                    izbran.запасы AS stock, 
                    izbran.категория AS category, 
                    category.название AS category_name, 
                    izbran.дата_создания AS created_at, 
                    izbran.фото AS photo, 
                    COALESCE(AVG(otziv.рейтинг), 0) AS rating,
                    COUNT(DISTINCT otziv.id) AS reviews,
                    COUNT(DISTINCT vopros.id) AS questions,
                    users.имя_пользователя AS username 
                FROM izbran
                LEFT JOIN category ON izbran.категория_id = category.id
                LEFT JOIN otziv ON izbran.product_id = otziv.продукт_id
                LEFT JOIN vopros ON izbran.product_id = vopros.продукт_id
                LEFT JOIN users ON izbran.пользователь_id = users.id
                WHERE izbran.пользователь_id = ?
                GROUP BY izbran.id, izbran.product_id, izbran.название, izbran.описание, izbran.цена, izbran.запасы,
                         izbran.категория, category.название, izbran.дата_создания, izbran.фото, users.имя_пользователя`;
            connection.query(query, [userId], (err, results) => {
                connection.release();
                if (err) return res.status(500).send('Ошибка запроса: ' + err.message);
                res.json(results);
            });
        });
    });
});

// GET для vopros
app.get('/api/vopros', (req, res) => {
    const { productId } = req.query;
    db.getConnection((err, connection) => {
        if (err) return res.status(500).send('Ошибка подключения');
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                return res.status(500).send('Ошибка переключения');
            }
            const query = `
                SELECT vopros.id, 
                       product.название AS product_name, 
                       users.имя_пользователя AS username, 
                       vopros.вопрос AS question, 
                       vopros.дата_создания AS created_at, 
                       vopros.ответ AS answer 
                FROM vopros
                LEFT JOIN product ON vopros.продукт_id = product.id
                LEFT JOIN users ON vopros.пользователь_id = users.id
                ${productId ? 'WHERE vopros.продукт_id = ?' : ''}`;
            connection.query(query, productId ? [productId] : [], (err, results) => {
                connection.release();
                if (err) return res.status(500).send('Ошибка запроса');
                res.json(results);
            });
        });
    });
});

// GET для заказов
app.get('/api/zakaz', (req, res) => {
    const userId = req.query.userId;

    console.log(`[${new Date().toISOString()}] Запрос GET /api/zakaz с userId=${userId}`);

    db.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка подключения к базе данных:', err);
            return res.status(500).json({ error: 'Ошибка подключения к базе данных' });
        }

        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                console.error(`Ошибка выбора базы данных ${DB_NAME}:`, err);
                return res.status(500).json({ error: 'Ошибка выбора базы данных' });
            }

            let sqlQuery = `
                SELECT 
                    zakaz.id,
                    zakaz.статус,
                    zakaz.дата_создания,
                    zakaz.пользователь_id,
                    zakaz.итого,
                    zakaz.дата_обновления,
                    zakaz.адрес_доставки,
                    zakaz.способ_оплаты,
                    zakaz.поставщик_id,
                    zakaz.дни_на_доставку,
                    IFNULL(zakaz.товары, '[]') AS товары, -- Используем IFNULL для безопасной обработки JSON
                    zakaz.трэк_номер,
                    COALESCE(users.имя_пользователя, 'Удалён') AS пользователь_имя,
                    postavshik.название AS поставщик
                FROM zakaz
                LEFT JOIN users ON zakaz.пользователь_id = users.id
                LEFT JOIN postavshik ON zakaz.поставщик_id = postavshik.id
            `;
            const queryParams = [];

            if (userId) {
                sqlQuery += ' WHERE zakaz.пользователь_id = ?';
                queryParams.push(userId);
            }

            console.log('SQL запрос:', sqlQuery);
            console.log('Параметры:', queryParams);

            connection.query(sqlQuery, queryParams, (err, results) => {
                connection.release();
                if (err) {
                    console.error('Ошибка выполнения запроса:', err);
                    return res.status(400).json({ error: `Ошибка запроса: ${err.message}` });
                }

                // Преобразуем поле товары из строки JSON в объект, если оно не null
                const processedResults = results.map(row => ({
                    ...row,
                    товары: row.товары ? JSON.parse(row.товары) : []
                }));

                console.log('Результаты запроса:', processedResults);
                res.json(processedResults);
            });
        });
    });
});

// GET для postavshik
app.get('/api/postavshik', (req, res) => {
    db.getConnection((err, connection) => {
        if (err) return res.status(500).send('Ошибка подключения');
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                return res.status(500).send('Ошибка переключения');
            }
            const query = `
                SELECT id, 
                       название AS name, 
                       рэйтинг AS rating, 
                       количество_заказов AS order_count, 
                       количество_курьеров AS courier_count, 
                       год_основания AS founded_year, 
                       телефон AS phone, 
                       фото AS photo 
                FROM postavshik`;
            connection.query(query, (err, results) => {
                connection.release();
                if (err) return res.status(500).send('Ошибка запроса');
                res.json(results);
            });
        });
    });
});

// GET для opisanie
app.get('/api/opisanie', (req, res) => {
    const { productId } = req.query;
    db.getConnection((err, connection) => {
        if (err) return res.status(500).send('Ошибка подключения');
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                return res.status(500).send('Ошибка переключения');
            }
            const query = `
                SELECT id, 
                       продукт_id AS product_id, 
                       бренд AS brand, 
                       модель AS model, 
                       вес AS weight, 
                       размеры AS dimensions, 
                       мощность AS power, 
                       скорость AS speed, 
                       совместимость AS compatibility, 
                       гарантия AS warranty,
                       фото_папка AS photo_folder -- Переименовываем для ясности, возвращаем как относительный путь
                FROM opisanie 
                ${productId ? 'WHERE продукт_id = ?' : ''}`;
            connection.query(query, productId ? [productId] : [], (err, results) => {
                connection.release();
                if (err) return res.status(500).send('Ошибка запроса');
                res.json(results);
            });
        });
    });
});

// Эндпоинт для экспорта в Excel
app.get('/api/export-excel', (req, res) => {
    db.getConnection((err, connection) => {
        if (err) return res.status(500).send('Ошибка подключения');
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                return res.status(500).send('Ошибка переключения');
            }

            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Your App';
            workbook.created = new Date();

            const tables = [
                {
                    name: 'users',
                    query: `
                        SELECT id, имя_пользователя AS username, электронная_почта AS email, пароль AS password, роль AS role, дата_создания AS created_at, фото AS photo 
                        FROM users`
                },
                {
                    name: 'otziv',
                    query: `
                        SELECT otziv.id, otziv.рейтинг AS rating, users.имя_пользователя AS username, product.название AS product_name, otziv.комментарий AS comment, otziv.дата_создания AS created_at, otziv.фото AS photo 
                        FROM otziv
                        LEFT JOIN users ON otziv.пользователь_id = users.id
                        LEFT JOIN product ON otziv.продукт_id = product.id`
                },
                {
                    name: 'category',
                    query: `
                        SELECT id, название AS name, описание AS description, дата_создания AS created_at, создатель AS creator, количество_продуктов AS product_count, фото AS photo 
                        FROM category`
                },
                {
                    name: 'product',
                    query: `
                        SELECT product.id, product.название AS name, product.описание AS description, product.цена AS price, product.запасы AS stock, product.категория AS category, category.название AS category_name, product.дата_создания AS created_at, product.фото AS photo 
                        FROM product 
                        LEFT JOIN category ON product.категория_id = category.id`
                },
                {
                    name: 'corzina',
                    query: `
                        SELECT corzina.id, users.имя_пользователя AS username, product.название AS product_name, corzina.количество AS quantity, corzina.дата_создания AS created_at, corzina.цена AS price, postavshik.название AS supplier_name 
                        FROM corzina
                        LEFT JOIN users ON corzina.пользователь_id = users.id
                        LEFT JOIN product ON corzina.продукт_id = product.id
                        LEFT JOIN postavshik ON corzina.поставщик_id = postavshik.id`
                },
                {
                    name: 'izbran',
                    query: `
                        SELECT izbran.id, izbran.product_id AS productId, izbran.название AS name, izbran.описание AS description, izbran.цена AS price, izbran.запасы AS stock, izbran.категория AS category, category.название AS category_name, izbran.дата_создания AS created_at, izbran.фото AS photo, users.имя_пользователя AS username 
                        FROM izbran
                        LEFT JOIN category ON izbran.категория_id = category.id
                        LEFT JOIN users ON izbran.пользователь_id = users.id`
                },
                {
                    name: 'vopros',
                    query: `
                        SELECT vopros.id, product.название AS product_name, users.имя_пользователя AS username, vopros.вопрос AS question, vopros.дата_создания AS created_at, vopros.ответ AS answer 
                        FROM vopros
                        LEFT JOIN product ON vopros.продукт_id = product.id
                        LEFT JOIN users ON vopros.пользователь_id = users.id`
                },
                {
                    name: 'zakaz',
                    query: `
                        SELECT zakaz.id, zakaz.статус AS status, zakaz.дата_создания AS created_at, users.имя_пользователя AS username, zakaz.итого AS total, zakaz.дата_обновления AS updated_at, zakaz.адрес_доставки AS delivery_address, zakaz.способ_оплаты AS payment_method, postavshik.название AS supplier_name, zakaz.дни_на_доставку AS delivery_days, zakaz.товары AS items, zakaz.трэк_номер AS tracking_number 
                        FROM zakaz
                        LEFT JOIN users ON zakaz.пользователь_id = users.id
                        LEFT JOIN postavshik ON zakaz.поставщик_id = postavshik.id`
                },
                {
                    name: 'postavshik',
                    query: `
                        SELECT id, название AS name, рэйтинг AS rating, количество_заказов AS order_count, количество_курьеров AS courier_count, год_основания AS founded_year, телефон AS phone, фото AS photo 
                        FROM postavshik`
                },
                {
                    name: 'opisanie',
                    query: `
                        SELECT id, продукт_id AS product_id, бренд AS brand, модель AS model, вес AS weight, размеры AS dimensions, мощность AS power, скорость AS speed, совместимость AS compatibility, гарантия AS warranty 
                        FROM opisanie`
                }
            ];

            const queryPromise = (query) => {
                return new Promise((resolve, reject) => {
                    connection.query(query, (err, results) => {
                        if (err) reject(err);
                        else resolve(results);
                    });
                });
            };

            Promise.all(tables.map(table => queryPromise(table.query)))
                .then(results => {
                    results.forEach((data, index) => {
                        const table = tables[index];
                        const worksheet = workbook.addWorksheet(table.name);

                        if (data.length > 0) {
                            const columns = Object.keys(data[0]).map(key => ({
                                header: key,
                                key,
                                width: 20
                            }));
                            worksheet.columns = columns;
                            worksheet.addRows(data);
                            worksheet.getRow(1).font = { bold: true };
                            worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
                        } else {
                            worksheet.addRow(['Нет данных']);
                        }
                    });

                    const exportPath = path.join(__dirname, '../src/app/export_excel', `database_export_${Date.now()}.xlsx`);
                    return workbook.xlsx.writeFile(exportPath);
                })
                .then(() => {
                    connection.release();
                    console.log('Excel-файл успешно создан');
                    res.json({ message: 'Данные экспортированы в Excel' });
                })
                .catch(error => {
                    connection.release();
                    console.error('Ошибка при экспорте:', error);
                    res.status(500).send('Ошибка при экспорте данных: ' + error.message);
                });
        });
    });
});

// GET для получения продуктов со скидкой
app.get('/api/products/discounted', (req, res) => {
    db.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка подключения:', err);
            return res.status(500).json({ success: false, message: 'Ошибка подключения к базе данных' });
        }
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                console.error(`Ошибка выбора базы данных ${DB_NAME}:`, err);
                return res.status(500).json({ success: false, message: 'Ошибка выбора базы данных' });
            }

            const query = `
                SELECT 
                    product.id, 
                    product.название AS name, 
                    product.описание AS description, 
                    product.цена AS price, 
                    product.запасы AS stock, 
                    product.категория AS category, 
                    category.название AS category_name,
                    product.дата_создания AS created_at, 
                    product.фото AS photo, 
                    COALESCE(AVG(otziv.рейтинг), 0) AS rating, 
                    COUNT(DISTINCT otziv.id) AS reviews, 
                    COUNT(DISTINCT vopros.id) AS questions,
                    (product.цена * 1.2) AS oldPrice
                FROM product 
                LEFT JOIN category ON product.категория_id = category.id
                LEFT JOIN otziv ON product.id = otziv.продукт_id
                LEFT JOIN vopros ON product.id = vopros.продукт_id
                WHERE product.цена < 10000
                GROUP BY 
                    product.id, 
                    product.название, 
                    product.описание, 
                    product.цена, 
                    product.запасы, 
                    product.категория, 
                    category.название,
                    product.дата_создания, 
                    product.фото
                ORDER BY product.цена ASC
                LIMIT 10
            `;
            connection.query(query, (err, results) => {
                connection.release();
                if (err) {
                    console.error('Ошибка запроса:', err);
                    return res.status(500).json({ success: false, message: 'Ошибка запроса: ' + err.message });
                }
                console.log('Discounted products:', results);
                res.json({ data: results });
            });
        });
    });
});

// GET для получения топ-рейтинговых продуктов (для карусели на главной странице)
app.get('/api/products/top-rated', (req, res) => {
    db.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка подключения:', err);
            return res.status(500).json({ success: false, message: 'Ошибка подключения к базе данных' });
        }
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                console.error(`Ошибка выбора базы данных ${DB_NAME}:`, err);
                return res.status(500).json({ success: false, message: 'Ошибка выбора базы данных' });
            }

            const query = `
                SELECT 
                    product.id, 
                    product.название AS name, 
                    product.описание AS description, 
                    product.цена AS price, 
                    product.запасы AS stock, 
                    product.категория AS category, 
                    category.название AS category_name,
                    product.дата_создания AS created_at, 
                    product.фото AS photo, 
                    COALESCE(AVG(otziv.рейтинг), 0) AS rating, 
                    COUNT(DISTINCT otziv.id) AS reviews, 
                    COUNT(DISTINCT vopros.id) AS questions
                FROM product 
                LEFT JOIN category ON product.категория_id = category.id
                LEFT JOIN otziv ON product.id = otziv.продукт_id
                LEFT JOIN vopros ON product.id = vopros.продукт_id
                GROUP BY 
                    product.id, 
                    product.название, 
                    product.описание, 
                    product.цена, 
                    product.запасы, 
                    product.категория, 
                    category.название,
                    product.дата_создания, 
                    product.фото
                HAVING rating >= 4
                ORDER BY rating DESC
                LIMIT 10
            `;
            connection.query(query, (err, results) => {
                connection.release();
                if (err) {
                    console.error('Ошибка запроса:', err);
                    return res.status(500).json({ success: false, message: 'Ошибка запроса: ' + err.message });
                }
                console.log('Top-rated products:', results);
                res.json({ data: results });
            });
        });
    });
});


// GET для получения продукта по ID
app.get('/api/products/:id', (req, res) => {
    const { id } = req.params;

    db.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка подключения:', err);
            return res.status(500).json({ success: false, message: 'Ошибка подключения к базе данных' });
        }
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                console.error(`Ошибка выбора базы данных ${DB_NAME}:`, err);
                return res.status(500).json({ success: false, message: 'Ошибка выбора базы данных' });
            }

            const query = `
                SELECT 
                    product.id, 
                    product.название AS name, 
                    product.описание AS description, 
                    product.цена AS price, 
                    product.запасы AS stock, 
                    product.категория AS category, 
                    category.название AS category_name, 
                    product.дата_создания AS created_at, 
                    product.фото AS photo,
                    COALESCE(AVG(otziv.рейтинг), 0) AS rating,
                    COUNT(DISTINCT otziv.id) AS reviews,
                    COUNT(DISTINCT vopros.id) AS questions
                FROM product 
                LEFT JOIN category ON product.категория_id = category.id
                LEFT JOIN otziv ON product.id = otziv.продукт_id
                LEFT JOIN vopros ON product.id = vopros.продукт_id
                WHERE product.id = ?
                GROUP BY product.id, product.название, product.описание, product.цена, product.запасы, product.категория, category.название, product.дата_создания, product.фото`;

            connection.query(query, [id], (err, results) => {
                connection.release();
                if (err) {
                    console.error('Ошибка запроса:', err);
                    return res.status(500).json({ success: false, message: 'Ошибка запроса: ' + err.message });
                }
                if (results.length === 0) {
                    console.log(`Продукт с id ${id} не найден`);
                    return res.status(404).json({ success: false, message: `Продукт с id ${id} не найден` });
                }
                console.log(`Продукт с id ${id} найден:`, results[0]);
                res.json(results[0]);
            });
        });
    });
});

// POST для добавления в корзину
app.post('/api/corzina', (req, res) => {
    let { userId, productId, quantity, price, supplierId } = req.body; // Используем let для изменения supplierId
    console.log('Запрос на добавление в корзину:', { userId, productId, quantity, price, supplierId });
    if (!userId || !productId || !quantity || !price) {
        console.error('Ошибка: Не указаны обязательные поля');
        return res.status(400).json({ success: false, message: 'Не указаны userId, productId, quantity или price' });
    }
    db.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка подключения к базе данных:', err);
            return res.status(500).json({ success: false, message: 'Ошибка подключения к базе данных' });
        }
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                console.error(`Ошибка выбора базы данных ${DB_NAME}:`, err);
                return res.status(500).json({ success: false, message: 'Ошибка выбора базы данных' });
            }
            // Проверка существования пользователя
            connection.query('SELECT id FROM users WHERE id = ?', [userId], (err, userResults) => {
                if (err || userResults.length === 0) {
                    connection.release();
                    console.error('Пользователь не существует:', { userId, err });
                    return res.status(400).json({ success: false, message: `Пользователь с ID ${userId} не существует` });
                }
                // Проверка существования продукта
                connection.query('SELECT id, цена FROM product WHERE id = ?', [productId], (err, productResults) => {
                    if (err || productResults.length === 0) {
                        connection.release();
                        console.error('Продукт не существует:', { productId, err });
                        return res.status(400).json({ success: false, message: `Продукт с ID ${productId} не существует` });
                    }
                    // Проверка существования поставщика (если указан)
                    const proceedWithCart = () => {
                        const checkQuery = `
                            SELECT * FROM corzina
                            WHERE пользователь_id = ? AND продукт_id = ?`;
                        connection.query(checkQuery, [userId, productId], (err, results) => {
                            if (err) {
                                connection.release();
                                console.error('Ошибка проверки корзины:', err);
                                return res.status(500).json({ success: false, message: 'Ошибка проверки корзины: ' + err.message });
                            }
                            if (results.length > 0) {
                                const updateQuery = `
                                    UPDATE corzina
                                    SET количество = количество + ?, 
                                        цена = цена + ?, 
                                        поставщик_id = ?
                                    WHERE пользователь_id = ? AND продукт_id = ?`;
                                connection.query(updateQuery, [quantity, price * quantity, supplierId, userId, productId], (err) => {
                                    if (err) {
                                        connection.release();
                                        console.error('Ошибка обновления корзины:', err);
                                        return res.status(500).json({ success: false, message: 'Ошибка обновления корзины: ' + err.message });
                                    }
                                    // Возвращаем актуальное состояние корзины
                                    connection.query('SELECT * FROM corzina WHERE пользователь_id = ?', [userId], (err, corzinaResults) => {
                                        connection.release();
                                        if (err) {
                                            console.error('Ошибка получения корзины:', err);
                                            return res.status(500).json({ success: false, message: 'Ошибка получения корзины: ' + err.message });
                                        }
                                        console.log('Корзина обновлена для userId:', userId);
                                        res.json({ success: true, corzina: corzinaResults });
                                    });
                                });
                            } else {
                                const insertQuery = `
                                    INSERT INTO corzina (пользователь_id, продукт_id, количество, дата_создания, цена, поставщик_id)
                                    VALUES (?, ?, ?, NOW(), ?, ?)`;
                                connection.query(insertQuery, [userId, productId, quantity, price * quantity, supplierId], (err) => {
                                    if (err) {
                                        connection.release();
                                        console.error('Ошибка добавления в корзину:', err);
                                        return res.status(500).json({ success: false, message: 'Ошибка добавления в корзину: ' + err.message });
                                    }
                                    // Возвращаем актуальное состояние корзины
                                    connection.query('SELECT * FROM corzina WHERE пользователь_id = ?', [userId], (err, corzinaResults) => {
                                        connection.release();
                                        if (err) {
                                            console.error('Ошибка получения корзины:', err);
                                            return res.status(500).json({ success: false, message: 'Ошибка получения корзины: ' + err.message });
                                        }
                                        console.log('Товар добавлен в корзину для userId:', userId);
                                        res.json({ success: true, corzina: corzinaResults });
                                    });
                                });
                            }
                        });
                    };

                    if (supplierId) {
                        connection.query('SELECT id FROM postavshik WHERE id = ?', [supplierId], (err, supplierResults) => {
                            if (err || supplierResults.length === 0) {
                                console.warn('Поставщик не существует, устанавливаем поставщик_id = NULL:', { supplierId, err });
                                supplierId = null; // Явно устанавливаем supplierId в null
                            }
                            proceedWithCart();
                        });
                    } else {
                        supplierId = null; // Устанавливаем null, если supplierId не указан
                        proceedWithCart();
                    }
                });
            });
        });
    });
});

// Начало запроса
app.post('/api/zakaz', (req, res) => {
    const { userId, total, supplierId, delivery_address = 'Не указан', payment_method = 'Наличные', items } = req.body;

    if (!userId || !total || !supplierId || !items || !Array.isArray(items)) {
        console.error('Ошибка: Отсутствуют обязательные поля', { userId, total, supplierId, items });
        return res.status(400).json({ success: false, message: 'Не указаны userId, total, supplierId или items' });
    }

    if (isNaN(total) || total <= 0) {
        console.error('Ошибка: Некорректная сумма заказа', { total });
        return res.status(400).json({ success: false, message: 'Сумма заказа должна быть положительным числом' });
    }

    db.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка подключения к базе данных:', err);
            return res.status(500).json({ success: false, message: 'Ошибка подключения к базе данных' });
        }

        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                console.error(`Ошибка выбора базы данных ${DB_NAME}:`, err);
                return res.status(500).json({ success: false, message: 'Ошибка выбора базы данных' });
            }

            // Проверка существования пользователя
            connection.query('SELECT id FROM users WHERE id = ?', [userId], (err, userResults) => {
                if (err || userResults.length === 0) {
                    connection.release();
                    console.error('Ошибка: Пользователь не найден', { userId, err });
                    return res.status(400).json({ success: false, message: `Пользователь с ID ${userId} не найден` });
                }

                // Проверка существования поставщика
                connection.query('SELECT id FROM postavshik WHERE id = ?', [supplierId], (err, supplierResults) => {
                    if (err || supplierResults.length === 0) {
                        connection.release();
                        console.error('Ошибка: Поставщик не найден', { supplierId, err });
                        return res.status(400).json({ success: false, message: `Поставщик с ID ${supplierId} не найден` });
                    }

                    connection.beginTransaction((err) => {
                        if (err) {
                            connection.release();
                            console.error('Ошибка начала транзакции:', err);
                            return res.status(500).json({ success: false, message: 'Ошибка начала транзакции' });
                        }

                        // Получение элементов корзины для проверки
                        const getCartItemsQuery = `
                            SELECT id, продукт_id, количество, цена
                            FROM corzina
                            WHERE пользователь_id = ?
                        `;
                        connection.query(getCartItemsQuery, [userId], (err, cartItems) => {
                            if (err) {
                                connection.rollback(() => {
                                    connection.release();
                                    console.error('Ошибка при получении корзины:', err);
                                    return res.status(500).json({ success: false, message: `Ошибка при получении корзины: ${err.message}` });
                                });
                                return;
                            }

                            if (cartItems.length === 0) {
                                connection.rollback(() => {
                                    connection.release();
                                    console.error('Ошибка: Корзина пуста', { userId });
                                    return res.status(400).json({ success: false, message: 'Корзина пуста' });
                                });
                                return;
                            }

                            // Проверка продуктов в корзине
                            const productIds = cartItems.map(item => item.продукт_id);
                            connection.query('SELECT id FROM product WHERE id IN (?)', [productIds], (err, productResults) => {
                                if (err || productResults.length !== productIds.length) {
                                    connection.rollback(() => {
                                        connection.release();
                                        console.error('Ошибка: Некоторые продукты не найдены', { productIds, err });
                                        return res.status(400).json({ success: false, message: 'Некоторые продукты в корзине не найдены' });
                                    });
                                    return;
                                }

                                // Вставка заказа с товарами в JSON
                                const insertOrderQuery = `
                                    INSERT INTO zakaz (пользователь_id, итого, статус, поставщик_id, дата_создания, дата_обновления, адрес_доставки, способ_оплаты, товары)
                                    VALUES (?, ?, 'не_оплачен', ?, CURDATE(), CURDATE(), ?, ?, ?)
                                `;
                                const goods = JSON.stringify(items); // Сохраняем товары как JSON
                                connection.query(insertOrderQuery, [userId, total, supplierId, delivery_address, payment_method, goods], (err, result) => {
                                    if (err) {
                                        connection.rollback(() => {
                                            connection.release();
                                            console.error('Ошибка при создании заказа:', err);
                                            return res.status(500).json({ success: false, message: `Ошибка при создании заказа: ${err.message}` });
                                        });
                                        return;
                                    }

                                    const orderId = result.insertId;

                                    // Очистка корзины
                                    const deleteCartQuery = `
                                        DELETE FROM corzina
                                        WHERE пользователь_id = ?
                                    `;
                                    connection.query(deleteCartQuery, [userId], (err) => {
                                        if (err) {
                                            connection.rollback(() => {
                                                connection.release();
                                                console.error('Ошибка при очистке корзины:', err);
                                                return res.status(500).json({ success: false, message: `Ошибка при очистке корзины: ${err.message}` });
                                            });
                                            return;
                                        }

                                        connection.commit((err) => {
                                            if (err) {
                                                connection.rollback(() => {
                                                    connection.release();
                                                    console.error('Ошибка фиксации транзакции:', err);
                                                    return res.status(500).json({ success: false, message: `Ошибка фиксации транзакции: ${err.message}` });
                                                });
                                                return;
                                            }

                                            connection.release();
                                            console.log('Заказ успешно создан', { orderId, userId });
                                            res.json({ success: true, orderId, message: 'Заказ успешно создан' });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});
// Конец запроса

// POST для добавления в избранное
app.post('/api/izbran', (req, res) => {
    const { userId, productId } = req.body;
    console.log('Запрос на добавление в избранное:', { userId, productId });
    if (!userId || !productId) {
        console.error('Ошибка: Не указан userId или productId');
        return res.status(400).json({ success: false, message: 'Не указан userId или productId' });
    }
    db.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка подключения к базе данных:', err);
            return res.status(500).json({ success: false, message: 'Ошибка подключения к базе данных' });
        }
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                console.error(`Ошибка выбора базы данных ${DB_NAME}:`, err);
                return res.status(500).json({ success: false, message: 'ERROR_DB_SELECTION' });
            }
            connection.query(
                'SELECT id FROM izbran WHERE пользователь_id = ? AND product_id = ?',
                [userId, productId],
                (err, results) => {
                    if (err) {
                        connection.release();
                        console.error('Ошибка проверки избранного:', err);
                        return res.status(500).json({ success: false, message: 'Ошибка проверки избранного: ' + err.message });
                    }
                    if (results.length > 0) {
                        connection.release();
                        console.log('Товар уже в избранном для userId:', userId);
                        return res.status(409).json({ success: false, message: 'Товар уже в избранном' });
                    }
                    const query = `
                        INSERT INTO izbran (product_id, название, описание, цена, запасы, категория, категория_id, дата_создания, фото, рэйтинг, отзывов, вопросов, пользователь_id)
                        SELECT ?, название, описание, цена, запасы, категория, категория_id, NOW(), фото, COALESCE(рэйтинг, 0), COALESCE(отзывов, 0), COALESCE(вопросов, 0), ?
                        FROM product
                        WHERE id = ?`;
                    connection.query(query, [productId, userId, productId], (err, result) => {
                        if (err) {
                            connection.release();
                            console.error('Ошибка добавления в избранное:', err);
                            return res.status(500).json({ success: false, message: 'Ошибка добавления в избранное: ' + err.message });
                        }
                        // Возвращаем актуальное состояние избранного
                        connection.query('SELECT * FROM izbran WHERE пользователь_id = ?', [userId], (err, izbranResults) => {
                            connection.release();
                            if (err) {
                                console.error('Ошибка получения избранного:', err);
                                return res.status(500).json({ success: false, message: 'Ошибка получения избранного: ' + err.message });
                            }
                            console.log('Товар успешно добавлен в избранное для userId:', userId);
                            res.json({ success: true, izbrans: izbranResults });
                        });
                    });
                }
            );
        });
    });
});

// DELETE для заказа
app.delete('/api/zakaz/:id', (req, res) => {
    const { id } = req.params;
    const userId = req.query.userId;

    if (!userId) {
        console.error('Ошибка: Не указан userId');
        return res.status(400).json({ success: false, message: 'Не указан userId' });
    }

    db.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка подключения к базе данных:', err);
            return res.status(500).json({ success: false, message: 'Ошибка подключения к базе данных' });
        }

        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                console.error(`Ошибка выбора базы данных ${DB_NAME}:`, err);
                return res.status(500).json({ success: false, message: 'Ошибка выбора базы данных' });
            }

            // Проверяем, существует ли заказ и принадлежит ли он пользователю
            connection.query('SELECT id FROM zakaz WHERE id = ? AND пользователь_id = ?', [id, userId], (err, results) => {
                if (err) {
                    connection.release();
                    console.error('Ошибка проверки заказа:', err);
                    return res.status(500).json({ success: false, message: 'Ошибка проверки заказа' });
                }

                if (results.length === 0) {
                    connection.release();
                    console.error(`Заказ с id ${id} не найден для userId ${userId}`);
                    return res.status(404).json({ success: false, message: 'Заказ не найден или не принадлежит пользователю' });
                }

                // Удаляем заказ
                connection.query('DELETE FROM zakaz WHERE id = ?', [id], (err) => {
                    if (err) {
                        connection.release();
                        console.error('Ошибка удаления заказа:', err);
                        return res.status(500).json({ success: false, message: 'Ошибка удаления заказа' });
                    }

                    connection.release();
                    console.log(`Заказ с id ${id} успешно удален для userId ${userId}`);
                    res.json({ success: true, message: 'Заказ успешно удален' });
                });
            });
        });
    });
});

// DELETE для избранного
app.delete('/api/izbran/:productId', (req, res) => {
    const { productId } = req.params;
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).send('Не указан userId');
    }
    db.getConnection((err, connection) => {
        if (err) return res.status(500).send('Ошибка подключения');
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                return res.status(500).send('Ошибка переключения');
            }
            const query = 'DELETE FROM izbran WHERE product_id = ? AND пользователь_id = ?';
            connection.query(query, [productId, userId], (err) => {
                if (err) {
                    connection.release();
                    return res.status(500).send('Ошибка удаления: ' + err.message);
                }
                // Возвращаем актуальное состояние избранного
                connection.query('SELECT * FROM izbran WHERE пользователь_id = ?', [userId], (err, izbranResults) => {
                    connection.release();
                    if (err) return res.status(500).send('Ошибка получения избранного');
                    res.json({ success: true, izbrans: izbranResults });
                });
            });
        });
    });
});

// DELETE для корзины
app.delete('/api/corzina/:id', (req, res) => {
    const { id } = req.params;
    db.getConnection((err, connection) => {
        if (err) return res.status(500).send('Ошибка подключения');
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                return res.status(500).send('Ошибка переключения');
            }
            // Получаем productId перед удалением
            connection.query('SELECT продукт_id AS productId, пользователь_id AS userId FROM corzina WHERE id = ?', [id], (err, result) => {
                if (err || result.length === 0) {
                    connection.release();
                    return res.status(404).send('Элемент корзины не найден');
                }
                const productId = result[0].productId;
                const userId = result[0].userId;
                connection.query('DELETE FROM corzina WHERE id = ?', [id], (err) => {
                    if (err) {
                        connection.release();
                        return res.status(500).send('Ошибка удаления');
                    }
                    // Возвращаем актуальное состояние корзины
                    connection.query('SELECT * FROM corzina WHERE пользователь_id = ?', [userId], (err, corzinaResults) => {
                        connection.release();
                        if (err) return res.status(500).send('Ошибка получения корзины');
                        res.json({ success: true, corzina: corzinaResults });
                    });
                });
            });
        });
    });
});

// PUT для corzina
app.put('/api/corzina/:id', (req, res) => {
    const { id } = req.params;
    const { quantity, supplierId } = req.body;
    db.getConnection((err, connection) => {
        if (err) return res.status(500).send('Ошибка подключения');
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                return res.status(500).send('Ошибка переключения');
            }
            connection.query(`
                UPDATE corzina 
                SET количество = ?, 
                    поставщик_id = ?, 
                    цена = (SELECT цена FROM product WHERE id = corzina.продукт_id) * ?
                WHERE id = ?`, [quantity, supplierId, quantity, id], (err) => {
                connection.release();
                if (err) return res.status(500).send('Ошибка обновления');
                res.json({ success: true });
            });
        });
    });
});

// Роут для регистрации пользователя
app.post('/api/register', async (req, res) => {
    db.getConnection(async (err, connection) => {
        if (err) {
            console.error('Ошибка подключения:', err);
            return res.status(500).json({ success: false, message: 'Ошибка подключения к базе данных' });
        }
        connection.query('USE ??', [DB_NAME], async (err) => {
            if (err) {
                connection.release();
                console.error(`Ошибка выбора базы данных ${DB_NAME}:`, err);
                return res.status(500).json({ success: false, message: 'Ошибка выбора базы данных' });
            }

            const { имя_пользователя, электронная_почта, пароль, роль = 'user', дата_создания = new Date().toISOString().split('T')[0] } = req.body;

            // Валидация входных данных
            if (!имя_пользователя || !электронная_почта || !пароль) {
                connection.release();
                return res.status(400).json({ success: false, message: 'Все поля обязательны' });
            }

            // Проверка уникальности имени пользователя и электронной почты
            connection.query(
                'SELECT id FROM users WHERE имя_пользователя = ? OR электронная_почта = ?',
                [имя_пользователя, электронная_почта],
                async (err, results) => {
                    if (err) {
                        connection.release();
                        console.error('Ошибка проверки пользователя:', err);
                        return res.status(500).json({ success: false, message: 'Ошибка проверки пользователя' });
                    }
                    if (results.length > 0) {
                        connection.release();
                        return res.status(409).json({ success: false, message: 'Имя пользователя или электронная почта уже существуют' });
                    }

                    // Хеширование пароля
                    try {
                        const hashedPassword = await bcrypt.hash(пароль, 10);
                        const query = 'INSERT INTO users (имя_пользователя, электронная_почта, пароль, роль, дата_создания) VALUES (?, ?, ?, ?, ?)';
                        connection.query(query, [имя_пользователя, электронная_почта, hashedPassword, роль, дата_создания], (err, results) => {
                            connection.release();
                            if (err) {
                                console.error('Ошибка регистрации:', err);
                                return res.status(500).json({ success: false, message: 'Ошибка регистрации пользователя' });
                            }
                            res.json({ success: true, message: 'Пользователь успешно зарегистрирован' });
                        });
                    } catch (hashError) {
                        connection.release();
                        console.error('Ошибка хеширования пароля:', hashError);
                        res.status(500).json({ success: false, message: 'Ошибка обработки пароля' });
                    }
                }
            );
        });
    });
});

// Роут для аутентификации пользователя
app.post('/api/login', (req, res) => {
    db.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка подключения:', err);
            return res.status(500).json({ success: false, message: 'Ошибка подключения к базе данных' });
        }
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                console.error(`Ошибка выбора базы данных ${DB_NAME}:`, err);
                return res.status(500).json({ success: false, message: 'Ошибка выбора базы данных' });
            }

            const { имя_пользователя, пароль } = req.body;

            // Валидация входных данных
            if (!имя_пользователя || !пароль) {
                connection.release();
                return res.status(400).json({ success: false, message: 'Имя пользователя и пароль обязательны' });
            }

            // Поиск пользователя
            connection.query(
                'SELECT id, имя_пользователя, пароль, роль FROM users WHERE имя_пользователя = ?',
                [имя_пользователя],
                async (err, results) => {
                    connection.release();
                    if (err) {
                        console.error('Ошибка поиска пользователя:', err);
                        return res.status(500).json({ success: false, message: 'Ошибка поиска пользователя' });
                    }
                    if (results.length === 0) {
                        return res.status(401).json({ success: false, message: 'Неправильное имя пользователя или пароль' });
                    }

                    const user = results[0];

                    // Проверка пароля
                    try {
                        const isPasswordValid = await bcrypt.compare(пароль, user.пароль);
                        if (!isPasswordValid) {
                            return res.status(401).json({ success: false, message: 'Неправильное имя пользователя или пароль' });
                        }

                        // Генерация JWT-токена
                        const token = jwt.sign({ id: user.id, имя_пользователя: user.имя_пользователя, роль: user.роль }, secretKey, { expiresIn: '1h' });
                        res.json({ success: true, token, роль: user.роль, userId: user.id });
                    } catch (compareError) {
                        console.error('Ошибка проверки пароля:', compareError);
                        res.status(500).json({ success: false, message: 'Ошибка проверки пароля' });
                    }
                }
            );
        });
    });
});



// Эндпоинт для админ-панели
app.get('/api/admin/:table', (req, res) => {
    const { table } = req.params;

    // Список допустимых таблиц
    const allowedTables = [
        'users', 'category', 'product', 'opisanie', 'postavshik', 'otziv',
        'vopros', 'contact', 'corzina', 'zakaz', 'izbran'
    ];

    if (!allowedTables.includes(table)) {
        console.error(`Недопустимая таблица: ${table}`);
        return res.status(400).json({ success: false, message: 'Недопустимая таблица' });
    }

    db.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка подключения к базе данных:', err);
            return res.status(500).json({ success: false, message: 'Ошибка подключения к базе данных' });
        }
        connection.query('USE ??', ['alexmi49_diplom'], (err) => {
            if (err) {
                connection.release();
                console.error(`Ошибка выбора базы данных alexmi49_diplom:`, err);
                return res.status(500).json({ success: false, message: 'Ошибка выбора базы данных' });
            }

            // Конфигурация таблиц
            const tableConfigs = {
                users: {
                    fields: ['id', 'имя_пользователя', 'электронная_почта', 'пароль', 'роль', 'фото', 'дата_создания'],
                    displayNames: ['ID', 'Имя пользователя', 'Email', 'Пароль', 'Роль', 'Фото', 'Дата создания'],
                    types: ['number', 'text', 'email', 'password', 'enum', 'text', 'date'],
                    enums: { роль: ['user', 'admin'] }
                },
                category: {
                    fields: ['id', 'название', 'описание', 'дата_создания', 'создатель', 'количество_продуктов', 'фото'],
                    displayNames: ['ID', 'Название', 'Описание', 'Дата создания', 'Создатель', 'Кол-во продуктов', 'Фото'],
                    types: ['number', 'text', 'text', 'date', 'text', 'number', 'text'],
                    enums: {}
                },
                product: {
                    fields: ['id', 'название', 'описание', 'цена', 'запасы', 'категория', 'категория_id', 'дата_создания', 'фото', 'рэйтинг', 'отзывов', 'вопросов'],
                    displayNames: ['ID', 'Название', 'Описание', 'Цена', 'Запасы', 'Категория', 'Категория ID', 'Дата создания', 'Фото', 'Рейтинг', 'Отзывов', 'Вопросов'],
                    types: ['number', 'text', 'text', 'decimal', 'number', 'text', 'number', 'date', 'text', 'decimal', 'number', 'number'],
                    enums: {}
                },
                opisanie: {
                    fields: ['id', 'продукт_id', 'бренд', 'модель', 'вес', 'размеры', 'мощность', 'скорость', 'совместимость', 'гарантия', 'фото_папка'],
                    displayNames: ['ID', 'Продукт ID', 'Бренд', 'Модель', 'Вес', 'Размеры', 'Мощность', 'Скорость', 'Совместимость', 'Гарантия', 'Фото папка'],
                    types: ['number', 'number', 'text', 'text', 'decimal', 'text', 'number', 'text', 'text', 'number', 'text'],
                    enums: {}
                },
                postavshik: {
                    fields: ['id', 'название', 'рэйтинг', 'количество_заказов', 'количество_курьеров', 'год_основания', 'телефон', 'фото'],
                    displayNames: ['ID', 'Название', 'Рейтинг', 'Кол-во заказов', 'Кол-во курьеров', 'Год основания', 'Телефон', 'Фото'],
                    types: ['number', 'text', 'decimal', 'number', 'number', 'number', 'text', 'text'],
                    enums: {}
                },
                otziv: {
                    fields: ['id', 'рейтинг', 'пользователь_id', 'продукт_id', 'комментарий', 'дата_создания', 'фото', 'пользователь_имя', 'продукт_название'],
                    displayNames: ['ID', 'Рейтинг', 'Пользователь ID', 'Продукт ID', 'Комментарий', 'Дата создания', 'Фото', 'Пользователь', 'Продукт'],
                    types: ['number', 'decimal', 'number', 'number', 'text', 'date', 'text', 'text', 'text'],
                    enums: {}
                },
                vopros: {
                    fields: ['id', 'продукт_id', 'пользователь_id', 'вопрос', 'дата_создания', 'ответ', 'продукт_название', 'пользователь_имя'],
                    displayNames: ['ID', 'Продукт ID', 'Пользователь ID', 'Вопрос', 'Дата создания', 'Ответ', 'Продукт', 'Пользователь'],
                    types: ['number', 'number', 'number', 'text', 'date', 'text', 'text', 'text'],
                    enums: {}
                },
                contact: {
                    fields: ['id', 'имя', 'email', 'сообщение', 'выполнено', 'дата_создания'],
                    displayNames: ['ID', 'Имя', 'Email', 'Сообщение', 'Выполнено', 'Дата создания'],
                    types: ['number', 'text', 'email', 'text', 'enum', 'date'],
                    enums: { выполнено: ['да', 'нет'] }
                },
                corzina: {
                    fields: ['id', 'пользователь_id', 'продукт_id', 'количество', 'дата_создания', 'цена', 'поставщик_id', 'пользователь_имя', 'продукт_название', 'поставщик'],
                    displayNames: ['ID', 'Пользователь ID', 'Продукт ID', 'Количество', 'Дата создания', 'Цена', 'Поставщик ID', 'Пользователь', 'Продукт', 'Поставщик'],
                    types: ['number', 'number', 'number', 'number', 'date', 'decimal', 'number', 'text', 'text', 'text'],
                    enums: {}
                },
                zakaz: {
                    fields: ['id', 'статус', 'дата_создания', 'пользователь_id', 'итого', 'дата_обновления', 'адрес_доставки', 'способ_оплаты', 'поставщик_id', 'дни_на_доставку', 'товары', 'трэк_номер', 'пользователь_имя', 'поставщик'],
                    displayNames: ['ID', 'Статус', 'Дата создания', 'Пользователь ID', 'Итого', 'Дата обновления', 'Адрес доставки', 'Способ оплаты', 'Поставщик ID', 'Дни на доставку', 'Товары', 'Трэк номер', 'Пользователь', 'Поставщик'],
                    types: ['number', 'enum', 'date', 'number', 'decimal', 'date', 'text', 'text', 'number', 'number', 'text', 'text', 'text', 'text'],
                    enums: { статус: ['не_оплачен', 'оплачен', 'в_доставке', 'доставлен', 'отменён'] }
                },
                izbran: {
                    fields: ['id', 'product_id', 'название', 'описание', 'цена', 'запасы', 'категория', 'категория_id', 'дата_создания', 'фото', 'рэйтинг', 'отзывов', 'вопросов', 'пользователь_id', 'пользователь_имя', 'category_name'],
                    displayNames: ['ID', 'Продукт ID', 'Название', 'Описание', 'Цена', 'Запасы', 'Категория', 'Категория ID', 'Дата создания', 'Фото', 'Рейтинг', 'Отзывов', 'Вопросов', 'Пользователь ID', 'Пользователь', 'Категория'],
                    types: ['number', 'number', 'text', 'text', 'decimal', 'number', 'text', 'number', 'date', 'text', 'decimal', 'number', 'number', 'number', 'text', 'text'],
                    enums: {}
                }
            };

            if (!tableConfigs[table]) {
                connection.release();
                console.error(`Конфигурация таблицы не найдена: ${table}`);
                return res.status(400).json({ success: false, message: 'Конфигурация таблицы не найдена' });
            }

            // Формируем SQL-запрос
            let query = '';
            try {
                switch (table) {
                    case 'users':
                        query = `
                            SELECT id, 
                                   имя_пользователя, 
                                   электронная_почта, 
                                   пароль, 
                                   роль, 
                                   дата_создания, 
                                   фото 
                            FROM users`;
                        break;
                    case 'category':
                        query = `
                            SELECT id, 
                                   название, 
                                   описание, 
                                   дата_создания, 
                                   создатель, 
                                   количество_продуктов, 
                                   фото 
                            FROM category`;
                        break;
                    case 'product':
                        query = `
                            SELECT 
                                product.id, 
                                product.название, 
                                product.описание, 
                                product.цена, 
                                product.запасы, 
                                product.категория, 
                                product.категория_id, 
                                product.дата_создания, 
                                product.фото,
                                COALESCE(AVG(otziv.рейтинг), 0) AS рэйтинг,
                                COUNT(DISTINCT otziv.id) AS отзывов,
                                COUNT(DISTINCT vopros.id) AS вопросов
                            FROM product 
                            LEFT JOIN otziv ON product.id = otziv.продукт_id
                            LEFT JOIN vopros ON product.id = vopros.продукт_id
                            GROUP BY product.id`;
                        break;
                    case 'opisanie':
                        query = `
                            SELECT id, 
                                   продукт_id, 
                                   бренд, 
                                   модель, 
                                   вес, 
                                   размеры, 
                                   мощность, 
                                   скорость, 
                                   совместимость, 
                                   гарантия, 
                                   фото_папка 
                            FROM opisanie`;
                        break;
                    case 'postavshik':
                        query = `
                            SELECT id, 
                                   название, 
                                   рэйтинг, 
                                   количество_заказов, 
                                   количество_курьеров, 
                                   год_основания, 
                                   телефон, 
                                   фото 
                            FROM postavshik`;
                        break;
                    case 'otziv':
                        query = `
                            SELECT 
                                otziv.id, 
                                otziv.рейтинг, 
                                otziv.пользователь_id, 
                                otziv.продукт_id, 
                                otziv.комментарий, 
                                otziv.дата_создания, 
                                otziv.фото,
                                COALESCE(users.имя_пользователя, 'Удалён') AS пользователь_имя,
                                product.название AS продукт_название
                            FROM otziv
                            LEFT JOIN users ON otziv.пользователь_id = users.id
                            LEFT JOIN product ON otziv.продукт_id = product.id`;
                        break;
                    case 'vopros':
                        query = `
                            SELECT 
                                vopros.id, 
                                vopros.продукт_id, 
                                vopros.пользователь_id, 
                                vopros.вопрос, 
                                vopros.дата_создания, 
                                vopros.ответ,
                                product.название AS продукт_название,
                                COALESCE(users.имя_пользователя, 'Удалён') AS пользователь_имя
                            FROM vopros
                            LEFT JOIN product ON vopros.продукт_id = product.id
                            LEFT JOIN users ON vopros.пользователь_id = users.id`;
                        break;
                    case 'contact':
                        query = `
                            SELECT id, 
                                   имя, 
                                   email, 
                                   сообщение, 
                                   выполнено, 
                                   дата_создания
                            FROM contact`;
                        break;
                    case 'corzina':
                        query = `
                            SELECT 
                                corzina.id, 
                                corzina.пользователь_id, 
                                corzina.продукт_id, 
                                corzina.количество, 
                                corzina.дата_создания, 
                                corzina.цена, 
                                corzina.поставщик_id,
                                COALESCE(users.имя_пользователя, 'Удалён') AS пользователь_имя,
                                product.название AS продукт_название,
                                postavshik.название AS поставщик
                            FROM corzina
                            LEFT JOIN users ON corzina.пользователь_id = users.id
                            LEFT JOIN product ON corzina.продукт_id = product.id
                            LEFT JOIN postavshik ON corzina.поставщик_id = postavshik.id`;
                        break;
                    case 'zakaz':
                        query = `
                            SELECT 
                                zakaz.id, 
                                zakaz.статус, 
                                zakaz.дата_создания, 
                                zakaz.пользователь_id, 
                                zakaz.итого AS total, 
                                zakaz.дата_обновления,
                                zakaz.адрес_доставки, 
                                zakaz.способ_оплаты, 
                                zakaz.поставщик_id, 
                                zakaz.дни_на_доставку, 
                                COALESCE(zakaz.товары, '[]') AS товары, 
                                zakaz.трэк_номер,
                                COALESCE(users.имя_пользователя, 'Удалён') AS пользователь_имя,
                                postavshik.название AS поставщик
                            FROM zakaz
                            LEFT JOIN users ON zakaz.пользователь_id = users.id
                            LEFT JOIN postavshik ON zakaz.поставщик_id = postavshik.id`;
                        break;
                    case 'izbran':
                        query = `
                            SELECT 
                                izbran.id, 
                                izbran.product_id, 
                                izbran.название, 
                                izbran.описание, 
                                izbran.цена, 
                                izbran.запасы, 
                                izbran.категория, 
                                izbran.категория_id,
                                izbran.дата_создания, 
                                izbran.фото, 
                                COALESCE(AVG(otziv.рейтинг), 0) AS рэйтинг,
                                COUNT(DISTINCT otziv.id) AS отзывов,
                                COUNT(DISTINCT vopros.id) AS вопросов,
                                COALESCE(users.имя_пользователя, 'Удалён') AS пользователь_имя,
                                category.название AS category_name
                            FROM izbran
                            LEFT JOIN category ON izbran.категория_id = category.id
                            LEFT JOIN otziv ON izbran.product_id = otziv.продукт_id
                            LEFT JOIN vopros ON izbran.product_id = vopros.продукт_id
                            LEFT JOIN users ON izbran.пользователь_id = users.id
                            GROUP BY izbran.id`;
                        break;
                    default:
                        connection.release();
                        console.error(`Таблица не поддерживается: ${table}`);
                        return res.status(400).json({ success: false, message: 'Таблица не поддерживается' });
                }

                console.log(`Выполняется запрос для таблицы ${table}: ${query}`);
                connection.query(query, (err, results) => {
                    connection.release();
                    if (err) {
                        console.error(`Ошибка запроса для таблицы ${table}:`, err);
                        return res.status(500).json({ 
                            success: false, 
                            message: `Ошибка запроса: ${err.message}` 
                        });
                    }

                    // Обработка данных
                    let processedResults = Array.isArray(results) ? results : [];
                    if (table === 'zakaz') {
                        processedResults = processedResults.map(row => ({
                            ...row,
                            товары: row.товары ? JSON.parse(row.товары) : []
                        }));
                    }

                    // Возвращаем структурированный ответ
                    console.log(`Ответ для таблицы ${table}:`, { 
                        success: true, 
                        data: processedResults, 
                        config: tableConfigs[table] 
                    });
                    res.json({
                        success: true,
                        data: processedResults,
                        config: tableConfigs[table]
                    });
                });
            } catch (error) {
                connection.release();
                console.error(`Ошибка обработки запроса для таблицы ${table}:`, error);
                res.status(500).json({ 
                    success: false, 
                    message: `Внутренняя ошибка сервера: ${error.message}` 
                });
            }
        });
    });
});

// Dry-run endpoint for table access
app.get('/api/admin/:table/dry-run', async (req, res) => {
    const { table } = req.params;
    const allowedTables = [
        'users', 'category', 'product', 'opisanie', 'postavshik', 'otziv',
        'vopros', 'contact', 'corzina', 'zakaz', 'izbran'
    ];

    if (!allowedTables.includes(table)) {
        return res.status(400).json({ success: false, message: 'Недопустимая таблица' });
    }

    // Simulate table access check
    res.json({ success: true, message: `Table ${table} is accessible` });
});

// Dry-run endpoint for creating record
app.post('/api/:table/dry-run', async (req, res) => {
    const { table } = req.params;
    const allowedTables = [
        'users', 'category', 'product', 'opisanie', 'postavshik', 'otziv',
        'vopros', 'contact', 'corzina', 'zakaz', 'izbran'
    ];

    if (!allowedTables.includes(table)) {
        return res.status(400).json({ success: false, message: 'Недопустимая таблица' });
    }

    // Simulate record creation
    res.json({ success: true, message: `Record creation simulated for ${table}` });
});

// Dry-run endpoint for updating record
app.put('/api/:table/:id/dry-run', async (req, res) => {
    const { table, id } = req.params;
    const allowedTables = [
        'users', 'category', 'product', 'opisanie', 'postavshik', 'otziv',
        'vopros', 'contact', 'corzina', 'zakaz', 'izbran'
    ];

    if (!allowedTables.includes(table)) {
        return res.status(400).json({ success: false, message: 'Недопустимая таблица' });
    }

    // Simulate record update
    res.json({ success: true, message: `Record update simulated for ${table} with id ${id}` });
});

// Dry-run endpoint for deleting record
app.delete('/api/:table/:id/dry-run', async (req, res) => {
    const { table, id } = req.params;
    const allowedTables = [
        'users', 'category', 'product', 'opisanie', 'postavshik', 'otziv',
        'vopros', 'contact', 'corzina', 'zakaz', 'izbran'
    ];

    if (!allowedTables.includes(table)) {
        return res.status(400).json({ success: false, message: 'Недопустимая таблица' });
    }

    if (table === 'users') {
        // Simulate admin check
        try {
            const [rows] = await db.query('SELECT роль FROM users WHERE id = ?', [id]);
            if (rows[0] && rows[0].роль === 'admin') {
                return res.status(403).json({ success: false, message: 'Cannot delete admin user' });
            }
            res.json({ success: true, message: `Record deletion simulated for ${table} with id ${id}` });
        } catch (error) {
            res.json({ success: true, message: `Record deletion simulated for ${table} with id ${id}` });
        }
    } else {
        // Simulate record deletion
        res.json({ success: true, message: `Record deletion simulated for ${table} with id ${id}` });
    }
});

// Dry-run endpoints for admin functions
app.post('/api/login/dry-run', async (req, res) => {
    res.json({ success: true, message: 'Login simulated' });
});

app.post('/api/migrate/dry-run', async (req, res) => {
    res.json({ success: true, message: 'Database migration simulated' });
});

app.post('/api/seed/dry-run', async (req, res) => {
    res.json({ success: true, message: 'Database seeding simulated' });
});

app.post('/api/export/dry-run', async (req, res) => {
    res.json({ success: true, message: 'Excel export simulated' });
});

// Ping endpoint with dry-run support
app.get('/api/ping', async (req, res) => {
    if (req.query.dryRun === 'true') {
        return res.json({ success: true, message: 'Dry-run ping successful' });
    }
    try {
        await db.ping();
        res.json({ success: true, message: 'Database ping successful' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database ping failed' });
    }
});

// POST для создания новой записи
app.post('/api/:table', (req, res) => {
    const { table } = req.params;
    const allowedTables = [
        'users', 'category', 'product', 'opisanie', 'postavshik', 'otziv',
        'vopros', 'contact', 'corzina', 'zakaz', 'izbran'
    ];

    if (!allowedTables.includes(table)) {
        return res.status(400).json({ success: false, message: 'Недопустимая таблица' });
    }

    db.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка подключения:', err);
            return res.status(500).json({ success: false, message: 'Ошибка подключения к базе данных' });
        }
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                console.error(`Ошибка выбора базы данных ${DB_NAME}:`, err);
                return res.status(500).json({ success: false, message: 'Ошибка выбора базы данных' });
            }

            const data = req.body;
            const fields = Object.keys(data);
            const values = Object.values(data);
            const placeholders = fields.map(() => '?').join(', ');

            // Специальная обработка для таблицы users (хеширование пароля)
            if (table === 'users' && data.пароль) {
                bcrypt.hash(data.пароль, 10, (err, hashedPassword) => {
                    if (err) {
                        connection.release();
                        console.error('Ошибка хеширования пароля:', err);
                        return res.status(500).json({ success: false, message: 'Ошибка обработки пароля' });
                    }
                    data['пароль'] = hashedPassword;
                    insertRecord();
                });
            } else {
                insertRecord();
            }

            function insertRecord() {
                const query = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
                connection.query(query, Object.values(data), (err, result) => {
                    connection.release();
                    if (err) {
                        console.error(`Ошибка при создании записи в таблице ${table}:`, err);
                        return res.status(400).json({ success: false, message: `Ошибка при создании записи: ${err.message}` });
                    }
                    console.log(`Создана запись в таблице ${table}: id=${result.insertId}`);
                    res.json({ success: true, message: 'Запись создана', id: result.insertId });
                });
            }
        });
    });
});

// PUT для обновления записи
app.put('/api/:table/:id', (req, res) => {
    const { table, id } = req.params;
    const allowedTables = [
        'users', 'category', 'product', 'opisanie', 'postavshik', 'otziv',
        'vopros', 'contact', 'corzina', 'zakaz', 'izbran'
    ];

    if (!allowedTables.includes(table)) {
        return res.status(400).json({ success: false, message: 'Недопустимая таблица' });
    }

    db.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка подключения:', err);
            return res.status(500).json({ success: false, message: 'Ошибка подключения к базе данных' });
        }
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                console.error(`Ошибка выбора базы данных ${DB_NAME}:`, err);
                connection.release();
                return res.status(500).json({ success: false, message: 'Ошибка выбора базы данных' });
            }

            const data = req.body;
            const fields = Object.keys(data);
            const setClause = fields.map(field => `${field} = ?`).join(', ');
            const values = [...Object.values(data), id];

            // Специальная обработка для таблицы users (хеширование пароля)
            if (table === 'users' && data.пароль) {
                bcrypt.hash(data.пароль, 10, (err, hashedPassword) => {
                    if (err) {
                        connection.release();
                        console.error('Ошибка хеширования пароля:', err);
                        return res.status(500).json({ success: false, message: 'Ошибка обработки пароля' });
                    }
                    data['пароль'] = hashedPassword;
                    updateRecord();
                });
            } else {
                updateRecord();
            }

            function updateRecord() {
                const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
                connection.query(query, values, (err, result) => {
                    connection.release();
                    if (err) {
                        console.error(`Ошибка при обновлении записи в таблице ${table}:`, err);
                        return res.status(400).json({ success: false, message: `Ошибка при обновлении записи: ${err.message}` });
                    }
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ success: false, message: `Запись с id ${id} не найдена` });
                    }
                    console.log(`Обновлена запись в таблице ${table}: id=${id}`);
                    res.json({ success: true, message: 'Запись обновлена' });
                });
            }
        });
    });
});

// DELETE для удаления записи
app.delete('/api/:table/:id', (req, res) => {
    const { table, id } = req.params;
    const allowedTables = [
        'users', 'category', 'product', 'opisanie', 'postavshik', 'otziv',
        'vopros', 'contact', 'corzina', 'zakaz', 'izbran'
    ];

    if (!allowedTables.includes(table)) {
        return res.status(400).json({ success: false, message: 'Недопустимая таблица' });
    }

    db.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка подключения:', err);
            return res.status(500).json({ success: false, message: 'Ошибка подключения к базе данных' });
        }
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                console.error(`Ошибка выбора базы данных ${DB_NAME}:`, err);
                connection.release();
                return res.status(500).json({ success: false, message: 'Ошибка выбора базы данных' });
            }

            // Если таблица product, сначала удаляем связанные записи
            if (table === 'product') {
                const deleteRelatedQueries = [
                    'DELETE FROM opisanie WHERE продукт_id = ?',
                    'DELETE FROM otziv WHERE продукт_id = ?',
                    'DELETE FROM vopros WHERE продукт_id = ?',
                    'DELETE FROM corzina WHERE продукт_id = ?',
                    'DELETE FROM izbran WHERE product_id = ?'
                ];

                let queryIndex = 0;
                const executeNextQuery = () => {
                    if (queryIndex >= deleteRelatedQueries.length) {
                        deleteRecord(); // Исправлено: вызов deleteRecord вместо deleteProduct
                        return;
                    }
                    connection.query(deleteRelatedQueries[queryIndex], [id], (err) => {
                        if (err) {
                            connection.release();
                            console.error(`Ошибка удаления связанных данных для product id=${id}:`, err);
                            return res.status(500).json({
                                success: false,
                                message: `Ошибка при удалении связанных данных: ${err.message}`
                            });
                        }
                        queryIndex++;
                        executeNextQuery();
                    });
                };

                executeNextQuery();
            } else {
                deleteRecord();
            }

            function deleteRecord() {
                const query = `DELETE FROM ${table} WHERE id = ?`;
                connection.query(query, [id], (err, result) => {
                    connection.release();
                    if (err) {
                        console.error(`Ошибка при удалении записи в таблице ${table}:`, err);
                        return res.status(500).json({
                            success: false,
                            message: `Ошибка при удалении записи: ${err.message}`
                        });
                    }
                    if (result.affectedRows === 0) {
                        return res.status(404).json({
                            success: false,
                            message: `Запись с id ${id} не найдена`
                        });
                    }
                    console.log(`Удалена запись в таблице ${table}: id=${id}`);
                    res.json({ success: true, message: 'Запись успешно удалена' });
                });
            }
        });
    });
});

// Проверка токена
app.get('/api/check-token', (req, res) => {
    db.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка подключения:', err);
            return res.status(500).json({ success: false, message: 'Ошибка подключения к базе данных' });
        }
        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                console.error(`Ошибка выбора базы данных ${DB_NAME}:`, err);
                return res.status(500).json({ success: false, message: 'Ошибка выбора базы данных' });
            }
            const token = req.headers['authorization'];
            if (!token) {
                connection.release();
                return res.status(401).json({ success: false, message: 'Токен не предоставлен' });
            }
            jwt.verify(token, secretKey, (err, decoded) => {
                connection.release();
                if (err) {
                    return res.status(401).json({ success: false, message: 'Ошибка аутентификации токена' });
                }
                res.json({ 
                    success: true, 
                    user: { 
                        id: decoded.id, 
                        имя_пользователя: decoded.имя_пользователя, 
                        роль: decoded.роль 
                    } 
                });
            });
        });
    });
});

// Добавление информации от пользователей через контакты
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Все поля обязательны для заполнения' });
    }

    db.getConnection((err, connection) => {
        if (err) return res.status(500).json({ success: false, message: 'Ошибка подключения к базе данных' });

        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                connection.release();
                return res.status(500).json({ success: false, message: 'Ошибка выбора базы данных' });
            }

            const query = 'INSERT INTO contact (имя, email, сообщение) VALUES (?, ?, ?)';
            connection.query(query, [name, email, message], (err) => {
                connection.release();
                if (err) {
                    return res.status(500).json({ success: false, message: 'Ошибка сохранения обращения' });
                }
                res.json({ success: true, message: 'Обращение успешно сохранено' });
            });
        });
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});