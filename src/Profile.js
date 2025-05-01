import React, { useState, useEffect } from 'react';
import { FaTimes, FaUserCircle, FaCamera } from 'react-icons/fa';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase';
import './profile.css';

const Profile = ({ isOpen, onClose }) => {
  const [user, setUser] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    role: '',
    photoURL: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [previewURL, setPreviewURL] = useState('');

  const auth = getAuth();
  const storage = getStorage();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUser({
              fullName: userData.fullName || '',
              phoneNumber: userData.phoneNumber || '',
              email: userData.email || currentUser.email || '',
              role: userData.role || '',
              photoURL: userData.photoURL || currentUser.photoURL || ''
            });
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchUserData();
    }
  }, [isOpen, auth]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewURL(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No authenticated user found");

      let photoURL = user.photoURL;

      // Upload new profile image if selected
      if (imageFile) {
        const storageRef = ref(storage, `profileImages/${currentUser.uid}`);
        await uploadBytes(storageRef, imageFile);
        photoURL = await getDownloadURL(storageRef);
      }

      const userRef = doc(db, 'users', currentUser.uid);
      
      await updateDoc(userRef, {
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
        photoURL: photoURL,
        lastUpdated: new Date()
      });

      setUser(prev => ({
        ...prev,
        photoURL: photoURL
      }));
      
      setIsEditing(false);
      setImageFile(null);
      setPreviewURL('');
      alert('Profile updated successfully!');
    } catch (error) {
      console.error("Error updating profile:", error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="profile-overlay">
      <div className="profile-modal">
        <div className="profile-header">
          <h2>User Profile</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {isLoading ? (
          <div className="profile-loading">Loading profile information...</div>
        ) : (
          <div className="profile-content">
            <div className="profile-image-container">
              {previewURL || user.photoURL ? (
                <img 
                  src={previewURL || user.photoURL} 
                  alt="Profile" 
                  className="profile-image" 
                />
              ) : (
                <FaUserCircle className="profile-image-placeholder" />
              )}
              
              {isEditing && (
                <div className="image-upload">
                  <label htmlFor="photo-upload" className="upload-label">
                    <FaCamera className="camera-icon" />
                  </label>
                  <input 
                    type="file" 
                    id="photo-upload" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="upload-input" 
                  />
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input 
                  type="text" 
                  id="fullName" 
                  name="fullName" 
                  value={user.fullName} 
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={isEditing ? '' : 'readonly'}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input 
                  type="tel" 
                  id="phoneNumber" 
                  name="phoneNumber" 
                  value={user.phoneNumber} 
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={isEditing ? '' : 'readonly'}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={user.email} 
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={isEditing ? '' : 'readonly'}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <input 
                  type="text" 
                  id="role" 
                  name="role" 
                  value={user.role} 
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={isEditing ? '' : 'readonly'}
                />
              </div>

              <div className="profile-buttons">
                {isEditing ? (
                  <>
                    <button type="submit" className="save-button">Save Changes</button>
                    <button 
                      type="button" 
                      className="cancel-button" 
                      onClick={() => {
                        setIsEditing(false);
                        setImageFile(null);
                        setPreviewURL('');
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button 
                    type="button" 
                    className="edit-button" 
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;