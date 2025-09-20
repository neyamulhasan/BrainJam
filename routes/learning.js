const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const slugify = require('slugify');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/uploads/learning');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'resource-' + uniqueSuffix + ext);
    }
});

// File filter function
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

// Initialize multer upload
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB max file size
    }
});

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(isAdmin);

// Get all learning resources
router.get('/learning-resources', async (req, res) => {
    try {
        const [resources] = await db.execute(`
            SELECT lr.*, lc.name as category_name
            FROM learning_resources lr
            JOIN learning_categories lc ON lr.category_id = lc.id
            ORDER BY lr.created_at DESC
        `);
        
        res.json({
            success: true,
            resources
        });
    } catch (error) {
        console.error('Error fetching learning resources:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch learning resources'
        });
    }
});

// Get a single learning resource
router.get('/learning-resources/:id', async (req, res) => {
    try {
        const [resources] = await db.execute(`
            SELECT lr.*, lc.name as category_name
            FROM learning_resources lr
            JOIN learning_categories lc ON lr.category_id = lc.id
            WHERE lr.id = ?
        `, [req.params.id]);
        
        if (resources.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Resource not found'
            });
        }
        
        // Get resource tags if any
        const [tags] = await db.execute(`
            SELECT tag FROM learning_resource_tags
            WHERE resource_id = ?
        `, [req.params.id]);
        
        const resource = resources[0];
        resource.tags = tags.map(t => t.tag);
        
        res.json({
            success: true,
            resource
        });
    } catch (error) {
        console.error('Error fetching learning resource:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch learning resource'
        });
    }
});

// Create a new learning resource with image upload
router.post('/learning-resources', upload.single('featured_image'), async (req, res) => {
    try {
        const { title, content, category_id, status, meta_description } = req.body;
        let tags = [];
        
        // Parse tags if provided as a string
        if (req.body.tags) {
            if (typeof req.body.tags === 'string') {
                tags = req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            } else if (Array.isArray(req.body.tags)) {
                tags = req.body.tags;
            }
        }
        
        const author_id = req.user.id;
        
        // Generate slug from title
        let slug = slugify(title, {
            lower: true,
            strict: true
        });
        
        // Add random suffix to ensure uniqueness
        slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        
        // Calculate estimated read time (rough estimate: 200 words per minute)
        const wordCount = content.split(/\s+/).length;
        const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));
        
        // Set published_at if status is published
        const published_at = status === 'published' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
        
        // Get image path if uploaded
        let featured_image = null;
        if (req.file) {
            featured_image = `/uploads/learning/${req.file.filename}`;
        }
        
        // Insert the resource
        const [result] = await db.execute(`
            INSERT INTO learning_resources 
            (title, slug, content, category_id, status, author_id, featured_image, meta_description, estimated_read_time, published_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [title, slug, content, category_id, status, author_id, featured_image, meta_description, estimatedReadTime, published_at]);
        
        const resourceId = result.insertId;
        
        // Insert tags if any
        if (tags.length > 0) {
            // We can't use query, so we'll use execute with individual inserts
            for (const tag of tags) {
                if (tag && tag.trim() !== '') {
                    await db.execute(`
                        INSERT INTO learning_resource_tags (resource_id, tag) VALUES (?, ?)
                    `, [resourceId, tag.trim()]);
                }
            }
        }
        
        res.status(201).json({
            success: true,
            message: 'Learning resource created successfully',
            resourceId,
            resource: {
                id: resourceId,
                title,
                slug,
                status,
                featured_image,
                category_id,
                published_at
            }
        });
    } catch (error) {
        console.error('Error creating learning resource:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create learning resource: ' + error.message,
            details: error.stack
        });
    }
});

// Update a learning resource
router.put('/learning-resources/:id', upload.single('featured_image'), async (req, res) => {
    try {
        // Validate required fields
        if (!req.body.title || !req.body.category_id) {
            return res.status(400).json({
                success: false,
                error: 'Title and category are required fields'
            });
        }
        
        // Get the resource ID from the URL
        const resourceId = req.params.id;
        
        // Extract values from request body
        const title = req.body.title;
        const category_id = req.body.category_id;
        const status = req.body.status || 'draft';
        const content = req.body.content || '';
        const metaDescription = req.body.meta_description || null;
        
        // Parse tags
        let tags = [];
        if (req.body.tags) {
            if (typeof req.body.tags === 'string') {
                tags = req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            } else if (Array.isArray(req.body.tags)) {
                tags = req.body.tags;
            }
        }
        
        
        // Check if resource exists
        const [existingResources] = await db.execute('SELECT * FROM learning_resources WHERE id = ?', [resourceId]);
        
        if (existingResources.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Resource not found'
            });
        }
        
        const existingResource = existingResources[0];
        
        // Calculate estimated read time (rough estimate: 200 words per minute)
        const wordCount = content.split(/\s+/).length;
        const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));
        
        // Generate new slug if title changed
        let slug = existingResource.slug;
        if (title !== existingResource.title) {
            slug = slugify(title, {
                lower: true,
                strict: true
            });
            slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        }
        
        // Set published_at if status is changing to published
        let published_at = existingResource.published_at;
        if (status === 'published' && existingResource.status !== 'published') {
            published_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        }
        
        // Get image path if uploaded
        let featured_image = existingResource.featured_image;
        if (req.file) {
            featured_image = `/uploads/learning/${req.file.filename}`;
        }
        
        // Update the resource
        try {
            const updateQuery = `
                UPDATE learning_resources 
                SET title = ?, 
                    slug = ?,
                    content = ?, 
                    category_id = ?, 
                    status = ?, 
                    meta_description = ?, 
                    featured_image = ?,
                    estimated_read_time = ?, 
                    published_at = ?
                WHERE id = ?
            `;
            
            await db.execute(updateQuery, [
                title, 
                slug,
                content, 
                category_id, 
                status, 
                req.body.meta_description || null, 
                featured_image, 
                estimatedReadTime, 
                published_at, 
                resourceId
            ]);
            
            // Success - resource updated
            
            // Update tags
            await db.execute('DELETE FROM learning_resource_tags WHERE resource_id = ?', [resourceId]);
            
            if (tags.length > 0) {
                for (const tag of tags) {
                    if (tag && tag.trim() !== '') {
                        await db.execute(
                            'INSERT INTO learning_resource_tags (resource_id, tag) VALUES (?, ?)',
                            [resourceId, tag.trim()]
                        );
                    }
                }
                console.log(`${tags.length} tags added to resource`);
            }
            
            res.json({
                success: true,
                message: 'Learning resource updated successfully'
            });
            
        } catch (dbError) {
            console.error('Database error:', dbError);
            throw new Error(`Database error: ${dbError.message}`);
        }
        
    } catch (error) {
        console.error('Error updating learning resource:', error);
        
        let errorMessage = 'Failed to update learning resource';
        if (error.message) {
            errorMessage += ': ' + error.message;
        }
        
        res.status(500).json({
            success: false,
            error: errorMessage,
            details: error.stack || ''
        });
    }
});

// Delete a learning resource
router.delete('/learning-resources/:id', async (req, res) => {
    try {
        const resourceId = req.params.id;
        
        // Check if resource exists
        const [resources] = await db.execute('SELECT * FROM learning_resources WHERE id = ?', [resourceId]);
        
        if (resources.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Resource not found'
            });
        }
        
        // Delete the resource (will cascade to tags and votes)
        await db.execute('DELETE FROM learning_resources WHERE id = ?', [resourceId]);
        
        res.json({
            success: true,
            message: 'Learning resource deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting learning resource:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete learning resource'
        });
    }
});

// Get all learning categories
router.get('/learning-categories', async (req, res) => {
    try {
        const [categories] = await db.execute('SELECT * FROM learning_categories ORDER BY name');
        
        res.json({
            success: true,
            categories
        });
    } catch (error) {
        console.error('Error fetching learning categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch learning categories'
        });
    }
});

module.exports = router;