const { Schema, model } = require('mongoose');

const postSchema = new Schema({
    title: { type: String, required: true },
    category: { type: String, enum: ['Robotics','Technology', 'Business', 'Literature', 'General', 'Programming', 'Life Style', 'Design', 'Sports'], message: '{VALUE is not supported}' },
    content: { type: String, required: true },
    author: {type: Schema.Types.ObjectId, ref: 'Users'},
    thumbnail:{ type: String, required: true },
}, { timestamps: true });

module.exports = model('Post', postSchema);