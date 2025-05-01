import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import './inventory.css';

export const AddCategoryModal = ({ setIsCategoryModalOpen, refreshCategories }) => {
  const [categoryName, setCategoryName] = useState('');
  const [color, setColor] = useState('#000000');
  const [existingCategories, setExistingCategories] = useState([]);
  const [selectedCategoryToDelete, setSelectedCategoryToDelete] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const snap = await getDocs(collection(db, 'categories'));
      const categories = snap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setExistingCategories(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const name = categoryName.trim();
    if (!name) return alert('Category name is required');
    if (existingCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      return alert('Category already exists');
    }
    try {
      await addDoc(collection(db, 'categories'), { name, color, createdAt: serverTimestamp() });
      await fetchCategories();
      refreshCategories();
      setCategoryName('');
      setColor('#000000');
      alert('Category added successfully.');
    } catch (err) {
      console.error('Error adding category:', err);
      alert('Failed to add category: ' + err.message);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategoryToDelete) return alert('Please select a category to delete.');
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      await deleteDoc(doc(db, 'categories', selectedCategoryToDelete));
      await fetchCategories();
      refreshCategories();
      setSelectedCategoryToDelete('');
      alert('Category deleted successfully.');
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category: ' + err.message);
    }
  };

  return (
    <div className="inventory-modal-overlay">
      <div className="inventory-modal">
        <div className="inventory-modal-header">
          <h2>Manage Categories</h2>
          <button className="inventory-modal-close" onClick={() => setIsCategoryModalOpen(false)}>&times;</button>
        </div>

        {/* ADD NEW CATEGORY */}
        <form onSubmit={handleAddCategory} className="inventory-modal-form">
          <h3>Add New Category</h3>
          <div className="form-group">
            <label htmlFor="categoryName">Category Name</label>
            <input
              id="categoryName"
              name="categoryName"
              type="text"
              value={categoryName}
              onChange={e => setCategoryName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Highlight Color</label>
            <div className="color-picker">
              <div
                className="color-circle"
                style={{ backgroundColor: color }}
                onClick={() => document.getElementById('colorInput').click()}
              />
              <input
                id="colorInput"
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                style={{ visibility: 'hidden', position: 'absolute' }}
              />
            </div>
          </div>

          <div className="inventory-modal-footer">
            <button type="submit" className="save-button">Add Category</button>
          </div>
        </form>

        {/* DELETE CATEGORY */}
        <div className="inventory-modal-form">
          <h3>Delete Existing Category</h3>
          <div className="form-group">
            <label>Select Category to Delete</label>
            <select
              value={selectedCategoryToDelete}
              onChange={e => setSelectedCategoryToDelete(e.target.value)}
            >
              <option value="">-- Select Category --</option>
              {existingCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="inventory-modal-footer">
            <button
              type="button"
              className="delete-button"
              onClick={handleDeleteCategory}
              disabled={!selectedCategoryToDelete}
            >
              Delete Category
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
