import { Students } from "../models/student.model.js";
import { Admin } from "../models/admin.model.js";

const addStudent = async (req, res) => {
    try {
        console.log("Received request to add a new student.");

        const { name, address, mobile, entryDate, subscriptionEndDate, shift, reservedSeat, isSubscriptionActive, email, password, fatherName, adharNumber, gender, monthlyFee, feesubmit, timing, seat } = req.body;
        console.log("Extracted student details from request body.");

        const adminId = req.admin?._id;
        console.log("Extracted admin ID:", adminId);

        if (!adminId) {
            console.log("Unauthorized: Admin ID not found.");
            return res.status(403).json({ message: "Unauthorized: Admin ID not found." });
        }

        if (!name || !address || !mobile || !entryDate || !subscriptionEndDate || !shift || !email || !password || !fatherName || !gender || !monthlyFee || !feesubmit || !timing || !seat) {
            console.log("Missing required fields.");
            return res.status(400).json({ message: "All required fields must be provided." });
        }

        console.log("Checking if student already exists...");
        const existingStudent = await Students.findOne({ $or: [{ email }, { mobile }, { adharNumber }], admin: adminId });

        if (existingStudent) {
            console.log("Student already exists with this email, mobile, or Aadhar number.");
            return res.status(400).json({ message: "Student already exists with this email or mobile or Aadhar number." });
        }

        console.log("Creating a new student instance.");
        const newStudent = new Students({
            admin: adminId,
            name,
            address,
            mobile,
            email,
            password,
            entryDate,
            subscriptionEndDate,
            shift,
            feesubmit,
            fatherName,
            adharNumber,
            monthlyFee,
            gender,
            seat,
            timing,
            reservedSeat: reservedSeat || false,
            isSubscriptionActive: isSubscriptionActive ?? true,
        });

        console.log("Saving new student to the database.");
        await newStudent.save();

        console.log("Updating the admin's student list.");
        const admin = await Admin.findByIdAndUpdate(
            adminId,
            { $push: { myStudents: newStudent._id } },
            { new: true }
        );

        if (!admin) {
            console.log("Admin not found.");
            return res.status(404).json({ message: "Admin not found." });
        }

        console.log("Student added successfully.");
        return res.status(201).json({
            student: newStudent,
            message: "Student added successfully and linked to admin.",
        });
    } catch (error) {
        console.error("Error adding student:", error);
        return res.status(500).json({ message: "Internal Server Error.", error: error.message });
    }
};

const getStudents = async (req, res) => {
    try {
        const adminId = req.admin?._id;

        if (!adminId) {
            return res.status(403).json({ message: "Unauthorized: Admin ID not found" });
        }

        const admin = await Admin.findById(adminId).populate("myStudents");

        if (!admin || !admin.myStudents) {
            return res.status(401).json({ message: "No Students found." });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let studentsToUpdate = [];

        admin.myStudents.forEach((student) => {
            const endDate = new Date(student.subscriptionEndDate);
            endDate.setHours(0, 0, 0, 0);
            const timeDiff = endDate - today;
            student.remainingDays = Math.max(Math.ceil(timeDiff / (1000 * 3600 * 24)), 0);

            // Automatically update subscription status if expired
            if (student.remainingDays <= 0 && student.isSubscriptionActive) {
                student.isSubscriptionActive = false;
                studentsToUpdate.push(student._id);
            }
        });

        // Update students in the database whose subscription expired
        if (studentsToUpdate.length > 0) {
            await Students.updateMany(
                { _id: { $in: studentsToUpdate } },
                { $set: { isSubscriptionActive: false } }
            );
        }

        const unpaidFeeStudents = admin.myStudents.filter(student => !student.isSubscriptionActive || student.remainingDays <= 0);

        return res.status(200).json({
            myStudents: admin.myStudents,
            totalStudents: admin.myStudents.length,
            unpaidFeeStudents: unpaidFeeStudents,
            message: "Students fetched successfully",
        });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const deleteStudent = async (req, res) => {
    try {
        const { studentId } = req.params;

        if (!studentId) {
            return res.status(403).json({ message: "Student ID not found" });
        }

        // Find and delete the student
        const deletedStudent = await Students.findByIdAndDelete(studentId);

        if (!deletedStudent) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Remove the student ID from the admin's myStudents array
        const adminId = deletedStudent.admin; // Assuming the student document has a reference to admin
        await Admin.findByIdAndUpdate(adminId, {
            $pull: { myStudents: studentId },
        });

        return res.status(200).json({
            id: studentId,
            message: "Student deleted successfully and removed from admin's list.",
        });
    } catch (error) {
        console.error("Error deleting student:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const updateStudent = async (req, res) => {
    try {
        const { studentId } = req.params;

        if (!studentId) {
            return res.status(403).json({ message: "Student ID not found." });
        }

        const updateData = req.body;

        if (!updateData) {
            return res.status(400).json({ message: "No data provided for updating." });
        }

        if (updateData.subscriptionEndDate) {
            const today = new Date();
            const endDate = new Date(updateData.subscriptionEndDate);
            const timeDiff = endDate - today;
            const remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
            updateData.remainingDays = remainingDays > 0 ? remainingDays : 0;
        }

        const updatedStudent = await Students.findByIdAndUpdate(
            studentId,
            { $set: updateData },
            { new: true, runValidators: true }
        )

        if (!updatedStudent) {
            return res.status(404).json({ message: "Student not found." });
        }

        return res.status(200).json({
            student: updatedStudent,
            message: "Student updated successfully.",
        })
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message })
    }
}

const getFeeCollection = async (req, res) => {
    try {
        const adminId = req.admin?._id;

        if (!adminId) {
            return res.status(403).json({ message: "Unauthorized: Admin ID not found." });
        }

        const admin = await Admin.findById(adminId).populate("myStudents");

        if (!admin || !admin.myStudents || admin.myStudents.length === 0) {
            return res.status(404).json({ message: "No students found for this admin." });
        }

        const currentDate = new Date();
        const thirtyDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - 30));

        const students = admin.myStudents.filter(student => {
            return (
                student.feesubmit >= thirtyDaysAgo || student.isSubscriptionActive
            );
        });

        const totalFeesCollected = students.reduce((total, student) => {
            return total + parseInt(student.monthlyFee || 0, 10);
        }, 0);

        return res.status(200).json({
            totalFeesCollected,
            students,
            message: "Total fee collection fetched.",
        });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const getOneStudentProfile = async (req, res) => {
    try {
        const adminId = req.admin?._id;
        const { studentId } = req.params;

        if (!adminId) {
            return res.status(403).json({ message: "Unauthorized: Admin ID not found." });
        }

        if (!studentId) {
            return res.status(400).json({ message: "Student ID not found" });
        }

        const student = await Students.findOne({
            _id: studentId,
            admin: adminId
        });

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        return res.status(200).json({
            student: student,
            message: "Student fetched successfully",
        });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}

 
let cachedStudents = []; // Global variable to cache students from getStudents

const findStudentsWithSubscriptionFinish = async (req, res) => {
    try {
        const adminId = req.admin?._id;

        if (!adminId) {
            return res.status(403).json({ message: "Unauthorized: Admin ID not found." });
        }

        // Ensure cachedStudents is populated by fetching students if not already cached
        if (cachedStudents.length === 0) {
            const admin = await Admin.findById(adminId).populate("myStudents");

            if (!admin || !admin.myStudents) {
                return res.status(404).json({ message: "No students found for this admin." });
            }

            cachedStudents = admin.myStudents;
        }

        // Get the current date normalized to the start of the day
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter students whose subscription has expired
        const expiredStudents = cachedStudents.filter(student => {
            const endDate = new Date(student.subscriptionEndDate);
            endDate.setHours(0, 0, 0, 0);
            return endDate < today && student.isSubscriptionActive === false;
        });
        // Remove students who have paid the fee and have more than 0 days left
        expiredStudents.forEach((student, index) => {
            const endDate = new Date(student.subscriptionEndDate);
            endDate.setHours(0, 0, 0, 0);
            const timeDiff = endDate - today;
            const remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

            if (remainingDays > 0 && student.isSubscriptionActive) {
            expiredStudents.splice(index, 1);
            }
        });
        return res.status(200).json({
            count: expiredStudents.length,
            students: expiredStudents,
            message: "Fetched all students with expired subscriptions.",
        });
    } catch (error) {
        console.error("Error fetching students with expired subscriptions:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};
export {
    getStudents,
    addStudent,
    deleteStudent,
    updateStudent,
    getFeeCollection,
    getOneStudentProfile,
    findStudentsWithSubscriptionFinish,
}
