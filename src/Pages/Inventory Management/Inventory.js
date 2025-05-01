import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaEdit, FaTrash } from 'react-icons/fa';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import './inventory.css';
import { AddInventoryModal } from './add-inventory';
import { EditInventoryModal } from './edit-inventory';
import { AddCategoryModal } from './category-inventory';

const Inventory = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const snap = await getDocs(collection(db, 'categories'));
      setCategories(snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })));
    } catch (error) {
      console.error("Error fetching categories: ", error);
    }
  };

  const getCategoryColor = (categoryName) => {
    const category = categories.find(c => c.name === categoryName);
    return category ? category.color : '#000000'; // fallback to black if not found
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchInventory = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "inventory"));
      const items = [];
      querySnapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Sort items by lastUpdated in descending order (newest first)
      items.sort((a, b) => b.lastUpdated?.toDate() - a.lastUpdated?.toDate());

      setInventoryItems(items);
    } catch (error) {
      console.error("Error fetching inventory: ", error);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteDoc(doc(db, 'inventory', id));
        fetchInventory();
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item.');
      }
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate();
      const options = { hour: 'numeric', minute: 'numeric', hour12: true };
      const formattedDate = date.toLocaleDateString();
      const formattedTime = date.toLocaleTimeString([], options).replace(' ', '');
      return `${formattedDate} @ ${formattedTime}`;
    } catch {
      return 'Invalid date';
    }
  };

  // Filter items by SKU or Name
  const filteredItems = inventoryItems.filter(item => {
    const term = searchText.toLowerCase();
    return (
      item.sku?.toString().toLowerCase().includes(term) ||
      item.name?.toLowerCase().includes(term)
    );
  });

  // Pagination calculations
  const pageCount = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page < 1 || page > pageCount) return;
    setCurrentPage(page);
  };

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h1>Inventory</h1>
        <FaUserCircle className="inventory-profile-icon" />
      </div>

      <div className="inventory-controls">
        <input
          type="text"
          placeholder="Search inventory by SKU or Name..."
          className="inventory-search"
          value={searchText}
          onChange={e => { setSearchText(e.target.value); setCurrentPage(1); }}
        />
        <button
          className="inventory-add-button"
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
        >
          Add Item
        </button>
        <button className="inventory-add-button" onClick={() => setIsCategoryModalOpen(true)}>
          Categories
        </button>
      </div>

      <div className="inventory-table-wrap">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Unit Cost</th>
              <th>Selling Price</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.sku}</td>
                  <td>{item.name}</td>
                  <td>
                    <span style={{
                      backgroundColor: getCategoryColor(item.category),
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '5px',
                      display: 'inline-block',
                      fontWeight: 'bold'
                    }}>
                      {item.category}
                    </span>
                  </td>
                  <td>{item.quantity}</td>
                  <td>₱{item.unitCost?.toFixed(2)}</td>
                  <td>₱{item.sellingPrice?.toFixed(2)}</td>
                  <td>{formatDate(item.lastUpdated)}</td>
                  <td className="inventory-actions-cell">
                    <FaEdit className="icon edit" onClick={() => handleEdit(item)} />
                    <FaTrash className="icon delete" onClick={() => handleDelete(item.id)} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center' }}>No inventory items found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pageCount > 1 && (
        <div className="pagination">
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
            Prev
          </button>
          {[...Array(pageCount)].map((_, idx) => {
            const page = idx + 1;
            return (
              <button
                key={page}
                className={page === currentPage ? 'active' : ''}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            );
          })}
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pageCount}>
            Next
          </button>
        </div>
      )}

      {isModalOpen && (
        editingItem
          ? <EditInventoryModal
              editingItem={editingItem}
              setIsModalOpen={setIsModalOpen}
              refreshInventory={fetchInventory}
              categories={categories}
            />
          : <AddInventoryModal
              setIsModalOpen={setIsModalOpen}
              refreshInventory={fetchInventory}
              categories={categories}
            />
      )}
      {isCategoryModalOpen && (
        <AddCategoryModal
          setIsCategoryModalOpen={setIsCategoryModalOpen}
          refreshCategories={fetchCategories}
        />
      )}

    </div>
  );
};

export default Inventory;