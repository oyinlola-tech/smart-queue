const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'user_queue',
    password: '!(ZsfoB06t/GTLgT',
    database: 'user_queue'
});

connection.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL server.');

    connection.query(
        "CREATE DATABASE IF NOT EXISTS queuesmart_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci",
        (err) => {
            if (err) throw err;
            console.log('Admin database ready.');

            const adminTable = `
            CREATE TABLE IF NOT EXISTS queuesmart_admin.admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;

            connection.query(adminTable, (err) => {
                if (err) throw err;
                console.log('Admins table ready.');
            });
        }
    );

    connection.query(
        "CREATE DATABASE IF NOT EXISTS queuesmart_queue CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci",
        (err) => {
            if (err) throw err;
            console.log('Queue database ready.');

            const queueTable = `
            CREATE TABLE IF NOT EXISTS queuesmart_queue.queue_entries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                queue_number VARCHAR(10) NOT NULL UNIQUE,
                full_name VARCHAR(100) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                email VARCHAR(100),
                gender VARCHAR(20),
                dob DATE,
                service_type VARCHAR(50) NOT NULL,
                notes TEXT,
                status ENUM('waiting','serving','served','skipped') DEFAULT 'waiting',
                checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                serve_time TIMESTAMP NULL,
                position INT
            )`;

            connection.query(queueTable, (err) => {
                if (err) throw err;
                console.log('Queue entries table ready.');
                console.log('Database setup complete.');
                connection.end();
            });
        }
    );
});