import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import './inventory.css';

export const EditInventoryModal = ({ editingItem, setIsModalOpen, refreshInventory, categories = [] }) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    quantity: '',
    unitCost: '',
    sellingPrice: ''
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        sku: editingItem.sku || '',
        name: editingItem.name || '',
        category: editingItem.category || '',
        quantity: editingItem.quantity || '',
        unitCost: editingItem.unitCost || '',
        sellingPrice: editingItem.sellingPrice || ''
      });
    }
    // No cleanup function needed
  }, [editingItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['quantity', 'unitCost', 'sellingPrice'].includes(name)
        ? value === '' ? '' : Number(value)
        : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, 'inventory', editingItem.id);
      await updateDoc(docRef, {
        ...formData,
        lastUpdated: serverTimestamp()
      });
      await refreshInventory();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error updating item:', err);
      alert('Failed to update item: ' + err.message);
    }
  };

  return (
    <div className="inventory-modal-overlay">
      <div className="inventory-modal">
        <div className="inventory-modal-header">
          <h2>Edit Inventory Item</h2>
          <button className="inventory-modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="inventory-modal-form">
          {['sku', 'name'].map(field => (
            <div className="form-group" key={field}>
              <label htmlFor={field}>{field.toUpperCase()}</label>
              <input
                id={field}
                name={field}
                type="text"
                value={formData[field]}
                onChange={handleChange}
                required
              />
            </div>
          ))}
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Category --</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          {['quantity', 'unitCost', 'sellingPrice'].map(field => (
            <div className="form-group" key={field}>
              <label htmlFor={field}>
                {field === 'unitCost' || field === 'sellingPrice'
                  ? field.replace(/([A-Z])/g, ' $1') + ' (₱)'
                  : field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                id={field}
                name={field}
                type="number"
                min="0"
                step={field !== 'quantity' ? "0.01" : "1"}
                value={formData[field]}
                onChange={handleChange}
                required
              />
            </div>
          ))}
          <div className="inventory-modal-footer">
            <button type="button" className="cancel-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="save-button">Update Item</button>
          </div>
        </form>
      </div>
    </div>
  );
};