const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

const multerStorage = multer.diskStorage({
    destination: function (req, res, cb) {
        cb(null, path.join(__dirname, '../public/images'));
    },
    filename: function (req, res, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * le9)
        cb(null, file.fieldname + '-' + uniqueSuffix + '.jpeg');
    }
});


const multerFilter = (req, res, cb) => {
    if(file.mimetype.startsWith('image')) {
        cb(null, true)
    } else {
        cb({
            message: 'Unsupported file format'
        }, false)
    }
}

const uploadPhoto = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fieldSize: 2000000}
});

const blogImgResize = async(req, res, next) => {
    if(!req.files) return next();
    await Promise.all(
        req.files.map( async (file) => {
            await sharp(file.path)
            .resize(300, 300)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/image/blogs/${file.filename}`);
        })
    );

    next();
};

module.exports = { uploadPhoto, blogImgResize  }