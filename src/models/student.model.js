import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const studentSchema = new mongoose.Schema(
    {
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
        },
        name: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        fatherName: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        adharNumber: {
            type: String,
            trim: true,
        },
        gender: {
            type: String,
            enum: ["male", "female"],
            required: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        mobile: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            validate: {
                validator: function (v) {
                    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
                },
                message: (props) => `${props.value} is not a valid email!`,
            },
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        entryDate: {
            type: Date,
            required: true,
        },
        subscriptionEndDate: {
            type: Date,
            required: true,
        },
        shift: {
            type: String,
            enum: ["morning", "evening", "afternoon", "night", "reserved"],
            required: true,
        },
        timing: {
            type: String,
            enum: [
                "7:00 AM - 12:00 PM",
                "12:00 PM - 4:00 PM",
                "4:00 PM - 8:00 PM",
                "8:00 PM - 11:00 PM",
                "Full Time",
            ],
            required: true,
        },
        seat: {
            type: String,
            required: true,
        },
        reservedSeat: {
            type: Boolean,
            default: false,
        },
        monthlyFee: {
            type: String,
            enum: ["500", "1000", "1500", "2000", "2500", "3000"],
            required: true,
        },
        feesubmit: {
            type: String,
            required: true,
        },
        isSubscriptionActive: {
            type: Boolean,
            default: false,
        },
        remainingDays: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// ✅ Automatically update `remainingDays` when saving
studentSchema.pre("save", function (next) {
    if (this.subscriptionEndDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to midnight
        const endDate = new Date(this.subscriptionEndDate);
        endDate.setHours(0, 0, 0, 0); // Set to midnight

        const timeDiff = endDate - today;
        this.remainingDays = Math.max(Math.ceil(timeDiff / (1000 * 3600 * 24)), 0);
    }
    next();
});

// ✅ Automatically update `remainingDays` when saving
studentSchema.pre("save", function (next) {
    if (this.subscriptionEndDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to midnight
        const endDate = new Date(this.subscriptionEndDate);
        endDate.setHours(0, 0, 0, 0); // Set to midnight

        const timeDiff = endDate - today;
        this.remainingDays = Math.max(Math.ceil(timeDiff / (1000 * 3600 * 24)), 0);
    }
    next();
});


// ✅ Hash password before saving
studentSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ✅ Compare password method
studentSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

// ✅ Generate JWT token
studentSchema.methods.generateToken = async function () {
    return jwt.sign(
        { _id: this._id, name: this.name },
        process.env.TOKEN_SECRET,
        {
            expiresIn: "7d",
        }
    );
};

export const Students = mongoose.model("Students", studentSchema);