const Post = require('../models/postModel');
const User = require('../models/userModels');
const HttpError = require('../models/errorModel');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const { error } = require('console');


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
                    thumbnail: newFilename,
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
    return next(new HttpError(error));
   }
}

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
        let fileName;
        let newFilename;
        let updatedPost;
        const postId = req.params.id;
        let { title, category, content } = req.body;
        //ReactQuill has a paragraph opening and closing tag with a break tag in between so the are 11 characters in there already.
        if(!title || !category || content.length < 12 ){
            return next(new HttpError('Fill in all fields.', 422));
        }
        if(!req.files) {
            updatedPost = await Post.findByIdAndUpdate(postId, { title, category, content }, { new: true});
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

            //Upload new Thumbnail
            const { thumbnail } = req.files;
            //Check file sixe
            if(thumbnail.size > 2000000) {
                return next(new HttpError('Thumbnail too big. Should be less than 2mb.'))
            }
            fileName = thumbnail.name;
            let splittedFilename = fileName.split('.');
            newFilename = splittedFilename[0] + uuid() + '.' + splittedFilename[splittedFilename.length -1]
            thumbnail.mv(path.join(__dirname, '..', 'uploads', newFilename), async(err) => {
                if(err) {
                    return next(new HttpError(err))
                }
            })

            updatedPost = await Post.findByIdAndUpdate(postId, { title, category, content, thumbnail: newFilename }, { new: true })
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
        if(!postId) {
            return next(new HttpError('Post Not Available'));
        }
        const post = await Post.findById(postId);
        const fileName = post?.thumbnail;
        if(req.user.id == post.author) {

        //Delete Thumbnail from Uploads Folder
        fs.unlink(path.join(__dirname, '..', 'uploads', fileName), async(err) => {
            if(err) {
                return runInNewContext(new HttpError(err))
            } else {
                await Post.findOneAndDelete(postId);

                //Find user and Reduce Post count by 1
                const currentUser = await User.findById(req.user.id);
                const userPostCount = currentUser?.posts -1;
                await User.findByIdAndDelete(req.user.id, {posts: userPostCount })
                res.json(`Post ${postId} deleted successfully.`)
            }
        }) 
    } else {
        return next(new HttpError('Post could not be deleted.', 403));
    }
    } catch (error) {
        return next(new HttpError(error))
    }
}

module.exports = { createPost, getPosts, getPost, getPostsBycat, getPostsByAuthor, editPost, deletePost }