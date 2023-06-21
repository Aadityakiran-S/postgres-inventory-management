const client = require('../db/database.js');

const executeDBQuery = async (query, values = []) => {
    let result;
    try {
        await client.connect();
        result = await client.query(query, values);
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