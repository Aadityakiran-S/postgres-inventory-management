const { Client } = require('pg');
require('dotenv').config();
const client = new Client({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: process.env.LOCAL_PG_PASSWORD, //1996
    database: "garibaldi"
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