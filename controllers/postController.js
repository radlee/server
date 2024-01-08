const Post = require('../models/postModel');
const User = require('../models/userModels');
const HttpError = require('../models/errorModel');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');


// =================================== CREATE A POST
// - POST : -> api/posts (PROTECTED)
const createPost = async (req, res, next) => {
    try {
        let { title, category, content } = req.body;
        if(!title || !content || !category || !req.files ) {
            return next(new HttpError('Fill in all field and choose thumbnail.', 422));
        }
        const { thumbnail } = req.files;
        //Check the File Size
        if(thumbnail.size > 20000000) {
            return next(new HttpError('Thumbnail too big. File should be less than 2mb.'));
        }
        let fileName = thumbnail.name;
        let splittedFilename = fileName.split('.');
        let newFilename = splittedFilename[0] + uuid() + '.' + splittedFilename[splittedFilename.length -1]
        thumbnail.mv(path.join(__dirname, '..', '/uploads', newFilename), async (err) => {
            if(err) {
                return next(new HttpError(err));
            } else {
                const newPost = await Post.create({
                    title, 
                    category, 
                    content, 
                    thumbnail: {
                        data: fs.readFileSync(path.join(__dirname, '..', '/uploads', newFilename)),
                        contentType: thumbnail.mimetype,
                        filename: newFilename,
                    }, 
                    author: req.user.id
                });
                if(!newPost) {
                    return next(new HttpError("Post couldn't be created.", 422));
                }
                //Find User and increase Post Count
                const currentUser = await User.findById(req.user.id);
                const userPostCount = currentUser.posts + 1;
                await User.findByIdAndUpdate(req.user.id,  { posts: userPostCount })

                res.status(201).json(newPost)
            }
        })
    } catch (error) {
        return next(new HttpError(error))
    }
}

// =================================== GET ALL POST
// - GET : -> api/posts (UNPROTECTED)
const getPosts = async (req, res, next) => {
   try {
    const posts = await Post.find().sort({ updatedAt: -1 });
    res.status(200).json(posts);
   } catch (error) {
    return next(new HttpError(error))
   }
}

// =================================== GET POST BY ID
// - GET : -> api/posts/:id (UNPROTECTED)
const getPost = async (req, res, next) => {
    res.json('Get Single Post')
}
// =================================== GET POSTS BY CATEGORY
// - GET : -> api/posts/categories/:category (UNPROTECTED)
const getPostsBycat = async (req, res, next) => {
    res.json('Get Posts by Category')
}

// =================================== GET POSTS BY AUTHOR
// - GET : -> api/posts/users/:id (UNPROTECTED)
const getPostsByAuthor = async (req, res, next) => {
    res.json('Get Posts By Author')
}

// =================================== EDIT POST
// - PATCH : -> api/posts/:id (PROTECTED)
const editPost = async (req, res, next) => {
    res.json('Edit Post')
}

// =================================== DELETE POST
// - DELETE : -> api/posts/:id (PROTECTED)
const deletePost = async (req, res, next) => {
    res.json('Delete Post')
}

module.exports = { createPost, getPosts, getPost, getPostsBycat, getPostsByAuthor, editPost, deletePost }