const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

dotenv.config();
const { parseDocument, validateItemCount } = require('./documentParser');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit for larger documents
});

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

// ==================== DOCUMENT PARSING ENDPOINT ====================

app.post('/api/parse-document', authMiddleware, upload.single('document'), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'No file uploaded' });
		}

		const fileBuffer = req.file.buffer;
		const filename = req.file.originalname;

		console.log('Parsing document:', filename);

		// Parse the document
		const result = await parseDocument(fileBuffer, filename);

		console.log('Parse result:', {
			success: result.success,
			itemCount: result.itemCount,
			items: result.items
		});

		if (!result.success) {
			return res.status(400).json({ error: result.error });
		}

		res.json({
			items: result.items,
			language: result.language,
			itemCount: result.itemCount,
			filename: result.filename
		});
	} catch (err) {
		console.error('Document parsing error:', err);
		res.status(500).json({ error: 'Failed to parse document' });
	}
});

// ==================== PROJECT ENDPOINTS ====================

// Create new project (auto-assigns creator as admin)
app.post('/api/projects', authMiddleware, async (req, res) => {
	try {
		const { name, description, type } = req.body;

		if (!name) {
			return res.status(400).json({ error: 'Project name required' });
		}

		const newProject = {
			id: Math.max(0, ...db.projects.map(p => p.id || 0)) + 1,
			name,
			description: description || '',
			type: type || 'delphi', // 'delphi' or 'face-validity'
			adminId: req.user.id,
			originalScaleItems: [],
			translatedScaleItems: [],
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

// Debug endpoint to check database status
app.get('/api/debug/db-status', (req, res) => {
	res.json({
		totalProjects: db.projects.length,
		totalUsers: db.users.length,
		projectIds: db.projects.map(p => ({ id: p.id, name: p.name })),
		dbDir: DB_DIR,
		projectsFile: PROJECTS_FILE,
		usersFile: USERS_FILE
	});
});

// Get specific project (public - for experts)
app.get('/api/projects/:id', async (req, res) => {
	try {
		console.log('Looking for project ID:', req.params.id);
		console.log('Total projects in DB:', db.projects.length);
		console.log('All project IDs:', db.projects.map(p => p.id));

		const project = db.projects.find(p => p.id === parseInt(req.params.id));
		if (!project) {
			console.log('Project not found!');
			return res.status(404).json({
				error: 'Project not found',
				requestedId: parseInt(req.params.id),
				availableIds: db.projects.map(p => p.id)
			});
		}

		// Return necessary fields for experts (both scales for display, but only translated for evaluation)
		res.json({
			id: project.id,
			name: project.name,
			description: project.description,
			type: project.type,
			originalScaleItems: project.originalScaleItems || [],
			translatedScaleItems: project.translatedScaleItems || []
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

// Delete a project (admin only)
app.delete('/api/projects/:id', authMiddleware, async (req, res) => {
	try {
		const projectId = parseInt(req.params.id);
		const projectIndex = db.projects.findIndex(p => p.id === projectId);
		if (projectIndex === -1) return res.status(404).json({ error: 'Project not found' });

		const project = db.projects[projectIndex];
		if (project.adminId !== req.user.id) return res.status(403).json({ error: 'Access denied' });

		// Remove project from db.projects
		db.projects.splice(projectIndex, 1);

		// Remove project id from any user's projectIds
		db.users = db.users.map(u => {
			if (Array.isArray(u.projectIds)) {
				u.projectIds = u.projectIds.filter(pid => pid !== projectId);
			}
			return u;
		});

		await saveProjects();
		await saveUsers();

		res.json({ message: 'Project deleted' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

// Expert response submission (no authentication required)
app.post('/api/expert-response/:projectId', async (req, res) => {
	try {
		const { expertName, expertEmail, expertQualification, expertYearsOfExperience, responses } = req.body;
		const projectId = parseInt(req.params.projectId);

		if (!expertName || !expertEmail || !expertQualification || !expertYearsOfExperience || !responses) {
			return res.status(400).json({ error: 'All expert details and responses are required' });
		}

		const project = db.projects.find(p => p.id === projectId);
		if (!project) {
			return res.status(404).json({ error: 'Project not found' });
		}

		// Initialize expertResponses array if it doesn't exist
		if (!project.expertResponses) {
			project.expertResponses = [];
		}

		// Check if expert already submitted
		const existingResponse = project.expertResponses.find(r => r.expertEmail === expertEmail);
		if (existingResponse) {
			return res.status(400).json({ error: 'You have already submitted a response for this project' });
		}

		// Add expert response
		const expertResponse = {
			id: Date.now(),
			expertName,
			expertEmail,
			expertQualification,
			expertYearsOfExperience,
			responses,
			submittedAt: new Date().toISOString()
		};

		project.expertResponses.push(expertResponse);
		await saveProjects();

		res.json({ message: 'Response submitted successfully' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

// Get aggregated expert responses for a project (admin only)
app.get('/api/projects/:id/expert-responses', authMiddleware, async (req, res) => {
	try {
		const projectId = parseInt(req.params.id);
		const project = db.projects.find(p => p.id === projectId);

		if (!project) {
			return res.status(404).json({ error: 'Project not found' });
		}

		if (project.adminId !== req.user.id) {
			return res.status(403).json({ error: 'Access denied' });
		}

		res.json({
			expertResponses: project.expertResponses || [],
			translatedScaleItems: project.translatedScaleItems || []
		});
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

// Update project scale items
app.put('/api/projects/:id/items', authMiddleware, async (req, res) => {
	try {
		const projectId = parseInt(req.params.id);
		const { originalScaleItems, translatedScaleItems } = req.body;

		const project = db.projects.find(p => p.id === projectId);

		if (!project) {
			return res.status(404).json({ error: 'Project not found' });
		}

		// Check if user is admin
		if (project.adminId !== req.user.id) {
			return res.status(403).json({ error: 'Only project admin can update items' });
		}

		// Update items
		if (originalScaleItems !== undefined) {
			project.originalScaleItems = originalScaleItems;
		}
		if (translatedScaleItems !== undefined) {
			project.translatedScaleItems = translatedScaleItems;
		}

		await saveProjects();

		res.json({
			success: true,
			originalScaleItems: project.originalScaleItems,
			translatedScaleItems: project.translatedScaleItems
		});
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

// Parse document endpoint
app.post('/api/documents/parse', authMiddleware, async (req, res) => {
	try {
		const { fileData, filename, projectId, scaleType } = req.body;

		if (!fileData || !filename) {
			return res.status(400).json({ error: 'File data and filename required' });
		}

		// Convert base64 to buffer
		const buffer = Buffer.from(fileData, 'base64');

		// Parse document
		const result = await parseDocument(buffer, filename);

		if (!result.success) {
			return res.status(400).json(result);
		}

		// Validate item count (expecting 12 items for burnout scale)
		const validation = validateItemCount(result.itemCount, 12);

		// If projectId provided, store scale reference in project
		if (projectId) {
			const project = db.projects.find(p => p.id === parseInt(projectId));
			if (!project) {
				return res.status(404).json({ error: 'Project not found' });
			}
			if (project.adminId !== req.user.id) {
				return res.status(403).json({ error: 'Access denied' });
			}

			// Store scale metadata
			if (scaleType === 'original') {
				project.originalScale = {
					filename,
					language: result.language,
					itemCount: result.itemCount,
					items: result.items,
					uploadedAt: result.extractedAt,
					uploadedBy: req.user.id
				};
			} else if (scaleType === 'translated') {
				project.translatedScale = {
					filename,
					language: result.language,
					itemCount: result.itemCount,
					items: result.items,
					uploadedAt: result.extractedAt,
					uploadedBy: req.user.id
				};
			}

			await saveProjects();
		}

		res.json({
			success: true,
			...result,
			validation,
			message: `✓ Successfully parsed ${result.itemCount} items in ${result.language}`
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error during parsing' });
	}
});

// Get project scales endpoint
app.get('/api/projects/:id/scales', authMiddleware, async (req, res) => {
	try {
		const projectId = parseInt(req.params.id);
		const project = db.projects.find(p => p.id === projectId);

		if (!project) return res.status(404).json({ error: 'Project not found' });
		if (project.adminId !== req.user.id) return res.status(403).json({ error: 'Access denied' });

		res.json({
			originalScale: project.originalScale || null,
			translatedScale: project.translatedScale || null
		});
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

// Admin: return raw DB files for inspection (projects, evaluations, delphi, users)
app.get('/api/admin/db', authMiddleware, async (req, res) => {
	try {
		// Only admins
		if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });

		const files = ['projects.json', 'evaluations.json', 'delphi.json', 'users.json'];
		const result = {};
		for (const f of files) {
			const p = path.join(DB_DIR, f);
			try {
				const raw = await fs.readFile(p, 'utf8');
				result[f.replace('.json','')] = JSON.parse(raw);
			} catch (err) {
				// file may not exist yet
				result[f.replace('.json','')] = null;
			}
		}

		res.json({ ok: true, data: result });
	} catch (err) {
		console.error('Error reading DB files', err);
		res.status(500).json({ error: 'Server error reading DB files' });
	}
});

// ---------- Analytics helpers ----------
function combination(n, k) {
	if (k < 0 || k > n) return 0;
	if (k === 0 || k === n) return 1;
	k = Math.min(k, n - k);
	let c = 1;
	for (let i = 0; i < k; i++) {
		c = c * (n - i) / (i + 1);
	}
	return c;
}

function computeCohensKappa(arrA, arrB) {
	if (!arrA || !arrB || arrA.length !== arrB.length || arrA.length === 0) return null;
	const n = arrA.length;
	let agree = 0;
	let a1 = 0, b1 = 0;
	for (let i = 0; i < n; i++) {
		const A = arrA[i];
		const B = arrB[i];
		if (A === B) agree++;
		if (A) a1++;
		if (B) b1++;
	}
	const Po = agree / n;
	const pA1 = a1 / n;
	const pB1 = b1 / n;
	const Pe = pA1 * pB1 + (1 - pA1) * (1 - pB1);
	const denom = 1 - Pe;
	if (denom === 0) return 1;
	return (Po - Pe) / denom;
}

function flattenFaceResponses(responses, itemsCount, criteriaCount = 10) {
	const arr = [];
	for (let item = 1; item <= itemsCount; item++) {
		for (let crit = 1; crit <= criteriaCount; crit++) {
			const key = `C${crit}_Q${item}`;
			const v = responses[key];
			// Accept truthy, 'yes', 'Yes', 1
			const bit = v === true || v === 'yes' || v === 'Yes' || v === 1 || v === '1' ? 1 : 0;
			arr.push(bit);
		}
	}
	return arr;
}

function getFaceItemStats(project, criteriaCount = 10, endorsementThreshold = 8) {
	const submissions = project.face.submissions || [];
	const N = submissions.length;
	const itemsCount = project.face.itemCount || (project.originalScale?.itemCount || project.translatedScale?.itemCount || 0);
	const itemStats = [];
	for (let item = 1; item <= itemsCount; item++) {
		// Count how many criteria each expert marked as yes for this item
		const expertYesCounts = submissions.map(sub => {
			let c = 0;
			for (let crit = 1; crit <= criteriaCount; crit++) {
				const key = `C${crit}_Q${item}`;
				const v = sub.responses[key];
				if (v === true || v === 'yes' || v === 'Yes' || v === 1 || v === '1') c++;
			}
			return c;
		});

		const proportions = expertYesCounts.map(c => c / criteriaCount);
		const avgProportion = proportions.length ? (proportions.reduce((a,b)=>a+b,0)/proportions.length) : 0;

		// Endorsement based on endorsementThreshold (e.g., 8 of 10 criteria)
		const endorsedExperts = expertYesCounts.filter(c => c >= endorsementThreshold).length;
		const iCVI = submissions.length ? (endorsedExperts / submissions.length) : 0;

		// Modified kappa per Polit: Pc = combination(N, A) * 0.5^N where A = number endorsing
		const A = endorsedExperts;
		const Pc = submissions.length ? (combination(submissions.length, A) * Math.pow(0.5, submissions.length)) : 0;
		const kappa = (iCVI - Pc) / (1 - Pc || 1);

		const retainedByAll = submissions.length ? (endorsedExperts === submissions.length) : false;
		const retainedByMajority = submissions.length ? (endorsedExperts / submissions.length >= 0.5) : false;

		itemStats.push({ item, expertYesCounts, proportions, avgProportion, endorsedExperts, iCVI, modifiedKappa: kappa, retainedByAll, retainedByMajority });
	}
	return { itemsCount, itemStats };
}

// ---------- Analytics endpoints ----------
// Face analytics (admin only)
app.get('/api/projects/:id/face/analytics', authMiddleware, async (req, res) => {
	try {
		const projectId = parseInt(req.params.id);
		const project = db.projects.find(p => p.id === projectId);
		if (!project) return res.status(404).json({ error: 'Project not found' });
		if (project.adminId !== req.user.id) return res.status(403).json({ error: 'Access denied' });

		const submissions = project.face.submissions || [];
		const N = submissions.length;

		const itemsCount = project.face.itemCount || (project.originalScale?.itemCount || project.translatedScale?.itemCount || 0);

		// Build per-expert flattened arrays
		const expertArrays = submissions.map(sub => ({ userId: sub.userId, userName: sub.userName, arr: flattenFaceResponses(sub.responses, itemsCount) }));

		// Pairwise Cohen's kappa
		const pairs = [];
		for (let i = 0; i < expertArrays.length; i++) {
			for (let j = i + 1; j < expertArrays.length; j++) {
				const a = expertArrays[i];
				const b = expertArrays[j];
				const k = computeCohensKappa(a.arr, b.arr);
				pairs.push({ a: a.userName, b: b.userName, kappa: k });
			}
		}
		const avgKappa = pairs.length ? (pairs.reduce((s,p)=>s+(p.kappa||0),0)/pairs.length) : null;

		const { itemsCount: ic, itemStats } = getFaceItemStats(project, 10);

		// S-CVI (average)
		const sCVI_Ave = itemStats.length ? (itemStats.reduce((s,it)=>s+it.iCVI,0)/itemStats.length) : 0;

		res.json({ submissionsCount: N, avgPairwiseKappa: avgKappa, pairwise: pairs, itemsCount: ic, itemStats, sCVI_Ave });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Server error' });
	}
});

// Delphi analytics (admin only)
app.get('/api/projects/:id/delphi/analytics', authMiddleware, async (req, res) => {
	try {
		const projectId = parseInt(req.params.id);
		const project = db.projects.find(p => p.id === projectId);
		if (!project) return res.status(404).json({ error: 'Project not found' });
		if (project.adminId !== req.user.id) return res.status(403).json({ error: 'Access denied' });

		const submissions = project.delphi.submissions || [];
		const N = submissions.length;
		const itemsCount = project.delphi.itemCount || (project.originalScale?.itemCount || project.translatedScale?.itemCount || 0);

		// Build matrix of expert x items (numbers)
		const expertRatings = submissions.map(sub => {
			const arr = [];
			for (let item = 1; item <= itemsCount; item++) {
				for (let crit = 1; crit <= 5; crit++) {
					const key = `Item${item}_Criteria${crit}`;
					const v = sub.responses[key];
					// Expect numeric or string; coerce to Number
					arr.push(typeof v === 'number' ? v : (v ? Number(v) : NaN));
				}
			}
			return { userId: sub.userId, userName: sub.userName, arr };
		});

		// Item-level stats (per item across experts, averaging across 5 criteria)
		const itemStats = [];
		for (let item = 1; item <= itemsCount; item++) {
			const values = [];
			for (const sub of submissions) {
				// average across criteria for this item for this expert
				const vals = [];
				for (let crit = 1; crit <= 5; crit++) {
					const key = `Item${item}_Criteria${crit}`;
					const v = sub.responses[key];
					const num = typeof v === 'number' ? v : (v ? Number(v) : NaN);
					if (!Number.isNaN(num)) vals.push(num);
				}
				if (vals.length) values.push(vals.reduce((a,b)=>a+b,0)/vals.length);
			}
			const mean = values.length ? (values.reduce((a,b)=>a+b,0)/values.length) : null;
			const sd = values.length ? Math.sqrt(values.reduce((a,b)=>a+Math.pow(b-mean,2),0)/values.length) : null;
			const cv = (mean && sd) ? (sd / mean) : null;
			// retention criteria default: mean >= 6 and sd <= 2
			const retain = mean !== null ? (mean >= 6 && sd <= 2) : false;
			itemStats.push({ item, mean, sd, cv, n: values.length, retain });
		}

		// Pairwise Pearson correlations between experts across item-averaged scores
		const pairCorrs = [];
		for (let i = 0; i < expertRatings.length; i++) {
			for (let j = i + 1; j < expertRatings.length; j++) {
				const a = expertRatings[i].arr;
				const b = expertRatings[j].arr;
				// they should have same length
				if (a.length !== b.length) continue;
				const valid = [];
				for (let k = 0; k < a.length; k++) {
					if (!Number.isNaN(a[k]) && !Number.isNaN(b[k])) valid.push([a[k], b[k]]);
				}
				if (valid.length < 2) continue;
				const ax = valid.map(v=>v[0]);
				const bx = valid.map(v=>v[1]);
				const meanA = ax.reduce((s,v)=>s+v,0)/ax.length;
				const meanB = bx.reduce((s,v)=>s+v,0)/bx.length;
				let num = 0, denA = 0, denB = 0;
				for (let k = 0; k < ax.length; k++) {
					num += (ax[k]-meanA)*(bx[k]-meanB);
					denA += Math.pow(ax[k]-meanA,2);
					denB += Math.pow(bx[k]-meanB,2);
				}
				const corr = num / Math.sqrt(denA * denB) || 0;
				pairCorrs.push({ a: expertRatings[i].userName, b: expertRatings[j].userName, corr });
			}
		}
		const avgCorr = pairCorrs.length ? (pairCorrs.reduce((s,p)=>s+(p.corr||0),0)/pairCorrs.length) : null;

		res.json({ submissionsCount: N, itemsCount, itemStats, pairwiseCorrelations: pairCorrs, avgPairwiseCorrelation: avgCorr });
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
