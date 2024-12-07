import React, { useState, useEffect } from "react";
import { auth } from "../Firebase/firebase";
import { getDatabase, ref, get } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { logOut } from "../Firebase/firebase";
import "./profile.css"
import {
    UserCircle2,
    Mail,
    GraduationCap,
    MapPin,
    LogOut,
    BookUser,
    Building2
} from "lucide-react";

// Function to fetch user role
const fetchUserRole = async (userId) => {
    try {
        const db = getDatabase();
        const instructorRef = ref(db, `registrations/instructor/${userId}`);
        const instructorSnapshot = await get(instructorRef);
        if (instructorSnapshot.exists()) {
            return "instructor";
        }

        const studentRef = ref(db, `registrations/student/${userId}`);
        const studentSnapshot = await get(studentRef);
        if (studentSnapshot.exists()) {
            return "student";
        }

        throw new Error("Role not found for user");
    } catch (error) {
        console.error("Error fetching user role:", error.message);
        throw error;
    }
};

const Profile = () => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Handle Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    const userRole = await fetchUserRole(currentUser.uid);
                    setRole(userRole);
                    await fetchUserData(currentUser.uid, userRole);
                } catch (error) {
                    console.error("Error during user setup:", error);
                }
            } else {
                setUser(null);
                navigate("/login");
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [navigate]);

    // Function to fetch user data based on role
    const fetchUserData = async (userId, userRole) => {
        const db = getDatabase();
        const userRef = ref(db, `registrations/${userRole}/${userId}`);

        try {
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                setUserData(snapshot.val());
            } else {
                console.log("No user data found.");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    // Function to handle logout (added directly in the component)
    const handleLogout = async () => {
        try {
            await logOut();
            navigate("/login");
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    // Loading state with animated loader
    if (loading) {
        return (
            <div className="profile-loading">
                <div className="loader"></div>
                <p>Loading your profile...</p>
            </div>
        );
    }

    // No profile data found
    if (!userData) {
        return (
            <div className="profile-error">
                <p>No profile data found. Please complete your registration.</p>
                <button onClick={() => navigate('/update-profile')}>
                    Complete Profile
                </button>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <div className="profile-avatar">
                        <UserCircle2 size={100} className="avatar-icon" />
                    </div>
                    <h1>{user.displayName || userData.fullName}</h1>
                    <p className="profile-role-badge">{role.toUpperCase()}</p>
                </div>

                <div className="profile-grid">
                    <div className="profile-card">
                        <h3><Mail className="card-icon" /> Contact Information</h3>
                        <div className="card-content">
                            <p><strong>Email:</strong> {user.email}</p>
                        </div>
                    </div>

                    <div className="profile-card">
                        <h3><MapPin className="card-icon" /> Personal Details</h3>
                        <div className="card-content">
                            <p><strong>Full Name:</strong> {userData.fullName}</p>
                            <p><strong>Location:</strong> {userData.location}</p>
                        </div>
                    </div>

                    {role === "student" && (
                        <div className="profile-card">
                            <h3><GraduationCap className="card-icon" /> Student Information</h3>
                            <div className="card-content">
                                <p><strong>Branch:</strong> {userData.branch}</p>
                                <p><strong>Year of Study:</strong> {userData.yearOfStudy}</p>
                            </div>
                        </div>
                    )}

                    {role === "instructor" && (
                        <div className="profile-card">
                            <h3><Building2 className="card-icon" /> Instructor Details</h3>
                            <div className="card-content">
                                <p><strong>Department:</strong> {userData.department}</p>
                                <p><strong>Subjects:</strong> {userData.subjects}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="profile-actions">
                    <button
                        className="profile-edit-btn"
                        onClick={() => navigate('/edit-profile')}
                    >
                        Edit Profile
                    </button>
                    <button
                        className="profile-logout-btn"
                        onClick={handleLogout}
                    >
                        <LogOut className="btn-icon" /> Log Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
