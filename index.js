const express = require('express'); 
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const session = require('express-session');
require('dotenv').config();

app.use(express.static('Public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
    secret: 'queuesmartsecret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
})); 

const db = mysql.createConnection({
    host: 'localhost',
    user: 'user_queue',
    password: '!(ZsfoB06t/GTLgT',
    database: 'queuesmart_queue'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to QueueSmart database.');
});


app.get('/', (req, res) => {
    res.sendFile(__dirname + "/Public/index.html");
});

app.get('/admin/login', (req, res) => {
    res.sendFile(__dirname + "/Public/login.html");
});

app.get('/dashboard', (req, res) => {
    if (!req.session.admin) return res.redirect('/admin/login');
    res.sendFile(__dirname + "/Public/dashboard.html");
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const sql = 'SELECT * FROM admins WHERE username = ? AND password = ? LIMIT 1';

  db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    req.session.admin ={
        id: results[0].id,
        username: results[0].username
    };
    res.json({
      message: 'Login successful',
      redirect: '/dashboard'
    });
  });
});

app.post('/queue/add', (req, res) => {
    const { fullName, phone, email, gender, dob, service_type, notes } = req.body;

    if (!fullName || !phone || !service_type) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    db.query('SELECT COUNT(*) AS count FROM queue_entries', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        const queueCount = results[0].count + 1;
        const queue_number = `B-${1000 + queueCount}`;
        const position = queueCount;

        const estimated_wait = (position - 1) * 5;

        const insertQuery = `
            INSERT INTO queue_entries 
            (queue_number, full_name, phone, email, gender, dob, service_type, notes, position)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        db.query(insertQuery, [queue_number, fullName, phone, email, gender, dob, service_type, notes, position], (err) => {
            if (err) return res.status(500).json({ error: 'Failed to add to queue' });

            res.json({
                success: true,
                queue_number,
                position,
                estimated_wait
            });
        });
    });
});

app.get('/queue/list', (req, res) => {
  const sql = 'SELECT * FROM queue_entries ORDER BY position ASC';

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    res.json({
      success: true,
      entries: results
    });
  });
});

app.get('/queue/status', (req, res) =>{
    const { queue_number } = req.query;

    if (!queue_number) {
        return res.json({
            success: false,
            message: 'Queue number is required'
        });
    }

    const customerQuery = `
    SELECT * FROM queue_entries
    WHERE queue_number = ?
    LIMIT 1
    `;

    db.query(customerQuery, [queue_number], (err, customerResult) => {
        if (err){
            return res.status(500).json({ success: false, message: 'Database error'});
        }
        if (customerResult.length === 0){
            return res.json({ success: false, message: 'Queue number not found'});
        }
        const position = posResult[0].position + 1;
        const estimated_wait = position * 5;

        res.json({
            success: true,
            queue_number: customer.queue_number,
            status: customer.status,
            position,
            estimated_wait
        });
    });
});

app.post('/queue/serve', (req, res) => {
  const sql = `
    SELECT * FROM queue_entries
    WHERE status = 'waiting'
    ORDER BY position ASC
    LIMIT 1
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    if (results.length === 0) {
      return res.json({
        success: false,
        message: 'No waiting customer'
      });
    }

    const customer = results[0];

    const updateSql = `
      UPDATE queue_entries
      SET status = 'serving', serve_time = NOW()
      WHERE id = ?
    `;

    db.query(updateSql, [customer.id], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          message: 'Failed to update status'
        });
      }

      res.json({
        success: true,
        customer
      });
    });
  });
});

app.post('/queue/skip', (req, res) => {
    const { queue_number } = req.body || {};

    if (!queue_number) {
        return res.status(400).json({ error: 'Queue number required' });
    }

    console.log('Attempting to skip queue_number:', queue_number);

    const query = 'UPDATE queue_entries SET status = "skipped" WHERE queue_number = ?';
    db.query(query, [queue_number], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Queue number not found' });
        }

        console.log('Rows affected:', result.affectedRows);
        res.json({ success: true, affected: result.affectedRows });
    });
});

app.get('/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

app.listen(3000, () => {
    console.log('Server started at Port 3000');
});