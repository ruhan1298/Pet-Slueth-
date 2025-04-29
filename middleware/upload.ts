import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        console.log(ext,"EXTENTION");
        
        const originalname = `${uuidv4()}${ext}`;
        cb(null, originalname);
    },
});

const upload = multer({ storage: storage });

export default upload;
