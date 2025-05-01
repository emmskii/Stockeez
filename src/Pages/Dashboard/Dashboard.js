import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaUserCircle, FaBoxOpen, FaChartLine, FaExclamationTriangle } from 'react-icons/fa';
import { BsCurrencyDollar, BsBarChartLine } from 'react-icons/bs';
import { MdTrendingUp, MdTrendingDown } from 'react-icons/md';
import './dashboard.css';

const Dashboard = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalInventoryValue: 0,
    totalSales: 0,
    inventoryCount: 0,
    averageSaleValue: 0
  });
  const [salesByCategory, setSalesByCategory] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);

  const LOW_STOCK_THRESHOLD = 5;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch inventory data
        const invSnapshot = await getDocs(collection(db, 'inventory'));
        const invItems = invSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setInventoryItems(invItems);
        
        // Fetch sales data
        const salesQuery = query(
          collection(db, 'sales'),
          orderBy('dateSold', 'desc')
        );
        const salesSnapshot = await getDocs(salesQuery);
        const salesItems = salesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSalesData(salesItems);

        // Get recent sales (last 5)
        setRecentSales(salesItems.slice(0, 5));

        // Find low stock items
        const lowItems = invItems.filter(item => item.quantity <= LOW_STOCK_THRESHOLD);
        setLowStockItems(lowItems);

        // Calculate summary metrics
        const totalInvValue = invItems.reduce((sum, item) => 
          sum + (item.quantity * item.sellingPrice || 0), 0);
        
        const totalSalesValue = salesItems.reduce((sum, sale) => 
          sum + (sale.totalPrice || 0), 0);

        setSummaryMetrics({
          totalInventoryValue: totalInvValue,
          totalSales: totalSalesValue,
          inventoryCount: invItems.length,
          averageSaleValue: salesItems.length ? totalSalesValue / salesItems.length : 0
        });

        // Calculate sales by category
        const categoryMap = {};
        invItems.forEach(item => {
          const category = item.category || 'Uncategorized';
          if (!categoryMap[category]) {
            categoryMap[category] = {
              name: category,
              count: 0,
              value: 0
            };
          }
          categoryMap[category].count += 1;
          categoryMap[category].value += (item.quantity * item.sellingPrice) || 0;
        });
        setSalesByCategory(Object.values(categoryMap));

        // Calculate top selling products
        const productSales = {};
        salesItems.forEach(sale => {
          if (!productSales[sale.product]) {
            productSales[sale.product] = {
              name: sale.product,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[sale.product].quantity += sale.quantity || 0;
          productSales[sale.product].revenue += sale.totalPrice || 0;
        });
        
        const topProducts = Object.values(productSales)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
          
        setTopSellingProducts(topProducts);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (value) => {
    return '₱' + value.toFixed(2);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Stockeez Dashboard</h1>
        <FaUserCircle className="dashboard-profile-icon" />
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon inventory-icon">
            <FaBoxOpen />
          </div>
          <div className="card-content">
            <h3>Total Inventory</h3>
            <p className="card-value">{summaryMetrics.inventoryCount} items</p>
            <p className="card-subtext">Stock Value: {formatCurrency(summaryMetrics.totalInventoryValue)}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon sales-icon">
            <BsCurrencyDollar />
          </div>
          <div className="card-content">
            <h3>Total Sales</h3>
            <p className="card-value">{formatCurrency(summaryMetrics.totalSales)}</p>
            <p className="card-subtext">Avg. Sale: {formatCurrency(summaryMetrics.averageSaleValue)}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon alert-icon">
            <FaExclamationTriangle />
          </div>
          <div className="card-content">
            <h3>Low Stock Alert</h3>
            <p className="card-value">{lowStockItems.length} items</p>
            <p className="card-subtext">Below threshold of {LOW_STOCK_THRESHOLD}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon performance-icon">
            <BsBarChartLine />
          </div>
          <div className="card-content">
            <h3>Performance</h3>
            <p className="card-value">
              {salesData.length > 0 ? (
                <>
                  {salesData.length} sales
                  <span className="trend-indicator positive">
                    <MdTrendingUp />
                  </span>
                </>
              ) : (
                <>
                  No sales data
                  <span className="trend-indicator negative">
                    <MdTrendingDown />
                  </span>
                </>
              )}
            </p>
            <p className="card-subtext">Overall store activity</p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        {/* Inventory by Category */}
        <div className="stats-container category-stats">
          <h2>Inventory by Category</h2>
          <div className="category-bars">
            {salesByCategory.map((category, index) => (
              <div className="category-bar-container" key={index}>
                <div className="category-bar-header">
                  <span className="category-name">{category.name}</span>
                  <span className="category-value">{formatCurrency(category.value)}</span>
                </div>
                <div className="category-bar-wrapper">
                  <div 
                    className="category-bar" 
                    style={{ 
                      width: `${Math.min(100, (category.value / summaryMetrics.totalInventoryValue) * 100)}%`,
                      backgroundColor: getCategoryColor(index)
                    }}
                  ></div>
                </div>
                <div className="category-bar-footer">
                  <span className="category-count">{category.count} items</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Top Selling Products */}
        <div className="stats-container top-products-stats">
          <h2>Top Selling Products</h2>
          <div className="top-products-list">
            {topSellingProducts.length > 0 ? (
              topSellingProducts.map((product, index) => (
                <div className="top-product-item" key={index}>
                  <div className="top-product-rank">{index + 1}</div>
                  <div className="top-product-details">
                    <div className="top-product-name">{product.name}</div>
                    <div className="top-product-metrics">
                      <span className="top-product-quantity">{product.quantity} units sold</span>
                      <span className="top-product-revenue">{formatCurrency(product.revenue)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-stats-message">No sales data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="tables-section">
        {/* Low Stock Items */}
        <div className="table-container low-stock-table">
          <h2>Low Stock Items</h2>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.length > 0 ? (
                lowStockItems.slice(0, 5).map(item => (
                  <tr key={item.id}>
                    <td>{item.sku}</td>
                    <td>{item.name}</td>
                    <td>
                      <span className="category-tag">
                        {item.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="quantity-cell">
                      <span className={`quantity-badge ${item.quantity <= 0 ? 'out-of-stock' : 'low-stock'}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td>
                      <Link to="/inventory" className="action-link">Update</Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-table-message">No low stock items</td>
                </tr>
              )}
            </tbody>
          </table>
          {lowStockItems.length > 5 && (
            <div className="view-more">
              <Link to="/inventory" className="view-more-link">View all {lowStockItems.length} items</Link>
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="table-container recent-sales-table">
          <h2>Recent Sales</h2>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Buyer</th>
                <th>Price</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.length > 0 ? (
                recentSales.map(sale => (
                  <tr key={sale.id}>
                    <td>{sale.product}</td>
                    <td>{sale.quantity}</td>
                    <td>{sale.buyer}</td>
                    <td>{formatCurrency(sale.totalPrice || 0)}</td>
                    <td>{formatDate(sale.dateSold)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-table-message">No recent sales</td>
                </tr>
              )}
            </tbody>
          </table>
          {salesData.length > 5 && (
            <div className="view-more">
              <Link to="/sales" className="view-more-link">View all {salesData.length} sales</Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="quick-links">
        <Link to="/inventory" className="quick-link inventory-link">
          <FaBoxOpen /> Manage Inventory
        </Link>
        <Link to="/sales" className="quick-link sales-link">
          <FaChartLine /> Track Sales
        </Link>
      </div>
    </div>
  );
};

// Helper function to generate category colors
function getCategoryColor(index) {
  const colors = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', 
    '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'
  ];
  return colors[index % colors.length];
}

export default Dashboard;