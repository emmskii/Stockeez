import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaEdit, FaTrash } from 'react-icons/fa';
import { collection, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import './sales.css';
import { AddSalesModal } from './add-sales';
import { EditSalesModal } from './edit-sales';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchSales = async () => {
    try {
      const snap = await getDocs(collection(db, 'sales'));
      const salesData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // sort by dateSold desc
      salesData.sort((a, b) => b.dateSold.toDate() - a.dateSold.toDate());
      setSales(salesData);
    } catch (err) {
      console.error('Error fetching sales:', err);
    }
  };

  const fetchInventory = async () => {
    try {
      const snap = await getDocs(collection(db, 'inventory'));
      setInventoryItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchInventory();
  }, []);

  const handleDelete = async (saleId) => {
    if (!window.confirm('Are you sure you want to delete this sale?')) return;
    const returnStock = window.confirm(
      'Return sold quantity to inventory?\nOK = Return stock, Cancel = Remove sale only'
    );
    try {
      if (returnStock) {
        const sale = sales.find(s => s.id === saleId);
        const inv = inventoryItems.find(i => i.name === sale.product);
        if (inv) {
          const invRef = doc(db, 'inventory', inv.id);
          await updateDoc(invRef, {
            quantity: (inv.quantity || 0) + sale.quantity,
            lastUpdated: serverTimestamp()
          });
        }
      }
      await deleteDoc(doc(db, 'sales', saleId));
      fetchSales();
      if (returnStock) fetchInventory();
    } catch (err) {
      console.error('Error deleting sale:', err);
      alert('Failed to delete sale.');
    }
  };

  const handleEdit = (sale) => {
    setEditingSale(sale);
    setIsSaleModalOpen(true);
  };

  const formatDate = (ts) => {
    if (!ts) return 'N/A';
    const d = ts.toDate();
    return `${d.toLocaleDateString()} @ ${
      d.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric', hour12: true })
    }`;
  };

  const filteredSales = sales.filter(s =>
    s.product.toLowerCase().includes(searchText.toLowerCase())
  );

  const pageCount = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSales = filteredSales.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (p) => { if (p >= 1 && p <= pageCount) setCurrentPage(p); };

  return (
    <div className="sales-container">
      <div className="sales-header">
        <h1>Sales</h1>
        <FaUserCircle className="sales-profile-icon" />
      </div>

      <div className="sales-controls">
        <input
          type="text"
          placeholder="Search by product..."
          className="sales-search"
          value={searchText}
          onChange={e => { setSearchText(e.target.value); setCurrentPage(1); }}
        />
        <button
          className="sales-add-button"
          onClick={() => { setEditingSale(null); setIsSaleModalOpen(true); }}
        >
          Add Sale
        </button>
      </div>

      <div className="sales-table-wrap">
        <table className="sales-table">
          <thead>
            <tr>
              <th>Product</th><th>Quantity</th><th>Price</th>
              <th>Total Price</th><th>Buyer</th><th>Date Sold</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentSales.length > 0 ? currentSales.map(sale => (
              <tr key={sale.id}>
                <td>{sale.product}</td>
                <td>{sale.quantity}</td>
                <td>₱{sale.price?.toFixed(2)}</td>
                <td>₱{sale.totalPrice?.toFixed(2)}</td>
                <td>{sale.buyer}</td>
                <td>{formatDate(sale.dateSold)}</td>
                <td className="actions-cell">
                  <FaEdit className="icon edit" onClick={() => handleEdit(sale)} />
                  <FaTrash className="icon delete" onClick={() => handleDelete(sale.id)} />
                </td>
              </tr>
            )) : (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>No sales records found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="pagination">
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
          {[...Array(pageCount)].map((_, i) => {
            const p = i + 1;
            return (
              <button key={p} className={p === currentPage ? 'active' : ''} onClick={() => goToPage(p)}>
                {p}
              </button>
            );
          })}
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pageCount}>Next</button>
        </div>
      )}

      {isSaleModalOpen && (
        editingSale
          ? <EditSalesModal
              sale={editingSale}
              setIsSaleModalOpen={setIsSaleModalOpen}
              refreshSales={fetchSales}
              refreshInventory={fetchInventory}
              inventoryItems={inventoryItems}
            />
          : <AddSalesModal
              setIsSaleModalOpen={setIsSaleModalOpen}
              refreshSales={fetchSales}
              inventoryItems={inventoryItems}
            />
      )}
    </div>
  );
};

export default Sales;
