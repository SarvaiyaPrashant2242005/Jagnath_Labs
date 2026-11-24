/**
 * @file blog.service.js
 * @description Business logic and database operations for Blogs.
 */

const { Op } = require("sequelize");
const Blog = require("./blog.model");
const Users = require("../Auth/Users/users.model");

/**
 * Generate a clean, URL-safe slug from title.
 * Automatically appends suffix if collision occurs.
 */
const generateUniqueSlug = async (title, currentBlogId = null) => {
    let baseSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

    if (!baseSlug) {
        baseSlug = "post";
    }

    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const whereClause = { slug };
        if (currentBlogId) {
            whereClause.id = { [Op.ne]: currentBlogId };
        }
        const existing = await Blog.findOne({ where: whereClause, paranoid: false });
        if (!existing) {
            return slug;
        }
        counter += 1;
        slug = `${baseSlug}-${counter}`;
    }
};

/**
 * Normalizes tags from comma-separated string or array into an array of strings.
 */
const normalizeTags = (tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags.map(t => String(t).trim()).filter(Boolean);
    if (typeof tags === 'string') {
        try {
            const parsed = JSON.parse(tags);
            if (Array.isArray(parsed)) return parsed.map(t => String(t).trim()).filter(Boolean);
        } catch {
            return tags.split(',').map(t => t.trim()).filter(Boolean);
        }
    }
    return [];
};

/**
 * Create a new Blog
 */
const createBlog = async (data, user) => {
    const slug = await generateUniqueSlug(data.title);
    const tags = normalizeTags(data.tags);
    const authorName = data.author_name || user.name || "Jagnath Lab Team";
    const status = data.status || "Draft";
    const publishedAt = status === "Published" ? new Date() : null;

    const blog = await Blog.create({
        user_id: user.id || user.user_id,
        author_name: authorName,
        title: data.title,
        slug,
        short_description: data.short_description || "",
        content: data.content,
        featured_image: data.featured_image || null,
        category: data.category,
        tags,
        status,
        published_at: publishedAt
    });

    return blog;
};

/**
 * Get all blogs for the currently logged-in user
 */
const getUserBlogs = async (userId, query = {}) => {
    const { search, category, status } = query;
    const where = { user_id: userId };

    if (status && status !== 'all') {
        where.status = status;
    }
    if (category && category !== 'all') {
        where.category = category;
    }
    if (search) {
        where[Op.or] = [
            { title: { [Op.iLike]: `%${search}%` } },
            { short_description: { [Op.iLike]: `%${search}%` } }
        ];
    }

    return await Blog.findAll({
        where,
        order: [["created_at", "DESC"]]
    });
};

/**
 * Get single blog for editing by author or admin
 */
const getBlogByIdForUser = async (id, user) => {
    const blog = await Blog.findByPk(id);
    if (!blog) {
        return null;
    }
    const isOwner = blog.user_id === (user.id || user.user_id);
    const isAdmin = user.role === 'SuperAdmin' || user.role === 'Admin';
    if (!isOwner && !isAdmin) {
        const error = new Error("UNAUTHORIZED_ACCESS");
        error.status = 403;
        throw error;
    }
    return blog;
};

/**
 * Update Blog
 */
const updateBlog = async (id, data, user) => {
    const blog = await Blog.findByPk(id);
    if (!blog) return null;

    const isOwner = blog.user_id === (user.id || user.user_id);
    const isAdmin = user.role === 'SuperAdmin' || user.role === 'Admin';
    if (!isOwner && !isAdmin) {
        const error = new Error("UNAUTHORIZED_ACCESS");
        error.status = 403;
        throw error;
    }

    const updates = {};
    if (data.title && data.title !== blog.title) {
        updates.title = data.title;
        updates.slug = await generateUniqueSlug(data.title, blog.id);
    }
    if (data.short_description !== undefined) updates.short_description = data.short_description;
    if (data.content !== undefined) updates.content = data.content;
    if (data.featured_image !== undefined) updates.featured_image = data.featured_image;
    if (data.category !== undefined) updates.category = data.category;
    if (data.tags !== undefined) updates.tags = normalizeTags(data.tags);

    if (data.status !== undefined) {
        updates.status = data.status;
        if (data.status === "Published" && !blog.published_at) {
            updates.published_at = new Date();
        }
    }

    await blog.update(updates);
    return blog;
};

/**
 * Delete Blog (Soft delete)
 */
const deleteBlog = async (id, user) => {
    const blog = await Blog.findByPk(id);
    if (!blog) return null;

    const isOwner = blog.user_id === (user.id || user.user_id);
    const isAdmin = user.role === 'SuperAdmin' || user.role === 'Admin';
    if (!isOwner && !isAdmin) {
        const error = new Error("UNAUTHORIZED_ACCESS");
        error.status = 403;
        throw error;
    }

    await blog.destroy();
    return true;
};

/**
 * Public: Get published blogs with search, category filtering & pagination
 */
const getPublicBlogs = async (query = {}) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(query.limit, 10) || 9));
    const offset = (page - 1) * limit;

    const where = {
        status: "Published"
    };

    if (query.category && query.category !== 'all') {
        where.category = query.category;
    }

    if (query.search && query.search.trim()) {
        const searchPattern = `%${query.search.trim()}%`;
        where[Op.or] = [
            { title: { [Op.iLike]: searchPattern } },
            { short_description: { [Op.iLike]: searchPattern } }
        ];
    }

    const { count, rows } = await Blog.findAndCountAll({
        where,
        order: [
            ["published_at", "DESC"],
            ["created_at", "DESC"]
        ],
        limit,
        offset,
        attributes: [
            "id", "author_name", "title", "slug", "short_description",
            "featured_image", "category", "tags", "status", "published_at", "created_at"
        ]
    });

    return {
        blogs: rows,
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
    };
};

/**
 * Public: Get single published blog by slug
 */
const getPublicBlogBySlug = async (slug) => {
    const blog = await Blog.findOne({
        where: {
            slug,
            status: "Published"
        }
    });

    if (!blog) return null;

    // Fetch related published blogs under same category
    const relatedBlogs = await Blog.findAll({
        where: {
            status: "Published",
            category: blog.category,
            id: { [Op.ne]: blog.id }
        },
        limit: 3,
        order: [["published_at", "DESC"]],
        attributes: [
            "id", "author_name", "title", "slug", "short_description",
            "featured_image", "category", "published_at"
        ]
    });

    return {
        blog,
        relatedBlogs
    };
};

/**
 * Public: Get distinct categories among published blogs
 */
const getPublicCategories = async () => {
    const blogs = await Blog.findAll({
        where: { status: "Published" },
        attributes: ["category"],
        group: ["category"]
    });
    return blogs.map(b => b.category).filter(Boolean);
};

module.exports = {
    createBlog,
    getUserBlogs,
    getBlogByIdForUser,
    updateBlog,
    deleteBlog,
    getPublicBlogs,
    getPublicBlogBySlug,
    getPublicCategories
};

