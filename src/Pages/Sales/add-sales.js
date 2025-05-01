import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import './sales.css';

export const AddSalesModal = ({ setIsSaleModalOpen, refreshSales, inventoryItems }) => {
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [buyer, setBuyer] = useState('');

  // Recalculate total whenever price or quantity changes
  useEffect(() => {
    setTotalPrice(price * quantity);
  }, [quantity, price]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product || !quantity || !buyer) {
      return alert('All fields are required');
    }

    try {
      // 1) Create the sale record
      await addDoc(collection(db, 'sales'), {
        product,
        quantity,
        price,
        totalPrice,
        buyer,
        dateSold: serverTimestamp()
      });

      // 2) Decrement inventory
      const soldItem = inventoryItems.find(item => item.name === product);
      if (soldItem) {
        const invRef = doc(db, 'inventory', soldItem.id);
        const newQty = Math.max((soldItem.quantity || 0) - quantity, 0);
        await updateDoc(invRef, {
          quantity: newQty,
          lastUpdated: serverTimestamp()
        });
      }

      // Refresh and close
      refreshSales();
      setIsSaleModalOpen(false);
    } catch (err) {
      console.error('Error adding sale', err);
      alert('Failed to add sale: ' + err.message);
    }
  };

  const handleProductChange = (e) => {
    const selectedProduct = e.target.value;
    setProduct(selectedProduct);
    const selectedItem = inventoryItems.find(item => item.name === selectedProduct);
    setPrice(selectedItem ? selectedItem.unitCost : 0);
  };

  return (
    <div className="sales-modal-overlay">
      <div className="sales-modal">
        <div className="sales-modal-header">
          <h2>Add New Sale</h2>
          <button className="sales-modal-close" onClick={() => setIsSaleModalOpen(false)}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="sales-modal-form">
          <div className="form-group">
            <label htmlFor="product">Product</label>
            <input
              id="product"
              list="product-list"
              name="product"
              value={product}
              onChange={handleProductChange}
              required
            />
            <datalist id="product-list">
              {inventoryItems.map(item => (
                <option key={item.id} value={item.name} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label htmlFor="quantity">Quantity</label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Price (₱)</label>
            <input id="price" name="price" type="number" value={price} disabled />
          </div>

          <div className="form-group">
            <label htmlFor="totalPrice">Total Price (₱)</label>
            <input id="totalPrice" name="totalPrice" type="number" value={totalPrice} disabled />
          </div>

          <div className="form-group">
            <label htmlFor="buyer">Buyer</label>
            <input
              id="buyer"
              name="buyer"
              type="text"
              value={buyer}
              onChange={e => setBuyer(e.target.value)}
              required
            />
          </div>

          <div className="sales-modal-footer">
            <button type="button" className="cancel-button" onClick={() => setIsSaleModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="save-button">
              Save Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
