const { Pool, Client } = require('pg');
require('dotenv').config();

const client = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: `${process.env.DB_PASSWORD}`,
    database: process.env.DB_NAME,
    max: 20,
    connectionTimeoutMillis: 0,
    idleTimeoutMillis: 0
});

client.on("connect", () => {
    console.log("DB connection established");
});

client.on("end", () => {
    console.log("Connection ended");
})

client.on('row', (row) => {
    console.log('row!', row);
})

client.on('error', (err) => {
    console.error(err.stack);
})

module.exports = client;