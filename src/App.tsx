import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

// ─── localStorage helpers ─────────────────────────────────────────────────────
function loadLS<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? (JSON.parse(r) as T) : fallback; } catch { return fallback; }
}
function saveLS(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /**/ }
}

// ─── Product catalogue (20 products) ─────────────────────────────────────────
// URLs are deep-linked to the exact product search on each platform
const BASE_DEALS = [
  { id:'1',  platform:'AMAZON',   name:'Samsung Galaxy S24 Ultra 256GB',          brand:'Samsung',     category:'Smartphones', current_price:89999,  original_price:129999, discount_pct:31, value_score:82, fake_discount_flag:false, low_confidence_score:false, image_url:'https://images.unsplash.com/photo-1709563996840-da5a1a3af9c9?w=160&h=160&fit=crop',   url:'https://www.amazon.in/s?k=Samsung+Galaxy+S24+Ultra+256GB&i=electronics',        is_available:true },
  { id:'2',  platform:'FLIPKART', name:'Apple iPhone 15 Pro 128GB Titanium',       brand:'Apple',       category:'Smartphones', current_price:114999, original_price:134900, discount_pct:15, value_score:61, fake_discount_flag:true,  low_confidence_score:false, image_url:'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=160&h=160&fit=crop', url:'https://www.flipkart.com/search?q=Apple+iPhone+15+Pro+128GB&as=on&as-show=on&otracker=AS_QueryStore_OrganicAutoSuggest_1_2', is_available:true },
  { id:'3',  platform:'AMAZON',   name:'Sony WH-1000XM5 Wireless Headphones',     brand:'Sony',        category:'Audio',       current_price:19990,  original_price:29990,  discount_pct:33, value_score:91, fake_discount_flag:false, low_confidence_score:false, image_url:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=160&h=160&fit=crop', url:'https://www.amazon.in/s?k=Sony+WH-1000XM5+Wireless+Headphones&i=electronics',  is_available:true },
  { id:'4',  platform:'FLIPKART', name:'LG 55" OLED C3 4K Smart TV',              brand:'LG',          category:'TVs',         current_price:109999, original_price:174990, discount_pct:37, value_score:88, fake_discount_flag:false, low_confidence_score:true,  image_url:'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=160&h=160&fit=crop', url:'https://www.flipkart.com/search?q=LG+55+OLED+C3+4K+Smart+TV&as=on&as-show=on', is_available:true },
  { id:'5',  platform:'MYNTRA',   name:'Nike Air Max 270 Running Shoes',           brand:'Nike',        category:'Footwear',    current_price:5995,   original_price:11995,  discount_pct:50, value_score:76, fake_discount_flag:false, low_confidence_score:false, image_url:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=160&h=160&fit=crop', url:'https://www.myntra.com/shoes/nike/nike-air-max-270/buy',                         is_available:true },
  { id:'6',  platform:'AMAZON',   name:'Dyson V15 Detect Vacuum Cleaner',          brand:'Dyson',       category:'Appliances',  current_price:42900,  original_price:62900,  discount_pct:32, value_score:79, fake_discount_flag:false, low_confidence_score:false, image_url:'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=160&h=160&fit=crop', url:'https://www.amazon.in/s?k=Dyson+V15+Detect+Vacuum+Cleaner&i=kitchen',           is_available:true },
  { id:'7',  platform:'FLIPKART', name:'OnePlus 12 5G 256GB Silky Black',          brand:'OnePlus',     category:'Smartphones', current_price:54999,  original_price:69999,  discount_pct:21, value_score:74, fake_discount_flag:false, low_confidence_score:false, image_url:'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=160&h=160&fit=crop', url:'https://www.flipkart.com/search?q=OnePlus+12+5G+256GB+Silky+Black&as=on',       is_available:true },
  { id:'8',  platform:'AMAZON',   name:'Apple MacBook Air M3 8GB 256GB',           brand:'Apple',       category:'Laptops',     current_price:99900,  original_price:114900, discount_pct:13, value_score:69, fake_discount_flag:false, low_confidence_score:false, image_url:'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=160&h=160&fit=crop', url:'https://www.amazon.in/s?k=Apple+MacBook+Air+M3+8GB+256GB&i=computers',          is_available:true },
  { id:'9',  platform:'AMAZON',   name:'boAt Airdopes 141 TWS Earbuds',            brand:'boAt',        category:'Audio',       current_price:899,    original_price:2990,   discount_pct:70, value_score:88, fake_discount_flag:false, low_confidence_score:false, image_url:'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=160&h=160&fit=crop', url:'https://www.amazon.in/s?k=boAt+Airdopes+141+TWS+Earbuds&i=electronics',         is_available:true },
  { id:'10', platform:'FLIPKART', name:'HP Pavilion 15 Intel i5 16GB 512GB SSD',  brand:'HP',          category:'Laptops',     current_price:54990,  original_price:72990,  discount_pct:25, value_score:80, fake_discount_flag:false, low_confidence_score:false, image_url:'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=160&h=160&fit=crop', url:'https://www.flipkart.com/search?q=HP+Pavilion+15+Intel+i5+16GB+512GB+SSD&as=on', is_available:true },
  { id:'11', platform:'MYNTRA',   name:'Adidas Ultraboost 22 Running Shoes',       brand:'Adidas',      category:'Footwear',    current_price:8995,   original_price:17999,  discount_pct:50, value_score:83, fake_discount_flag:false, low_confidence_score:false, image_url:'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=160&h=160&fit=crop', url:'https://www.myntra.com/shoes/adidas/adidas-ultraboost-22/buy',                   is_available:true },
  { id:'12', platform:'AMAZON',   name:'Samsung 65" Crystal 4K UHD Smart TV',     brand:'Samsung',     category:'TVs',         current_price:54990,  original_price:84990,  discount_pct:35, value_score:85, fake_discount_flag:false, low_confidence_score:false, image_url:'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=160&h=160&fit=crop', url:'https://www.amazon.in/s?k=Samsung+65+Crystal+4K+UHD+Smart+TV&i=electronics',    is_available:true },
  { id:'13', platform:'FLIPKART', name:'Realme Narzo 60 Pro 5G 8GB 128GB',        brand:'Realme',      category:'Smartphones', current_price:19999,  original_price:29999,  discount_pct:33, value_score:71, fake_discount_flag:false, low_confidence_score:false, image_url:'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=160&h=160&fit=crop', url:'https://www.flipkart.com/search?q=Realme+Narzo+60+Pro+5G+8GB+128GB&as=on',      is_available:true },
  { id:'14', platform:'AMAZON',   name:'Instant Pot Duo 7-in-1 Electric Cooker',  brand:'Instant Pot', category:'Appliances',  current_price:6499,   original_price:9999,   discount_pct:35, value_score:90, fake_discount_flag:false, low_confidence_score:false, image_url:'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=160&h=160&fit=crop', url:'https://www.amazon.in/s?k=Instant+Pot+Duo+7-in-1+Electric+Cooker&i=kitchen',    is_available:true },
  { id:'15', platform:'MYNTRA',   name:"Levi's 511 Slim Fit Jeans",               brand:"Levi's",      category:'Clothing',    current_price:1799,   original_price:3499,   discount_pct:49, value_score:78, fake_discount_flag:false, low_confidence_score:false, image_url:'https://images.unsplash.com/photo-1542272604-787c3835535d?w=160&h=160&fit=crop', url:'https://www.myntra.com/jeans/levis/levis-511-slim-fit/buy',                      is_available:true },
  { id:'16', platform:'FLIPKART', name:'ASUS ROG Strix G15 Ryzen 7 RTX 3060',    brand:'ASUS',        category:'Laptops',     current_price:89990,  original_price:119990, discount_pct:25, value_score:87, fake_discount_flag:false, low_confidence_score:false, image_url:'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=160&h=160&fit=crop', url:'https://www.flipkart.com/search?q=ASUS+ROG+Strix+G15+Ryzen+7+RTX+3060&as=on',  is_available:true },
  { id:'17', platform:'AMAZON',   name:'Philips Air Fryer XXL 7.3L HD9860',       brand:'Philips',     category:'Appliances',  current_price:9999,   original_price:17995,  discount_pct:44, value_score:86, fake_discount_flag:false, low_confidence_score:false, image_url:'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=160&h=160&fit=crop', url:'https://www.amazon.in/s?k=Philips+Air+Fryer+XXL+7.3L+HD9860&i=kitchen',         is_available:true },
  { id:'18', platform:'FLIPKART', name:'Noise ColorFit Ultra 2 Smartwatch',       brand:'Noise',       category:'Wearables',   current_price:1799,   original_price:7999,   discount_pct:78, value_score:72, fake_discount_flag:false, low_confidence_score:true,  image_url:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160&h=160&fit=crop', url:'https://www.flipkart.com/search?q=Noise+ColorFit+Ultra+2+Smartwatch&as=on',    is_available:true },
  { id:'19', platform:'AMAZON',   name:'Kindle Paperwhite 16GB Waterproof',       brand:'Amazon',      category:'Electronics', current_price:11999,  original_price:16999,  discount_pct:29, value_score:92, fake_discount_flag:false, low_confidence_score:false, image_url:'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=160&h=160&fit=crop', url:'https://www.amazon.in/s?k=Kindle+Paperwhite+16GB+Waterproof&i=electronics',     is_available:true },
  { id:'20', platform:'MYNTRA',   name:'H&M Regular Fit Cotton T-Shirt Pack of 3',brand:'H&M',         category:'Clothing',    current_price:999,    original_price:1799,   discount_pct:44, value_score:77, fake_discount_flag:false, low_confidence_score:false, image_url:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=160&h=160&fit=crop', url:'https://www.myntra.com/tshirts/hm/hm-regular-fit-cotton-tshirt/buy',             is_available:true },
];

// ─── Build a direct product search URL for each platform ─────────────────────
function buildProductUrl(platform: string, name: string, fallbackUrl: string): string {
  const q = encodeURIComponent(name);
  switch (platform) {
    case 'AMAZON':   return `https://www.amazon.in/s?k=${q}&i=electronics`;
    case 'FLIPKART': return `https://www.flipkart.com/search?q=${q}&as=on&as-show=on&otracker=AS_QueryStore_OrganicAutoSuggest_1_1`;
    case 'MYNTRA':   return `https://www.myntra.com/search?rawQuery=${q}`;
    case 'SNAPDEAL': return `https://www.snapdeal.com/search?keyword=${q}`;
    case 'MEESHO':   return `https://meesho.com/search?q=${q}`;
    default:         return fallbackUrl;
  }
}

type Deal = typeof BASE_DEALS[0] & { last_fetched_at: string };

function simulatePriceUpdate(deals: typeof BASE_DEALS): Deal[] {
  return deals.map(d => {
    const swing = 1 + (Math.random() * 0.06 - 0.03);
    const simPrice = Math.round(d.current_price * swing);
    const simDiscount = Math.round(((d.original_price - simPrice) / d.original_price) * 100);
    return { ...d, current_price: simPrice, discount_pct: Math.max(0, simDiscount), last_fetched_at: new Date().toISOString() };
  });
}

const PLATFORM_COLORS: Record<string, string> = {
  AMAZON: '#ff9900', FLIPKART: '#2874f0', MYNTRA: '#ff3f6c', SNAPDEAL: '#e40046', MEESHO: '#9400d3',
};

type View = 'home' | 'search' | 'cart' | 'wishlist' | 'feed' | 'orders' | 'profile';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthUser { name: string; email: string; avatar: string; phone?: string; address?: string; }
type PaymentMethod = 'card' | 'upi' | 'wallet';
type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed';

interface OrderItem { id: string; name: string; image_url: string; platform: string; price: number; original_price: number; discount_pct: number; }
interface Order {
  id: string; date: string; items: OrderItem[]; total: number; savings: number;
  paymentMethod: string; status: 'Delivered' | 'Shipped' | 'Processing' | 'Cancelled';
  txnId: string;
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function ValueBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const c = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171';
  return <span style={{ background: c+'22', color: c, border:`1px solid ${c}55`, borderRadius:6, padding:'2px 7px', fontSize:12, fontWeight:700 }}>⚡ {score}</span>;
}
function PlatformTag({ platform }: { platform: string }) {
  const c = PLATFORM_COLORS[platform] ?? '#9898b0';
  return <span style={{ background:c+'22', color:c, border:`1px solid ${c}44`, borderRadius:5, padding:'2px 8px', fontSize:11, fontWeight:600 }}>{platform}</span>;
}
function ProductImage({ src, alt, size = 72 }: { src: string; alt: string; size?: number }) {
  const [err, setErr] = useState(false);
  const emoji = alt.toLowerCase().includes('phone')||alt.toLowerCase().includes('iphone')||alt.toLowerCase().includes('samsung') ? '📱'
    : alt.toLowerCase().includes('headphone')||alt.toLowerCase().includes('bud')||alt.toLowerCase().includes('earbuds') ? '🎧'
    : alt.toLowerCase().includes('tv')||alt.toLowerCase().includes('oled') ? '📺'
    : alt.toLowerCase().includes('shoe')||alt.toLowerCase().includes('nike')||alt.toLowerCase().includes('adidas') ? '👟'
    : alt.toLowerCase().includes('laptop')||alt.toLowerCase().includes('macbook')||alt.toLowerCase().includes('pavilion')||alt.toLowerCase().includes('rog') ? '💻'
    : alt.toLowerCase().includes('vacuum')||alt.toLowerCase().includes('dyson') ? '🧹'
    : alt.toLowerCase().includes('jeans')||alt.toLowerCase().includes('shirt')||alt.toLowerCase().includes('t-shirt') ? '👕'
    : alt.toLowerCase().includes('watch')||alt.toLowerCase().includes('smartwatch') ? '⌚'
    : alt.toLowerCase().includes('kindle')||alt.toLowerCase().includes('book') ? '📚'
    : alt.toLowerCase().includes('air fryer')||alt.toLowerCase().includes('cooker') ? '🍳'
    : '🛍️';
  if (err) return <div className="deal-img" style={{ width:size, height:size, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surface2)', fontSize:size*0.4, borderRadius:8 }}>{emoji}</div>;
  return <img src={src} alt={alt} className="deal-img" style={{ width:size, height:size }} onError={() => setErr(true)} loading="lazy" />;
}
function TimeAgo({ iso }: { iso: string }) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const l = s < 60 ? 'just now' : s < 3600 ? `${Math.floor(s/60)}m ago` : `${Math.floor(s/3600)}h ago`;
  return <span style={{ fontSize:11, color:'var(--text2)' }}>🕐 {l}</span>;
}
function StatusBadge({ status }: { status: Order['status'] }) {
  const map: Record<Order['status'], { color: string; bg: string }> = {
    Delivered:  { color:'#34d399', bg:'#34d39922' },
    Shipped:    { color:'#60a5fa', bg:'#60a5fa22' },
    Processing: { color:'#fbbf24', bg:'#fbbf2422' },
    Cancelled:  { color:'#f87171', bg:'#f8717122' },
  };
  const s = map[status];
  return <span style={{ background:s.bg, color:s.color, border:`1px solid ${s.color}44`, borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:700 }}>{status}</span>;
}

// ─── Live Refresh Bar ─────────────────────────────────────────────────────────
function LiveRefreshBar({ countdown, lastRefresh, onRefresh, updatedCount }: {
  countdown: number; lastRefresh: Date; onRefresh: () => void; updatedCount: number;
}) {
  const pct = ((30 - countdown) / 30) * 100;
  return (
    <div className="live-refresh-bar">
      <div className="live-dot" />
      <span className="live-label">LIVE</span>
      <div className="refresh-progress-track"><div className="refresh-progress-fill" style={{ width:`${pct}%` }} /></div>
      <span className="refresh-countdown">Next in {countdown}s</span>
      {updatedCount > 0 && <span className="price-update-badge">↕ {updatedCount} price{updatedCount!==1?'s':''} updated</span>}
      <span className="last-refresh-label">Last: {lastRefresh.toLocaleTimeString('en-IN')}</span>
      <button className="refresh-now-btn" onClick={onRefresh}>⟳ Refresh</button>
    </div>
  );
}

// ─── Bill Statement ───────────────────────────────────────────────────────────
function BillStatement({ order, onClose, user }: { order: Order; onClose: () => void; user: AuthUser | null }) {
  const gst = Math.round(order.total * 0.18);
  const subtotal = order.total - gst;
  const printBill = () => window.print();
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Bill Statement">
      <div className="modal-box bill-box" onClick={e => e.stopPropagation()} id="bill-print-area">
        <div className="bill-header">
          <div className="bill-logo">⚡ DealRadar</div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11, color:'var(--text2)' }}>Tax Invoice / Bill of Supply</div>
            <div style={{ fontSize:12, fontWeight:700, marginTop:2 }}># {order.txnId}</div>
          </div>
        </div>

        <div className="bill-divider" />

        <div className="bill-meta-row">
          <div>
            <div className="bill-meta-label">Billed To</div>
            <div className="bill-meta-val">{user?.name ?? 'Customer'}</div>
            <div style={{ fontSize:12, color:'var(--text2)' }}>{user?.email}</div>
            {user?.phone && <div style={{ fontSize:12, color:'var(--text2)' }}>{user.phone}</div>}
            {user?.address && <div style={{ fontSize:12, color:'var(--text2)', maxWidth:180 }}>{user.address}</div>}
          </div>
          <div style={{ textAlign:'right' }}>
            <div className="bill-meta-label">Date</div>
            <div className="bill-meta-val">{new Date(order.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</div>
            <div className="bill-meta-label" style={{ marginTop:8 }}>Payment</div>
            <div className="bill-meta-val">{order.paymentMethod}</div>
            <div style={{ marginTop:6 }}><StatusBadge status={order.status} /></div>
          </div>
        </div>

        <div className="bill-divider" />

        {/* Items table */}
        <table className="bill-table">
          <thead>
            <tr>
              <th style={{ textAlign:'left' }}>Item</th>
              <th>Platform</th>
              <th style={{ textAlign:'right' }}>MRP</th>
              <th style={{ textAlign:'right' }}>Discount</th>
              <th style={{ textAlign:'right' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <ProductImage src={item.image_url} alt={item.name} size={36} />
                    <span style={{ fontSize:13, fontWeight:500 }}>{item.name}</span>
                  </div>
                </td>
                <td style={{ textAlign:'center' }}><PlatformTag platform={item.platform} /></td>
                <td style={{ textAlign:'right', color:'var(--text2)', textDecoration:'line-through', fontSize:12 }}>₹{item.original_price.toLocaleString('en-IN')}</td>
                <td style={{ textAlign:'right', color:'var(--green)', fontSize:12 }}>-{item.discount_pct}%</td>
                <td style={{ textAlign:'right', fontWeight:700 }}>₹{item.price.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="bill-divider" />

        {/* Totals */}
        <div className="bill-totals">
          <div className="bill-total-row"><span>Subtotal (excl. GST)</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
          <div className="bill-total-row"><span>GST (18%)</span><span>₹{gst.toLocaleString('en-IN')}</span></div>
          <div className="bill-total-row savings"><span>🎉 Total Savings</span><span>-₹{order.savings.toLocaleString('en-IN')}</span></div>
          <div className="bill-divider" style={{ margin:'8px 0' }} />
          <div className="bill-total-row grand"><span>Grand Total</span><span>₹{order.total.toLocaleString('en-IN')}</span></div>
        </div>

        <div className="bill-divider" />
        <div className="bill-footer">
          <div>Thank you for shopping with DealRadar! 🛍️</div>
          <div style={{ fontSize:11, color:'var(--text2)', marginTop:4 }}>This is a computer-generated invoice. No signature required.</div>
          <div style={{ fontSize:11, color:'var(--text2)' }}>support@dealradar.in · www.dealradar.in</div>
        </div>

        <div className="bill-actions">
          <button className="btn-primary" onClick={printBill}>🖨️ Print / Save PDF</button>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Sign In Modal ────────────────────────────────────────────────────────────
function SignInModal({ onClose, onSignIn }: { onClose: () => void; onSignIn: (u: AuthUser) => void }) {
  const [tab, setTab] = useState<'signin'|'signup'>('signin');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [name, setName] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const DEMO = [
    { email:'demo@dealradar.in', password:'demo1234', name:'Demo User' },
    { email:'priya@example.com', password:'priya123', name:'Priya Sharma' },
  ];
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    setTimeout(() => {
      if (tab === 'signin') {
        const f = DEMO.find(u => u.email===email && u.password===password);
        f ? onSignIn({ name:f.name, email:f.email, avatar:f.name[0].toUpperCase() })
          : setError('Invalid credentials. Try demo@dealradar.in / demo1234');
      } else {
        if (!name.trim()) { setError('Enter your name'); setLoading(false); return; }
        if (!email.includes('@')) { setError('Enter a valid email'); setLoading(false); return; }
        if (password.length < 6) { setError('Password must be ≥ 6 chars'); setLoading(false); return; }
        onSignIn({ name, email, avatar:name[0].toUpperCase() });
      }
      setLoading(false);
    }, 900);
  };
  const google = () => { setLoading(true); setTimeout(() => onSignIn({ name:'Google User', email:'user@gmail.com', avatar:'G' }), 1200); };
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-logo">⚡ DealRadar</div>
        <div className="modal-tabs">
          <button className={`modal-tab ${tab==='signin'?'active':''}`} onClick={() => setTab('signin')}>Sign In</button>
          <button className={`modal-tab ${tab==='signup'?'active':''}`} onClick={() => setTab('signup')}>Create Account</button>
        </div>
        <form onSubmit={submit} className="auth-form">
          {tab==='signup' && <div className="form-group"><label htmlFor="an">Full Name</label><input id="an" type="text" placeholder="Priya Sharma" value={name} onChange={e=>setName(e.target.value)} required /></div>}
          <div className="form-group"><label htmlFor="ae">Email</label><input id="ae" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
          <div className="form-group"><label htmlFor="ap">Password</label><input id="ap" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button type="submit" className="btn-primary auth-submit" disabled={loading}>{loading ? <span className="spinner"/> : tab==='signin' ? '→ Sign In' : '→ Create Account'}</button>
        </form>
        <div className="auth-divider"><span>or</span></div>
        <button className="btn-google" onClick={google} disabled={loading} type="button">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continue with Google
        </button>
        {tab==='signin' && <div className="demo-hint"><span>🧪</span> demo@dealradar.in · demo1234</div>}
      </div>
    </div>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({ total, items, onClose, onSuccess }: {
  total: number; items: Deal[]; onClose: () => void;
  onSuccess: (order: Order) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [cardNumber, setCardNumber] = useState(''); const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState(''); const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState(''); const [wallet, setWallet] = useState('paytm');
  const [error, setError] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [showBill, setShowBill] = useState(false);

  const fmtCard = (v: string) => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const fmtExp  = (v: string) => { const d = v.replace(/\D/g,'').slice(0,4); return d.length>2 ? `${d.slice(0,2)}/${d.slice(2)}` : d; };

  const validate = () => {
    if (method==='card') {
      if (cardNumber.replace(/\s/g,'').length<16) return 'Enter a valid 16-digit card number';
      if (!cardName.trim()) return 'Enter cardholder name';
      if (expiry.length<5) return 'Enter valid expiry MM/YY';
      if (cvv.length<3) return 'Enter valid CVV';
    }
    if (method==='upi' && !upiId.includes('@')) return 'Enter a valid UPI ID (e.g. name@upi)';
    return '';
  };

  const pay = () => {
    const err = validate(); if (err) { setError(err); return; }
    setError(''); setStatus('processing');
    setTimeout(() => {
      if (Math.random() > 0.05) {
        const methodLabel = method==='card' ? `Card ••••${cardNumber.replace(/\s/g,'').slice(-4)||'1234'}`
          : method==='upi' ? `UPI ${upiId}` : `${wallet} Wallet`;
        const savings = items.reduce((s,i) => s + (i.original_price - i.current_price), 0);
        const order: Order = {
          id: `ORD-${Date.now()}`,
          txnId: `TXN${Math.random().toString(36).slice(2,10).toUpperCase()}`,
          date: new Date().toISOString(),
          items: items.map(i => ({ id:i.id, name:i.name, image_url:i.image_url, platform:i.platform, price:i.current_price, original_price:i.original_price, discount_pct:i.discount_pct })),
          total, savings, paymentMethod: methodLabel, status:'Processing',
        };
        setCompletedOrder(order);
        setStatus('success');
        onSuccess(order);
      } else {
        setStatus('failed');
      }
    }, 2000);
  };

  const methodLabels: Record<PaymentMethod, string> = { card:'💳 Card', upi:'📲 UPI', wallet:'👜 Wallet' };

  if (showBill && completedOrder) {
    return <BillStatement order={completedOrder} onClose={() => { setShowBill(false); onClose(); }} user={null} />;
  }

  return (
    <div className="modal-overlay" onClick={status==='idle'||status==='failed' ? onClose : undefined} role="dialog" aria-modal="true">
      <div className="modal-box payment-box" onClick={e => e.stopPropagation()}>

        {status==='processing' && (
          <div className="payment-processing">
            <div className="payment-spinner"/>
            <div style={{ fontWeight:700, fontSize:16, marginTop:16 }}>Processing Payment…</div>
            <div style={{ color:'var(--text2)', fontSize:13, marginTop:6 }}>Please do not close this window</div>
          </div>
        )}

        {status==='success' && completedOrder && (
          <div className="payment-result success">
            <div className="result-icon success-icon">✓</div>
            <div style={{ fontWeight:800, fontSize:20, marginTop:14 }}>Payment Successful!</div>
            <div style={{ color:'var(--text2)', fontSize:13, marginTop:6 }}>₹{total.toLocaleString('en-IN')} charged · {items.length} item{items.length!==1?'s':''}</div>
            <div style={{ color:'var(--text2)', fontSize:12, marginTop:4 }}>Txn ID: {completedOrder.txnId}</div>
            <div style={{ marginTop:20, display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
              <button className="btn-primary" onClick={() => setShowBill(true)}>🧾 View Bill Statement</button>
              <button className="btn-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        )}

        {status==='failed' && (
          <div className="payment-result failed">
            <div className="result-icon failed-icon">✕</div>
            <div style={{ fontWeight:800, fontSize:18, marginTop:12 }}>Payment Failed</div>
            <div style={{ color:'var(--text2)', fontSize:13, marginTop:6 }}>Your card was declined. Please try again.</div>
            <button className="btn-primary" style={{ marginTop:16 }} onClick={() => setStatus('idle')}>Try Again</button>
          </div>
        )}

        {status==='idle' && (
          <>
            <button className="modal-close" onClick={onClose}>✕</button>
            <div className="payment-header">
              <div style={{ fontWeight:800, fontSize:17 }}>Complete Payment</div>
              <div className="payment-total-pill">₹{total.toLocaleString('en-IN')} · {items.length} item{items.length!==1?'s':''}</div>
            </div>
            <div className="payment-method-tabs">
              {(Object.keys(methodLabels) as PaymentMethod[]).map(m => (
                <button key={m} className={`payment-method-tab ${method===m?'active':''}`} onClick={() => { setMethod(m); setError(''); }}>{methodLabels[m]}</button>
              ))}
            </div>
            {method==='card' && (
              <div className="payment-form">
                <div className="form-group"><label htmlFor="cn">Card Number</label><input id="cn" type="text" inputMode="numeric" placeholder="1234 5678 9012 3456" value={cardNumber} onChange={e=>setCardNumber(fmtCard(e.target.value))} maxLength={19} /></div>
                <div className="form-group"><label htmlFor="cna">Cardholder Name</label><input id="cna" type="text" placeholder="Priya Sharma" value={cardName} onChange={e=>setCardName(e.target.value)} /></div>
                <div style={{ display:'flex', gap:12 }}>
                  <div className="form-group" style={{ flex:1 }}><label htmlFor="ce">Expiry</label><input id="ce" type="text" inputMode="numeric" placeholder="MM/YY" value={expiry} onChange={e=>setExpiry(fmtExp(e.target.value))} maxLength={5} /></div>
                  <div className="form-group" style={{ flex:1 }}><label htmlFor="cv">CVV</label><input id="cv" type="password" inputMode="numeric" placeholder="•••" value={cvv} onChange={e=>setCvv(e.target.value.replace(/\D/g,'').slice(0,4))} maxLength={4} /></div>
                </div>
                <div className="card-demo-hint">🧪 Test: 4111 1111 1111 1111 · 12/26 · 123</div>
              </div>
            )}
            {method==='upi' && (
              <div className="payment-form">
                <div className="form-group"><label htmlFor="ui">UPI ID</label><input id="ui" type="text" placeholder="yourname@okicici" value={upiId} onChange={e=>setUpiId(e.target.value)} /></div>
                <div className="upi-apps">{['GPay','PhonePe','Paytm','BHIM'].map(a => <button key={a} className="upi-app-btn" type="button" onClick={() => setUpiId(`user@${a.toLowerCase()}`)}>{a}</button>)}</div>
                <div className="card-demo-hint">🧪 Test: demo@okicici</div>
              </div>
            )}
            {method==='wallet' && (
              <div className="payment-form">
                <div className="form-group">
                  <label>Select Wallet</label>
                  <div className="wallet-options">
                    {[{id:'paytm',label:'Paytm',bal:'₹2,340'},{id:'phonepe',label:'PhonePe',bal:'₹890'},{id:'amazon_pay',label:'Amazon Pay',bal:'₹5,120'},{id:'freecharge',label:'Freecharge',bal:'₹450'}].map(w => (
                      <label key={w.id} className={`wallet-option ${wallet===w.id?'active':''}`}>
                        <input type="radio" name="wallet" value={w.id} checked={wallet===w.id} onChange={() => setWallet(w.id)} />
                        <div><div style={{ fontWeight:600, fontSize:14 }}>{w.label}</div><div style={{ fontSize:12, color:'var(--text2)' }}>Balance: {w.bal}</div></div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {error && <div className="auth-error" role="alert">{error}</div>}
            <div className="payment-security-note">🔒 256-bit SSL encrypted · PCI DSS compliant</div>
            <button className="btn-primary pay-btn" onClick={pay}>Pay ₹{total.toLocaleString('en-IN')}</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Deal Card ────────────────────────────────────────────────────────────────
function DealCard({ deal, onAddCart, onAddWishlist, inCart, inWishlist, updated }: {
  deal: Deal; onAddCart: () => void; onAddWishlist: () => void;
  inCart: boolean; inWishlist: boolean; updated?: boolean;
}) {
  const pName = deal.platform.charAt(0) + deal.platform.slice(1).toLowerCase();
  return (
    <div className={`deal-card${updated?' price-updated':''}`}>
      {deal.fake_discount_flag && <div className="fake-badge">⚠️ Possible Fake Discount</div>}
      {deal.low_confidence_score && <div className="low-conf-badge">🔍 Low Confidence</div>}
      {updated && <div className="price-flash-indicator">↕ Updated</div>}
      <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
        <ProductImage src={deal.image_url} alt={deal.name} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', gap:8, marginBottom:6, flexWrap:'wrap', alignItems:'center' }}>
            <PlatformTag platform={deal.platform} />
            <span style={{ fontSize:11, color:'var(--text2)' }}>{deal.category}</span>
          </div>
          <div className="deal-name">{deal.name}</div>
          <div style={{ display:'flex', gap:10, alignItems:'center', margin:'8px 0', flexWrap:'wrap' }}>
            <span className="deal-price">₹{deal.current_price.toLocaleString('en-IN')}</span>
            <span className="deal-original">₹{deal.original_price.toLocaleString('en-IN')}</span>
            <span className="deal-discount">-{deal.discount_pct}%</span>
            <ValueBadge score={deal.value_score} />
          </div>
          <TimeAgo iso={deal.last_fetched_at} />
        </div>
      </div>
      <div className="deal-actions">
        <button className="btn-primary" onClick={() => window.open(buildProductUrl(deal.platform, deal.name, deal.url), '_blank')}>🛒 Buy on {pName}</button>
        <button className={`btn-secondary ${inCart?'active':''}`} onClick={onAddCart}>{inCart?'✓ In Cart':'+ Cart'}</button>
        <button className={`btn-secondary ${inWishlist?'active':''}`} onClick={onAddWishlist}>{inWishlist?'♥ Saved':'♡ Wish'}</button>
      </div>
    </div>
  );
}

// ─── Views ────────────────────────────────────────────────────────────────────
function HomeView({ deals, cart, wishlist, onAddCart, onAddWishlist, updatedIds, lastRefresh, countdown, onRefresh }: {
  deals: Deal[]; cart: string[]; wishlist: string[];
  onAddCart: (id: string) => void; onAddWishlist: (id: string) => void;
  updatedIds: Set<string>; lastRefresh: Date; countdown: number; onRefresh: () => void;
}) {
  const [filter, setFilter] = useState('ALL');
  const [catFilter, setCatFilter] = useState('ALL');
  const platforms = ['ALL','AMAZON','FLIPKART','MYNTRA'];
  const categories = ['ALL', ...Array.from(new Set(deals.map(d => d.category))).sort()];
  const filtered = deals
    .filter(d => filter==='ALL' || d.platform===filter)
    .filter(d => catFilter==='ALL' || d.category===catFilter);
  return (
    <div>
      {/* Hero banner */}
      <div className="home-hero">
        <div className="home-hero-title">Find the <span>Best Deals</span><br/>Across Every Platform</div>
        <div className="home-hero-sub">Real-time prices from Amazon, Flipkart, Myntra & more — with AI-powered fake discount detection.</div>
        <div className="home-hero-stats">
          <div className="hero-stat"><div className="hero-stat-val">20+</div><div className="hero-stat-label">Products</div></div>
          <div className="hero-stat"><div className="hero-stat-val">3</div><div className="hero-stat-label">Platforms</div></div>
          <div className="hero-stat"><div className="hero-stat-val">Live</div><div className="hero-stat-label">Prices</div></div>
          <div className="hero-stat"><div className="hero-stat-val">₹0</div><div className="hero-stat-label">Free to Use</div></div>
        </div>
      </div>

      <LiveRefreshBar countdown={countdown} lastRefresh={lastRefresh} onRefresh={onRefresh} updatedCount={Array.from(updatedIds).length} />
      <div className="section-header" style={{ marginTop:18 }}>
        <h2>🔥 Top Deals Today <span style={{ fontSize:13, color:'var(--text2)', fontWeight:400 }}>({filtered.length} products)</span></h2>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {platforms.map(p => <button key={p} className={`filter-btn ${filter===p?'active':''}`} onClick={() => setFilter(p)}>{p}</button>)}
        </div>
      </div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
        {categories.map(c => <button key={c} className={`filter-btn ${catFilter===c?'active':''}`} onClick={() => setCatFilter(c)} style={{ fontSize:11 }}>{c}</button>)}
      </div>
      <div className="deals-grid">
        {filtered.map(d => <DealCard key={d.id} deal={d} onAddCart={() => onAddCart(d.id)} onAddWishlist={() => onAddWishlist(d.id)} inCart={cart.includes(d.id)} inWishlist={wishlist.includes(d.id)} updated={updatedIds.has(d.id)} />)}
      </div>
    </div>
  );
}

function SearchView({ deals, cart, wishlist, onAddCart, onAddWishlist, updatedIds }: {
  deals: Deal[]; cart: string[]; wishlist: string[];
  onAddCart: (id: string) => void; onAddWishlist: (id: string) => void; updatedIds: Set<string>;
}) {
  const [q, setQ] = useState(''); const [sort, setSort] = useState('discount_pct'); const [platform, setPlatform] = useState('ALL');
  const results = deals
    .filter(d => platform==='ALL' || d.platform===platform)
    .filter(d => !q || d.name.toLowerCase().includes(q.toLowerCase()) || d.brand.toLowerCase().includes(q.toLowerCase()) || d.category.toLowerCase().includes(q.toLowerCase()))
    .sort((a,b) => sort==='discount_pct' ? b.discount_pct-a.discount_pct : sort==='value_score' ? (b.value_score??0)-(a.value_score??0) : sort==='price_asc' ? a.current_price-b.current_price : b.current_price-a.current_price);
  return (
    <div>
      <div className="section-header"><h2>🔎 Search Deals</h2></div>
      <div className="search-bar-row">
        <div className="search-input-wrap">
          <span className="search-icon">🔎</span>
          <input style={{ fontSize:15 }} placeholder="Search product, brand, or category…" value={q} onChange={e=>setQ(e.target.value)} autoFocus />
        </div>
        <select value={platform} onChange={e=>setPlatform(e.target.value)}>
          <option value="ALL">All Platforms</option>
          <option value="AMAZON">Amazon</option>
          <option value="FLIPKART">Flipkart</option>
          <option value="MYNTRA">Myntra</option>
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="discount_pct">Discount %</option>
          <option value="value_score">Value Score</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
        </select>
      </div>
      {results.length===0 ? (
        <div className="empty-state"><div style={{ fontSize:40 }}>🔍</div><div>No results{q?` for "${q}"`:''}. Try "Nike", "Sony", "Apple"…</div></div>
      ) : (
        <div className="deals-grid">{results.map(d => <DealCard key={d.id} deal={d} onAddCart={() => onAddCart(d.id)} onAddWishlist={() => onAddWishlist(d.id)} inCart={cart.includes(d.id)} inWishlist={wishlist.includes(d.id)} updated={updatedIds.has(d.id)} />)}</div>
      )}
    </div>
  );
}

function CartView({ deals, cart, onRemove, onCheckout }: {
  deals: Deal[]; cart: string[]; onRemove: (id: string) => void; onCheckout: () => void;
}) {
  const items = deals.filter(d => cart.includes(d.id));
  if (items.length===0) return (
    <div>
      <div className="section-header"><h2>🛒 Your Cart</h2></div>
      <div className="empty-state"><div style={{ fontSize:40 }}>🛒</div><div>Cart is empty</div><div style={{ color:'var(--text2)', fontSize:13 }}>Browse deals and tap "+ Cart"</div></div>
    </div>
  );
  const grandTotal = items.reduce((s,i) => s+i.current_price, 0);
  const savings = items.reduce((s,i) => s+(i.original_price-i.current_price), 0);
  const byPlatform = items.reduce<Record<string,Deal[]>>((acc,d) => { (acc[d.platform]??=[]).push(d); return acc; }, {});
  return (
    <div>
      <div className="section-header">
        <h2>🛒 Cart ({items.length})</h2>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:13, color:'var(--text2)' }}>You save</div>
          <div style={{ fontWeight:800, color:'var(--green)', fontSize:18 }}>₹{savings.toLocaleString('en-IN')}</div>
          <div style={{ fontSize:12, color:'var(--text2)' }}>Total: ₹{grandTotal.toLocaleString('en-IN')}</div>
        </div>
      </div>
      <div className="checkout-cta-bar">
        <div><span style={{ fontWeight:700, fontSize:16 }}>₹{grandTotal.toLocaleString('en-IN')}</span><span style={{ color:'var(--text2)', fontSize:13, marginLeft:8 }}>for {items.length} item{items.length!==1?'s':''}</span></div>
        <button className="btn-primary checkout-btn" onClick={onCheckout}>💳 Proceed to Pay</button>
      </div>
      {Object.entries(byPlatform).map(([platform, pItems]) => (
        <div key={platform} className="cart-group">
          <div className="cart-group-header">
            <PlatformTag platform={platform} />
            <span style={{ color:'var(--text2)', fontSize:13 }}>Subtotal:</span>
            <span style={{ fontWeight:700, color:'var(--green)' }}>₹{pItems.reduce((s,i)=>s+i.current_price,0).toLocaleString('en-IN')}</span>
            <button className="btn-primary" style={{ marginLeft:'auto', padding:'6px 14px' }} onClick={() => window.open(buildProductUrl(platform, pItems[0].name, pItems[0].url), '_blank')}>Buy on {platform.charAt(0)+platform.slice(1).toLowerCase()} →</button>
          </div>
          {pItems.map(item => (
            <div key={item.id} className="cart-item">
              <ProductImage src={item.image_url} alt={item.name} size={52} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{item.name}</div>
                <div style={{ color:'var(--text2)', fontSize:13, display:'flex', gap:10 }}>
                  <span>₹{item.current_price.toLocaleString('en-IN')}</span>
                  <span style={{ color:'var(--green)' }}>-{item.discount_pct}%</span>
                  <span style={{ textDecoration:'line-through' }}>₹{item.original_price.toLocaleString('en-IN')}</span>
                </div>
                <TimeAgo iso={item.last_fetched_at} />
              </div>
              <button className="btn-remove" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name}`}>✕</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function WishlistView({ deals, wishlist, onRemove }: { deals: Deal[]; wishlist: string[]; onRemove: (id: string) => void }) {
  const items = deals.filter(d => wishlist.includes(d.id));
  if (items.length===0) return (
    <div>
      <div className="section-header"><h2>♥ Wishlist</h2></div>
      <div className="empty-state"><div style={{ fontSize:40 }}>♡</div><div>Wishlist is empty</div><div style={{ color:'var(--text2)', fontSize:13 }}>Save deals to track price drops</div></div>
    </div>
  );
  return (
    <div>
      <div className="section-header"><h2>♥ Wishlist ({items.length})</h2></div>
      <div className="deals-grid">
        {items.map(item => (
          <div key={item.id} className="deal-card" style={{ position:'relative' }}>
            <button className="btn-remove wishlist-remove" onClick={() => onRemove(item.id)}>✕</button>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
              <ProductImage src={item.image_url} alt={item.name} />
              <div style={{ flex:1, minWidth:0 }}>
                <PlatformTag platform={item.platform} />
                <div className="deal-name" style={{ marginTop:6 }}>{item.name}</div>
                <div style={{ display:'flex', gap:10, alignItems:'center', marginTop:6, flexWrap:'wrap' }}>
                  <span className="deal-price">₹{item.current_price.toLocaleString('en-IN')}</span>
                  <span className="deal-original">₹{item.original_price.toLocaleString('en-IN')}</span>
                  <span className="deal-discount">-{item.discount_pct}%</span>
                  <ValueBadge score={item.value_score} />
                </div>
                <div style={{ marginTop:6 }}><TimeAgo iso={item.last_fetched_at} /></div>
                <div style={{ fontSize:12, color:'#34d399', marginTop:4 }}>📉 Price drop alerts active</div>
              </div>
            </div>
            <div className="deal-actions" style={{ marginTop:12 }}>
              <button className="btn-primary" onClick={() => window.open(buildProductUrl(item.platform, item.name, item.url), '_blank')}>🛒 Buy on {item.platform.charAt(0)+item.platform.slice(1).toLowerCase()}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Orders View ──────────────────────────────────────────────────────────────
function OrdersView({ orders, onViewBill, user }: { orders: Order[]; onViewBill: (o: Order) => void; user: AuthUser | null }) {
  if (orders.length===0) return (
    <div>
      <div className="section-header"><h2>📦 My Orders</h2></div>
      <div className="empty-state">
        <div style={{ fontSize:48 }}>📦</div>
        <div>No orders yet</div>
        <div style={{ color:'var(--text2)', fontSize:13 }}>Your completed purchases will appear here</div>
      </div>
    </div>
  );
  return (
    <div>
      <div className="section-header">
        <h2>📦 My Orders <span style={{ fontSize:13, color:'var(--text2)', fontWeight:400 }}>({orders.length})</span></h2>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {[...orders].reverse().map(order => (
          <div key={order.id} className="order-card">
            <div className="order-card-header">
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>{order.id}</div>
                <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>
                  {new Date(order.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                <StatusBadge status={order.status} />
                <span style={{ fontWeight:800, fontSize:16 }}>₹{order.total.toLocaleString('en-IN')}</span>
                <button className="btn-secondary" style={{ padding:'5px 14px', fontSize:12 }} onClick={() => onViewBill(order)}>🧾 Bill</button>
              </div>
            </div>
            <div className="order-items-row">
              {order.items.map((item, i) => (
                <div key={i} className="order-item-chip">
                  <ProductImage src={item.image_url} alt={item.name} size={40} />
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize:11, color:'var(--text2)' }}>₹{item.price.toLocaleString('en-IN')} · <span style={{ color:'var(--green)' }}>-{item.discount_pct}%</span></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="order-card-footer">
              <span style={{ fontSize:12, color:'var(--text2)' }}>via {order.paymentMethod}</span>
              <span style={{ fontSize:12, color:'var(--green)' }}>🎉 Saved ₹{order.savings.toLocaleString('en-IN')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Profile View ─────────────────────────────────────────────────────────────
function ProfileView({ user, orders, onSignOut, onUpdate }: {
  user: AuthUser | null; orders: Order[]; onSignOut: () => void; onUpdate: (u: AuthUser) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [saved, setSaved] = useState(false);

  const totalSpent = orders.reduce((s,o) => s+o.total, 0);
  const totalSaved = orders.reduce((s,o) => s+o.savings, 0);

  const save = () => {
    if (!user) return;
    onUpdate({ ...user, name, email, phone, address });
    setSaved(true); setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) return (
    <div>
      <div className="section-header"><h2>👤 Profile</h2></div>
      <div className="empty-state"><div style={{ fontSize:48 }}>👤</div><div>Not signed in</div><div style={{ color:'var(--text2)', fontSize:13 }}>Sign in to view your profile</div></div>
    </div>
  );

  return (
    <div>
      <div className="section-header"><h2>👤 My Profile</h2></div>

      {/* Avatar + stats */}
      <div className="profile-hero">
        <div className="profile-avatar-lg">{user.avatar}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:20 }}>{user.name}</div>
          <div style={{ color:'var(--text2)', fontSize:14, marginTop:2 }}>{user.email}</div>
          {user.phone && <div style={{ color:'var(--text2)', fontSize:13, marginTop:2 }}>📞 {user.phone}</div>}
          {user.address && <div style={{ color:'var(--text2)', fontSize:13, marginTop:2 }}>📍 {user.address}</div>}
        </div>
        <button className="btn-secondary" style={{ alignSelf:'flex-start' }} onClick={() => setEditing(e=>!e)}>
          {editing ? '✕ Cancel' : '✏️ Edit'}
        </button>
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="profile-stat"><div className="profile-stat-val">{orders.length}</div><div className="profile-stat-label">Orders</div></div>
        <div className="profile-stat"><div className="profile-stat-val">₹{Math.round(totalSpent/1000)}k</div><div className="profile-stat-label">Total Spent</div></div>
        <div className="profile-stat" style={{ color:'var(--green)' }}><div className="profile-stat-val">₹{Math.round(totalSaved/1000)}k</div><div className="profile-stat-label">Total Saved</div></div>
        <div className="profile-stat"><div className="profile-stat-val">{orders.length > 5 ? '🥇' : orders.length > 2 ? '🥈' : '🥉'}</div><div className="profile-stat-label">Member Tier</div></div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="profile-edit-card">
          <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Edit Profile</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div className="form-group"><label htmlFor="pn">Full Name</label><input id="pn" value={name} onChange={e=>setName(e.target.value)} /></div>
            <div className="form-group"><label htmlFor="pe">Email</label><input id="pe" type="email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
            <div className="form-group"><label htmlFor="pp">Phone</label><input id="pp" type="tel" placeholder="+91 98765 43210" value={phone} onChange={e=>setPhone(e.target.value)} /></div>
            <div className="form-group"><label htmlFor="pa">Address</label><input id="pa" placeholder="City, State" value={address} onChange={e=>setAddress(e.target.value)} /></div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <button className="btn-primary" onClick={save}>💾 Save Changes</button>
            <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
          {saved && <div style={{ color:'var(--green)', fontSize:13, marginTop:8 }}>✓ Profile updated!</div>}
        </div>
      )}

      {/* Recent orders preview */}
      {orders.length > 0 && (
        <div style={{ marginTop:24 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>Recent Orders</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[...orders].reverse().slice(0,3).map(o => (
              <div key={o.id} className="profile-order-row">
                <div>
                  <div style={{ fontWeight:600, fontSize:13 }}>{o.id}</div>
                  <div style={{ fontSize:12, color:'var(--text2)' }}>{o.items.length} item{o.items.length!==1?'s':''} · {new Date(o.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <StatusBadge status={o.status} />
                  <span style={{ fontWeight:700 }}>₹{o.total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign out */}
      <div style={{ marginTop:28 }}>
        <button className="btn-signout" onClick={onSignOut}>🚪 Sign Out</button>
      </div>
    </div>
  );
}

function FeedView() {
  const [feedDeals, setFeedDeals] = useState(() => loadLS('dealradar_feed', [
    { id:'f1', user:'ravi_k', deal:'Bose QC45 at ₹21,990 (↓25%)', upvotes:42, downvotes:8, score:78, platform:'AMAZON', time:'2h ago', hidden:false },
    { id:'f2', user:'priya_s', deal:'Instant Pot Duo at ₹6,499 (↓35%)', upvotes:31, downvotes:5, score:85, platform:'FLIPKART', time:'4h ago', hidden:false },
    { id:'f3', user:'ananya_m', deal:'OnePlus Buds Pro 2 at ₹8,499 (↓29%)', upvotes:19, downvotes:4, score:72, platform:'AMAZON', time:'5h ago', hidden:false },
    { id:'f4', user:'vikram_d', deal:'Philips Air Fryer at ₹9,999', upvotes:2, downvotes:9, score:38, platform:'FLIPKART', time:'6h ago', hidden:false },
  ]));
  const [url, setUrl] = useState('');
  useEffect(() => { saveLS('dealradar_feed', feedDeals); }, [feedDeals]);
  const vote = (id: string, dir: 'up'|'down') => setFeedDeals(prev => prev.map(d => {
    if (d.id!==id) return d;
    const up = dir==='up' ? d.upvotes+1 : d.upvotes; const dn = dir==='down' ? d.downvotes+1 : d.downvotes;
    return { ...d, upvotes:up, downvotes:dn, hidden: (up+dn)>=10 && up/(up+dn)<0.2 };
  }));
  const submit = () => {
    if (!url.trim()) return;
    const p = url.includes('amazon')?'AMAZON':url.includes('flipkart')?'FLIPKART':url.includes('myntra')?'MYNTRA':'AMAZON';
    setFeedDeals(prev => [{ id:`f${Date.now()}`, user:'you', deal:`New deal: ${url}`, upvotes:0, downvotes:0, score:50, platform:p, time:'just now', hidden:false }, ...prev]);
    setUrl('');
  };
  const visible = feedDeals.filter(d => !d.hidden);
  return (
    <div>
      <div className="section-header"><h2>🌐 Community Feed</h2></div>
      <div className="feed-submit">
        <input style={{ flex:1 }} placeholder="Paste a deal URL…" value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} />
        <button className="btn-primary" onClick={submit}>Submit</button>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {visible.map(d => (
          <div key={d.id} className="feed-item">
            <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
              <div className="feed-avatar">{d.user[0].toUpperCase()}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{d.deal}</div>
                <div style={{ color:'var(--text2)', fontSize:12, display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', marginTop:3 }}>
                  <span>@{d.user}</span>·<PlatformTag platform={d.platform}/>·<span>{d.time}</span>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <ValueBadge score={d.score}/>
                <div style={{ display:'flex', gap:6 }}>
                  <button className="vote-btn up" onClick={()=>vote(d.id,'up')}>▲ {d.upvotes}</button>
                  <button className="vote-btn down" onClick={()=>vote(d.id,'down')}>▼ {d.downvotes}</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {visible.length===0 && <div className="empty-state"><div style={{ fontSize:36 }}>🗳️</div><div>All deals hidden due to low votes</div></div>}
      </div>
    </div>
  );
}

function ApiStatus() {
  const [s, setS] = useState<'checking'|'ok'|'offline'>('checking');
  useEffect(() => { fetch('/api/health').then(r=>r.ok?setS('ok'):setS('offline')).catch(()=>setS('offline')); }, []);
  const c = s==='ok'?'var(--green)':s==='offline'?'var(--text3)':'var(--yellow)';
  const dot = s==='ok'?'🟢':s==='offline'?'⚫':'🟡';
  return <span style={{ fontSize:11, color:c, fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>{dot} {s==='ok'?'API Live':s==='offline'?'API Offline':'Connecting…'}</span>;
}

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<View>(() => loadLS('dealradar_view','home') as View);
  const [cart, setCart] = useState<string[]>(() => loadLS('dealradar_cart',[]));
  const [wishlist, setWishlist] = useState<string[]>(() => loadLS('dealradar_wishlist',[]));
  const [deals, setDeals] = useState<Deal[]>(() => simulatePriceUpdate(BASE_DEALS));
  const [updatedIds, setUpdatedIds] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [countdown, setCountdown] = useState(30);
  const prevPrices = useRef<Record<string,number>>({});
  const [user, setUser] = useState<AuthUser|null>(() => loadLS('dealradar_user',null));
  const [showSignIn, setShowSignIn] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [orders, setOrders] = useState<Order[]>(() => loadLS('dealradar_orders',[]));
  const [billOrder, setBillOrder] = useState<Order|null>(null);

  useEffect(() => { saveLS('dealradar_cart',cart); }, [cart]);
  useEffect(() => { saveLS('dealradar_wishlist',wishlist); }, [wishlist]);
  useEffect(() => { saveLS('dealradar_view',view); }, [view]);
  useEffect(() => { saveLS('dealradar_user',user); }, [user]);
  useEffect(() => { saveLS('dealradar_orders',orders); }, [orders]);

  const refresh = useCallback(() => {
    const updated = simulatePriceUpdate(BASE_DEALS);
    const changed = new Set<string>();
    updated.forEach(d => { if (prevPrices.current[d.id]!==undefined && prevPrices.current[d.id]!==d.current_price) changed.add(d.id); prevPrices.current[d.id]=d.current_price; });
    setDeals(updated); setUpdatedIds(changed); setLastRefresh(new Date()); setCountdown(30);
    setTimeout(() => setUpdatedIds(new Set()), 3000);
  }, []);

  useEffect(() => {
    BASE_DEALS.forEach(d => { prevPrices.current[d.id]=d.current_price; });
    const iv = setInterval(refresh, 30_000); return () => clearInterval(iv);
  }, [refresh]);
  useEffect(() => { const t = setInterval(() => setCountdown(c => c<=1?30:c-1), 1000); return () => clearInterval(t); }, []);

  const addCart = (id: string) => setCart(c => c.includes(id)?c.filter(x=>x!==id):[...c,id]);
  const addWishlist = (id: string) => setWishlist(w => w.includes(id)?w.filter(x=>x!==id):[...w,id]);
  const cartItems = deals.filter(d => cart.includes(d.id));
  const cartTotal = cartItems.reduce((s,i) => s+i.current_price, 0);

  type NavItem = { id:View; label:string; icon:string; badge?:number };
  const navItems: NavItem[] = [
    { id:'home',     label:'Deals',    icon:'🏷️' },
    { id:'search',   label:'Search',   icon:'🔎' },
    { id:'cart',     label:'Cart',     icon:'🛒',  badge: cart.length||undefined },
    { id:'wishlist', label:'Wishlist', icon:'♥',   badge: wishlist.length||undefined },
    { id:'orders',   label:'Orders',   icon:'📦',  badge: orders.length||undefined },
    { id:'feed',     label:'Feed',     icon:'🌐' },
    { id:'profile',  label:'Profile',  icon:'👤' },
  ];

  const pageTitle = navItems.find(n=>n.id===view)?.label ?? '';

  return (
    <div className="app">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">⚡</div>
          <div>
            <div className="logo-text">DealRadar</div>
            <div className="logo-sub">Smart Deals · Live Prices</div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-section-label">Navigation</div>
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${view===item.id?'active':''}`} onClick={() => setView(item.id)}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <ApiStatus />
          {user && (
            <div className="sidebar-user" onClick={() => setView('profile')} style={{ cursor:'pointer' }}>
              <div className="user-avatar-sm">{user.avatar}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</div>
                <div style={{ fontSize:10, color:'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main">
        <div className="topbar">
          <h1 className="page-title">
            <span style={{ fontSize:22 }}>{navItems.find(n=>n.id===view)?.icon}</span>
            {pageTitle}
          </h1>
          <div className="topbar-right">
            <span style={{ fontSize:12, color:'var(--text3)' }}>
              {new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}
            </span>
            {user ? (
              <div className="user-menu">
                <div className="user-avatar" onClick={() => setView('profile')} title="My Profile">{user.avatar}</div>
                <span style={{ fontSize:13, fontWeight:600 }}>{user.name.split(' ')[0]}</span>
                <button className="btn-secondary" style={{ padding:'6px 14px', fontSize:12 }}
                  onClick={() => { setUser(null); setView('home'); }}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button className="btn-primary" style={{ padding:'8px 20px', fontSize:13 }} onClick={() => setShowSignIn(true)}>
                Sign In
              </button>
            )}
          </div>
        </div>

        <div className="content">
          {view==='home'     && <HomeView deals={deals} cart={cart} wishlist={wishlist} onAddCart={addCart} onAddWishlist={addWishlist} updatedIds={updatedIds} lastRefresh={lastRefresh} countdown={countdown} onRefresh={refresh} />}
          {view==='search'   && <SearchView deals={deals} cart={cart} wishlist={wishlist} onAddCart={addCart} onAddWishlist={addWishlist} updatedIds={updatedIds} />}
          {view==='cart'     && <CartView deals={deals} cart={cart} onRemove={id=>setCart(c=>c.filter(x=>x!==id))} onCheckout={() => { if (!user) setShowSignIn(true); else setShowPayment(true); }} />}
          {view==='wishlist' && <WishlistView deals={deals} wishlist={wishlist} onRemove={id=>setWishlist(w=>w.filter(x=>x!==id))} />}
          {view==='orders'   && <OrdersView orders={orders} onViewBill={o=>setBillOrder(o)} user={user} />}
          {view==='feed'     && <FeedView />}
          {view==='profile'  && <ProfileView user={user} orders={orders} onSignOut={() => { setUser(null); setView('home'); }} onUpdate={u => setUser(u)} />}
        </div>
      </main>

      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} onSignIn={u => { setUser(u); setShowSignIn(false); }} />}
      {showPayment && (
        <PaymentModal total={cartTotal} items={cartItems}
          onClose={() => setShowPayment(false)}
          onSuccess={order => { setOrders(prev => [...prev, order]); setCart([]); setShowPayment(false); }}
        />
      )}
      {billOrder && <BillStatement order={billOrder} onClose={() => setBillOrder(null)} user={user} />}
    </div>
  );
}
