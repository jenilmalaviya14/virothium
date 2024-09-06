const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'public/images/token-icons/';
        fs.mkdir(uploadPath, { recursive: true }, err => {
            if (err) {
                console.error("Error creating directory:", err);
            }
            cb(null, uploadPath);
        });
    },
    filename: (req, file, cb) => {
        const tokenAddress = req.params.tokenAddress;
        const ext = path.extname(file.originalname);
        cb(null, `${tokenAddress}${ext}`);
    }
});

const upload = multer({ storage });

const setBaseURL = (req, res, next) => {
    let protocol = req.protocol;
    if (req.headers['x-forwarded-proto'] === 'https') {
        protocol = 'https';
    }
    req.baseURL = `${protocol}://${req.get('host')}/`;
    next();
};

module.exports = { upload, setBaseURL };