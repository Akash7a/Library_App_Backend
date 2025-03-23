import { Admin } from "../models/admin.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const options = {
    httpOnly: true,
    secure: true,// process.env.NODE_ENV === "production",
    sameSite:"None",
};

const registerAdmin = async (req, res) => {
    try {
        const { username, email, password ,contact,libraryName} = req.body;

        if ([username, email, password,contact,libraryName].some((incomingDetails) => !incomingDetails) || !req.file) {
            return res.status(400).json({ message: "Username, Email, Password, and Profile Picture are required." });
        }

        const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });

        if (existingAdmin) {
            return res.status(400).json({ message: "Admin already exists with email or username." });
        }

        const profileLocalPath = req.file.path;

        const profile = await uploadOnCloudinary(profileLocalPath);

        if (!profile || !profile.url) {
            return res.status(500).json({ message: "Failed to upload profile picture to Cloudinary." });
        }

        const newAdmin = new Admin({
            username,
            email,
            password,
            contact,
            libraryName,
            profilePic: profile.url,
        });

        await newAdmin.save();

        const token = await newAdmin.generateToken();

        return res
            .cookie("token", token, options)
            .status(201)
            .json({
                admin: newAdmin,
                token: token,
                message: "Admin registered successfully.",
            });

    } catch (error) {
        console.error("Error during admin login:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const loginAdmin = async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;

        if (!usernameOrEmail || !password) {
            return res.status(400).json({ message: "Username/Email and Password are required." });
        }

        const admin = await Admin.findOne({ $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }] });

        if (!admin) {
            console.log("⚠️ Admin not found for:", usernameOrEmail); // Debugging
            return res.status(401).json({ message: "Invalid email/username or password" });
        }

        const isPasswordValid = await admin.comparePassword(password);

        if (!isPasswordValid) {
            console.log("⚠️ Invalid password for:", usernameOrEmail); // Debugging
            return res.status(401).json({ message: "Invalid email/username or password" });
        }

        const token = await admin.generateToken();

        return res
            .cookie("token", token, options)
            .status(200)
            .json({
                admin: {
                    username: admin.username,
                    email: admin.email,
                    profilePic: admin.profilePic,
                    myStudents: admin.myStudents,
                },
                token: token,
                message: "Admin logged in successfully.",
            });
    } catch (error) {
        console.error("🔥 Error during login:", error.message); // Log the actual error
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const adminProfile = async (req, res) => {
    try {
        const adminId = req.admin?._id;

        if (!adminId) {
            return res.status(403).json({ message: "Unauthorized: Admin ID not found." });
        }

        const admin = await Admin.findById(adminId);

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        return res.status(200).json({
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                profilePic: admin.profilePic,
                myStudents: admin.myStudents,
            },
            message: "Admin profile fetched successfully."
        });
    } catch (error) {
        console.error("Error fetching admin profile:", error);
        return res.status(500).json({ message: "Internal Server Error.", error: error.message });
    }
}
const adminLogout = async (req, res) => {
    try {
        res.clearCookie("token", options);

        return res.status(200).json({ message: "Admin logged out successfully." });
    } catch (error) {
        console.error("Error during logout:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}
export {
    registerAdmin,
    loginAdmin,
    adminLogout,
    adminProfile,
};
