const oracledb = require('oracledb');
require('dotenv').config();

// Log loaded environment variables for debugging
console.log('Loaded environment variables:');
console.log('ORACLE_USER:', process.env.ORACLE_USER);
console.log('ORACLE_PASSWORD:', process.env.ORACLE_PASSWORD ? '****' : 'undefined'); // Mask password
console.log('ORACLE_CONNECT:', process.env.ORACLE_CONNECT);
console.log('ORACLE_CLIENT_PATH:', process.env.ORACLE_CLIENT_PATH);

// try {
//     oracledb.initOracleClient({ libDir: process.env.ORACLE_CLIENT_PATH });
//     console.log('Oracle Client initialized successfully with path:', process.env.ORACLE_CLIENT_PATH);
// } catch (initError) {
//     console.error('Failed to initialize Oracle Client:', initError);
//     throw initError; // Re-throw to stop execution on initialization failure
// }

async function getConnection() {
    let connection;
    try {
        console.log('Attempting to establish database connection...');
        connection = await oracledb.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONNECT,
        });
        console.log('Database connection established successfully!');
        return connection;
    } catch (error) {
        console.error('Database connection error:', error);
        throw error; // Re-throw to handle upstream
    }
}

getConnection();

module.exports = getConnection;