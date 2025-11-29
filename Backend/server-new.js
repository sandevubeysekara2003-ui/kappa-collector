const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const PORT = process.env.PORT || 4000;

// Database paths
const DB_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const PROJECTS_FILE = path.join(DB_DIR, 'projects.json');

// In-memory database
let db = {
	users: [],
	projects: []
};

// Load database
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
			const projectsData = await fs.readFile(PROJECTS_FILE, 'utf8');
			db.projects = JSON.parse(projectsData);
		} catch (err) {
			db.projects = [];
		}

		console.log('✓ Database loaded successfully');
	} catch (err) {
		console.error('✗ Error loading database:', err);
	}
}

async function saveUsers() {
	await fs.writeFile(USERS_FILE, JSON.stringify(db.users, null, 2));
}

async function saveProjects() {
	await fs.writeFile(PROJECTS_FILE, JSON.stringify(db.projects, null, 2));
}

// Authentication middleware
function authMiddleware(req, res, next) {
	const header = req.headers.authorization;
	if (!header) return res.status(401).json({ error: 'Missing authorization' });
	const parts = header.split(' ');
	if (parts.length !== 2) return res.status(401).json({ error: 'Invalid authorization' });
	const token = parts[1];
	try {
		const payload = jwt.verify(token, JWT_SECRET);
		req.user = payload;
		next();
	} catch (err) {
		return res.status(401).json({ error: 'Invalid token' });
	}
}

// ==================== AUTH ENDPOINTS ====================

app.post('/api/auth/register', async (req, res) => {
	try {
		const { name, email, password, qualification, experience } = req.body;
		
		if (!name || !email || !password) {
			return res.status(400).json({ error: 'Name, email, and password required' });
		}

		const existingUser = db.users.find(u => u.email === email);
		if (existingUser) {
			return res.status(400).json({ error: 'Email already registered' });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = {
			id: Math.max(0, ...db.users.map(u => u.id)) + 1,
			name,
			email,
			password: hashedPassword,
			qualification: qualification || '',
			experience: experience || '',
			isAdmin: false,
			projectIds: [],
			createdAt: new Date().toISOString()
		};

		db.users.push(newUser);
		await saveUsers();

		const token = jwt.sign({
			id: newUser.id,
			email: newUser.email,
			name: newUser.name,
			isAdmin: false,
			projectIds: []
		}, JWT_SECRET, { expiresIn: '7d' });

		res.json({
			token,
			user: {
				id: newUser.id,
				name: newUser.name,
				email: newUser.email,
				qualification: newUser.qualification,
				experience: newUser.experience,
				isAdmin: false,
				projectIds: []
			}
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

app.post('/api/auth/login', async (req, res) => {
	try {
		const { email, password } = req.body;
		
		if (!email || !password) {
			return res.status(400).json({ error: 'Email and password required' });
		}

		const user = db.users.find(u => u.email === email);
		if (!user) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const token = jwt.sign({
			id: user.id,
			email: user.email,
			name: user.name,
			isAdmin: user.isAdmin || false,
			projectIds: user.projectIds || []
		}, JWT_SECRET, { expiresIn: '7d' });

		res.json({
			token,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				qualification: user.qualification,
				experience: user.experience,
				isAdmin: user.isAdmin || false,
				projectIds: user.projectIds || []
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
			projectIds: user.projectIds || []
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

// ==================== PROJECT ENDPOINTS ====================

// Create new project (auto-assigns creator as admin)
app.post('/api/projects', authMiddleware, async (req, res) => {
	try {
		const { name, validationTypes } = req.body;
		
		if (!name) {
			return res.status(400).json({ error: 'Project name required' });
		}

		const newProject = {
			id: Math.max(0, ...db.projects.map(p => p.id || 0)) + 1,
			name,
			adminId: req.user.id,
			validationTypes: validationTypes || ['face', 'delphi'],
			face: {
				enabled: validationTypes?.includes('face') || false,
				inviteCode: `FACE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
				experts: [],
				submissions: []
			},
			delphi: {
				enabled: validationTypes?.includes('delphi') || false,
				inviteCode: `DELPHI-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
				experts: [],
				rounds: 1,
				submissions: []
			},
			createdAt: new Date().toISOString()
		};

		// Add project to user
		const user = db.users.find(u => u.id === req.user.id);
		if (!user.projectIds) user.projectIds = [];
		user.projectIds.push(newProject.id);
		
		db.projects.push(newProject);
		await saveUsers();
		await saveProjects();

		res.json({ project: newProject });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

// Get all projects for user
app.get('/api/projects', authMiddleware, async (req, res) => {
	try {
		const user = db.users.find(u => u.id === req.user.id);
		const userProjectIds = user?.projectIds || [];
		const projects = db.projects.filter(p => 
			userProjectIds.includes(p.id) || p.adminId === req.user.id
		);
		res.json({ projects });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

// Get specific project
app.get('/api/projects/:id', authMiddleware, async (req, res) => {
	try {
		const project = db.projects.find(p => p.id === parseInt(req.params.id));
		if (!project) return res.status(404).json({ error: 'Project not found' });

		const user = db.users.find(u => u.id === req.user.id);
		const hasAccess = user.projectIds?.includes(project.id) || project.adminId === req.user.id;
		
		if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

		res.json({ project });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

// Get project by invite code (for expert registration)
app.get('/api/projects/invite/:code', async (req, res) => {
	try {
		let project = null;
		let type = null;

		// Search in face validations
		project = db.projects.find(p => p.face.inviteCode === req.params.code);
		if (project) {
			type = 'face';
			return res.json({ project, type });
		}

		// Search in delphi validations
		project = db.projects.find(p => p.delphi.inviteCode === req.params.code);
		if (project) {
			type = 'delphi';
			return res.json({ project, type });
		}

		res.status(404).json({ error: 'Invalid invite code' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

// Submit face validity response
app.post('/api/projects/:id/face/submit', authMiddleware, async (req, res) => {
	try {
		const { responses } = req.body;
		const projectId = parseInt(req.params.id);
		
		const project = db.projects.find(p => p.id === projectId);
		if (!project) return res.status(404).json({ error: 'Project not found' });
		
		if (!project.face.experts.includes(req.user.id)) {
			return res.status(403).json({ error: 'Not an expert for this validation' });
		}

		// Add submission
		const submission = {
			userId: req.user.id,
			userName: req.user.name,
			userEmail: req.user.email,
			responses,
			submittedAt: new Date().toISOString()
		};

		project.face.submissions.push(submission);
		await saveProjects();

		res.json({ message: 'Face validity submission saved' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

// Submit delphi response
app.post('/api/projects/:id/delphi/submit', authMiddleware, async (req, res) => {
	try {
		const { responses } = req.body;
		const projectId = parseInt(req.params.id);
		
		const project = db.projects.find(p => p.id === projectId);
		if (!project) return res.status(404).json({ error: 'Project not found' });
		
		if (!project.delphi.experts.includes(req.user.id)) {
			return res.status(403).json({ error: 'Not an expert for this validation' });
		}

		const submission = {
			userId: req.user.id,
			userName: req.user.name,
			userEmail: req.user.email,
			responses,
			submittedAt: new Date().toISOString()
		};

		project.delphi.submissions.push(submission);
		await saveProjects();

		res.json({ message: 'Delphi submission saved' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

// Get project results (admin only)
app.get('/api/projects/:id/face/results', authMiddleware, async (req, res) => {
	try {
		const projectId = parseInt(req.params.id);
		const project = db.projects.find(p => p.id === projectId);
		
		if (!project) return res.status(404).json({ error: 'Project not found' });
		if (project.adminId !== req.user.id) return res.status(403).json({ error: 'Access denied' });

		res.json({ submissions: project.face.submissions });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

app.get('/api/projects/:id/delphi/results', authMiddleware, async (req, res) => {
	try {
		const projectId = parseInt(req.params.id);
		const project = db.projects.find(p => p.id === projectId);
		
		if (!project) return res.status(404).json({ error: 'Project not found' });
		if (project.adminId !== req.user.id) return res.status(403).json({ error: 'Access denied' });

		res.json({ submissions: project.delphi.submissions });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

// Initialize and start server
async function start() {
	await loadDatabase();
	app.listen(PORT, () => {
		console.log(`✓ Auth API running on port ${PORT}`);
	});
}

start().catch(err => {
	console.error('Failed to start server:', err);
	process.exit(1);
});
