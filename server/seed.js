const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);
const db = require('./db'); // Импортируем db.js для получения DB_NAME

// Устанавливаем русскую локализацию
faker.locale = 'ru';

// Получаем имя базы данных из db.js
const DB_NAME = db.DB_NAME;
if (!DB_NAME) {
    console.error('Ошибка: Имя базы данных не указано в конфигурации db.js');
    process.exit(1);
}

const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
};

const categories = [
    'Маршрутизаторы', 'Коммутаторы', 'Беспроводные точки доступа',
    'Сетевые адаптеры', 'Модемы', 'Кабели и аксессуары',
    'Серверное оборудование', 'IP-камеры', 'VoIP-телефоны'
];

// Русские названия и описания
const russianNames = {
    'Маршрутизаторы': ['TP-Link Archer', 'Asus RT', 'Zyxel Keenetic', 'MikroTik hAP', 'D-Link DIR'],
    'Коммутаторы': ['TP-Link TL-SG', 'Cisco Catalyst', 'HP ProCurve', 'D-Link DGS', 'Netgear GS'],
    'Беспроводные точки доступа': ['Ubiquiti UniFi', 'TP-Link EAP', 'MikroTik cAP', 'Aruba Instant', 'Ruckus ZoneFlex'],
    'Сетевые адаптеры': ['TP-Link Archer', 'Asus USB-AC', 'D-Link DWA', 'Netgear A7000', 'Edimax EW'],
    'Модемы': ['Huawei E3372', 'ZTE MF79', 'Alcatel Link', 'TP-Link M7200', 'Netgear Nighthawk'],
    'Кабели и аксессуары': ['Кабель UTP', 'Патч-корд', 'Коннектор RJ45', 'Кросс-панель', 'Кабель-канал'],
    'Серверное оборудование': ['Dell PowerEdge', 'HP ProLiant', 'Lenovo ThinkSystem', 'Supermicro', 'Fujitsu Primergy'],
    'IP-камеры': ['Hikvision DS', 'Dahua IPC', 'Axis Communications', 'Reolink RLC', 'TP-Link Tapo'],
    'VoIP-телефоны': ['Yealink T', 'Grandstream GXP', 'Cisco IP', 'Fanvil X', 'Snom D']
};

const russianDescriptions = {
    'Маршрутизаторы': [
        'Высокоскоростной маршрутизатор с поддержкой Wi-Fi 6',
        'Двухдиапазонный маршрутизатор с мощным процессом',
        'Профессиональный маршрутизатор для дома и офиса',
        'Компактный маршрутизатор с простой настройкой',
        'Маршрутизатор с расширенными функциями безопасности'
    ],
    'Коммутаторы': [
        'Управляемый коммутатор с поддержкой VLAN',
        'Коммутатор с портами Gigabit Ethernet',
        'Компактный настольный коммутатор',
        'Коммутатор с поддержкой PoE',
        'Профессиональный коммутатор для корпоративных сетей'
    ],
    'Беспроводные точки доступа': [
        'Точка доступа с поддержкой стандарта 802.11ac',
        'Профессиональная точка доступа для офиса',
        'Наружная точка доступа с защитой от влаги',
        'Точка доступа с поддержкой Mesh сети',
        'Компактная точка доступа для дома'
    ],
    'Сетевые адаптеры': [
        'USB адаптер с поддержкой Wi-Fi 5',
        'PCI-E сетевой адаптер для ПК',
        'Адаптер с внешней антенной',
        'Компактный USB адаптер для ноутбука',
        'Адаптер с поддержкой Bluetooth'
    ],
    'Модемы': [
        '4G LTE модем с поддержкой всех операторов',
        'Модем с разъемом для внешней антенны',
        'Компактный USB модем для путешествий',
        'Модем с поддержкой Wi-Fi',
        'Модем с Ethernet портом'
    ],
    'Кабели и аксессуары': [
        'Кабель витая пара категории 6',
        'Патч-корд с позолоченными контактами',
        'Комплект инструментов для обжима',
        'Кабель-канал для прокладки по стене',
        'Набор коннекторов RJ45'
    ],
    'Серверное оборудование': [
        'Сервер начального уровня для малого бизнеса',
        'Мощный сервер для виртуализации',
        'Сервер с поддержкой горячей замены дисков',
        'Компактный сервер для офиса',
        'Сервер с RAID контроллером'
    ],
    'IP-камеры': [
        'Камера с разрешением 4K',
        'Уличная камера с ИК подсветкой',
        'Камера с поворотным механизмом',
        'Компактная камера для дома',
        'Камера с поддержкой PoE'
    ],
    'VoIP-телефоны': [
        'IP телефон с цветным экраном',
        'Беспроводной VoIP телефон',
        'Телефон с поддержкой гарнитуры',
        'Бюджетный IP телефон',
        'Телефон с сенсорным экраном'
    ]
};

// Заготовленные вопросы и ответы
const questionsByCategory = {
    'Маршрутизаторы': [
        { question: 'Какой радиус действия у этого маршрутизатора?', answer: 'Радиус действия до 50 метров в помещении.' },
        { question: 'Поддерживает ли он двухдиапазонный Wi-Fi?', answer: 'Да, поддерживает 2.4 ГГц и 5 ГГц.' },
        { question: 'Сколько устройств можно подключить одновременно?', answer: 'До 32 устройств без потери скорости.' },
        { question: 'Есть ли поддержка IPv6?', answer: 'Да, устройство полностью совместимо с IPv6.' },
        { question: 'Как настроить родительский контроль?', answer: 'Настройка доступна через веб-интерфейс в разделе "Безопасность".' }
    ],
    'Коммутаторы': [
        { question: 'Сколько портов поддерживает этот коммутатор?', answer: '8 портов Gigabit Ethernet.' },
        { question: 'Подходит ли он для офиса?', answer: 'Да, идеально для небольшого офиса.' },
        { question: 'Есть ли поддержка PoE?', answer: 'Да, некоторые модели поддерживают Power over Ethernet.' },
        { question: 'Какой максимальный трафик он выдерживает?', answer: 'До 1 Гбит/с на порт.' },
        { question: 'Требуется ли настройка?', answer: 'Нет, работает по принципу Plug-and-Play.' }
    ],
    'Беспроводные точки доступа': [
        { question: 'Какой стандарт Wi-Fi поддерживает точка?', answer: 'Wi-Fi 6 (802.11ax).' },
        { question: 'Можно ли использовать на улице?', answer: 'Некоторые модели имеют защиту IP65 для наружного использования.' },
        { question: 'Как подключить к существующей сети?', answer: 'Через кабель Ethernet или Wi-Fi.' },
        { question: 'Поддерживает ли она бесшовный роуминг?', answer: 'Да, при использовании с совместимыми устройствами.' },
        { question: 'Какой радиус покрытия?', answer: 'До 100 метров в открытом пространстве.' }
    ],
    'Сетевые адаптеры': [
        { question: 'Совместим ли адаптер с Windows 11?', answer: 'Да, драйверы доступны для Windows 11.' },
        { question: 'Какая скорость передачи данных?', answer: 'До 300 Мбит/с.' },
        { question: 'Нужен ли внешний источник питания?', answer: 'Нет, питается через USB.' },
        { question: 'Подходит ли для игр?', answer: 'Да, обеспечивает стабильное соединение.' },
        { question: 'Есть ли антенна?', answer: 'Да, встроенная антенна для улучшения сигнала.' }
    ],
    'Модемы': [
        { question: 'Поддерживает ли модем 4G?', answer: 'Да, поддерживает сети 4G LTE.' },
        { question: 'Можно ли использовать с SIM-картой?', answer: 'Да, слот для SIM-карты встроен.' },
        { question: 'Какая максимальная скорость?', answer: 'До 150 Мбит/с на загрузку.' },
        { question: 'Совместим ли с роутером?', answer: 'Да, подключается через USB или Ethernet.' },
        { question: 'Есть ли поддержка VPN?', answer: 'Некоторые модели поддерживают VPN.' }
    ],
    'Кабели и аксессуары': [
        { question: 'Какой длины кабель?', answer: 'Длина варьируется от 1 до 10 метров.' },
        { question: 'Подходит ли для Gigabit Ethernet?', answer: 'Да, кабель категории Cat6.' },
        { question: 'Есть ли экранирование?', answer: 'Да, с двойным экранированием от помех.' },
        { question: 'Можно ли использовать для PoE?', answer: 'Да, поддерживает Power over Ethernet.' },
        { question: 'Какой материал оболочки?', answer: 'Прочный ПВХ или нейлоновая оплётка.' }
    ],
    'Серверное оборудование': [
        { question: 'Какой процессор используется?', answer: 'Intel Xeon или AMD EPYC в зависимости от модели.' },
        { question: 'Сколько слотов для RAM?', answer: 'До 8 слотов DDR4.' },
        { question: 'Поддерживает ли RAID?', answer: 'Да, встроенный контроллер RAID 0/1/5/10.' },
        { question: 'Какое охлаждение?', answer: 'Активное охлаждение с двумя вентиляторами.' },
        { question: 'Можно ли установить SSD?', answer: 'Да, есть слоты для NVMe SSD.' }
    ],
    'IP-камеры': [
        { question: 'Какое разрешение видео?', answer: 'Full HD 1080p или 4K в зависимости от модели.' },
        { question: 'Есть ли ночное видение?', answer: 'Да, до 10 метров в темноте.' },
        { question: 'Поддерживает ли запись на карту?', answer: 'Да, слот для microSD до 128 ГБ.' },
        { question: 'Можно ли управлять через приложение?', answer: 'Да, через мобильное приложение.' },
        { question: 'Какой угол обзора?', answer: 'От 90 до 120 градусов.' }
    ],
    'VoIP-телефоны': [
        { question: 'Поддерживает ли SIP?', answer: 'Да, совместим с большинством SIP-серверов.' },
        { question: 'Есть ли громкая связь?', answer: 'Да, встроенный динамик и микрофон.' },
        { question: 'Можно ли подключить гарнитуру?', answer: 'Да, есть разъём 3.5 мм или Bluetooth.' },
        { question: 'Какое качество звука?', answer: 'HD-звук с шумоподавлением.' },
        { question: 'Сколько линий поддерживает?', answer: 'До 4 линий одновременно.' }
    ]
};

// Заготовленные совместимости
const compatibilityByCategory = {
    'Маршрутизаторы': [
        'Совместим с Windows, macOS, Linux',
        'Совместим с устройствами Android и iOS',
        'Совместим с большинством провайдеров интернета',
        'Совместим с VoIP-телефонами',
        'Совместим с IP-камерами'
    ],
    'Коммутаторы': [
        'Совместим с сетевыми адаптерами',
        'Совместим с маршрутизаторами',
        'Совместим с серверным оборудованием',
        'Совместим с IP-камерами',
        'Совместим с VoIP-телефонами'
    ],
    'Беспроводные точки доступа': [
        'Совместим с маршрутизаторами',
        'Совместим с устройствами Wi-Fi 5 и Wi-Fi 6',
        'Совместим с IP-камерами',
        'Совместим с Windows и macOS'
    ],
    'Сетевые адаптеры': [
        'Совместим с Windows 7/8/10/11',
        'Совместим с Linux и macOS',
        'Совместим с USB 2.0 и 3.0',
        'Совместим с маршрутизаторами',
        'Совместим с точками доступа'
    ],
    'Модемы': [
        'Совместим с SIM-картами любых операторов',
        'Совместим с Windows и macOS',
        'Совместим с маршрутизаторами',
        'Совместим с Android через USB',
        'Совместим с сетями 3G/4G'
    ],
    'Кабели и аксессуары': [
        'Совместим с Gigabit Ethernet',
        'Совместим с маршрутизаторами и коммутаторами',
        'Совместим с сетевыми адаптерами',
        'Совместим с PoE-устройствами',
        'Совместим с IP-камерами'
    ],
    'Серверное оборудование': [
        'Совместим с Windows Server',
        'Совместим с Linux-дистрибутивами',
        'Совместим с RAID-контроллерами',
        'Совместим с коммутаторами'
    ],
    'IP-камеры': [
        'Совместим с маршрутизаторами',
        'Совместим с Windows и Android',
        'Совместим с приложениями видеонаблюдения',
        'Совместим с PoE-коммутаторами'
    ],
    'VoIP-телефоны': [
        'Совместим с SIP-серверами',
        'Совместим с маршрутизаторами',
        'Совместим с Windows и macOS',
        'Совместим с Bluetooth-гарнитурами'
    ]
};

const seedDatabase = (db, callback) => {
    db.getConnection((err, connection) => {
        if (err) {
            console.error('Ошибка подключения к базе данных:', err);
            return callback(err);
        }

        connection.query('USE ??', [DB_NAME], (err) => {
            if (err) {
                console.error(`Ошибка выбора базы данных ${DB_NAME}:`, err);
                connection.release();
                return callback(err);
            }

            const truncateTables = () => {
                connection.query('SET FOREIGN_KEY_CHECKS = 0', (err) => {
                    if (err) {
                        console.error('Ошибка отключения проверки внешних ключей:', err);
                        connection.release();
                        return callback(err);
                    }
                    const tables = ['vopros', 'opisanie', 'otziv', 'corzina', 'zakaz', 'izbran', 'postavshik', 'product', 'category', 'users', 'contact'];
                    let completed = 0;
                    tables.forEach(table => {
                        connection.query(`TRUNCATE TABLE ${table}`, (err) => {
                            if (err) {
                                console.error(`Ошибка очистки таблицы ${table}:`, err);
                                connection.release();
                                return callback(err);
                            }
                            completed++;
                            if (completed === tables.length) {
                                connection.query('SET FOREIGN_KEY_CHECKS = 1', (err) => {
                                    if (err) {
                                        console.error('Ошибка включения проверки внешних ключей:', err);
                                        connection.release();
                                        return callback(err);
                                    }
                                    fillUsers();
                                });
                            }
                        });
                    });
                });
            };

            const fillUsers = () => {
                const users = [];
                for (let i = 0; i < 20; i++) {
                    users.push([
                        faker.internet.userName(),
                        faker.internet.email(),
                        faker.internet.password(),
                        i === 0 ? 'admin' : 'user',
                        `/assets/users/user${i + 1}.jpg`,
                        formatDate(faker.date.past())
                    ]);
                }

                connection.query('INSERT INTO users (имя_пользователя, электронная_почта, пароль, роль, фото, дата_создания) VALUES ?', 
                    [users], (err) => {
                        if (err) {
                            console.error('Ошибка заполнения таблицы users:', err);
                            connection.release();
                            return callback(err);
                        }
                        console.log('Таблица users заполнена');
                        fillCategories();
                    });
            };

            const fillCategories = () => {
                const categoryData = categories.map(category => [
                    category,
                    `Описание для ${category}`,
                    formatDate(faker.date.past()),
                    faker.person.fullName(),
                    15,
                    `/assets/category/${category.replace(/\s+/g, '_')}.jpg`
                ]);

                connection.query('INSERT INTO category (название, описание, дата_создания, создатель, количество_продуктов, фото) VALUES ?', 
                    [categoryData], (err) => {
                        if (err) {
                            console.error('Ошибка заполнения таблицы category:', err);
                            connection.release();
                            return callback(err);
                        }
                        console.log('Таблица category заполнена');
                        fillProducts();
                    });
            };

            const fillProducts = () => {
                connection.query('SELECT id, название FROM category', (err, categoryResults) => {
                    if (err) {
                        console.error('Ошибка получения категорий:', err);
                        connection.release();
                        return callback(err);
                    }
                    
                    const products = [];
                    categoryResults.forEach(category => {
                        const catNames = russianNames[category.название] || ['Товар'];
                        const catDescs = russianDescriptions[category.название] || ['Описание товара'];
                        
                        for (let i = 1; i <= 15; i++) {
                            const productName = faker.helpers.arrayElement(catNames) + ' ' + 
                                faker.helpers.arrayElement(['Pro', 'Lite', 'Plus', 'Max', 'Ultra']);
                            
                            products.push([
                                productName,
                                faker.helpers.arrayElement(catDescs),
                                faker.number.float({ min: 500, max: 50000, fractionDigits: 2 }),
                                faker.number.int({ min: 0, max: 500 }),
                                category.название,
                                category.id,
                                formatDate(faker.date.past()),
                                `/assets/${category.название}/${i}.jpg`
                            ]);
                        }
                    });

                    connection.query('INSERT INTO product (название, описание, цена, запасы, категория, категория_id, дата_создания, фото) VALUES ?', 
                        [products], (err) => {
                            if (err) {
                                console.error('Ошибка заполнения таблицы product:', err);
                                connection.release();
                                return callback(err);
                            }
                            console.log('Таблица product заполнена');
                            fillOpisanie();
                        });
                });
            };

            const fillOpisanie = () => {
                connection.query('SELECT id, название, категория FROM product', (err, products) => {
                    if (err) {
                        console.error('Ошибка получения продуктов:', err);
                        connection.release();
                        return callback(err);
                    }
                    
                    const opisanie = products.map(product => [
                        product.id,
                        ['TP-Link', 'D-Link', 'Asus', 'Huawei', 'Cisco'][product.id % 5],
                        ['AX3000', 'AC1200', 'Gigabit', 'Pro', 'Lite'][product.id % 5],
                        faker.number.float({ min: 0.1, max: 10, fractionDigits: 1 }),
                        `${faker.number.int({ max: 50 })}x${faker.number.int({ max: 50 })}x${faker.number.int({ max: 50 })} см`,
                        faker.number.int({ min: 10, max: 1000 }),
                        `${faker.number.int({ min: 100, max: 1000 })} Мбит/с`,
                        faker.helpers.arrayElement(compatibilityByCategory[product.категория]),
                        faker.number.int({ min: 12, max: 36 }),
                        `/assets/${product.категория}/`
                    ]);

                    connection.query('INSERT INTO opisanie (продукт_id, бренд, модель, вес, размеры, мощность, скорость, совместимость, гарантия, фото_папка) VALUES ?', 
                        [opisanie], (err) => {
                            if (err) {
                                console.error('Ошибка заполнения таблицы opisanie:', err);
                                connection.release();
                                return callback(err);
                            }
                            console.log('Таблица opisanie заполнена');
                            fillPostavshik();
                        });
                });
            };

            const fillPostavshik = () => {
                const suppliers = [];
                const russianCompanies = [
                    'Ростелеком', 'МТС', 'Билайн', 'Мегафон', 'ЭР-Телеком',
                    'ТрансТелеКом', 'Ростех', 'Крок', 'Техносерв', 'Ланит'
                ];
                
                for (let i = 0; i < 10; i++) {
                    const phone = `+7${faker.number.int({ min: 900, max: 999 })}${faker.number.int({ min: 1000000, max: 9999999 })}`;
                    suppliers.push([
                        russianCompanies[i] || faker.company.name(),
                        faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
                        faker.number.int({ min: 50, max: 500 }),
                        faker.number.int({ min: 5, max: 50 }),
                        faker.number.int({ min: 2000, max: 2023 }),
                        phone,
                        `/assets/postavshik/${i + 1}.jpg`
                    ]);
                }

                connection.query('INSERT INTO postavshik (название, рэйтинг, количество_заказов, количество_курьеров, год_основания, телефон, фото) VALUES ?', 
                    [suppliers], (err) => {
                        if (err) {
                            console.error('Ошибка заполнения таблицы postavshik:', err);
                            connection.release();
                            return callback(err);
                        }
                        console.log('Таблица postavshik заполнена');
                        fillOtziv();
                    });
            };

            const fillOtziv = () => {
                connection.query('SELECT id FROM users', (err, userResults) => {
                    if (err) {
                        console.error('Ошибка получения пользователей:', err);
                        connection.release();
                        return callback(err);
                    }
                    const userIds = userResults.map(result => result.id);

                    connection.query('SELECT id, категория, фото FROM product', (err, productResults) => {
                        if (err) {
                            console.error('Ошибка получения продуктов:', err);
                            connection.release();
                            return callback(err);
                        }
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
                            'VoIP-телефоны': ['Чистый звук.', 'Простая настройка.', 'Качество связи отличное.']
                        };

                        for (let i = 0; i < 200; i++) {
                            const productId = faker.helpers.arrayElement(productIds);
                            const product = products.find(p => p.id === productId);
                            otzivi.push([
                                faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
                                faker.helpers.arrayElement(userIds),
                                productId,
                                faker.helpers.arrayElement(commentsByCategory[product.категория] || ['Хороший продукт.']),
                                formatDate(faker.date.past()),
                                product.фото
                            ]);
                        }

                        connection.query('INSERT INTO otziv (рейтинг, пользователь_id, продукт_id, комментарий, дата_создания, фото) VALUES ?', 
                            [otzivi], (err) => {
                                if (err) {
                                    console.error('Ошибка заполнения таблицы otziv:', err);
                                    connection.release();
                                    return callback(err);
                                }
                                console.log('Таблица otziv заполнена');
                                fillVopros();
                            });
                    });
                });
            };

            const fillVopros = () => {
                connection.query('SELECT id FROM users', (err, userResults) => {
                    if (err) {
                        console.error('Ошибка получения пользователей:', err);
                        connection.release();
                        return callback(err);
                    }
                    const userIds = userResults.map(result => result.id);

                    connection.query('SELECT id, категория FROM product', (err, productResults) => {
                        if (err) {
                            console.error('Ошибка получения продуктов:', err);
                            connection.release();
                            return callback(err);
                        }
                        const productIds = productResults.map(result => result.id);
                        const products = productResults;

                        const voprosy = [];
                        for (let i = 0; i < 200; i++) {
                            const productId = faker.helpers.arrayElement(productIds);
                            const product = products.find(p => p.id === productId);
                            const categoryQuestions = questionsByCategory[product.категория] || [];
                            const qa = categoryQuestions.length ? faker.helpers.arrayElement(categoryQuestions) : { question: 'Общий вопрос?', answer: null };
                            const hasAnswer = Math.random() < 0.75;
                            voprosy.push([
                                productId,
                                faker.helpers.arrayElement(userIds),
                                qa.question,
                                formatDate(faker.date.past()),
                                hasAnswer ? (qa.answer || 'Общий ответ.') : null
                            ]);
                        }

                        connection.query('INSERT INTO vopros (продукт_id, пользователь_id, вопрос, дата_создания, ответ) VALUES ?', 
                            [voprosy], (err) => {
                                if (err) {
                                    console.error('Ошибка заполнения таблицы vopros:', err);
                                    connection.release();
                                    return callback(err);
                                }
                                console.log('Таблица vopros заполнена');
                                fillContact();
                            });
                    });
                });
            };

            const fillContact = () => {
                const contacts = [];
                for (let i = 0; i < 20; i++) {
                    contacts.push([
                        faker.person.fullName(),
                        faker.internet.email(),
                        faker.lorem.sentence(),
                        'нет',
                        formatDate(faker.date.past())
                    ]);
                }

                connection.query('INSERT INTO contact (имя, email, сообщение, выполнено, дата_создания) VALUES ?', 
                    [contacts], (err) => {
                        connection.release();
                        if (err) {
                            console.error('Ошибка заполнения таблицы contact:', err);
                            return callback(err);
                        }
                        console.log('Таблица contact заполнена');
                        callback(null);
                    });
            };

            truncateTables();
        });
    });
};

module.exports = seedDatabase;