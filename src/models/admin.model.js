import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";

const adminSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        profilePic: {
            type: String,
            required: false,
        },
        libraryName:{
            type: String,
            required: true,
        },
        contact:{
            type: String,
            required: true,
        },
        myStudents: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Students"
            }
        ]
    },
    {
        timestamps: true,
    }
);

adminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

adminSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
}

adminSchema.methods.generateToken = async function () {
    return jwt.sign(
        { _id: this._id, username: this.username },
        process.env.TOKEN_SECRET,
        {
            expiresIn: "7d",
        }
    )
};

export const Admin = mongoose.model("Admin", adminSchema);