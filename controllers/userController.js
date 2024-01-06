const bcrypt = require('bcryptjs');
const User = require('../models/userModels');
const jwt = require('jsonwebtoken');
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
        const user = await User.findOne({email: newEmail})
        if(!user) {
            return next(new HttpError('Invalid Credentials', 422))
        }
        const comparePass = await bcrypt.compare(password, user.password)
        if(!comparePass) {
            return next(new HttpError('Invalid Credentials', 422))
        }
        const {_id: id, name} = user; 
        const token = jwt.sign({id, name}, process.env.JWT_SCRET, {expiresIn: '1d'})

    } catch (error) {
        return next(new HttpError('Login failed. Please check your credentials.', 422))
    }
};

const getUser = async (req, res, next) => {
    res.json('Get User')
};

const changeAvatar = async (req, res, next) => {
    res.json('Change User Avatar')
};

const editUser = async (req, res, next) => {
    res.json('Edit User Details')
};

const getAuthors = async (req, res, next) => {
    res.json('Get Authors')
};

module.exports = { registerUser, loginUser, getUser, changeAvatar,editUser, getAuthors}