/**
 * @file blog.routes.js
 * @description API routes for Blog system (User Management & Public Access).
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const blogController = require("./blog.controller");
const { authenticateToken } = require("../../middlewares/auth.middleware");
const { errorResponse } = require("../../utils/response");

// Multer storage for blog images
const blogUploadDir = path.join(__dirname, "../../../uploads/blogs");
if (!fs.existsSync(blogUploadDir)) {
    fs.mkdirSync(blogUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, blogUploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `blog-${uuidv4()}${ext}`);
    }
});

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif"];

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("INVALID_FILE_TYPE"), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter
});

const handleImageUpload = (req, res, next) => {
    upload.single("image")(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json(errorResponse(
                    "FILE_TOO_LARGE",
                    "Image size exceeds 10MB limit.",
                    "The uploaded image is too large. Maximum allowed size is 10MB."
                ));
            }
            if (err.message === "INVALID_FILE_TYPE") {
                return res.status(400).json(errorResponse(
                    "INVALID_FILE_TYPE",
                    "Only JPEG, PNG, WEBP, and GIF images are allowed."
                ));
            }
            return res.status(500).json(errorResponse("UPLOAD_ERROR", err.message));
        }
        next();
    });
};

/* ==========================================================================
   PUBLIC ROUTES (NO AUTH REQUIRED)
   ========================================================================== */
router.get("/public", blogController.getPublicBlogs);
router.get("/public/categories", blogController.getPublicCategories);
router.get("/public/:slug", blogController.getPublicBlogBySlug);

/* ==========================================================================
   AUTHENTICATED USER BLOG MANAGEMENT ROUTES
   ========================================================================== */
router.use(authenticateToken);

router.post("/upload-image", handleImageUpload, blogController.uploadFeaturedImage);
router.post("/", blogController.createBlog);
router.get("/my-blogs", blogController.getMyBlogs);
router.get("/:id", blogController.getBlogById);
router.put("/:id", blogController.updateBlog);
router.delete("/:id", blogController.deleteBlog);

module.exports = router;

