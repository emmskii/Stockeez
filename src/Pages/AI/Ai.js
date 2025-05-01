import React, { useState, useRef, useEffect } from 'react';
import { FaUserCircle, FaPaperPlane, FaRobot } from 'react-icons/fa';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import './ai.css';

const Ai = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    { 
      type: 'bot', 
      content: 'Hello! I\'m your Inventory & Sales Assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inventoryData, setInventoryData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const messagesEndRef = useRef(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchData = async () => {
    try {
      // Fetch inventory data
      const inventorySnap = await getDocs(collection(db, 'inventory'));
      const inventoryItems = inventorySnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInventoryData(inventoryItems);

      // Fetch sales data
      const salesSnap = await getDocs(collection(db, 'sales'));
      const salesItems = salesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSalesData(salesItems);

      // Fetch categories
      const categorySnap = await getDocs(collection(db, 'categories'));
      const categoryItems = categorySnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoryItems);
    } catch (error) {
      console.error("Error fetching data:", error);
      addMessage('bot', 'Sorry, I had trouble accessing your data. Please try again later.');
    }
  };

  const addMessage = (type, content) => {
    setMessages(prev => [...prev, { type, content, timestamp: new Date() }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    addMessage('user', userMessage);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Process the user's query
      const response = await processQuery(userMessage);
      addMessage('bot', response);
    } catch (error) {
      console.error("Error processing query:", error);
      addMessage('bot', 'Sorry, I encountered an error while processing your request.');
    } finally {
      setIsLoading(false);
    }
  };

  const processQuery = async (query) => {
    // Convert query to lowercase for case-insensitive matching
    const queryLower = query.toLowerCase();
    
    // Check if data is available
    if (inventoryData.length === 0 && salesData.length === 0) {
      return "I don't have any inventory or sales data to analyze yet. Please make sure your database is set up correctly.";
    }

    // Low stock queries
    if (queryLower.includes('low stock') || 
        queryLower.includes('running out') ||
        queryLower.includes('need to restock')) {
      return handleLowStockQuery();
    }

    // Top selling products
    if (queryLower.includes('top sell') || 
        queryLower.includes('best sell') ||
        queryLower.includes('popular product')) {
      return handleTopSellingQuery();
    }

    // Sales summary
    if (queryLower.includes('sales summary') || 
        queryLower.includes('sales overview') ||
        queryLower.includes('total sales')) {
      return handleSalesSummaryQuery();
    }

    // Inventory summary
    if (queryLower.includes('inventory summary') || 
        queryLower.includes('inventory overview') ||
        queryLower.includes('total inventory')) {
      return handleInventorySummaryQuery();
    }

    // Category breakdown
    if (queryLower.includes('category') || 
        queryLower.includes('product type') ||
        queryLower.includes('product group')) {
      return handleCategoryQuery();
    }

    // Profit margins
    if (queryLower.includes('profit') || 
        queryLower.includes('margin') ||
        queryLower.includes('markup')) {
      return handleProfitMarginQuery();
    }

    // Search for specific product
    if (queryLower.includes('find product') ||
        queryLower.includes('search for') ||
        queryLower.includes('where is') ||
        queryLower.includes('do we have')) {
      const productName = extractProductName(queryLower);
      if (productName) {
        return searchProduct(productName);
      }
    }

    // Sales for specific product
    if (queryLower.includes('sales for') ||
        queryLower.includes('how many sold') ||
        queryLower.includes('sold how many')) {
      const productName = extractProductName(queryLower);
      if (productName) {
        return getProductSales(productName);
      }
    }

    // Recent sales
    if (queryLower.includes('recent sale') ||
        queryLower.includes('latest sale') ||
        queryLower.includes('last sale')) {
      return handleRecentSalesQuery();
    }

    // Help command
    if (queryLower.includes('help') || 
        queryLower.includes('what can you do') ||
        queryLower.includes('how to use')) {
      return handleHelpQuery();
    }

    // Default response for unrecognized queries
    return "I'm not sure how to help with that. Try asking about inventory levels, sales data, or type 'help' to see what I can do.";
  };

  // Extract product name from query
  const extractProductName = (query) => {
    // Common patterns for product name extraction
    const patterns = [
      /find product\s+(.+)/i,
      /search for\s+(.+)/i,
      /where is\s+(.+)/i,
      /do we have\s+(.+)/i,
      /sales for\s+(.+)/i,
      /how many\s+(.+)\s+sold/i,
      /sold how many\s+(.+)/i
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // If no match found, try to extract any words that match products
    const words = query.split(/\s+/);
    for (const word of words) {
      const wordLower = word.toLowerCase();
      if (wordLower.length > 3) { // Avoid short words
        const matchingProduct = inventoryData.find(item => 
          item.name.toLowerCase().includes(wordLower)
        );
        if (matchingProduct) {
          return matchingProduct.name;
        }
      }
    }
    
    return null;
  };

  // Search for a specific product
  const searchProduct = (productName) => {
    const products = inventoryData.filter(item => 
      item.name.toLowerCase().includes(productName.toLowerCase())
    );

    if (products.length === 0) {
      return `I couldn't find any products matching "${productName}" in the inventory.`;
    }

    if (products.length === 1) {
      const product = products[0];
      return `
### Product Details: ${product.name}

- **SKU**: ${product.sku || 'N/A'}
- **Category**: ${product.category || 'Uncategorized'}
- **Quantity**: ${product.quantity || 0} units in stock
- **Unit Cost**: ₱${product.unitCost?.toFixed(2) || '0.00'}
- **Selling Price**: ₱${product.sellingPrice?.toFixed(2) || '0.00'}
- **Last Updated**: ${formatDate(product.lastUpdated) || 'N/A'}
      `;
    }

    // Multiple matches
    return `
### Found ${products.length} matching products:

${products.map(product => `- **${product.name}**: ${product.quantity || 0} units in stock, priced at ₱${product.sellingPrice?.toFixed(2) || '0.00'}`).join('\n')}

Ask for more details about a specific product for more information.
    `;
  };

  // Get sales data for a specific product
  const getProductSales = (productName) => {
    const productSales = salesData.filter(sale => 
      sale.product.toLowerCase().includes(productName.toLowerCase())
    );

    if (productSales.length === 0) {
      return `I couldn't find any sales records for "${productName}".`;
    }

    const totalQuantity = productSales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
    const totalRevenue = productSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);
    
    return `
### Sales Summary for ${productName}:

- **Total Units Sold**: ${totalQuantity}
- **Total Revenue**: ₱${totalRevenue.toFixed(2)}
- **Number of Transactions**: ${productSales.length}
- **Average Sale Price**: ₱${(totalRevenue / totalQuantity).toFixed(2)}

${productSales.length > 5 ? 
  `**Most Recent Sales**:\n${productSales.sort((a, b) => b.dateSold?.toDate() - a.dateSold?.toDate()).slice(0, 5).map(sale => 
    `- ${formatDate(sale.dateSold)}: ${sale.quantity} units to ${sale.buyer || 'Unknown'} for ₱${sale.totalPrice?.toFixed(2) || '0.00'}`
  ).join('\n')}` : 
  `**All Sales**:\n${productSales.sort((a, b) => b.dateSold?.toDate() - a.dateSold?.toDate()).map(sale => 
    `- ${formatDate(sale.dateSold)}: ${sale.quantity} units to ${sale.buyer || 'Unknown'} for ₱${sale.totalPrice?.toFixed(2) || '0.00'}`
  ).join('\n')}`
}
    `;
  };

  // Handle low stock query
  const handleLowStockQuery = () => {
    const lowStockThreshold = 10; // Consider items with less than 10 units as low stock
    const lowStockItems = inventoryData
      .filter(item => (item.quantity || 0) <= lowStockThreshold)
      .sort((a, b) => (a.quantity || 0) - (b.quantity || 0));

    if (lowStockItems.length === 0) {
      return "Great news! All your inventory items have sufficient stock levels. Nothing needs to be restocked at the moment.";
    }

    return `
### Low Stock Items:

${lowStockItems.map(item => `- **${item.name}**: ${item.quantity || 0} units remaining (SKU: ${item.sku || 'N/A'})`).join('\n')}

You should consider restocking these items soon.
    `;
  };

  // Handle top selling products query
  const handleTopSellingQuery = () => {
    if (salesData.length === 0) {
      return "I don't have any sales data yet to determine top selling products.";
    }

    // Aggregate sales data by product
    const productSales = {};
    salesData.forEach(sale => {
      const product = sale.product;
      if (!productSales[product]) {
        productSales[product] = {
          name: product,
          quantity: 0,
          revenue: 0,
          transactions: 0
        };
      }
      productSales[product].quantity += (sale.quantity || 0);
      productSales[product].revenue += (sale.totalPrice || 0);
      productSales[product].transactions += 1;
    });

    // Convert to array and sort by quantity
    const sortedProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return `
### Top Selling Products:

${sortedProducts.map((product, index) => 
  `${index + 1}. **${product.name}**: ${product.quantity} units sold, ₱${product.revenue.toFixed(2)} revenue (${product.transactions} transactions)`
).join('\n')}
    `;
  };

  // Handle sales summary query
  const handleSalesSummaryQuery = () => {
    if (salesData.length === 0) {
      return "I don't have any sales data yet to provide a summary.";
    }

    const totalSales = salesData.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);
    const totalUnits = salesData.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
    const avgTransactionValue = totalSales / salesData.length;

    // Get date of oldest and newest sales
    const dates = salesData.map(sale => sale.dateSold?.toDate()).filter(Boolean);
    const oldestDate = new Date(Math.min(...dates));
    const newestDate = new Date(Math.max(...dates));
    
    // Calculate daily average (if date range is available)
    const daysDifference = dates.length ? Math.max(1, Math.floor((newestDate - oldestDate) / (1000 * 60 * 60 * 24))) : 1;
    const dailyAverage = totalSales / daysDifference;

    return `
### Sales Summary:

- **Total Revenue**: ₱${totalSales.toFixed(2)}
- **Total Units Sold**: ${totalUnits}
- **Number of Transactions**: ${salesData.length}
- **Average Transaction Value**: ₱${avgTransactionValue.toFixed(2)}
${dates.length ? `- **Date Range**: ${formatDate(oldestDate)} to ${formatDate(newestDate)}
- **Daily Average**: ₱${dailyAverage.toFixed(2)}` : ''}
    `;
  };

  // Handle inventory summary query
  const handleInventorySummaryQuery = () => {
    if (inventoryData.length === 0) {
      return "I don't have any inventory data yet to provide a summary.";
    }

    const totalItems = inventoryData.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalValue = inventoryData.reduce((sum, item) => sum + ((item.unitCost || 0) * (item.quantity || 0)), 0);
    const totalRetailValue = inventoryData.reduce((sum, item) => sum + ((item.sellingPrice || 0) * (item.quantity || 0)), 0);
    const potentialProfit = totalRetailValue - totalValue;

    // Calculate category breakdown
    const categoryCounts = {};
    inventoryData.forEach(item => {
      const category = item.category || 'Uncategorized';
      if (!categoryCounts[category]) {
        categoryCounts[category] = 0;
      }
      categoryCounts[category] += (item.quantity || 0);
    });

    const categoryBreakdown = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => `- **${category}**: ${count} units`);

    return `
### Inventory Summary:

- **Total Products**: ${inventoryData.length} unique items
- **Total Units**: ${totalItems} units in stock
- **Total Cost Value**: ₱${totalValue.toFixed(2)}
- **Total Retail Value**: ₱${totalRetailValue.toFixed(2)}
- **Potential Profit**: ₱${potentialProfit.toFixed(2)}

**Category Breakdown**:
${categoryBreakdown.join('\n')}
    `;
  };

  // Handle category query
  const handleCategoryQuery = () => {
    if (inventoryData.length === 0) {
      return "I don't have any inventory data yet to provide category information.";
    }

    // Build category stats
    const categoryStats = {};
    inventoryData.forEach(item => {
      const category = item.category || 'Uncategorized';
      if (!categoryStats[category]) {
        categoryStats[category] = {
          name: category,
          items: 0,
          units: 0,
          value: 0,
          retailValue: 0
        };
      }
      categoryStats[category].items += 1;
      categoryStats[category].units += (item.quantity || 0);
      categoryStats[category].value += ((item.unitCost || 0) * (item.quantity || 0));
      categoryStats[category].retailValue += ((item.sellingPrice || 0) * (item.quantity || 0));
    });

    // Convert to array and sort by units
    const sortedCategories = Object.values(categoryStats)
      .sort((a, b) => b.units - a.units);

    return `
### Category Breakdown:

${sortedCategories.map(cat => 
  `**${cat.name}**:
- ${cat.items} unique product${cat.items !== 1 ? 's' : ''}
- ${cat.units} total units
- ₱${cat.value.toFixed(2)} cost value
- ₱${cat.retailValue.toFixed(2)} retail value
- ₱${(cat.retailValue - cat.value).toFixed(2)} potential profit`
).join('\n\n')}
    `;
  };

  // Handle profit margin query
  const handleProfitMarginQuery = () => {
    if (inventoryData.length === 0) {
      return "I don't have any inventory data yet to calculate profit margins.";
    }

    // Calculate margins for all products
    const productsWithMargins = inventoryData
      .filter(item => item.unitCost && item.sellingPrice) // Ensure both cost and price exist
      .map(item => {
        const margin = item.sellingPrice - item.unitCost;
        const marginPercent = (margin / item.unitCost) * 100;
        return {
          ...item,
          margin,
          marginPercent
        };
      })
      .sort((a, b) => b.marginPercent - a.marginPercent);

    // Overall margin statistics
    const totalCost = productsWithMargins.reduce((sum, item) => sum + (item.unitCost || 0), 0);
    const totalPrice = productsWithMargins.reduce((sum, item) => sum + (item.sellingPrice || 0), 0);
    const avgMarginPercent = productsWithMargins.length ? 
      productsWithMargins.reduce((sum, item) => sum + item.marginPercent, 0) / productsWithMargins.length : 0;

    return `
### Profit Margin Analysis:

**Overall Metrics**:
- **Average Margin**: ${avgMarginPercent.toFixed(2)}%
- **Total Cost**: ₱${totalCost.toFixed(2)}
- **Total Price**: ₱${totalPrice.toFixed(2)}

**Top 5 Highest Margins**:
${productsWithMargins.slice(0, 5).map(item => 
  `- **${item.name}**: ${item.marginPercent.toFixed(2)}% (₱${item.unitCost?.toFixed(2)} → ₱${item.sellingPrice?.toFixed(2)})`
).join('\n')}

**Bottom 5 Lowest Margins**:
${productsWithMargins.slice(-5).reverse().map(item => 
  `- **${item.name}**: ${item.marginPercent.toFixed(2)}% (₱${item.unitCost?.toFixed(2)} → ₱${item.sellingPrice?.toFixed(2)})`
).join('\n')}
    `;
  };

  // Handle recent sales query
  const handleRecentSalesQuery = () => {
    if (salesData.length === 0) {
      return "I don't have any sales data yet to show recent sales.";
    }

    // Sort by date sold (most recent first)
    const recentSales = [...salesData]
      .sort((a, b) => {
        const dateA = a.dateSold?.toDate() || new Date(0);
        const dateB = b.dateSold?.toDate() || new Date(0);
        return dateB - dateA;
      })
      .slice(0, 10); // Get the 10 most recent sales

    return `
### Recent Sales:

${recentSales.map((sale, index) => 
  `${index + 1}. **${sale.product}**: ${sale.quantity} units sold to ${sale.buyer || 'Unknown'} for ₱${sale.totalPrice?.toFixed(2) || '0.00'} on ${formatDate(sale.dateSold)}`
).join('\n')}
    `;
  };

  // Handle help query
  const handleHelpQuery = () => {
    return `
### I can help you with:

**Inventory Questions**:
- "What items are low on stock?"
- "Give me an inventory summary"
- "Show me products by category"
- "Find product [product name]"
- "Do we have [product name]?"

**Sales Questions**:
- "What are our top selling products?"
- "Show me recent sales"
- "Give me a sales summary"
- "How many [product name] have we sold?"
- "Sales for [product name]"

**Analysis Questions**:
- "What are our profit margins?"
- "Which category sells the most?"
- "What's our total inventory value?"

Just ask in natural language, and I'll try to answer your question!
    `;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : timestamp;
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Function to render messages with Markdown support
  const renderMessage = (message) => {
    // Convert Markdown headers, bold text, and lists to HTML
    let formattedContent = message.content
      .replace(/### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/- (.*?)$/gm, '<li>$1</li>')
      .replace(/<li>(.*?)<\/li>/g, '<ul><li>$1</li></ul>');
    
    // Remove duplicate <ul> tags
    formattedContent = formattedContent.replace(/<\/ul>\s*<ul>/g, '');
    
    return <div dangerouslySetInnerHTML={{ __html: formattedContent }} />;
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h1>ChatBOT</h1>
        <FaUserCircle className="chatbot-profile-icon" />
      </div>

      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}-message`}>
            <div className="message-icon">
              {message.type === 'bot' ? <FaRobot /> : <FaUserCircle />}
            </div>
            <div className="message-content">
              {renderMessage(message)}
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot-message">
            <div className="message-icon">
              <FaRobot />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chatbot-input-form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask about your inventory or sales..."
          className="chatbot-input"
          disabled={isLoading}
        />
        <button type="submit" className="chatbot-send-button" disabled={isLoading}>
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};

export default Ai;