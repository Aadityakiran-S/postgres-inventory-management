const express = require('express');
const app = express();
const routes = require('./routes/router.js');
const { urlencoded } = require('express');
require('dotenv').config();

//using the json parser
app.use(express.json());

//Setting up routes
app.use('/api/v1/users', routes);

const port = process.env.PORT || 3000;

app.listen(port, (err) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`Server is listening on port ${port}....`);
})

module.exports = app;