// edit-sales.js
import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import './sales.css';

export const EditSalesModal = ({
  sale,                  // { id, product, quantity, price, totalPrice, buyer, dateSold }
  setIsSaleModalOpen,
  refreshSales,
  refreshInventory,      // new prop: to re-fetch inventory in parent
  inventoryItems
}) => {
  // Local form state
  const [product, setProduct] = useState(sale.product);
  const [quantity, setQuantity] = useState(sale.quantity);
  const [buyer, setBuyer] = useState(sale.buyer);
  const [price, setPrice] = useState(sale.price);
  const [totalPrice, setTotalPrice] = useState(sale.totalPrice);

  // Keep a ref to the ORIGINAL sale quantity & product
  const origQty = useRef(sale.quantity);
  const origProd = useRef(sale.product);

  // Recompute totalPrice when quantity or price change
  useEffect(() => {
    setTotalPrice(price * quantity);
  }, [quantity, price]);

  const handleProductChange = e => {
    const newProd = e.target.value;
    setProduct(newProd);
    // update unit price
    const inv = inventoryItems.find(i => i.name === newProd);
    if (inv) setPrice(inv.unitCost);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!product || !quantity || !buyer) {
      return alert('All fields are required');
    }

    try {
      // ----- 1) Restore original stock -----
      // fetch live doc for the ORIGINAL product
      const origInvDoc = inventoryItems.find(i => i.name === origProd.current);
      if (origInvDoc) {
        const invRef = doc(db, 'inventory', origInvDoc.id);
        const invSnap = await getDoc(invRef);
        const liveQty = (invSnap.data().quantity || 0);
        const restored = liveQty + origQty.current;
        await updateDoc(invRef, { 
          quantity: restored, 
          lastUpdated: serverTimestamp() 
        });
      }

      // ----- 2) Subtract new stock -----
      const newInvDoc = inventoryItems.find(i => i.name === product);
      if (newInvDoc) {
        const invRef2 = doc(db, 'inventory', newInvDoc.id);
        const invSnap2 = await getDoc(invRef2);
        const liveQty2 = (invSnap2.data().quantity || 0);
        const reduced = Math.max(liveQty2 - quantity, 0);
        await updateDoc(invRef2, { 
          quantity: reduced, 
          lastUpdated: serverTimestamp() 
        });
      }

      // ----- 3) Update the sale itself -----
      const saleRef = doc(db, 'sales', sale.id);
      await updateDoc(saleRef, {
        product,
        quantity,
        price,
        totalPrice,
        buyer,
        dateSold: serverTimestamp()
      });

      // ----- 4) Refresh UI -----
      refreshSales();
      refreshInventory();
      setIsSaleModalOpen(false);
    } catch (err) {
      console.error('Error updating sale:', err);
      alert('Failed to update sale: ' + err.message);
    }
  };

  return (
    <div className="sales-modal-overlay">
      <div className="sales-modal">
        <div className="sales-modal-header">
          <h2>Edit Sale</h2>
          <button className="sales-modal-close" onClick={() => setIsSaleModalOpen(false)}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="sales-modal-form">
          <div className="form-group">
            <label>Product</label>
            <input
              list="product-list"
              value={product}
              onChange={handleProductChange}
              required
            />
            <datalist id="product-list">
              {inventoryItems.map(i => <option key={i.id} value={i.name} />)}
            </datalist>
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              required
            />
          </div>
          <div className="form-group">
            <label>Price (₱)</label>
            <input type="number" value={price} disabled />
          </div>
          <div className="form-group">
            <label>Total Price (₱)</label>
            <input type="number" value={totalPrice} disabled />
          </div>
          <div className="form-group">
            <label>Buyer</label>
            <input value={buyer} onChange={e => setBuyer(e.target.value)} required/>
          </div>
          <div className="sales-modal-footer">
            <button type="button" className="cancel-button" onClick={() => setIsSaleModalOpen(false)}>Cancel</button>
            <button type="submit" className="save-button">Update Sale</button>
          </div>
        </form>
      </div>
    </div>
  );
};
