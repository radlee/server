const bcrypt = require('bcryptjs');
const User = require('../models/userModels');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');

const HttpError = require('../models/errorModel');

// Unprotected
const registerUser = async (req, res, next) => {
    try {
        const { name, email, password, password2 } = req.body;
        if(!name || !email || !password) {
            return next(new HttpError('Fill in all fields.', 422));
        }
        const newEmail = email.toLowerCase();
        const emailExists = await User.findOne({ email: newEmail })
        if(emailExists) {
            return next(new HttpError('Email already exists.', 422))
        }

        if((password.trim()).length < 6 ) {
            return next(new HttpError('Password should be at least 6 characters.', 422))
        }
        if(password != password2 ) {
            return next(new HttpError('Passwords do no match.', 422))
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await User.create({name, email, newEmail, password: hashedPassword})
        res.status(201).json(`New user ${newUser.email} registered`)

    } catch (error) {
        return next(new HttpError('User registration failed', 422));
    }
};

// Unprotected
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if(!email || !password) {
            return next(new HttpError('Fill in all fiels', 422))
        }
        const newEmail = email.toLowerCase();
        const user = await User.findOne({email: newEmail});
          
        if(!user) {
            return next(new HttpError('Invalid Credentials', 422))
        }
        const comparePass = await bcrypt.compare(password, user.password)
        if(!comparePass) {
            return next(new HttpError('Invalid Credentials', 422))
        }
        const {_id: id, name} = user; 
        const token = jwt.sign({id, name}, process.env.JWT_SECRET, {expiresIn: '1d'})

        res.status(200).json({ token, id, name })

    } catch (error) {
        return next(new HttpError('Login failed. Please check your credentials.', 422))
    }
};

const getUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password');
        if(!user) {
            return next(new HttpError('User Not Found.', 404))
        }
        res.status(200).json(user);
    } catch (error) {
        return next(new HttpError(error))
    }
};

const changeAvatar = async (req, res, next) => {
    console.log("Here", req.body)
    try {
        if(!req.body.avatar){
            return next(new HttpError('Please choose an image.', 422));
        }

        
        const updatedAvatar = await User.findByIdAndUpdate(req.user.id, { avatar: req.body.avatar }, { new: true });
            if(!updatedAvatar) {
                return next(new HttpError('Avatar could not be changed.', 422));
            }
            res.status(200).json(updatedAvatar);

    } catch (error) {
        return next(new HttpError(error));
    }
};

const editUser = async (req, res, next) => {
    try {
        const { name, email, currentPassword, newPassword, confirmNewPassword } = req.body;
        if(!name || !email || !currentPassword || !newPassword) {
            return next(new HttpError('Fill in all fields.', 422));
        }
        const user = await User.findById(req.user.id);
        if(!user) {
            return next(new HttpError('User Not Found.', 403));
        }
        // make sure new email does not already exist
        const emailExists = await User.findOne({email});
        
        if(emailExists && (emailExists._id != req.user.id)){
            return next(new HttpError('Email already exists.', 422));
        }

        // compare current password to db passoword
        const validateUserPassword = await bcrypt.compare(currentPassword, user.password);
        if(!validateUserPassword) {
            return next(new HttpError('Invalid Current Password', 422));
        }

        //Compare New Password
        if(newPassword !== confirmNewPassword) {
            return next(new HttpError('New Passwords do not match.', 422));
        }

        //Hash New Password
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);

        //Upadate User Info
        const newInfo = await User.findByIdAndUpdate(req.user.id, { name, email, password: hashed }, { new: true });
        res.status(200).json(newInfo);

    } catch (error) {
        return next(new HttpError(error));
    }
};

const getAuthors = async (req, res, next) => {
    try {
        const authors = await User.find().select('-password');
        res.json(authors)
    } catch (error) {
        return next(new HttpError(error));
    }
};

module.exports = { registerUser, loginUser, getUser, changeAvatar,editUser, getAuthors}