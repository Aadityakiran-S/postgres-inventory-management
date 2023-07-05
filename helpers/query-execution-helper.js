const client = require('../db/database.js');

const executeDBQuery = async (query) => {
    let result;
    try {
        result = await client.query(query);
    } catch (error) {
        console.error(error.message);
        result = error;
    }
    return result;
}

module.exports = executeDBQuery;