// const mysql = require('mysql2');
require('dotenv').config();

// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     database: process.env.DB_NAME,
//     password: process.env.DB_PASSWORD,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

// pool.getConnection((err, connection) => {
//     if (err) {
//         console.error('Error connecting to database: ', err);
//         return;
//     }
//     console.log('DATABASE CONNECTED SUCCESSFULLY!');
//     connection.release();
// });

// module.exports = pool.promise()

function createPool() {
    try {
        const mysql = require('mysql2');

        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        const promisePool = pool.promise();

        console.log('DATABASE CONNECTED SUCCESSFULLY!');

        return promisePool;
    } catch (error) {
        return console.log(`Could not connect - ${error}`);
    }
}

const pool = createPool();

module.exports = {
    connection: async () => pool.getConnection(),
    execute: (...params) => pool.execute(...params)
};