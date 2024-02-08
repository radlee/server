const { Schema, model } = require('mongoose');

const postSchema = new Schema({
    title: { type: String, required: true },
    category: { type: String, enum: ['General','Health and Wellness', 'Personal Development', 'Technology', 'Finance', 'Career and Business', 'Lifestyle', 'Travel', 'Food and Cooking'], message: '{VALUE is not supported}' },
    content: { type: String, required: true },
    author: {type: Schema.Types.ObjectId, ref: 'User'},
    thumbnail:{ type: String, required: true },
}, { timestamps: true });

module.exports = model('Post', postSchema);