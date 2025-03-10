const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const seedDatabase = require('./seed'); // Импортируем функцию seedDatabase
const db = require('./db'); // Импортируем пул соединений
const app = express();
const PORT = process.env.PORT || 3000;
const createTableQueries = require('./migrate')
const bcrypt = require('bcrypt');
const jwt = require ('jsonwebtoken');
const secretKey = 'your_secret_key';  // Измените это на свой секретный ключ
app.use(cors());
app.use(bodyParser.json());

// Подключение к серверу базы данных
db.getConnection((err, connection) => {
  if (err) throw err;
  console.log('Подключение к серверу базы данных успешно установлено');
  connection.release();
});

// Эндпоинт для миграции
app.post('/api/migrate', (req, res) => {
  console.log('Начало миграции');
  const createDatabaseQuery = `CREATE DATABASE IF NOT EXISTS Diplom`;
  db.getConnection((err, connection) => {
      if (err) return res.status(500).send('Ошибка подключения');
      connection.query(createDatabaseQuery, (err) => {
          if (err) {
              connection.release();
              return res.status(500).send('Ошибка создания БД');
          }
          connection.query('USE Diplom', (err) => {
              if (err) {
                  connection.release();
                  return res.status(500).send('Ошибка переключения');
              }
              const executeQueries = (queries, index = 0, callback) => {
                  if (index >= queries.length) return callback();
                  connection.query(queries[index], (err) => {
                      if (err) {
                          connection.release();
                          return res.status(500).send('Ошибка выполнения запроса');
                      }
                      executeQueries(queries, index + 1, callback);
                  });
              };
              executeQueries(createTableQueries, 0, () => {
                  console.log('Все таблицы созданы');
                  connection.release();
                  res.status(200).send('Миграция завершена');
              });
          });
      });
  });
});

// Эндпоинт для заполнения
app.post('/api/seed', (req, res) => {
  console.log('Начало заполнения');
  seedDatabase(db, (err) => {
      if (err) {
          console.error('Ошибка:', err);
          if (!res.headersSent) return res.status(500).send('Ошибка заполнения');
          return;
      }
      console.log('Заполнение завершено');
      if (!res.headersSent) res.send('База данных заполнена');
  });
});

// GET для users
app.get('/api/users', (req, res) => {
  db.getConnection((err, connection) => {
      if (err) return res.status(500).send('Ошибка подключения');
      connection.query('USE Diplom', (err) => {
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
      connection.query('USE Diplom', (err) => {
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
      connection.query('USE Diplom', (err) => {
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
  const { categoryName } = req.query;
  db.getConnection((err, connection) => {
      if (err) return res.status(500).send('Ошибка подключения');
      connection.query('USE Diplom', (err) => {
          if (err) {
              connection.release();
              return res.status(500).send('Ошибка переключения');
          }
          const query = `
              SELECT product.id, 
                     product.название AS name, 
                     product.описание AS description, 
                     product.цена AS price, 
                     product.запасы AS stock, 
                     product.категория AS category, 
                     category.название AS category_name, 
                     product.дата_создания AS created_at, 
                     product.фото AS photo, 
                     product.рэйтинг AS rating, 
                     product.отзывов AS reviews, 
                     product.вопросов AS questions 
              FROM product 
              LEFT JOIN category ON product.категория_id = category.id
              WHERE product.категория = ?`;
          connection.query(query, [categoryName], (err, results) => {
              connection.release();
              if (err) return res.status(500).send('Ошибка запроса');
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
      connection.query('USE Diplom', (err) => {
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
      connection.query('USE Diplom', (err) => {
          if (err) {
              connection.release();
              return res.status(500).send('Ошибка переключения');
          }
          const query = `
              SELECT izbran.id, 
                     izbran.название AS name, 
                     izbran.описание AS description, 
                     izbran.цена AS price, 
                     izbran.запасы AS stock, 
                     izbran.категория AS category, 
                     category.название AS category_name, 
                     izbran.дата_создания AS created_at, 
                     izbran.фото AS photo, 
                     izbran.рэйтинг AS rating, 
                     izbran.отзывов AS reviews, 
                     izbran.вопросов AS questions, 
                     users.имя_пользователя AS username 
              FROM izbran
              LEFT JOIN users ON izbran.пользователь_id = users.id
              LEFT JOIN category ON izbran.категория_id = category.id
              WHERE izbran.пользователь_id = ?`;
          connection.query(query, [userId], (err, results) => {
              connection.release();
              if (err) return res.status(500).send('Ошибка запроса');
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
      connection.query('USE Diplom', (err) => {
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

// GET для zakaz
app.get('/api/zakaz', (req, res) => {
  const { userId } = req.query;
  db.getConnection((err, connection) => {
      if (err) return res.status(500).send('Ошибка подключения');
      connection.query('USE Diplom', (err) => {
          if (err) {
              connection.release();
              return res.status(500).send('Ошибка переключения');
          }
          const query = `
              SELECT zakaz.id, 
                     zakaz.статус AS status, 
                     zakaz.дата_создания AS created_at, 
                     users.имя_пользователя AS username, 
                     zakaz.итого AS total, 
                     zakaz.дата_обновления AS updated_at, 
                     zakaz.адрес_доставки AS delivery_address, 
                     zakaz.способ_оплаты AS payment_method, 
                     postavshik.название AS supplier_name, 
                     zakaz.дни_на_доставку AS delivery_days, 
                     zakaz.товары AS items, 
                     zakaz.трэк_номер AS tracking_number 
              FROM zakaz
              LEFT JOIN users ON zakaz.пользователь_id = users.id
              LEFT JOIN postavshik ON zakaz.поставщик_id = postavshik.id
              WHERE zakaz.пользователь_id = ?`;
          connection.query(query, [userId], (err, results) => {
              connection.release();
              if (err) return res.status(500).send('Ошибка запроса');
              res.json(results);
          });
      });
  });
});

// GET для postavshik
app.get('/api/postavshik', (req, res) => {
  db.getConnection((err, connection) => {
      if (err) return res.status(500).send('Ошибка подключения');
      connection.query('USE Diplom', (err) => {
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

// GET для opisanie (уже был, но добавлю для ясности)
app.get('/api/opisanie', (req, res) => {
  const { productId } = req.query;
  db.getConnection((err, connection) => {
      if (err) return res.status(500).send('Ошибка подключения');
      connection.query('USE Diplom', (err) => {
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
                     гарантия AS warranty 
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

// POST для добавления в corzina
app.post('/api/corzina', (req, res) => {
  const { userId, productId, quantity, price, supplierId } = req.body;

  if (!userId || !productId) {
      return res.status(400).send('Не указан userId или productId');
  }

  db.getConnection((err, connection) => {
      if (err) return res.status(500).send('Ошибка подключения');
      connection.query('USE Diplom', (err) => {
          if (err) {
              connection.release();
              return res.status(500).send('Ошибка переключения');
          }

          connection.query('SELECT id FROM users WHERE id = ?', [userId], (err, userResults) => {
              if (err || userResults.length === 0) {
                  connection.release();
                  return res.status(400).send('Пользователь не существует');
              }

              connection.query('SELECT id, цена FROM product WHERE id = ?', [productId], (err, productResults) => {
                  if (err || productResults.length === 0) {
                      connection.release();
                      return res.status(400).send('Продукт не существует');
                  }

                  const checkQuery = `
                      SELECT * FROM corzina
                      WHERE пользователь_id = ? AND продукт_id = ?`;
                  connection.query(checkQuery, [userId, productId], (err, results) => {
                      if (err) {
                          connection.release();
                          return res.status(500).send('Ошибка проверки корзины');
                      }

                      if (results.length > 0) {
                          const updateQuery = `
                              UPDATE corzina
                              SET количество = количество + ?, 
                                  цена = цена + ?, 
                                  поставщик_id = ?
                              WHERE пользователь_id = ? AND продукт_id = ?`;
                          connection.query(updateQuery, [quantity, price * quantity, supplierId, userId, productId], (err) => {
                              connection.release();
                              if (err) return res.status(500).send('Ошибка обновления корзины');
                              res.json({ success: true });
                          });
                      } else {
                          const insertQuery = `
                              INSERT INTO corzina (пользователь_id, продукт_id, количество, дата_создания, цена, поставщик_id)
                              VALUES (?, ?, ?, NOW(), ?, ?)`;
                          connection.query(insertQuery, [userId, productId, quantity, price * quantity, supplierId], (err) => {
                              connection.release();
                              if (err) return res.status(500).send('Ошибка добавления в корзину: ' + err.message);
                              res.json({ success: true });
                          });
                      }
                  });
              });
          });
      });
  });
});

// POST для создания заказа
app.post('/api/zakaz', (req, res) => {
  const { userId, total } = req.body;

  db.getConnection((err, connection) => {
      if (err) return res.status(500).send('Ошибка подключения');
      connection.query('USE Diplom', (err) => {
          if (err) {
              connection.release();
              return res.status(500).send('Ошибка переключения');
          }

          connection.query(`
              SELECT product.название, corzina.поставщик_id 
              FROM corzina 
              LEFT JOIN product ON corzina.продукт_id = product.id 
              WHERE corzina.пользователь_id = ?`, [userId], (err, corzinaItems) => {
              if (err) {
                  connection.release();
                  return res.status(500).send('Ошибка получения корзины');
              }

              const items = corzinaItems.map(item => item.название).join(', ');
              const supplierId = corzinaItems[0]?.поставщик_id || null;
              const addresses = ['ул. Ленина, д. 1', 'ул. Пушкина, д. 2', 'ул. Гоголя, д. 3'];
              const paymentMethods =['наличные', 'карта', 'онлайн'];
              const trackingNumber = `TRK${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

              const query = `
                  INSERT INTO zakaz (статус, дата_создания, пользователь_id, итого, дата_обновления, адрес_доставки, способ_оплаты, поставщик_id, дни_на_доставку, товары, трэк_номер)
                  VALUES ('не_оплачен', NOW(), ?, ?, NOW(), ?, ?, ?, ?, ?, ?)`;
              connection.query(query, [
                  userId,
                  total,
                  addresses[Math.floor(Math.random() * addresses.length)],
                  paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                  supplierId,
                  Math.floor(Math.random() * 7) + 1,
                  items,
                  trackingNumber
              ], (err) => {
                  if (err) {
                      connection.release();
                      return res.status(500).send('Ошибка создания заказа');
                  }

                  connection.query('DELETE FROM corzina WHERE пользователь_id = ?', [userId], (err) => {
                      connection.release();
                      if (err) return res.status(500).send('Ошибка очистки корзины');
                      res.json({ success: true });
                  });
              });
          });
      });
  });
});

// DELETE для corzina
app.delete('/api/corzina/:id', (req, res) => {
  const { id } = req.params;
  db.getConnection((err, connection) => {
      if (err) return res.status(500).send('Ошибка подключения');
      connection.query('USE Diplom', (err) => {
          if (err) {
              connection.release();
              return res.status(500).send('Ошибка переключения');
          }
          connection.query('DELETE FROM corzina WHERE id = ?', [id], (err) => {
              connection.release();
              if (err) return res.status(500).send('Ошибка удаления');
              res.json({ success: true });
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
      connection.query('USE Diplom', (err) => {
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
app.post('/api/register', (req, res) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error('Ошибка при подключении к базе данных:', err);
      return res.status(500).json({ success: false, message: 'Ошибка подключения к базе данных' });
    }

    connection.query('USE Diplom', (err) => {
      if (err) {
        connection.release();
        console.error('Ошибка выбора базы данных:', err);
        return res.status(500).json({ success: false, message: 'Ошибка выбора базы данных' });
      }

      const { имя_пользователя, электронная_почта, пароль, роль } = req.body; // дата_создания исключена

      const query = 'INSERT INTO users (имя_пользователя, электронная_почта, пароль, роль) VALUES (?, ?, ?, ?)';
      connection.query(query, [имя_пользователя, электронная_почта, пароль, роль], (err, results) => {
        connection.release();
        if (err) {
          console.error('Ошибка при регистрации пользователя:', err);
          return res.status(500).json({ success: false, message: 'Ошибка при регистрации пользователя' });
        }
        res.json({ success: true, message: 'Пользователь успешно зарегистрирован' });
      });
    });
  });
});
// Роут для аутентификации пользователя
app.post('/api/login', (req, res) => {
  const { имя_пользователя, пароль } = req.body;

  db.getConnection((err, connection) => {
    if (err) {
      console.error('Ошибка при подключении к базе данных:', err);
      return res.status(500).json({ success: false, message: 'Ошибка подключения к базе данных' });
    }

    connection.query('USE Diplom', (err) => {
      if (err) {
        connection.release();
        console.error('Ошибка выбора базы данных:', err);
        return res.status(500).json({ success: false, message: 'Ошибка выбора базы данных' });
      }

      const query = 'SELECT * FROM users WHERE имя_пользователя = ? AND пароль = ?';
      connection.query(query, [имя_пользователя, пароль], (err, results) => {
        connection.release();
        if (err) {
          console.error('Ошибка при аутентификации пользователя:', err);
          return res.status(500).json({ success: false, message: 'Ошибка при аутентификации пользователя' });
        }

        if (results.length === 0) {
          return res.status(401).json({ success: false, message: 'Неправильное имя пользователя или пароль' });
        }

        const user = results[0];
        const token = jwt.sign({ имя_пользователя }, secretKey, { expiresIn: '1h' });
        res.json({ success: true, token, роль: user.роль, userId: user.id }); // Возвращаем роль и id пользователя
      });
    });
  });
});
// Проверка токена
app.get('/api/check-token', (req, res) => {
  db.getConnection((err, connection) => {
    if (err) throw err;
    connection.query('USE authdb', (err) => {
      if (err) {
        connection.release();
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

        res.json({ success: true, user: decoded });
      });
    });
  });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});