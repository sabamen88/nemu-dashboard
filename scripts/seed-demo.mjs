import { readFileSync } from 'fs';
const envFile = readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim();
});

import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

const sellers = await sql`SELECT id FROM sellers LIMIT 1`;
if (!sellers.length) { console.log('No seller found'); process.exit(1); }
const sellerId = sellers[0].id;
console.log('Seeding for seller:', sellerId);

const prods = await sql`SELECT id, name, price FROM products WHERE seller_id = ${sellerId} LIMIT 5`;
console.log('Found products:', prods.length);

const existing = await sql`SELECT COUNT(*) as c FROM orders WHERE seller_id = ${sellerId}`;
if (Number(existing[0].c) >= 5) {
  console.log('Already has demo orders (' + existing[0].c + '), skipping');
} else {
  const statuses = ['pending', 'confirmed', 'shipped', 'done', 'pending'];
  const buyers = [
    { name: 'Siti Rahayu', phone: '+628123456789' },
    { name: 'Budi Santoso', phone: '+628234567890' },
    { name: 'Dewi Lestari', phone: '+628345678901' },
    { name: 'Ahmad Fauzi', phone: '+628456789012' },
    { name: 'Rina Wahyuni', phone: '+628567890123' },
  ];
  for (let i = 0; i < 5; i++) {
    const buyer = buyers[i];
    const product = prods[i % (prods.length || 1)];
    const qty = Math.floor(Math.random() * 3) + 1;
    const price = product ? Number(product.price) : 150000;
    const total = price * qty;
    const createdAt = new Date(Date.now() - i * 2 * 86400000);
    const items = product
      ? [{ productId: product.id, name: product.name, price, qty }]
      : [{ name: 'Produk Demo', price: 150000, qty }];
    await sql`INSERT INTO orders (seller_id, buyer_phone, buyer_name, items, total, status, created_at, updated_at)
      VALUES (${sellerId}, ${buyer.phone}, ${buyer.name}, ${JSON.stringify(items)}::jsonb, ${total}, ${statuses[i]}, ${createdAt}, ${createdAt})`;
    console.log(`✓ Order ${i+1}: ${buyer.name} — Rp${total.toLocaleString('id')} [${statuses[i]}]`);
  }
}

const msgCheck = await sql`SELECT COUNT(*) as c FROM messages WHERE seller_id = ${sellerId}`;
if (Number(msgCheck[0].c) === 0) {
  const msgs = [
    { buyer: '+628123456789', name: 'Siti Rahayu', content: 'Halo kak, ada size M gak?', dir: 'inbound' },
    { buyer: '+628123456789', name: 'Siti Rahayu', content: 'Halo kak Siti! Ada kok, masih tersedia 😊 Mau pesan?', dir: 'outbound' },
    { buyer: '+628234567890', name: 'Budi Santoso', content: 'Ongkir ke Surabaya berapa ya?', dir: 'inbound' },
    { buyer: '+628234567890', name: 'Budi Santoso', content: 'Untuk Surabaya sekitar Rp15.000 kak via JNE reguler 🚚', dir: 'outbound' },
  ];
  for (const m of msgs) {
    await sql`INSERT INTO messages (seller_id, buyer_phone, buyer_name, content, direction, handled_by)
      VALUES (${sellerId}, ${m.buyer}, ${m.name}, ${m.content}, ${m.dir}, 'agent')`;
  }
  console.log('✓ Seeded 4 demo messages');
} else {
  console.log('Messages already exist (' + msgCheck[0].c + '), skipping');
}
console.log('🎉 Done!');
