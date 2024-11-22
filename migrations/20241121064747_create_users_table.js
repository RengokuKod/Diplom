/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
require('dotenv').config();
exports.up = function(knex) {
    return knex.schema.createTable('users', function(table) {
        table.increments('id').primary();
        table.string('username').notNullable().unique();
        table.string('email').notNullable().unique();
        table.string('password').notNullable();
        table.enu('role', ['user', 'admin']).defaultTo('user');  // Устанавливаем роль по умолчанию
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('users');
};
