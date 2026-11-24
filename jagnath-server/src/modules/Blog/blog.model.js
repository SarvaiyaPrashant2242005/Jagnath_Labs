/**
 * @file blog.model.js
 * @description Sequelize model for Blog posts.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Blog = sequelize.define("Blog", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id"
    },
    author_name: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "author_name"
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    short_description: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "short_description"
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    featured_image: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: "featured_image"
    },
    category: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    tags: {
        type: DataTypes.JSONB,
        defaultValue: [],
    },
    status: {
        type: DataTypes.ENUM("Draft", "Published"),
        defaultValue: "Draft",
    },
    published_at: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "published_at"
    }
}, {
    tableName: "blogs",
    paranoid: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
});

module.exports = Blog;
