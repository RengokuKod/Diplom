const { faker } = require('@faker-js/faker');

const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
};

const seedDatabase = (db, callback) => {
    db.getConnection((err, connection) => {
        if (err) return callback(err);

        connection.query('USE Diplom', (err) => {
            if (err) {
                connection.release();
                return callback(err);
            }

            const truncateTables = () => {
                connection.query('SET FOREIGN_KEY_CHECKS = 0', (err) => {
                    if (err) return callback(err);
                    ['vopros', 'opisanie', 'otziv', 'corzina', 'zakaz', 'izbran', 'postavshik', 'product', 'category', 'users'].forEach(table => {
                        connection.query(`TRUNCATE TABLE ${table}`, (err) => {
                            if (err) return callback(err);
                        });
                    });
                    connection.query('SET FOREIGN_KEY_CHECKS = 1', (err) => {
                        if (err) return callback(err);
                        fillUsers();
                    });
                });
            };

            const fillUsers = () => {
                const users = [];
                for (let i = 0; i < 20; i++) {
                    users.push([
                        faker.internet.username(),
                        faker.internet.email(),
                        faker.internet.password(),
                        'user',
                        `https://randomuser.me/api/portraits/men/${i + 1}.jpg`,
                        formatDate(faker.date.past())
                    ]);
                }
                connection.query('INSERT INTO users (имя_пользователя, электронная_почта, пароль, роль, фото, дата_создания) VALUES ?', [users], (err) => {
                    if (err) return callback(err);
                    console.log('Таблица users заполнена');
                    fillCategories();
                });
            };

            const fillCategories = () => {
                const categories = [
                    ['Маршрутизаторы', 'Устройства для маршрутизации трафика.', formatDate(faker.date.past()), faker.person.fullName(), 10, 'https://picsum.photos/200?category=router'],
                    ['Коммутаторы', 'Устройства для соединения сетей.', formatDate(faker.date.past()), faker.person.fullName(), 10, 'https://picsum.photos/200?category=switch'],
                    ['Беспроводные точки доступа', 'Для беспроводных сетей.', formatDate(faker.date.past()), faker.person.fullName(), 10, 'https://picsum.photos/200?category=accesspoint'],
                    ['Сетевые адаптеры', 'Для подключения к сети.', formatDate(faker.date.past()), faker.person.fullName(), 10, 'https://picsum.photos/200?category=adapter'],
                    ['Модемы', 'Для интернета.', formatDate(faker.date.past()), faker.person.fullName(), 10, 'https://picsum.photos/200?category=modem'],
                    ['Кабели и аксессуары', 'Для сетей.', formatDate(faker.date.past()), faker.person.fullName(), 10, 'https://picsum.photos/200?category=cable'],
                    ['Серверное оборудование', 'Для серверов.', formatDate(faker.date.past()), faker.person.fullName(), 10, 'https://picsum.photos/200?category=server'],
                    ['IP-камеры', 'Для видеонаблюдения.', formatDate(faker.date.past()), faker.person.fullName(), 10, 'https://picsum.photos/200?category=camera'],
                    ['Сетевые хранилища (NAS)', 'Для хранения данных.', formatDate(faker.date.past()), faker.person.fullName(), 10, 'https://picsum.photos/200?category=nas'],
                    ['VoIP-телефоны', 'Для IP-телефонии.', formatDate(faker.date.past()), faker.person.fullName(), 10, 'https://picsum.photos/200?category=voip']
                ];
                connection.query('INSERT INTO category (название, описание, дата_создания, создатель, количество_продуктов, фото) VALUES ?', [categories], (err) => {
                    if (err) return callback(err);
                    console.log('Таблица category заполнена');
                    fillProducts();
                });
            };

            const fillProducts = () => {
                connection.query('SELECT id, название FROM category', (err, categoryResults) => {
                    if (err) return callback(err);
                    const categoryMap = categoryResults.reduce((map, cat) => {
                        map[cat.название] = cat.id;
                        return map;
                    }, {});

                    const products = [];
                    const productTemplates = [
                        { category: 'Маршрутизаторы', prefix: 'Маршрутизатор', desc: 'Для дома и офиса.', photo: 'https://picsum.photos/200?router' },
                        { category: 'Коммутаторы', prefix: 'Коммутатор', desc: 'Для сетей.', photo: 'https://picsum.photos/200?switch' },
                        { category: 'Беспроводные точки доступа', prefix: 'Точка доступа', desc: 'Беспроводная.', photo: 'https://picsum.photos/200?accesspoint' },
                        { category: 'Сетевые адаптеры', prefix: 'Адаптер', desc: 'Для ПК.', photo: 'https://picsum.photos/200?adapter' },
                        { category: 'Модемы', prefix: 'Модем', desc: 'Для интернета.', photo: 'https://picsum.photos/200?modem' },
                        { category: 'Кабели и аксессуары', prefix: 'Кабель', desc: 'Для сетей.', photo: 'https://picsum.photos/200?cable' },
                        { category: 'Серверное оборудование', prefix: 'Сервер', desc: 'Для серверов.', photo: 'https://picsum.photos/200?server' },
                        { category: 'IP-камеры', prefix: 'Камера', desc: 'Для наблюдения.', photo: 'https://picsum.photos/200?camera' },
                        { category: 'Сетевые хранилища (NAS)', prefix: 'NAS', desc: 'Для данных.', photo: 'https://picsum.photos/200?nas' },
                        { category: 'VoIP-телефоны', prefix: 'Телефон', desc: 'Для IP-телефонии.', photo: 'https://picsum.photos/200?voip' }
                    ];

                    for (let i = 0; i < 100; i++) {
                        const template = productTemplates[i % 10];
                        const categoryId = categoryMap[template.category];
                        products.push([
                            `${template.prefix} ${faker.company.name()} ${faker.string.alphanumeric(3)}`,
                            `${template.desc} ${faker.lorem.sentence()}`,
                            faker.number.float({ min: 999, max: 19999, precision: 0.01 }),
                            faker.number.int({ min: 0, max: 500 }),
                            template.category,
                            categoryId,
                            formatDate(faker.date.past()),
                            template.photo
                        ]);
                    }

                    connection.query('INSERT INTO product (название, описание, цена, запасы, категория, категория_id, дата_создания, фото) VALUES ?', [products], (err) => {
                        if (err) return callback(err);
                        console.log('Таблица product заполнена');
                        fillOpisanie();
                    });
                });
            };

            const fillOpisanie = () => {
                connection.query('SELECT id FROM product', (err, productResults) => {
                    if (err) return callback(err);
                    const opisanie = [];
                    productResults.forEach(product => {
                        opisanie.push([
                            product.id,
                            faker.company.name(),
                            faker.string.alphanumeric(5),
                            faker.number.float({ min: 0.1, max: 10, precision: 0.1 }),
                            `${faker.number.int({ max: 50 })}x${faker.number.int({ max: 50 })}x${faker.number.int({ max: 50 })} см`,
                            faker.number.int({ min: 10, max: 1000 }),
                            `${faker.number.int({ min: 100, max: 1000 })} Мбит/с`,
                            faker.lorem.sentence(),
                            faker.number.int({ min: 12, max: 36 })
                        ]);
                    });
                    connection.query('INSERT INTO opisanie (продукт_id, бренд, модель, вес, размеры, мощность, скорость, совместимость, гарантия) VALUES ?', [opisanie], (err) => {
                        if (err) return callback(err);
                        console.log('Таблица opisanie заполнена');
                        fillPostavshik();
                    });
                });
            };

            const fillPostavshik = () => {
                const suppliers = [];
                for (let i = 0; i < 20; i++) {
                    const phone = `+7 (${faker.number.int({ min: 900, max: 999 })}) ${faker.number.int({ min: 100, max: 999 })}-${faker.number.int({ min: 10, max: 99 })}-${faker.number.int({ min: 10, max: 99 })}`;
                    suppliers.push([
                        faker.company.name(),
                        faker.number.float({ min: 1, max: 5, precision: 0.1 }),
                        faker.number.int({ min: 50, max: 500 }),
                        faker.number.int({ min: 5, max: 50 }),
                        faker.number.int({ min: 2000, max: 2023 }),
                        phone,
                        `https://picsum.photos/200?supplier${i}`
                    ]);
                }
                connection.query('INSERT INTO postavshik (название, рэйтинг, количество_заказов, количество_курьеров, год_основания, телефон, фото) VALUES ?', [suppliers], (err) => {
                    if (err) return callback(err);
                    console.log('Таблица postavshik заполнена');
                    fillOtziv();
                });
            };

            const fillOtziv = () => {
                connection.query('SELECT id FROM users', (err, userResults) => {
                    if (err) return callback(err);
                    const userIds = userResults.map(result => result.id);

                    connection.query('SELECT id, категория, фото FROM product', (err, productResults) => {
                        if (err) return callback(err);
                        const productIds = productResults.map(result => result.id);
                        const products = productResults;

                        const otzivi = [];
                        const commentsByCategory = {
                            'Маршрутизаторы': ['Скорость отличная.', 'Сигнал стабильный.', 'Интерфейс сложноват.'],
                            'Коммутаторы': ['Надежный.', 'Порты быстрые.', 'Тихий.'],
                            'Беспроводные точки доступа': ['Мощный сигнал.', 'Быстрая настройка.', 'Большое покрытие.'],
                            'Сетевые адаптеры': ['Легко подключился.', 'Скорость выросла.', 'Компактный.'],
                            'Модемы': ['Стабильный интернет.', 'Прост в настройке.', 'Доволен покупкой.'],
                            'Кабели и аксессуары': ['Качественный кабель.', 'Прочный.', 'Хорошая цена.'],
                            'Серверное оборудование': ['Мощное.', 'Без перегрева.', 'Отличная производительность.'],
                            'IP-камеры': ['Четкое изображение.', 'Легко подключается.', 'Хорошая камера.'],
                            'Сетевые хранилища (NAS)': ['Быстрый доступ.', 'Надежное хранилище.', 'Интуитивный интерфейс.'],
                            'VoIP-телефоны': ['Чистый звук.', 'Простая настройка.', 'Качество связи отличное.']
                        };

                        for (let i = 0; i < 500; i++) {
                            const productId = faker.helpers.arrayElement(productIds);
                            const product = products.find(p => p.id === productId);
                            otzivi.push([
                                faker.number.float({ min: 1, max: 5, precision: 0.1 }),
                                faker.helpers.arrayElement(userIds),
                                productId,
                                faker.helpers.arrayElement(commentsByCategory[product.категория]),
                                formatDate(faker.date.past()),
                                product.фото
                            ]);
                        }

                        connection.query('INSERT INTO otziv (рейтинг, пользователь_id, продукт_id, комментарий, дата_создания, фото) VALUES ?', [otzivi], (err) => {
                            if (err) return callback(err);
                            console.log('Таблица otziv заполнена');
                            fillVopros();
                        });
                    });
                });
            };

            const fillVopros = () => {
                connection.query('SELECT id FROM users', (err, userResults) => {
                    if (err) return callback(err);
                    const userIds = userResults.map(result => result.id);

                    connection.query('SELECT id FROM product', (err, productResults) => {
                        if (err) return callback(err);
                        const productIds = productResults.map(result => result.id);

                        const voprosy = [];
                        for (let i = 0; i < 200; i++) {
                            voprosy.push([
                                faker.helpers.arrayElement(productIds),
                                faker.helpers.arrayElement(userIds),
                                faker.lorem.sentence() + '?',
                                formatDate(faker.date.past()),
                                i % 2 === 0 ? faker.lorem.sentence() : null
                            ]);
                        }

                        connection.query('INSERT INTO vopros (продукт_id, пользователь_id, вопрос, дата_создания, ответ) VALUES ?', [voprosy], (err) => {
                            if (err) return callback(err);
                            console.log('Таблица vopros заполнена');
                            connection.release();
                            callback();
                        });
                    });
                });
            };

            truncateTables();
        });
    });
};

module.exports = seedDatabase;