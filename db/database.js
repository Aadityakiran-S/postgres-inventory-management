const { Client } = require('pg');
const client = new Client({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "1996",
    database: "garibaldi"
});

client.on("connect", () => {
    console.log("DB connection established");
});

client.on("end", () => {
    console.log("Connection ended");
})

module.exports = client;