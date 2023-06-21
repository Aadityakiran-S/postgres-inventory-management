const client = require('../db/database.js');

const executeDBQuery = async (query) => {
    let result;
    try {
        await client.connect();
        result = await client.query(query);
    } catch (error) {
        console.error(error.message);
        result = error;
    }
    finally {
        await client.end()
    }
    return result;
}

module.exports = executeDBQuery;