import React, { useState } from 'react';
import { 
  FaUserCircle, 
  FaEdit, 
  FaTrash, 
  FaCheckSquare 
} from 'react-icons/fa';
import './users.css';

const Users = () => {
  const [activeTab, setActiveTab] = useState('approved');

  return (
    <div className="users-container">
      {/* Header */}
      <div className="users-header">
        <h1>User Management</h1>
        <FaUserCircle className="users-profile-icon" />
      </div>

      {/* Tabs */}
      <div className="users-tabs">
        <button
          className={activeTab === 'approved' ? 'active' : ''}
          onClick={() => setActiveTab('approved')}
        >
          Approved Users
        </button>
        <button
          className={activeTab === 'pending' ? 'active' : ''}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approval
        </button>
      </div>

      {/* Table */}
      <div className="users-table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Phone Number</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* single blank row until backend is hooked up */}
            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td className="actions-cell">
                {activeTab === 'approved' ? (
                  <>
                    <FaEdit className="icon edit" />
                    <FaTrash className="icon delete" />
                  </>
                ) : (
                  <>
                    <FaCheckSquare className="icon approve" />
                    <FaTrash className="icon delete" />
                  </>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
