import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SEQUENCES = [
  'customers_customer_id_seq',
  'addresses_address_id_seq',
  'restaurants_restaurant_id_seq',
  'food_categories_category_id_seq',
  'menu_items_item_id_seq',
  'orders_order_id_seq',
  'order_items_order_item_id_seq',
  'payments_payment_id_seq',
  'delivery_agents_agent_id_seq',
  'deliveries_delivery_id_seq',
  'reviews_review_id_seq',
];

async function clear() {
  // Run sequentially (not in a $transaction) — Neon's pooled connection doesn't reliably
  // support long-lived interactive transactions, and each deleteMany is already atomic.
  await prisma.reviews.deleteMany();
  await prisma.deliveries.deleteMany();
  await prisma.payments.deleteMany();
  await prisma.order_items.deleteMany();
  await prisma.orders.deleteMany();
  await prisma.restaurant_categories.deleteMany();
  await prisma.menu_items.deleteMany();
  await prisma.addresses.deleteMany();
  await prisma.delivery_agents.deleteMany();
  await prisma.food_categories.deleteMany();
  await prisma.restaurants.deleteMany();
  await prisma.customers.deleteMany();

  for (const seq of SEQUENCES) {
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "${seq}" RESTART WITH 1`);
  }
}

async function main() {
  console.log('Clearing existing data...');
  await clear();

  console.log('Seeding customers...');
  const [ali, sara, hamza, moeed, ayesha, bilal] = await Promise.all(
    [
      { name: 'Ali Raza', email: 'ali.raza@example.com', phone: '03001234567' },
      { name: 'Sara Khan', email: 'sara.khan@example.com', phone: '03007654321' },
      { name: 'Hamza Bhatti', email: 'hamza.bhatti@example.com', phone: '03009876543' },
      { name: 'Moeed Ahmed', email: 'moeed.ahmed@example.com', phone: '03001112223' },
      { name: 'Ayesha Malik', email: 'ayesha.malik@example.com', phone: '03004445556' },
      { name: 'Bilal Siddiqui', email: 'bilal.siddiqui@example.com', phone: '03007778889' },
    ].map((data) => prisma.customers.create({ data })),
  );

  console.log('Seeding addresses...');
  await prisma.addresses.createMany({
    data: [
      { customer_id: ali.customer_id, street: '12 Model Town', city: 'Lahore', zip_code: '54000', label: 'Home' },
      { customer_id: sara.customer_id, street: '45 DHA Phase 5', city: 'Lahore', zip_code: '54792', label: 'Home' },
      { customer_id: hamza.customer_id, street: '7 F-10 Markaz', city: 'Islamabad', zip_code: '44000', label: 'Home' },
      { customer_id: moeed.customer_id, street: '21 Gulshan-e-Iqbal', city: 'Karachi', zip_code: '75300', label: 'Home' },
      { customer_id: ayesha.customer_id, street: '3 Bahria Town', city: 'Rawalpindi', zip_code: '46000', label: 'Home' },
      { customer_id: bilal.customer_id, street: '88 Johar Town', city: 'Lahore', zip_code: '54782', label: 'Work' },
    ],
  });

  console.log('Seeding restaurants...');
  const [alMadina, bellaItalia, sweetTreats, greenBowl] = await Promise.all(
    [
      { name: 'Al Madina Grill', email: 'contact@almadinagrill.com', phone: '0429988776', address: 'Liberty Market, Lahore' },
      { name: 'Bella Italia', email: 'hello@bellaitalia.com', phone: '0518877665', address: 'Blue Area, Islamabad' },
      { name: 'Sweet Treats Bakery', email: 'orders@sweettreats.com', phone: '0219988112', address: 'Clifton, Karachi' },
      { name: 'Green Bowl', email: 'hi@greenbowl.com', phone: '0429911223', address: 'MM Alam Road, Lahore' },
    ].map((data) => prisma.restaurants.create({ data })),
  );

  console.log('Seeding food categories...');
  const [fastFood, italian, desserts, healthy, beverages] = await Promise.all(
    ['Fast Food', 'Italian', 'Desserts', 'Healthy', 'Beverages'].map((category_name) =>
      prisma.food_categories.create({ data: { category_name } }),
    ),
  );

  console.log('Linking restaurants to categories...');
  await prisma.restaurant_categories.createMany({
    data: [
      { restaurant_id: alMadina.restaurant_id, category_id: fastFood.category_id },
      { restaurant_id: bellaItalia.restaurant_id, category_id: italian.category_id },
      { restaurant_id: sweetTreats.restaurant_id, category_id: desserts.category_id },
      { restaurant_id: greenBowl.restaurant_id, category_id: healthy.category_id },
      { restaurant_id: alMadina.restaurant_id, category_id: beverages.category_id },
    ],
  });

  console.log('Seeding menu items...');
  const menuItemsData = [
    { restaurant_id: alMadina.restaurant_id, category_id: fastFood.category_id, item_name: 'Chicken Seekh Kebab Roll', description: 'Grilled chicken seekh kebab wrapped in naan with mint chutney', price: 450, availability: true },
    { restaurant_id: alMadina.restaurant_id, category_id: fastFood.category_id, item_name: 'Beef Burger', description: 'Charbroiled beef patty with cheddar, lettuce, and special sauce', price: 650, availability: true },
    { restaurant_id: alMadina.restaurant_id, category_id: beverages.category_id, item_name: 'Fresh Lime Soda', description: 'Chilled soda with fresh lime and mint', price: 180, availability: true },
    { restaurant_id: bellaItalia.restaurant_id, category_id: italian.category_id, item_name: 'Margherita Pizza', description: 'Classic tomato, mozzarella, and basil on a thin crust', price: 950, availability: true },
    { restaurant_id: bellaItalia.restaurant_id, category_id: italian.category_id, item_name: 'Chicken Alfredo Pasta', description: 'Creamy alfredo sauce with grilled chicken and fettuccine', price: 1100, availability: true },
    { restaurant_id: bellaItalia.restaurant_id, category_id: italian.category_id, item_name: 'Bruschetta', description: 'Toasted baguette topped with tomato, garlic, and basil', price: 500, availability: true },
    { restaurant_id: sweetTreats.restaurant_id, category_id: desserts.category_id, item_name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with a molten center, served with ice cream', price: 550, availability: true },
    { restaurant_id: sweetTreats.restaurant_id, category_id: desserts.category_id, item_name: 'New York Cheesecake', description: 'Classic baked cheesecake with a graham cracker crust', price: 600, availability: true },
    { restaurant_id: sweetTreats.restaurant_id, category_id: desserts.category_id, item_name: 'Red Velvet Cupcake', description: 'Moist red velvet cupcake with cream cheese frosting', price: 300, availability: true },
    { restaurant_id: greenBowl.restaurant_id, category_id: healthy.category_id, item_name: 'Grilled Chicken Caesar Salad', description: 'Romaine, parmesan, croutons, and grilled chicken breast', price: 700, availability: true },
    { restaurant_id: greenBowl.restaurant_id, category_id: healthy.category_id, item_name: 'Quinoa Buddha Bowl', description: 'Quinoa, roasted vegetables, chickpeas, and tahini dressing', price: 750, availability: true },
    { restaurant_id: greenBowl.restaurant_id, category_id: healthy.category_id, item_name: 'Avocado Toast', description: 'Multigrain toast topped with smashed avocado and chili flakes', price: 500, availability: false },
  ];
  await prisma.menu_items.createMany({ data: menuItemsData });
  const menuItems = await prisma.menu_items.findMany({ orderBy: { item_id: 'asc' } });

  console.log('Seeding delivery agents...');
  const [agent1, agent2, agent3] = await Promise.all(
    [
      { name: 'Usman Tariq', phone: '03211234567', vehicle_number: 'LEA-2234' },
      { name: 'Fahad Iqbal', phone: '03217654321', vehicle_number: 'LEB-8871' },
      { name: 'Zainab Hussain', phone: '03219876543', vehicle_number: 'LEC-4432' },
    ].map((data) => prisma.delivery_agents.create({ data })),
  );

  console.log('Seeding orders, order items, payments, and deliveries...');
  const orderPlans = [
    { customer: ali, status: 'delivered', items: [menuItems[0], menuItems[2]], agent: agent1, deliveryStatus: 'delivered', paymentStatus: 'completed', paymentMethod: 'card' },
    { customer: sara, status: 'delivered', items: [menuItems[3], menuItems[5]], agent: agent2, deliveryStatus: 'delivered', paymentStatus: 'completed', paymentMethod: 'wallet' },
    { customer: hamza, status: 'out_for_delivery', items: [menuItems[6], menuItems[7]], agent: agent3, deliveryStatus: 'in_transit', paymentStatus: 'completed', paymentMethod: 'cash' },
    { customer: moeed, status: 'preparing', items: [menuItems[9]], agent: agent1, deliveryStatus: 'assigned', paymentStatus: 'pending', paymentMethod: 'card' },
    { customer: ayesha, status: 'placed', items: [menuItems[1], menuItems[8]], agent: agent2, deliveryStatus: 'assigned', paymentStatus: 'pending', paymentMethod: 'cash' },
    { customer: bilal, status: 'cancelled', items: [menuItems[10]], agent: agent3, deliveryStatus: 'failed', paymentStatus: 'refunded', paymentMethod: 'card' },
  ] as const;

  for (const plan of orderPlans) {
    const totalAmount = plan.items.reduce((sum, item) => sum + Number(item.price), 0);
    const order = await prisma.orders.create({
      data: { customer_id: plan.customer.customer_id, status: plan.status, total_amount: totalAmount },
    });

    await prisma.order_items.createMany({
      data: plan.items.map((item) => ({
        order_id: order.order_id,
        item_id: item.item_id,
        quantity: 1,
        price: item.price,
      })),
    });

    await prisma.payments.create({
      data: {
        order_id: order.order_id,
        amount: totalAmount,
        payment_method: plan.paymentMethod,
        payment_status: plan.paymentStatus,
      },
    });

    await prisma.deliveries.create({
      data: {
        order_id: order.order_id,
        agent_id: plan.agent.agent_id,
        delivery_status: plan.deliveryStatus,
        delivery_time: new Date('1970-01-01T18:30:00.000Z'),
      },
    });
  }

  console.log('Seeding reviews...');
  await prisma.reviews.createMany({
    data: [
      { customer_id: ali.customer_id, restaurant_id: alMadina.restaurant_id, rating: 5, comment: 'Best seekh kebab roll in town, fast delivery too!' },
      { customer_id: sara.customer_id, restaurant_id: bellaItalia.restaurant_id, rating: 4, comment: 'Great pasta, pizza crust could be crispier.' },
      { customer_id: hamza.customer_id, restaurant_id: sweetTreats.restaurant_id, rating: 5, comment: 'The lava cake was incredible, will order again.' },
      { customer_id: moeed.customer_id, restaurant_id: greenBowl.restaurant_id, rating: 4, comment: 'Healthy and filling, good portion size.' },
      { customer_id: ayesha.customer_id, restaurant_id: alMadina.restaurant_id, rating: 3, comment: 'Good food but the order took longer than expected.' },
    ],
  });

  console.log('Seed complete.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
