import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import './inventory.css';

export const AddInventoryModal = ({ setIsModalOpen, refreshInventory, categories = [] }) => {
  const [newItem, setNewItem] = useState({
    sku: '',
    name: '',
    category: '',
    quantity: '',
    unitCost: '',
    sellingPrice: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: ['quantity', 'unitCost', 'sellingPrice'].includes(name)
        ? value === '' ? '' : Number(value)
        : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const itemWithTimestamp = {
        ...newItem,
        lastUpdated: serverTimestamp()
      };
      await addDoc(collection(db, "inventory"), itemWithTimestamp);
      setNewItem({
        sku: '',
        name: '',
        category: '',
        quantity: '',
        unitCost: '',
        sellingPrice: ''
      });
      setIsModalOpen(false);
      await refreshInventory();
    } catch (error) {
      console.error("Error adding item: ", error);
      alert("Failed to add item: " + error.message);
    }
  };

  return (
    <div className="inventory-modal-overlay">
      <div className="inventory-modal">
        <div className="inventory-modal-header">
          <h2>Add New Inventory Item</h2>
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
                value={newItem[field]}
                onChange={handleInputChange}
                required
              />
            </div>
          ))}
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={newItem.category}
              onChange={handleInputChange}
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
                value={newItem[field]}
                onChange={handleInputChange}
                required
              />
            </div>
          ))}
          <div className="inventory-modal-footer">
            <button type="button" className="cancel-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="save-button">Save Item</button>
          </div>
        </form>
      </div>
    </div>
  );
};
