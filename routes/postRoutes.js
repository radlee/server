const { Router } = require('express');
const singleUpload = require ('../utils/multer');

const  { createPost , getPosts, getPost, getPostsBycat, getPostsByAuthor, editPost, deletePost } = require('../controllers/postController')
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

router.post('/', authMiddleware, createPost);
router.get('/', getPosts);
router.get('/:id', getPost);
router.get('/categories/:category', getPostsBycat);
router.get('/users/:id', getPostsByAuthor);
router.patch('/:id', authMiddleware, editPost);
router.delete('/:id', authMiddleware, deletePost);

module.exports = router; 