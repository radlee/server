const Post = require('../models/postModel');
const User = require('../models/userModels');
const HttpError = require('../models/errorModel');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const { error } = require('console');


// =================================== CREATE A POST
const createPost = async (req, res, next) => {

    try {
        let { title, category, content, thumbnail } = req.body;
        // if (!title || !content || !category || !req.files) {
        //     return next(new HttpError('Fill in all field and choose thumbnail.', 422));
        // }
        // const { thumbnail } = req.files;

        // Check the File Size
        // if (thumbnail.size > 20000000) {
        //     return next(new HttpError('Thumbnail too big. File should be less than 2mb.'));
        // }

        const newPost = await Post.create({
            title,
            category,
            content,
            thumbnail,
            author: req.user.id
        });

        if (!newPost) {
            return next(new HttpError("Post couldn't be created.", 422));
        }

        // Find User and increase Post Count
        const currentUser = await User.findById(req.user.id);
        const userPostCount = currentUser.posts + 1;
        await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });

        res.status(201).json(newPost);
    } catch (error) {
        return next(new HttpError(error));
    }
};


// =================================== GET ALL POST
const getPosts = async (req, res, next) => {
    try {
        const page_size = 9;
        const page = parseInt(req.query.page, 10) || 1; // Parse as integer and default to 1 if undefined
        const total = await Post.countDocuments({});
        const posts = await Post.find({})
            .sort({ updatedAt: -1 })  // Sort by createdAt in descending order
            .limit(page_size)
            .skip(page_size * (page - 1)); // Adjusted skip calculation

        res.json({ total, posts });
    } catch (error) {
        return next(new HttpError(error));
    }
};

// =================================== GET POST BY ID
// - GET : -> api/posts/:id (UNPROTECTED)
const getPost = async (req, res, next) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if(!post) {
            return next(new HttpError('Post Not Found.', 422));
        }
        res.status(200).json(post);
    } catch (error) {
        return next(new HttpError(error));
    }
}
// =================================== GET POSTS BY CATEGORY
// - GET : -> api/posts/categories/:category (UNPROTECTED)
const getPostsBycat = async (req, res, next) => {
    try {
        const { category } = req.params;
        const catPosts = await Post.find({ category }).sort({ createdAt: -1 });
        res.status(200).json(catPosts);
    } catch (error) {
        return next(new HttpError(error))
    }
}

// =================================== GET POSTS BY AUTHOR
// - GET : -> api/posts/users/:id (UNPROTECTED)
const getPostsByAuthor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const posts = await Post.find({ author: id }).sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        return next(new HttpError(error))
    }
}

// =================================== EDIT POST
// - PATCH : -> api/posts/:id (PROTECTED)
const editPost = async (req, res, next) => {
    try {
        let updatedPost;
        const postId = req.params.id;
        let { title, category, content, thumbnail } = req.body;
        //ReactQuill has a paragraph opening and closing tag with a break tag in between so the are 11 characters in there already.
        if(!title || !category || content.length < 12 ){
            return next(new HttpError('Fill in all fields.', 422));
        }
        if(!req.files) {
            updatedPost = await Post.findByIdAndUpdate(postId, { title, category, content, thumbnail }, { new: true});
        } else {
            //Get Old Post from DB
            const oldPost = await Post.findById(postId);
            if(req.user.id == oldPost.author) {
         
            //Delete Old Thumbnail from DB
            fs.unlink(path.join(__dirname, '..', 'uploads', oldPost.thumbnail), async (err) => {
                if(err) {
                    return next(new HttpError(err));
                } 
            });

            updatedPost = await Post.findByIdAndUpdate(postId, { title, category, content, thumbnail }, { new: true })
        }
    }

    
    if(!updatedPost) {
        return next(new HttpError('Could not update Post.', 400));
     }

     res.status(200).json(updatedPost);

    } catch (error) {
        return next(new HttpError(error))
    }
}

// =================================== DELETE POST
// - DELETE : -> api/posts/:id (PROTECTED)
const deletePost = async (req, res, next) => {
    try {
        const postId = req.params.id;
        if (!postId) {
            return next(new HttpError('Post ID not provided'));
        }

        const post = await Post.findById(postId);
        if (!post) {
            return next(new HttpError('Post not found', 404));
        }

        if (req.user.id !== post.author.toString()) {
            return next(new HttpError('You are not authorized to delete this post', 403));
        }

        // Delete the post
        await post.deleteOne();

        // Find user and reduce Post count by 1
        const currentUser = await User.findById(req.user.id);
        if (currentUser) {
            currentUser.posts -= 1;
            await currentUser.save();
        }

        res.json(`Post ${postId} deleted successfully.`);
    } catch (error) {
        return next(new HttpError(`Could not delete post: ${error.message}`));
    }
};


module.exports = { createPost, getPosts, getPost, getPostsBycat, getPostsByAuthor, editPost, deletePost }