const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// File-based database paths
const DB_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const ASSESSMENTS_FILE = path.join(DB_DIR, 'assessments.json');
const EVALUATIONS_FILE = path.join(DB_DIR, 'evaluations.json');
const DELPHI_FILE = path.join(DB_DIR, 'delphi.json');

// In-memory database
let db = {
	users: [],
	assessments: [],
	evaluations: [],
	delphi: []
};

// Helper functions for file-based database
async function loadDatabase() {
	try {
		await fs.mkdir(DB_DIR, { recursive: true });

		try {
			const usersData = await fs.readFile(USERS_FILE, 'utf8');
			db.users = JSON.parse(usersData);
		} catch (err) {
			db.users = [];
		}

		try {
			const assessmentsData = await fs.readFile(ASSESSMENTS_FILE, 'utf8');
			db.assessments = JSON.parse(assessmentsData);
		} catch (err) {
			db.assessments = [];
		}

		try {
			const evaluationsData = await fs.readFile(EVALUATIONS_FILE, 'utf8');
			db.evaluations = JSON.parse(evaluationsData);
		} catch (err) {
			db.evaluations = [];
		}

		try {
			const delphiData = await fs.readFile(DELPHI_FILE, 'utf8');
			db.delphi = JSON.parse(delphiData);
		} catch (err) {
			db.delphi = [];
		}

		console.log('Database loaded successfully');
	} catch (err) {
		console.error('Error loading database:', err);
	}
}

async function saveUsers() {
	await fs.writeFile(USERS_FILE, JSON.stringify(db.users, null, 2));
}

async function saveAssessments() {
	await fs.writeFile(ASSESSMENTS_FILE, JSON.stringify(db.assessments, null, 2));
}

async function saveEvaluations() {
	await fs.writeFile(EVALUATIONS_FILE, JSON.stringify(db.evaluations, null, 2));
}

async function saveDelphi() {
	await fs.writeFile(DELPHI_FILE, JSON.stringify(db.delphi, null, 2));
}

async function initDb() {
	await loadDatabase();
	console.log('File-based database initialized');
}

function authMiddleware(req, res, next) {
	const header = req.headers.authorization;
	if (!header) return res.status(401).json({ error: 'Missing authorization' });
	const parts = header.split(' ');
	if (parts.length !== 2) return res.status(401).json({ error: 'Invalid authorization' });
	const token = parts[1];
	try {
		const payload = jwt.verify(token, JWT_SECRET);
		req.user = payload;
		// For admin account, ensure isAdmin is set
		if (payload.id === 'admin') {
			req.user.isAdmin = true;
		}
		next();
	} catch (err) {
		return res.status(401).json({ error: 'Invalid token' });
	}
}

app.post('/api/register', async (req, res) => {
	try {
		const { name, qualification, email, experience, password } = req.body;
		if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });

		const existingUser = db.users.find(u => u.email === email.toLowerCase());
		if (existingUser) return res.status(400).json({ error: 'Email already registered' });

		const hashed = await bcrypt.hash(password, 10);
		const id = Date.now().toString();
		const createdAt = new Date().toISOString();

		const newUser = {
			id,
			name,
			qualification: qualification || '',
			email: email.toLowerCase(),
			experience: experience || '',
			password: hashed,
			createdAt
		};

		db.users.push(newUser);
		await saveUsers();

		const token = jwt.sign({ id, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });
		res.json({ token, user: { id, name, email: email.toLowerCase(), qualification: qualification || '', experience: experience || '' } });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

app.post('/api/login', async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) return res.status(400).json({ error: 'email and password required' });

		// Check for hardcoded admin account
		if (email.toLowerCase() === 'admin@venu.com' && password === 'admin1234') {
			const adminUser = {
				id: 2,
				name: 'Admin',
				email: 'admin@venu.com',
				qualification: 'Administrator',
				experience: 'Admin Access',
				isAdmin: true,
				delphiExpert: false,
				role: 'admin'
			};
			const token = jwt.sign({ id: adminUser.id, email: adminUser.email, isAdmin: true }, JWT_SECRET, { expiresIn: '7d' });
			return res.json({ token, user: adminUser });
		}

		const user = db.users.find(u => u.email === email.toLowerCase());
		if (!user) return res.status(400).json({ error: 'Invalid credentials' });

		const ok = await bcrypt.compare(password, user.password);
		if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

		const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin || false }, JWT_SECRET, { expiresIn: '7d' });
		res.json({
			token,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				qualification: user.qualification,
				experience: user.experience,
				isAdmin: user.isAdmin || false,
				delphiExpert: user.delphiExpert || false,
				role: user.role || 'user'
			}
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

app.get('/api/me', authMiddleware, async (req, res) => {
	try {
		const user = db.users.find(u => u.id === req.user.id);
		if (!user) return res.status(404).json({ error: 'User not found' });

		res.json({
			id: user.id,
			name: user.name,
			email: user.email,
			qualification: user.qualification,
			experience: user.experience,
			isAdmin: user.isAdmin || false,
			delphiExpert: user.delphiExpert || false,
			role: user.role || 'user'
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

app.post('/api/assessment/submit', authMiddleware, async (req, res) => {
	try {
		const { userId, responses } = req.body;

		if (!userId || !responses) {
			return res.status(400).json({ error: 'userId and responses are required' });
		}

		if (userId !== req.user.id) {
			return res.status(403).json({ error: 'Unauthorized' });
		}

		// Validate all 12 responses are present
		const requiredResponses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
		for (const qId of requiredResponses) {
			if (!responses[qId] || responses[qId] < 1 || responses[qId] > 5) {
				return res.status(400).json({ error: `Invalid or missing response for question ${qId}` });
			}
		}

		// Check if user already submitted an assessment
		const existingIndex = db.assessments.findIndex(a => a.userId === userId);

		const id = existingIndex >= 0 ? db.assessments[existingIndex].id : Date.now().toString();
		const submittedAt = new Date().toISOString();

		const assessmentData = {
			id,
			userId,
			response1: responses[1],
			response2: responses[2],
			response3: responses[3],
			response4: responses[4],
			response5: responses[5],
			response6: responses[6],
			response7: responses[7],
			response8: responses[8],
			response9: responses[9],
			response10: responses[10],
			response11: responses[11],
			response12: responses[12],
			submittedAt
		};

		if (existingIndex >= 0) {
			// Update existing assessment
			db.assessments[existingIndex] = assessmentData;
		} else {
			// Insert new assessment
			db.assessments.push(assessmentData);
		}

		await saveAssessments();

		res.json({
			success: true,
			message: 'Assessment submitted successfully',
			id,
			submittedAt
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

app.get('/api/assessment/:userId', authMiddleware, async (req, res) => {
	try {
		const { userId } = req.params;

		if (userId !== req.user.id) {
			return res.status(403).json({ error: 'Unauthorized' });
		}

		const assessment = db.assessments.find(a => a.userId === userId);

		if (!assessment) {
			return res.status(404).json({ error: 'Assessment not found' });
		}

		const responses = {
			1: assessment.response1,
			2: assessment.response2,
			3: assessment.response3,
			4: assessment.response4,
			5: assessment.response5,
			6: assessment.response6,
			7: assessment.response7,
			8: assessment.response8,
			9: assessment.response9,
			10: assessment.response10,
			11: assessment.response11,
			12: assessment.response12
		};

		res.json({
			id: assessment.id,
			userId: assessment.userId,
			responses,
			submittedAt: assessment.submittedAt
		});
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

		// Validate all 120 responses are present (10 criteria x 12 questions)
		// Expected format: C1_Q1, C1_Q2, ..., C10_Q12
		const totalExpected = 120; // 10 criteria x 12 questions
		const responseKeys = Object.keys(responses);

		if (responseKeys.length !== totalExpected) {
			return res.status(400).json({
				error: `Expected ${totalExpected} responses, but received ${responseKeys.length}`
			});
		}

		// Validate each response is 0 or 1
		for (const key of responseKeys) {
			if (responses[key] !== 0 && responses[key] !== 1) {
				return res.status(400).json({
					error: `Invalid response for ${key}. Must be 0 (No) or 1 (Yes)`
				});
			}
		}

		// Check if user already submitted an evaluation
		const existing = db.evaluations.find(e => e.userId === userId);

		if (existing) {
			return res.status(400).json({ error: 'You have already submitted your evaluation. Only one submission is allowed.' });
		}

		const id = Date.now().toString();
		const submittedAt = new Date().toISOString();

		// Insert new evaluation with new format (store responses as object)
		const evaluationData = {
			id,
			userId,
			responses, // Store the entire responses object (C1_Q1, C1_Q2, etc.)
			remarks: remarks || '',
			submittedAt
		};

		db.evaluations.push(evaluationData);
		await saveEvaluations();

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

app.get('/api/evaluation/:userId', authMiddleware, async (req, res) => {
	try {
		const { userId } = req.params;

		if (userId !== req.user.id && !req.user.isAdmin) {
			return res.status(403).json({ error: 'Unauthorized' });
		}

		const evaluation = db.evaluations.find(e => e.userId === userId);

		if (!evaluation) {
			return res.status(404).json({ error: 'Evaluation not found' });
		}

		// Return responses in the new format (C1_Q1, C1_Q2, etc.)
		// If old format exists, convert it; otherwise use new format
		let responses = evaluation.responses;

		// Handle backward compatibility with old format
		if (!responses && evaluation.question1 !== undefined) {
			// Old format - convert to new format for display
			responses = {
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
			};
		}

		res.json({
			id: evaluation.id,
			userId: evaluation.userId,
			responses,
			remarks: evaluation.remarks || '',
			submittedAt: evaluation.submittedAt
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

app.get('/api/admin/evaluations', authMiddleware, async (req, res) => {
	try {
		// Check if user is admin
		if (!req.user.isAdmin && req.user.id !== 'admin') {
			return res.status(403).json({ error: 'Admin access required' });
		}

		// Get all evaluations with user information
		const evaluations = db.evaluations.map(evaluation => {
			const user = db.users.find(u => u.id === evaluation.userId);

			// Handle both old and new format
			let responses = evaluation.responses;

			// Backward compatibility with old format
			if (!responses && evaluation.question1 !== undefined) {
				responses = {
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
				};
			}

			return {
				id: evaluation.id,
				userId: evaluation.userId,
				userName: user ? user.name : 'Unknown',
				userEmail: user ? user.email : 'Unknown',
				userQualification: user ? (user.qualification || '') : '',
				userExperience: user ? (user.experience || '') : '',
				responses,
				remarks: evaluation.remarks || '',
				submittedAt: evaluation.submittedAt
			};
		});

		// Sort by submittedAt DESC
		evaluations.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

		res.json({ evaluations });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

// ============================================
// DELPHI ENDPOINTS
// ============================================

// Register for Delphi (separate from regular registration)
app.post('/api/delphi/register', async (req, res) => {
	try {
		const { name, email, password, qualification, experience, expertise, institution } = req.body;

		// Validation
		if (!name || !email || !password || !qualification || !experience) {
			return res.status(400).json({ error: 'Please provide all required fields' });
		}

		// Check if user already exists
		const existingUser = db.users.find(u => u.email === email);
		if (existingUser) {
			return res.status(400).json({ error: 'Email already registered' });
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Create new Delphi expert user
		const newUser = {
			id: db.users.length + 1,
			name,
			email,
			password: hashedPassword,
			role: 'expert',
			delphiExpert: true, // Flag to identify Delphi experts
			qualification,
			experience,
			expertise: expertise || '',
			institution: institution || '',
			createdAt: new Date().toISOString()
		};

		db.users.push(newUser);
		await saveUsers();

		// Generate JWT token for auto-login
		const token = jwt.sign({ id: newUser.id, email: newUser.email, isAdmin: false }, JWT_SECRET, { expiresIn: '7d' });

		// Return token and user data for auto-login
		res.json({
			message: 'Delphi expert registered successfully',
			token,
			user: {
				id: newUser.id,
				name: newUser.name,
				email: newUser.email,
				qualification: newUser.qualification,
				experience: newUser.experience,
				isAdmin: false,
				delphiExpert: true,
				role: 'expert'
			}
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

// Submit Delphi evaluation
app.post('/api/delphi/submit', authMiddleware, async (req, res) => {
	try {
		const { responses } = req.body;
		const userId = req.user.id;

		// Validate responses
		if (!responses || typeof responses !== 'object') {
			return res.status(400).json({ error: 'Invalid responses format' });
		}

		// Check if user already submitted
		const existingIndex = db.delphi.findIndex(d => d.userId === userId);

		const delphiEntry = {
			id: existingIndex >= 0 ? db.delphi[existingIndex].id : db.delphi.length + 1,
			userId,
			responses,
			submittedAt: new Date().toISOString()
		};

		if (existingIndex >= 0) {
			// Update existing
			db.delphi[existingIndex] = delphiEntry;
		} else {
			// Add new
			db.delphi.push(delphiEntry);
		}

		await saveDelphi();

		res.json({
			message: 'Delphi evaluation submitted successfully',
			delphiId: delphiEntry.id
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

// Get all Delphi evaluations (admin only)
app.get('/api/delphi/all', authMiddleware, async (req, res) => {
	try {
		// Check if user is admin - check multiple ways
		const isAdmin = req.user.isAdmin === true || req.user.id === 2 || req.user.email === 'admin@venu.com';
		
		if (!isAdmin) {
			return res.status(403).json({ error: 'Access denied. Admin only.' });
		}

		const delphiEvaluations = db.delphi.map(delphi => {
			const user = db.users.find(u => u.id === delphi.userId);
			return {
				id: delphi.id,
				userId: delphi.userId,
				userName: user ? user.name : 'Unknown',
				userEmail: user ? user.email : 'Unknown',
				userQualification: user ? (user.qualification || '') : '',
				userExperience: user ? (user.experience || '') : '',
				responses: delphi.responses,
				submittedAt: delphi.submittedAt
			};
		});

		res.json({ delphiEvaluations });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

const PORT = process.env.PORT || 4000;
initDb().then(() => {
	app.listen(PORT, () => console.log(`Auth API running on http://localhost:${PORT}`));
}).catch(err => {
	console.error('Failed to initialize database', err);
	process.exit(1);
});
