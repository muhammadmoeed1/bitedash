// Database schema information
const databaseSchema = {
    tables: {
        customers: {
            name: "Customers",
            fields: [
                { name: "customer_id", type: "SERIAL", placeholder: "Auto-generated" },
                { name: "name", type: "VARCHAR(100)", placeholder: "Customer full name" },
                { name: "email", type: "VARCHAR(100)", placeholder: "Customer email (unique)" },
                { name: "phone", type: "VARCHAR(20)", placeholder: "Customer phone number" }
            ],
            primaryKey: "customer_id"
        },
        addresses: {
            name: "Addresses",
            fields: [
                { name: "address_id", type: "SERIAL", placeholder: "Auto-generated" },
                { name: "customer_id", type: "INT", placeholder: "Customer ID (foreign key)" },
                { name: "street", type: "VARCHAR(255)", placeholder: "Street address" },
                { name: "city", type: "VARCHAR(100)", placeholder: "City" },
                { name: "zip_code", type: "VARCHAR(20)", placeholder: "ZIP/Postal code" },
                { name: "label", type: "VARCHAR(50)", placeholder: "Address label (e.g., Home, Work)" }
            ],
            primaryKey: "address_id"
        },
        restaurants: {
            name: "Restaurants",
            fields: [
                { name: "restaurant_id", type: "SERIAL", placeholder: "Auto-generated" },
                { name: "name", type: "VARCHAR(100)", placeholder: "Restaurant name" },
                { name: "email", type: "VARCHAR(100)", placeholder: "Restaurant email" },
                { name: "phone", type: "VARCHAR(20)", placeholder: "Restaurant phone number" },
                { name: "address", type: "TEXT", placeholder: "Full restaurant address" }
            ],
            primaryKey: "restaurant_id"
        },
        food_categories: {
            name: "Food Categories",
            fields: [
                { name: "category_id", type: "SERIAL", placeholder: "Auto-generated" },
                { name: "category_name", type: "VARCHAR(100)", placeholder: "Category name (e.g., Pizza, Burger)" }
            ],
            primaryKey: "category_id"
        },
        menu_items: {
            name: "Menu Items",
            fields: [
                { name: "item_id", type: "SERIAL", placeholder: "Auto-generated" },
                { name: "restaurant_id", type: "INT", placeholder: "Restaurant ID (foreign key)" },
                { name: "category_id", type: "INT", placeholder: "Category ID (foreign key)" },
                { name: "item_name", type: "VARCHAR(100)", placeholder: "Item name" },
                { name: "description", type: "TEXT", placeholder: "Item description" },
                { name: "price", type: "DECIMAL(10,2)", placeholder: "Item price (e.g., 9.99)" }
            ],
            primaryKey: "item_id"
        },
        orders: {
            name: "Orders",
            fields: [
                { name: "order_id", type: "SERIAL", placeholder: "Auto-generated" },
                { name: "customer_id", type: "INT", placeholder: "Customer ID (foreign key)" },
                { name: "status", type: "VARCHAR(50)", placeholder: "Order status (e.g., Processing)" },
                { name: "total_amount", type: "DECIMAL(10,2)", placeholder: "Total order amount" }
            ],
            primaryKey: "order_id"
        },
        order_items: {
            name: "Order Items",
            fields: [
                { name: "order_item_id", type: "SERIAL", placeholder: "Auto-generated" },
                { name: "order_id", type: "INT", placeholder: "Order ID (foreign key)" },
                { name: "item_id", type: "INT", placeholder: "Menu item ID (foreign key)" },
                { name: "quantity", type: "INT", placeholder: "Item quantity" },
                { name: "price", type: "DECIMAL(10,2)", placeholder: "Item price at time of order" }
            ],
            primaryKey: "order_item_id"
        },
        payments: {
            name: "Payments",
            fields: [
                { name: "payment_id", type: "SERIAL", placeholder: "Auto-generated" },
                { name: "order_id", type: "INT", placeholder: "Order ID (foreign key)" },
                { name: "amount", type: "DECIMAL(10,2)", placeholder: "Payment amount" },
                { name: "payment_method", type: "VARCHAR(50)", placeholder: "Payment method (e.g., Credit Card)" },
                { name: "payment_status", type: "VARCHAR(50)", placeholder: "Payment status (e.g., Completed)" }
            ],
            primaryKey: "payment_id"
        },
        delivery_agents: {
            name: "Delivery Agents",
            fields: [
                { name: "agent_id", type: "SERIAL", placeholder: "Auto-generated" },
                { name: "name", type: "VARCHAR(100)", placeholder: "Agent full name" },
                { name: "phone", type: "VARCHAR(20)", placeholder: "Agent phone number" },
                { name: "vehicle_number", type: "VARCHAR(50)", placeholder: "Vehicle registration number" }
            ],
            primaryKey: "agent_id"
        },
        deliveries: {
            name: "Deliveries",
            fields: [
                { name: "delivery_id", type: "SERIAL", placeholder: "Auto-generated" },
                { name: "order_id", type: "INT", placeholder: "Order ID (foreign key)" },
                { name: "agent_id", type: "INT", placeholder: "Agent ID (foreign key)" },
                { name: "delivery_status", type: "VARCHAR(50)", placeholder: "Delivery status (e.g., In Transit)" }
            ],
            primaryKey: "delivery_id"
        },
        reviews: {
            name: "Reviews",
            fields: [
                { name: "review_id", type: "SERIAL", placeholder: "Auto-generated" },
                { name: "customer_id", type: "INT", placeholder: "Customer ID (foreign key)" },
                { name: "restaurant_id", type: "INT", placeholder: "Restaurant ID (foreign key)" },
                { name: "rating", type: "INT", placeholder: "Rating (1-5)" },
                { name: "comment", type: "TEXT", placeholder: "Review comments" }
            ],
            primaryKey: "review_id"
        },
        restaurant_categories: {
            name: "Restaurant Categories",
            fields: [
                { name: "restaurant_id", type: "INT", placeholder: "Restaurant ID (foreign key)" },
                { name: "category_id", type: "INT", placeholder: "Category ID (foreign key)" }
            ],
            primaryKey: ["restaurant_id", "category_id"]
        }
    },
    tableEndpoints: {
        customers: {
            getAll: "http://localhost:6006/customers",
            getCount: "http://localhost:6006/count/customers",
            add: "http://localhost:6006/add-customer",
            delete: "http://localhost:6006/delete-customer"
        },
        addresses: {
            getAll: "http://localhost:6006/addresses",
            getCount: "http://localhost:6006/count/addresses",
            add: "http://localhost:6006/add-address",
            delete: "http://localhost:6006/delete-address"
        },
        restaurants: {
            getAll: "http://localhost:6006/restaurants",
            getCount: "http://localhost:6006/count/restaurants",
            add: "http://localhost:6006/add-restaurant",
            delete: "http://localhost:6006/delete-restaurant"
        },
        food_categories: {
            getAll: "http://localhost:6006/food_categories",
            getCount: "http://localhost:6006/count/food_categories",
            add: "http://localhost:6006/add-category",
            delete: "http://localhost:6006/delete-category"
        },
        menu_items: {
            getAll: "http://localhost:6006/menu_items",
            getCount: "http://localhost:6006/count/menu_items",
            add: "http://localhost:6006/add-menu-item",
            delete: "http://localhost:6006/delete-menu-item"
        },
        orders: {
            getAll: "http://localhost:6006/orders",
            getCount: "http://localhost:6006/count/orders",
            add: "http://localhost:6006/add-order",
            delete: "http://localhost:6006/delete-order"
        },
        order_items: {
            getAll: "http://localhost:6006/order_items",
            getCount: "http://localhost:6006/count/order_items",
            add: "http://localhost:6006/add-order-item",
            delete: "http://localhost:6006/delete-order-item"
        },
        payments: {
            getAll: "http://localhost:6006/payments",
            getCount: "http://localhost:6006/count/payments",
            add: "http://localhost:6006/add-payment",
            delete: "http://localhost:6006/delete-payment"
        },
        delivery_agents: {
            getAll: "http://localhost:6006/delivery_agents",
            getCount: "http://localhost:6006/count/delivery_agents",
            add: "http://localhost:6006/add-agent",
            delete: "http://localhost:6006/delete-agent"
        },
        deliveries: {
            getAll: "http://localhost:6006/deliveries",
            getCount: "http://localhost:6006/count/deliveries",
            add: "http://localhost:6006/add-delivery",
            delete: "http://localhost:6006/delete-delivery"
        },
        reviews: {
            getAll: "http://localhost:6006/reviews",
            getCount: "http://localhost:6006/count/reviews",
            add: "http://localhost:6006/add-review",
            delete: "http://localhost:6006/delete-review"
        },
        restaurant_categories: {
            getAll: "http://localhost:6006/restaurant_categories",
            getCount: "http://localhost:6006/count/restaurant_categories",
            add: "http://localhost:6006/add-restaurant-category",
            delete: "http://localhost:6006/delete-restaurant-category"
        }
    },
    tableIcons: {
        customers: "fas fa-users",
        addresses: "fas fa-map-marker-alt",
        restaurants: "fas fa-store",
        food_categories: "fas fa-tags",
        restaurant_categories: "fas fa-tag",
        menu_items: "fas fa-utensils",
        orders: "fas fa-shopping-bag",
        order_items: "fas fa-list-ol",
        payments: "fas fa-credit-card",
        delivery_agents: "fas fa-motorcycle",
        deliveries: "fas fa-truck",
        reviews: "fas fa-star"
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    populateTableSelects();
    generateTableCards();
    generateReportCards();
    generateFeatureCards();
    
    // Event listeners for form generation
    document.getElementById('insertTableSelect').addEventListener('change', generateInsertFormFields);
    document.getElementById('deleteTableSelect').addEventListener('change', generateDeleteFormFields);
    
    // Event listeners for form submission
    document.getElementById('insertForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitInsertForm();
    });
    
    document.getElementById('deleteForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitDeleteForm();
    });
});

// Populate table select dropdowns
function populateTableSelects() {
    const insertSelect = document.getElementById('insertTableSelect');
    const deleteSelect = document.getElementById('deleteTableSelect');
    
    // Clear existing options
    insertSelect.innerHTML = '<option value="">-- Select a Table --</option>';
    deleteSelect.innerHTML = '<option value="">-- Select a Table --</option>';
    
    // Add options for each table
    Object.entries(databaseSchema.tables).forEach(([key, table]) => {
        const option1 = document.createElement('option');
        option1.value = key;
        option1.textContent = table.name;
        insertSelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = key;
        option2.textContent = table.name;
        deleteSelect.appendChild(option2);
    });
}

// Generate form fields for insert operation
function generateInsertFormFields() {
    const table = document.getElementById('insertTableSelect').value;
    const fieldsContainer = document.getElementById('insertFormFields');
    fieldsContainer.innerHTML = '';

    if (!table) return;

    const tableSchema = databaseSchema.tables[table];
    
    tableSchema.fields.forEach(field => {
        // Skip SERIAL primary key fields as they're auto-generated
        if (field.name === tableSchema.primaryKey && field.type.toUpperCase().includes('SERIAL')) {
            return;
        }
        
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group mb-3';
        
        const label = document.createElement('label');
        label.htmlFor = `insert_${field.name}`;
        label.className = 'form-label';
        label.innerHTML = `<i class="fas fa-tag me-1"></i> ${field.name.replace('_', ' ')}`;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `insert_${field.name}`;
        input.name = field.name;
        input.className = 'form-control vip-input';
        input.placeholder = field.placeholder || `Enter ${field.name.replace('_', ' ')}`;
        input.required = true;
        
        // Add data type information
        const typeInfo = document.createElement('small');
        typeInfo.className = 'form-text text-muted';
        typeInfo.textContent = `Type: ${field.type}`;
        
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        formGroup.appendChild(typeInfo);
        fieldsContainer.appendChild(formGroup);
    });
}

// Generate form fields for delete operation
function generateDeleteFormFields() {
    const table = document.getElementById('deleteTableSelect').value;
    const fieldsContainer = document.getElementById('deleteFormFields');
    fieldsContainer.innerHTML = '';

    if (!table) return;

    const tableSchema = databaseSchema.tables[table];
    const primaryKey = tableSchema.primaryKey;
    
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group mb-3';
    
    const label = document.createElement('label');
    label.htmlFor = `delete_${Array.isArray(primaryKey) ? primaryKey[0] : primaryKey}`;
    label.className = 'form-label';
    label.innerHTML = `<i class="fas fa-key me-1"></i> ${Array.isArray(primaryKey) ? primaryKey.join(' and ') : primaryKey.replace('_', ' ')} to delete`;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `delete_${Array.isArray(primaryKey) ? primaryKey[0] : primaryKey}`;
    input.name = Array.isArray(primaryKey) ? primaryKey.join(',') : primaryKey;
    input.className = 'form-control vip-input';
    input.placeholder = `Enter ${Array.isArray(primaryKey) ? primaryKey.join(' and ') : primaryKey.replace('_', ' ')} to delete`;
    input.required = true;
    
    // Special instructions for composite primary key
    if (Array.isArray(primaryKey)) {
        input.placeholder = `Enter ${primaryKey.join(' and ')} separated by comma (e.g., 1,2)`;
    }
    
    // Add data type information
    const typeInfo = document.createElement('small');
    typeInfo.className = 'form-text text-muted';
    typeInfo.textContent = `Primary key for ${tableSchema.name}`;
    
    formGroup.appendChild(label);
    formGroup.appendChild(input);
    formGroup.appendChild(typeInfo);
    fieldsContainer.appendChild(formGroup);
}

// Submit insert form with API call
async function submitInsertForm() {
    const table = document.getElementById('insertTableSelect').value;
    if (!table) {
        alert('Please select a table first!');
        return;
    }

    const tableSchema = databaseSchema.tables[table];
    const inputs = document.querySelectorAll('#insertFormFields input');
    const data = {};
    
    try {
        // Validate all required fields
        inputs.forEach(input => {
            if (!input.value.trim()) {
                throw new Error(`Please fill in the ${input.name.replace('_', ' ')} field!`);
            }
            data[input.name] = input.value;
        });

        const response = await fetch(databaseSchema.tableEndpoints[table].add, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (response.ok) {
            alert(`Data inserted successfully into ${tableSchema.name} table!`);
            // Clear the form
            document.getElementById('insertTableSelect').value = '';
            document.getElementById('insertFormFields').innerHTML = '';
            // Refresh table cards to update counts
            generateTableCards();
        } else {
            let errorMessage = result.message || 'Failed to insert data';
            if (result.error && result.error.includes('duplicate key')) {
                errorMessage = 'Duplicate primary key value. The record already exists.';
            } else if (result.error && result.error.includes('foreign key constraint')) {
                errorMessage = 'Invalid reference. Check foreign key values.';
            }
            alert(`Error: ${errorMessage}\n${result.error || ''}`);
        }
    } catch (error) {
        console.error('Error inserting data:', error);
        if (error.message) {
            alert(error.message);
            const fieldName = error.message.replace('Please fill in the ', '').replace(' field!', '').replace(' ', '_');
            const input = document.getElementById(`insert_${fieldName}`);
            if (input) input.focus();
        } else {
            alert('Failed to insert data. Please check console for details.');
        }
    }
}

// Submit delete form with API call
async function submitDeleteForm() {
    const table = document.getElementById('deleteTableSelect').value;
    if (!table) {
        alert('Please select a table first!');
        return;
    }

    const tableSchema = databaseSchema.tables[table];
    const primaryKey = tableSchema.primaryKey;
    const input = document.getElementById(`delete_${Array.isArray(primaryKey) ? primaryKey[0] : primaryKey}`);
    
    if (!input || input.value.trim() === '') {
        alert(`Please enter the ${Array.isArray(primaryKey) ? primaryKey.join(' and ') : primaryKey.replace('_', ' ')} to delete!`);
        if (input) input.focus();
        return;
    }

    if (!confirm(`Are you sure you want to delete this record from ${tableSchema.name}? This action cannot be undone!`)) {
        return;
    }

    try {
        let deleteUrl = databaseSchema.tableEndpoints[table].delete;
        
        // Handle composite primary key for restaurant_categories
        if (table === 'restaurant_categories') {
            const ids = input.value.split(',');
            if (ids.length !== 2) {
                alert('Please enter both restaurant_id and category_id separated by comma (e.g., 1,2)');
                return;
            }
            deleteUrl += `/${ids[0]}/${ids[1]}`;
        } else {
            deleteUrl += `/${input.value}`;
        }

        const response = await fetch(deleteUrl, {
            method: 'DELETE'
        });

        const result = await response.json();
        
        if (response.ok) {
            alert(`Record deleted successfully from ${tableSchema.name} table!`);
            // Clear the form
            document.getElementById('deleteTableSelect').value = '';
            document.getElementById('deleteFormFields').innerHTML = '';
            // Refresh table cards to update counts
            generateTableCards();
        } else {
            let errorMessage = result.message || 'Failed to delete record';
            if (result.error && result.error.includes('foreign key constraint')) {
                errorMessage = 'Cannot delete this record because it is referenced by other records.';
            }
            alert(`Error: ${errorMessage}\n${result.error || ''}`);
        }
    } catch (error) {
        console.error('Error deleting data:', error);
        alert('Failed to delete data. Please check console for details.');
    }
}

// Generate table cards for dashboard with count from API
async function generateTableCards() {
    const tableGrid = document.querySelector('.table-grid');
    tableGrid.innerHTML = '';
    
    for (const [key, table] of Object.entries(databaseSchema.tables)) {
        try {
            // Fetch count for each table
            const response = await fetch(databaseSchema.tableEndpoints[key].getCount);
            const data = await response.json();
            const count = data.count || 0;
            
            const card = document.createElement('div');
            card.className = 'col-md-4 mb-4';
            card.innerHTML = `
                <div class="card table-card h-100" onclick="openTable('${key}')">
                    <div class="card-body text-center">
                        <i class="${databaseSchema.tableIcons[key]} fa-3x mb-3"></i>
                        <h3 class="card-title">${table.name}</h3>
                        <div class="table-count">${count} Records</div>
                        <p class="card-text">${getTableDescription(table.name)}</p>
                    </div>
                </div>
            `;
            
            tableGrid.appendChild(card);
        } catch (error) {
            console.error(`Error fetching count for ${table.name}:`, error);
            // Fallback if API fails
            const card = document.createElement('div');
            card.className = 'col-md-4 mb-4';
            card.innerHTML = `
                <div class="card table-card h-100" onclick="openTable('${key}')">
                    <div class="card-body text-center">
                        <i class="${databaseSchema.tableIcons[key]} fa-3x mb-3"></i>
                        <h3 class="card-title">${table.name}</h3>
                        <p class="card-text">${getTableDescription(table.name)}</p>
                    </div>
                </div>
            `;
            
            tableGrid.appendChild(card);
        }
    }
}

// Generate report cards for dashboard
function generateReportCards() {
    const reportGrid = document.querySelector('.report-grid');
    reportGrid.innerHTML = '';
    
    Object.entries(reportsData).forEach(([key, report]) => {
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = `
            <div class="card report-card h-100" onclick="showReport('${key}')">
                <div class="card-body text-center">
                    <i class="${report.icon} fa-3x mb-3"></i>
                    <h3 class="card-title">${report.title}</h3>
                    <p class="card-text">${report.description}</p>
                    <div class="report-preview">
                        <canvas id="${key}-preview" height="100"></canvas>
                    </div>
                </div>
            </div>
        `;
        
        reportGrid.appendChild(card);
        
        // Create mini preview chart
        setTimeout(() => {
            const ctx = document.getElementById(`${key}-preview`).getContext('2d');
            const previewChart = new Chart(ctx, {
                type: report.charts[0].type,
                data: report.charts[0].data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: { display: false }
                    }
                }
            });
        }, 100);
    });
}

// Generate feature cards for dashboard
function generateFeatureCards() {
    const featureGrid = document.querySelector('.feature-grid');
    featureGrid.innerHTML = '';
    
    const features = [
        {
            icon: 'fas fa-plus-circle',
            title: 'Add Data',
            description: 'Insert new records into any table',
            color: '#4BC0C0'
        },
        {
            icon: 'fas fa-trash-alt',
            title: 'Delete Data',
            description: 'Remove records from any table',
            color: '#FF6384'
        },
        {
            icon: 'fas fa-table',
            title: 'View Tables',
            description: 'Browse complete table data',
            color: '#FFCE56'
        },
        {
            icon: 'fas fa-chart-bar',
            title: 'Analytics',
            description: 'View detailed reports and charts',
            color: '#36A2EB'
        },
        {
            icon: 'fas fa-search',
            title: 'Advanced Search',
            description: 'Find specific records quickly',
            color: '#9966FF'
        },
        {
            icon: 'fas fa-download',
            title: 'Export Data',
            description: 'Download data in multiple formats',
            color: '#FF9F40'
        }
    ];
    
    features.forEach(feature => {
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = `
            <div class="card feature-card h-100">
                <div class="card-body text-center">
                    <i class="${feature.icon} fa-3x mb-3" style="color: ${feature.color}"></i>
                    <h3 class="card-title">${feature.title}</h3>
                    <p class="card-text">${feature.description}</p>
                </div>
            </div>
        `;
        featureGrid.appendChild(card);
    });
}

// Get description for table
function getTableDescription(tableName) {
    const descriptions = {
        "Customers": "Manage customer records and profiles",
        "Addresses": "Manage customer delivery addresses",
        "Restaurants": "Manage restaurant partners and information",
        "Food Categories": "Manage food categories and types",
        "Menu Items": "Manage restaurant menu items and pricing",
        "Orders": "Manage customer orders and status",
        "Order Items": "Manage individual items within orders",
        "Payments": "Manage payment records and transactions",
        "Delivery Agents": "Manage delivery personnel information",
        "Deliveries": "Track delivery status and progress",
        "Reviews": "Manage customer feedback and ratings",
        "Restaurant Categories": "Manage restaurant category associations"
    };
    
    return descriptions[tableName] || "View and manage table data";
}

// Open table view with actual data
async function openTable(tableName) {
    try {
        const response = await fetch(databaseSchema.tableEndpoints[tableName].getAll);
        const data = await response.json();
        
        // Create a new window or tab with the table data
        const tableWindow = window.open('', '_blank');
        tableWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${databaseSchema.tables[tableName].name} Data</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #ff6b35; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .back-btn { 
                        display: inline-block; 
                        margin-bottom: 20px; 
                        padding: 8px 16px; 
                        background: #ff6b35; 
                        color: white; 
                        text-decoration: none; 
                        border-radius: 4px; 
                    }
                </style>
            </head>
            <body>
                <a href="#" onclick="window.close()" class="back-btn">
                    <i class="fas fa-arrow-left"></i> Back
                </a>
                <h1><i class="${databaseSchema.tableIcons[tableName]}"></i> ${databaseSchema.tables[tableName].name}</h1>
                <table>
                    <thead>
                        <tr>
                            ${Object.keys(data[0] || {}).map(key => `<th>${key.replace('_', ' ')}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr>
                                ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `);
        tableWindow.document.close();
    } catch (error) {
        console.error(`Error fetching data for ${tableName}:`, error);
        alert(`Failed to load ${databaseSchema.tables[tableName].name} data. Please try again.`);
    }
}

// Generate form fields for insert operation
function generateInsertFormFields() {
    const table = document.getElementById('insertTableSelect').value;
    const fieldsContainer = document.getElementById('insertFormFields');
    fieldsContainer.innerHTML = '';

    if (!table) return;

    const tableSchema = databaseSchema.tables[table];
    
    tableSchema.fields.forEach(field => {
        // Skip SERIAL primary key fields as they're auto-generated
        if (field.name === tableSchema.primaryKey && field.type.toUpperCase().includes('SERIAL')) {
            return;
        }
        
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const label = document.createElement('label');
        label.htmlFor = `insert_${field.name}`;
        label.innerHTML = `<i class="fas fa-tag"></i> ${field.name.replace('_', ' ')}`;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `insert_${field.name}`;
        input.name = field.name;
        input.className = 'vip-input';
        input.placeholder = field.placeholder || `Enter ${field.name.replace('_', ' ')}`;
        
        // Add data type information
        const typeInfo = document.createElement('small');
        typeInfo.textContent = `Type: ${field.type}`;
        typeInfo.style.display = 'block';
        typeInfo.style.marginTop = '5px';
        typeInfo.style.color = '#666';
        
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        formGroup.appendChild(typeInfo);
        fieldsContainer.appendChild(formGroup);
    });
}

// Submit insert form with API call
async function submitInsertForm() {
    const table = document.getElementById('insertTableSelect').value;
    if (!table) {
        alert('Please select a table first!');
        return;
    }

    const inputs = document.querySelectorAll('#insertFormFields input');
    const data = {};
    inputs.forEach(input => {
        if (input.value.trim() === '') {
            alert(`Please fill in the ${input.name.replace('_', ' ')} field!`);
            input.focus();
            throw new Error('Validation failed');
        }
        data[input.name] = input.value;
    });

    try {
        const response = await fetch(databaseSchema.tableEndpoints[table].add, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (response.ok) {
            alert(`Data inserted successfully into ${databaseSchema.tables[table].name} table!`);
            // Clear the form
            document.getElementById('insertTableSelect').value = '';
            document.getElementById('insertFormFields').innerHTML = '';
            // Refresh table cards to update counts
            generateTableCards();
        } else {
            alert(`Error: ${result.message || 'Failed to insert data'}\n${result.error || ''}`);
        }
    } catch (error) {
        console.error('Error inserting data:', error);
        alert('Failed to insert data. Please check console for details.');
    }
}

// Submit delete form with API call
async function submitDeleteForm() {
    const table = document.getElementById('deleteTableSelect').value;
    if (!table) {
        alert('Please select a table first!');
        return;
    }

    const tableSchema = databaseSchema.tables[table];
    const primaryKey = tableSchema.primaryKey;
    const input = document.getElementById(`delete_${primaryKey}`);
    
    if (!input || input.value.trim() === '') {
        alert(`Please enter the ${primaryKey.replace('_', ' ')} to delete!`);
        if (input) input.focus();
        return;
    }

    if (!confirm(`Are you sure you want to delete this record from ${tableSchema.name}? This action cannot be undone!`)) {
        return;
    }

    try {
        // Special handling for restaurant_categories which has composite primary key
        let deleteUrl = databaseSchema.tableEndpoints[table].delete;
        if (table === 'restaurant_categories') {
            const ids = input.value.split(',');
            if (ids.length !== 2) {
                alert('Please enter both restaurant_id and category_id separated by comma (e.g., 1,2)');
                return;
            }
            deleteUrl += `/${ids[0]}/${ids[1]}`;
        } else {
            deleteUrl += `/${input.value}`;
        }

        const response = await fetch(deleteUrl, {
            method: 'DELETE'
        });

        const result = await response.json();
        
        if (response.ok) {
            alert(`Record deleted successfully from ${tableSchema.name} table!`);
            // Clear the form
            document.getElementById('deleteTableSelect').value = '';
            document.getElementById('deleteFormFields').innerHTML = '';
            // Refresh table cards to update counts
            generateTableCards();
        } else {
            alert(`Error: ${result.message || 'Failed to delete record'}\n${result.error || ''}`);
        }
    } catch (error) {
        console.error('Error deleting data:', error);
        alert('Failed to delete data. Please check console for details.');
    }
}

// Reports data with sample analytics
const reportsData = {
    order_analytics: {
        title: "Order Analytics",
        icon: "fas fa-chart-pie",
        description: "Detailed analysis of order patterns, status distribution, and revenue trends.",
        charts: [
            {
                type: "pie",
                title: "Order Status Distribution",
                data: {
                    labels: ["Completed", "Processing", "Cancelled", "Delivered"],
                    datasets: [{
                        data: [45, 21, 5, 15],
                        backgroundColor: [
                            "#4BC0C0",
                            "#FFCE56",
                            "#FF6384",
                            "#36A2EB"
                        ]
                    }]
                }
            },
            {
                type: "bar",
                title: "Monthly Revenue",
                data: {
                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                    datasets: [{
                        label: "Revenue (in $)",
                        data: [12500, 19000, 15000, 21000, 23000, 19500],
                        backgroundColor: "#FF6B35"
                    }]
                }
            }
        ]
    },
    customer_insights: {
        title: "Customer Insights",
        icon: "fas fa-users",
        description: "Customer demographics and behavior patterns analysis.",
        charts: [
            {
                type: "doughnut",
                title: "Customer Distribution by Region",
                data: {
                    labels: ["Karachi", "Lahore", "Islamabad"],
                    datasets: [{
                        data: [45, 35, 20],
                        backgroundColor: [
                            "#FF6384",
                            "#36A2EB",
                            "#FFCE56"
                            
                        ]
                    }]
                }
            }
            ,
            {
                type: "line",
                title: "New Customers Over Time",
                data: {
                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                    datasets: [{
                        label: "New Customers",
                        data: [120, 190, 170, 210, 230, 195],
                        borderColor: "#FF6B35",
                        fill: false
                    }]
                }
            }
        ]
    },
    menu_performance: {
        title: "Menu Performance",
        icon: "fas fa-utensils",
        description: "Analysis of popular menu items and categories.",
        charts: [
            {
                type: "bar",
                title: "Top Selling Menu Items",
                data: {
                    labels: ["Burgers", "karahi", "Tikka", "Fish", "Roll"],
                    datasets: [{
                        label: "Total Orders",
                        data: [150, 70, 50, 26, 20],
                        backgroundColor: "#FF6B35"
                    }]
                }
            },
            {
                type: "polarArea",
                title: "Category Popularity",
                data: {
                    labels: ["Italian", "American", "Asian", "Mexican", "Desserts"],
                    datasets: [{
                        data: [35, 25, 20, 15, 5],
                        backgroundColor: [
                            "#FF6384",
                            "#36A2EB",
                            "#FFCE56",
                            "#4BC0C0",
                            "#9966FF"
                        ]
                    }]
                }
            }
        ]
    },
    delivery_performance: {
        title: "Delivery Performance",
        icon: "fas fa-truck",
        description: "Delivery times and driver performance metrics.",
        charts: [
            {
                type: "bar",
                title: "Average Delivery Time by Zone",
                data: {
                    labels: ["Karachi", "Lahore", "Islamabad"],
                    datasets: [{
                        label: "Minutes",
                        data: [15, 10, 5],
                        backgroundColor: "#4BC0C0"
                    }]
                }
            },
            {
                type: "line",
                title: "On-Time Delivery Rate",
                data: {
                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                    datasets: [{
                        label: "On-Time Percentage",
                        data: [92, 89, 94, 91, 93, 95],
                        borderColor: "#36A2EB",
                        fill: false
                    }]
                }
            }
        ]
    }
};

// Initialize reports when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Make sure Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }

    // Add click handlers to all report cards
    document.querySelectorAll('.report-card').forEach(card => {
        card.addEventListener('click', function() {
            const reportKey = this.getAttribute('data-report');
            showReport(reportKey);
        });
    });
});

// Show report modal with charts
function showReport(reportKey) {
    const modal = document.getElementById('reportModal');
    const modalTitle = document.getElementById('modalTitle');
    const chartCanvas = document.getElementById('reportChart');
    const reportDetails = document.getElementById('reportDetails');
    
    // Check if required elements exist
    if (!modal || !modalTitle || !chartCanvas || !reportDetails) {
        console.error('Required modal elements not found');
        return;
    }
    
    // const report = reportsData[reportKey];
    
    // if (!report) {
    //     console.error("Report not found:", reportKey);
    //     return;
    // }
    
    // Set modal title
    modalTitle.textContent = report.title;
    
    // Show modal
    modal.style.display = 'block';
    
    // Destroy previous chart if exists
    if (window.reportChart) {
        window.reportChart.destroy();
    }
    
    // Create new chart
    const ctx = chartCanvas.getContext('2d');
    
    // Use the first chart in the report
    const chartConfig = report.charts[0];
    
    window.reportChart = new Chart(ctx, {
        type: chartConfig.type,
        data: chartConfig.data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: chartConfig.title,
                    font: { size: 18 }
                },
                legend: { 
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 20
                    }
                }
            }
        }
    });
    
    // Add report details
    reportDetails.innerHTML = `
        <h3><i class="${report.icon}"></i> ${report.title} Details</h3>
        <p>${report.description}</p>
        <div class="stats-grid">
            ${report.charts.map((chart, index) => `
                <div class="stat-card">
                    <h4>${chart.title}</h4>
                    <p>Visualized as ${chart.type} chart</p>
                    <div class="stat-values">
                        ${chart.data.labels.map((label, i) => `
                            <div class="stat-value">
                                <span class="stat-label">${label}:</span>
                                <span class="stat-number">${chart.data.datasets[0].data[i]}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Close modal function
function closeModal() {
    const modal = document.getElementById('reportModal');
    modal.style.display = 'none';
    if (window.reportChart) {
        window.reportChart.destroy();
    }
}
// Generate feature cards for about section
function generateFeatureCards() {
    const featuresContainer = document.querySelector('.features');
    featuresContainer.innerHTML = '';
    
    const features = [
        {
            title: "Real-time Dashboard",
            description: "Monitor all aspects of your food delivery business with our interactive dashboard that updates in real-time.",
            icon: "fas fa-tachometer-alt"
        },
        {
            title: "Advanced Analytics",
            description: "Gain valuable insights with our comprehensive reporting and data visualization tools.",
            icon: "fas fa-chart-line"
        },
        {
            title: "Complete Database",
            description: "Manage all your data across 12 interconnected tables with our robust database management system.",
            icon: "fas fa-database"
        },
        {
            title: "Secure Operations",
            description: "Built with security in mind to protect your business and customer data.",
            icon: "fas fa-shield-alt"
        }
    ];
    
    features.forEach(feature => {
        const card = document.createElement('div');
        card.className = 'col-md-3 mb-4';
        card.innerHTML = `
            <div class="card feature-card h-100">
                <div class="card-body text-center">
                    <i class="${feature.icon} mb-3"></i>
                    <h3 class="card-title">${feature.title}</h3>
                    <p class="card-text">${feature.description}</p>
                </div>
            </div>
        `;
        
        featuresContainer.appendChild(card);
    });
}

// Close modal
function closeModal() {
    document.getElementById('reportModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('reportModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}