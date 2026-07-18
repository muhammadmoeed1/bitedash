const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
  try {
    res.json('WELCOME TO HR API');
  }
  catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

//addresses table
app.get('/addresses', async (req, res) => {
  try {
    const result = await pool.query('select * from addresses');
    res.json(result.rows);
  }
  catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

app.get('/count/addresses', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM addresses');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




app.post('/add-address', async (req, res) => {
  const { customer_id, street, city, zip_code, label } = req.body;
  try {
    await pool.query(
      'INSERT INTO Addresses (customer_id, street, city, zip_code, label) VALUES ($1, $2, $3, $4, $5)',
      [customer_id, street, city, zip_code, label]
    );
    res.send('Address added successfully!');
  } catch (err) {
    console.error('Error inserting address:', err);
    res.status(500).send('Failed to add address');
  }
});

app.delete('/delete-address/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Addresses WHERE address_id = $1', [req.params.id]);
    res.send('Address deleted successfully!');
  } catch (err) {
    console.error('Error deleting address:', err);
    res.status(500).send('Failed to delete address');
  }
});



//customers table
app.get('/customers', async (req, res) => {
  try {
    const result = await pool.query('select * from customers');
    res.json(result.rows);
  }
  catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

app.get('/count/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM customers');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




app.post('/add-customer', async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    await pool.query(
      'INSERT INTO Customers (name, email, phone) VALUES ($1, $2, $3)',
      [name, email, phone]
    );
    res.send('Customer added successfully!');
  } catch (err) {
    console.error('Error inserting customer:', err);
    res.status(500).send('Failed to add customer');
  }
});

app.delete('/delete-customer/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Customers WHERE customer_id = $1', [req.params.id]);
    res.send('Customer deleted successfully!');
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).send('Failed to delete customer');
  }
});


//deliveries table
app.get('/deliveries', async (req, res) => {
  try {
    const result = await pool.query('select * from deliveries');
    res.json(result.rows);
  }
  catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

app.get('/count/deliveries', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM deliveries');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/add-delivery', async (req, res) => {
  const { order_id, agent_id, delivery_status, delivery_time } = req.body;
  try {
    await pool.query(
      'INSERT INTO Deliveries (order_id, agent_id, delivery_status, delivery_time) VALUES ($1, $2, $3, $4)',
      [order_id, agent_id, delivery_status, delivery_time]
    );
    res.send('Delivery added successfully!');
  } catch (err) {
    console.error('Error inserting delivery:', err);
    res.status(500).send('Failed to add delivery');
  }
});

app.delete('/delete-delivery/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Deliveries WHERE delivery_id = $1', [req.params.id]);
    res.send('Delivery deleted successfully!');
  } catch (err) {
    console.error('Error deleting delivery:', err);
    res.status(500).send('Failed to delete delivery');
  }
});





//delivery_agents table
app.get('/delivery_agents', async (req, res) => {
  try {
    const result = await pool.query('select * from delivery_agents');
    res.json(result.rows);
  }
  catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

app.get('/count/delivery_agents', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM delivery_agents');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/add-agent', async (req, res) => {
  const { name, phone, vehicle_number } = req.body;
  try {
    await pool.query(
      'INSERT INTO Delivery_Agents (name, phone, vehicle_number) VALUES ($1, $2, $3)',
      [name, phone, vehicle_number]
    );
    res.send('Agent added successfully!');
  } catch (err) {
    console.error('Error inserting agent:', err);
    res.status(500).send('Failed to add agent');
  }
});

app.delete('/delete-agent/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Delivery_Agents WHERE agent_id = $1', [req.params.id]);
    res.send('Delivery agent deleted successfully!');
  } catch (err) {
    console.error('Error deleting agent:', err);
    res.status(500).send('Failed to delete agent');
  }
});



//food_categories table
app.get('/food_categories', async (req, res) => {
  try {
    const result = await pool.query('select * from food_categories');
    res.json(result.rows);
  }
  catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

app.get('/count/food_categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM food_categories');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/add-category', async (req, res) => {
  const { category_name } = req.body;
  try {
    await pool.query(
      'INSERT INTO Food_Categories (category_name) VALUES ($1)',
      [category_name]
    );
    res.send('Category added successfully!');
  } catch (err) {
    console.error('Error inserting category:', err);
    res.status(500).send('Failed to add category');
  }
});

app.delete('/delete-category/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Food_Categories WHERE category_id = $1', [req.params.id]);
    res.send('Category deleted successfully!');
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).send('Failed to delete category');
  }
});


//menu_items table
app.get('/menu_items', async (req, res) => {
  try {
    const result = await pool.query('select * from menu_items');
    res.json(result.rows);
  }
  catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

app.get('/count/menu_items', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM menu_items');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/add-menu-item', async (req, res) => {
  const { restaurant_id, category_id, item_name, description, price, availability } = req.body;
  try {
    await pool.query(
      'INSERT INTO Menu_Items (restaurant_id, category_id, item_name, description, price, availability) VALUES ($1, $2, $3, $4, $5, $6)',
      [restaurant_id, category_id, item_name, description, price, availability]
    );
    res.send('Menu item added successfully!');
  } catch (err) {
    console.error('Error inserting menu item:', err);
    res.status(500).send('Failed to add menu item');
  }
});

app.delete('/delete-menu-item/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Menu_Items WHERE item_id = $1', [req.params.id]);
    res.send('Menu item deleted successfully!');
  } catch (err) {
    console.error('Error deleting menu item:', err);
    res.status(500).send('Failed to delete menu item');
  }
});


//order_items table
app.get('/order_items', async (req, res) => {
  try {
    const result = await pool.query('select * from order_items');
    res.json(result.rows);
  }
  catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

app.get('/count/order_items', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM order_items');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.post('/add-order-item', async (req, res) => {
  const { order_id, item_id, quantity, price } = req.body;
  try {
    await pool.query(
      'INSERT INTO Order_Items (order_id, item_id, quantity, price) VALUES ($1, $2, $3, $4)',
      [order_id, item_id, quantity, price]
    );
    res.send('Order item added successfully!');
  } catch (err) {
    console.error('Error inserting order item:', err);
    res.status(500).send('Failed to add order item');
  }
});

app.delete('/delete-order-item/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Order_Items WHERE order_item_id = $1', [req.params.id]);
    res.send('Order item deleted successfully!');
  } catch (err) {
    console.error('Error deleting order item:', err);
    res.status(500).send('Failed to delete order item');
  }
});


//orders table
app.get('/orders', async (req, res) => {
  try {
    const result = await pool.query('select * from orders');
    res.json(result.rows);
  }
  catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

app.get('/count/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM orders');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.post('/add-order', async (req, res) => {
  const { customer_id, status, total_amount } = req.body;
  try {
    await pool.query(
      'INSERT INTO Orders (customer_id, status, total_amount) VALUES ($1, $2, $3)',
      [customer_id, status, total_amount]
    );
    res.send('Order added successfully!');
  } catch (err) {
    console.error('Error inserting order:', err);
    res.status(500).send('Failed to add order');
  }
});

app.delete('/delete-order/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Orders WHERE order_id = $1', [req.params.id]);
    res.send('Order deleted successfully!');
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).send('Failed to delete order');
  }
});



//payments table
app.get('/payments', async (req, res) => {
  try {
    const result = await pool.query('select * from payments');
    res.json(result.rows);
  }
  catch (err) {
    res.status(500).json({ Error: err.message });
  }
});


app.get('/count/payments', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM payments');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.post('/add-payment', async (req, res) => {
  const { order_id, payment_date, amount, payment_method, payment_status } = req.body;
  try {
    await pool.query(
      'INSERT INTO Payments (order_id, payment_date, amount, payment_method, payment_status) VALUES ($1, $2, $3, $4, $5)',
      [order_id, payment_date, amount, payment_method, payment_status]
    );
    res.send('Payment added successfully!');
  } catch (err) {
    console.error('Error inserting payment:', err);
    res.status(500).send('Failed to add payment');
  }
});

app.delete('/delete-payment/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Payments WHERE payment_id = $1', [req.params.id]);
    res.send('Payment deleted successfully!');
  } catch (err) {
    console.error('Error deleting payment:', err);
    res.status(500).send('Failed to delete payment');
  }
});


//restaurant_categories table
app.get('/restaurant_categories', async (req, res) => {
  try {
    const result = await pool.query('select * from restaurant_categories');
    res.json(result.rows);
  }
  catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

app.get('/count/restaurant_categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM restaurant_categories');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/add-restaurant-category', async (req, res) => {
  const { restaurant_id, category_id } = req.body;
  try {
    await pool.query(
      'INSERT INTO restaurant_categories (restaurant_id, category_id) VALUES ($1, $2)',
      [restaurant_id, category_id]
    );
    res.send('Restaurant category linked successfully!');
  } catch (err) {
    console.error('Error inserting restaurant category:', err);
    res.status(500).send('Failed to add restaurant category');
  }
});

app.delete('/delete-restaurant-category/:restaurant_id/:category_id', async (req, res) => {
  const { restaurant_id, category_id } = req.params;
  try {
    await pool.query(
      'DELETE FROM restaurant_categories WHERE restaurant_id = $1 AND category_id = $2',
      [restaurant_id, category_id]
    );
    res.send('Restaurant category link deleted successfully!');
  } catch (err) {
    console.error('Error deleting restaurant category:', err);
    res.status(500).send('Failed to delete restaurant category');
  }
});



//restaurants table
app.get('/restaurants', async (req, res) => {
  try {
    const result = await pool.query('select * from restaurants');
    res.json(result.rows);
  }
  catch (err) {
    res.status(500).json({ Error: err.message });
  }
});


app.get('/count/restaurants', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM restaurants');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/add-restaurant', async (req, res) => {
  const { name, email, phone, address } = req.body;
  try {
    await pool.query(
      'INSERT INTO Restaurants (name, email, phone, address) VALUES ($1, $2, $3, $4)',
      [name, email, phone, address]
    );
    res.send('Restaurant added successfully!');
  } catch (err) {
    console.error('Error inserting restaurant:', err);
    res.status(500).send('Failed to add restaurant');
  }
});

app.delete('/delete-restaurant/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Restaurants WHERE restaurant_id = $1', [req.params.id]);
    res.send('Restaurant deleted successfully!');
  } catch (err) {
    console.error('Error deleting restaurant:', err);
    res.status(500).send('Failed to delete restaurant');
  }
});


//reviews table
app.get('/reviews', async (req, res) => {
  try {
    const result = await pool.query('select * from reviews');
    res.json(result.rows);
  }
  catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

app.get('/count/reviews', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM reviews');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/add-review', async (req, res) => {
  const { customer_id, restaurant_id, rating, comment } = req.body;
  try {
    await pool.query(
      'INSERT INTO Reviews (customer_id, restaurant_id, rating, comment) VALUES ($1, $2, $3, $4)',
      [customer_id, restaurant_id, rating, comment]
    );
    res.send('Review added successfully!');
  } catch (err) {
    console.error('Error inserting review:', err);
    res.status(500).send('Failed to add review');
  }
});

app.delete('/delete-review/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Reviews WHERE review_id = $1', [req.params.id]);
    res.send('Review deleted successfully!');
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).send('Failed to delete review');
  }
});


const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Connect Successfully.....on Port ${PORT}`);
});