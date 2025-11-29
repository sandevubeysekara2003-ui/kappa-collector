const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'swu_evaluation',
    port: process.env.DB_PORT || 3306
};

let db;

async function initDb() {
    try {
        console.log('🔧 Connecting to MySQL database...');
        db = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL database');

        await db.execute(`CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            qualification VARCHAR(255),
            email VARCHAR(255) NOT NULL UNIQUE,
            experience TEXT,
            password VARCHAR(255) NOT NULL,
            createdAt DATETIME NOT NULL
        )`);
        console.log('✅ Users table ready');

        await db.execute(`CREATE TABLE IF NOT EXISTS evaluations (
            id VARCHAR(255) PRIMARY KEY,
            userId VARCHAR(255) NOT NULL,
            question1 INT NOT NULL,
            question2 INT NOT NULL,
            question3 INT NOT NULL,
            question4 INT NOT NULL,
            question5 INT NOT NULL,
            question6 INT NOT NULL,
            question7 INT NOT NULL,
            question8 INT NOT NULL,
            question9 INT NOT NULL,
            question10 INT NOT NULL,
            remarks TEXT,
            submittedAt DATETIME NOT NULL,
            FOREIGN KEY (userId) REFERENCES users(id)
        )`);
        console.log('✅ Evaluations table ready');

    } catch (err) {
        console.error('❌ Database connection failed:', err);
        throw err;
    }
}

function authMiddleware(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

app.post('/api/register', async (req, res) => {
    try {
        const { name, qualification, email, experience, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'name, email, password required' });
        }
        
        const [rows] = await db.execute('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
        if (rows.length) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        const hashed = await bcrypt.hash(password, 10);
        const id = Date.now().toString();
        const createdAt = new Date();
        
        await db.execute(
            'INSERT INTO users (id, name, qualification, email, experience, password, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, name, qualification || '', email.toLowerCase(), experience || '', hashed, createdAt]
        );
        
        const token = jwt.sign({ id, email: email.toLowerCase(), isAdmin: false }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ 
            token, 
            user: { 
                id, 
                name, 
                email: email.toLowerCase(), 
                qualification: qualification || '', 
                experience: experience || '',
                isAdmin: false
            } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'email and password required' });
        }
        
        if (email.toLowerCase() === 'admin@venu.com' && password === 'admin1234') {
            const adminUser = {
                id: 'admin',
                name: 'Admin',
                email: 'admin@venu.com',
                qualification: 'Administrator',
                experience: '',
                isAdmin: true
            };
            const token = jwt.sign({ id: adminUser.id, email: adminUser.email, isAdmin: true }, JWT_SECRET, { expiresIn: '7d' });
            return res.json({ token, user: adminUser });
        }
        
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
        const user = rows[0];
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: user.id, email: user.email, isAdmin: false }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                qualification: user.qualification, 
                experience: user.experience, 
                isAdmin: false 
            } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/me', authMiddleware, async (req, res) => {
    try {
        if (req.user.id === 'admin') {
            return res.json({
                id: 'admin',
                name: 'Admin',
                email: 'admin@venu.com',
                qualification: 'Administrator',
                experience: '',
                isAdmin: true
            });
        }
        
        const [rows] = await db.execute('SELECT id, name, email, qualification, experience FROM users WHERE id = ?', [req.user.id]);
        const user = rows[0];
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ ...user, isAdmin: false });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/evaluation/submit', authMiddleware, async (req, res) => {
    try {
        const { userId, responses, remarks } = req.body;
        
        if (!userId || !responses) {
            return res.status(400).json({ error: 'userId and responses are required' });
        }

        if (userId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const [existing] = await db.execute('SELECT id FROM evaluations WHERE userId = ?', [userId]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'You have already submitted your evaluation' });
        }

        const id = Date.now().toString();
        const submittedAt = new Date();

        await db.execute(
            `INSERT INTO evaluations 
                (id, userId, question1, question2, question3, question4, question5, question6,
                 question7, question8, question9, question10, remarks, submittedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, userId,
                responses[1], responses[2], responses[3], responses[4],
                responses[5], responses[6], responses[7], responses[8],
                responses[9], responses[10],
                remarks || '',
                submittedAt
            ]
        );

        res.json({ 
            success: true, 
            message: 'Evaluation submitted successfully',
            id,
            submittedAt
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/admin/evaluations', authMiddleware, async (req, res) => {
    try {
        if (!req.user.isAdmin && req.user.id !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const [rows] = await db.execute(`
            SELECT 
                e.*,
                u.name as userName,
                u.email as userEmail,
                u.qualification as userQualification,
                u.experience as userExperience
            FROM evaluations e
            INNER JOIN users u ON e.userId = u.id
            ORDER BY e.submittedAt DESC
        `);

        const evaluations = rows.map(evaluation => ({
            id: evaluation.id,
            userId: evaluation.userId,
            userName: evaluation.userName,
            userEmail: evaluation.userEmail,
            userQualification: evaluation.userQualification || '',
            userExperience: evaluation.userExperience || '',
            responses: {
                1: evaluation.question1,
                2: evaluation.question2,
                3: evaluation.question3,
                4: evaluation.question4,
                5: evaluation.question5,
                6: evaluation.question6,
                7: evaluation.question7,
                8: evaluation.question8,
                9: evaluation.question9,
                10: evaluation.question10
            },
            remarks: evaluation.remarks || '',
            submittedAt: evaluation.submittedAt
        }));

        res.json({ evaluations });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

const PORT = process.env.PORT || 4000;

initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log('✨ Server is ready to accept requests!');
    });
}).catch(err => {
    console.error('❌ Failed to initialize database:', err);
});