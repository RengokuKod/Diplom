const { faker } = require('@faker-js/faker');

const seedDatabase = (db, callback) => {
    db.getConnection((err, connection) => {
        if (err) {
            return callback(err);
        }

        connection.query('USE Diplom', (err) => {
            if (err) {
                connection.release();
                return callback(err);
            }

            // Заполняем таблицу users
            const users = [];
            for (let i = 0; i < 10; i++) {
                users.push([
                    faker.internet.userName(),
                    faker.internet.email(),
                    faker.internet.password(),
                    'user',
                    faker.date.past().toISOString().split('T')[0]
                ]);
            }

            const queryUsers = `
                INSERT INTO users (имя_пользователя, электронная_почта, пароль, роль, дата_создания)
                VALUES ?
            `;

            connection.query(queryUsers, [users], (err) => {
                if (err) return callback(err);
                console.log('Таблица users успешно заполнена');

                // Заполняем таблицу category
                const categories = [];
                for (let i = 0; i < 10; i++) {
                    categories.push([
                        faker.commerce.department(),
                        faker.commerce.productDescription(),
                        faker.date.past().toISOString().split('T')[0],
                        faker.date.recent().toISOString().split('T')[0],
                        faker.name.findName(),
                        faker.name.findName(),
                        faker.random.number({ min: 1, max: 50 }),
                        'активно',
                    ]);
                }

                const queryCategory = `
                    INSERT INTO category (название, описание, дата_создания, дата_обновления, создатель, обновлено_пользователем, количество_продуктов, статус)
                    VALUES ?
                `;

                connection.query(queryCategory, [categories], (err) => {
                    if (err) return callback(err);
                    console.log('Таблица category успешно заполнена');

                    // Заполняем таблицу product
                    const products = [];
                    for (let i = 0; i < 10; i++) {
                        products.push([
                            faker.commerce.productName(),
                            faker.commerce.productDescription(),
                            faker.commerce.price(5, 1000, 2),
                            faker.random.number({ min: 0, max: 500 }),
                            faker.random.number({ min: 1, max: 10 }), // category_id
                            faker.date.past().toISOString().split('T')[0],
                            faker.date.recent().toISOString().split('T')[0],
                            'доступно',
                        ]);
                    }

                    const queryProduct = `
                        INSERT INTO product (название, описание, цена, запасы, категория_id, дата_создания, дата_обновления, статус)
                        VALUES ?
                    `;

                    connection.query(queryProduct, [products], (err) => {
                        if (err) return callback(err);
                        console.log('Таблица product успешно заполнена');
                        
                        connection.release();
                        callback(); // Завершаем выполнение
                    });
                });
            });
        });
    });
};

module.exports = seedDatabase;