const postgresClient = require('../db/database.js');

const executeDBQuery = async (query) => {
    let result;
    try {
        await postgresClient.connect();
        result = await postgresClient.query(query);
        postgresClient.end();
    } catch (error) {
        console.error(error.message);
        result = error;
    }
    return result;
}

module.exports = executeDBQuery;