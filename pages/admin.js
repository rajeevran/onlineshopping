import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { jwtDecode } from "jwt-decode";
import api from "../lib/axiosInstance";

const sections = [
  { id: "overview", label: "Overview", icon: "⌂" },
  { id: "products", label: "Products", icon: "◈" },
  { id: "homeproducts", label: "Home Products", icon: "▣" },
  { id: "festiveWave", label: "Festive Wave", icon: "✦" },
  { id: "exploreCollection", label: "Explore Collection", icon: "◇" },
  { id: "recommendedProduct", label: "Recommended", icon: "♥" },
  { id: "recentlyViewed", label: "Recently Viewed", icon: "◷" },
  { id: "customerReview", label: "Customer Reviews", icon: "★" },
  { id: "users", label: "Users", icon: "♙" },
  { id: "orders", label: "Orders", icon: "▤" },
];

const endpoints = {
  homeproducts: "/homeproducts",
  festiveWave: "/festiveWave",
  recommendedProduct: "/recommendedProduct",
  recentlyViewed: "/recentlyViewed",
  customerReview: "/customerReview",
  exploreCollection: "/exploreCollection",
};

const labels = {
  homeproducts: "Home Products",
  festiveWave: "Festive Wave",
  exploreCollection: "Explore Collection",
  recommendedProduct: "Recommended Products",
  recentlyViewed: "Recently Viewed",
  customerReview: "Customer Reviews",
};

function getArray(data) {
  return Array.isArray(data) ? data : [];
}

export default function AdminPage() {
  const router = useRouter();
  const [active, setActive] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState({});
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const logout = () => {
    localStorage.removeItem("adminToken");
    router.replace("/admin-login");
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return router.replace("/admin-login");
    try {
      const decoded = jwtDecode(token);
      if (decoded.role !== "admin") {
        localStorage.removeItem("adminToken");
        return router.replace("/admin-login");
      }
      setLoading(false);
      loadAll();
    } catch {
      localStorage.removeItem("adminToken");
      router.replace("/admin-login");
    }
  }, []);

  const loadAll = async () => {
    setDataLoading(true);
    try {
      const requests = await Promise.allSettled([
        api.get("/products"),
        api.get("/users"),
        api.get("/order"),
        ...Object.values(endpoints).map((url) => api.get(url)),
      ]);
      const [p, u, o, ...rest] = requests;
      if (p.status === "fulfilled") setProducts(getArray(p.value.data));
      if (u.status === "fulfilled") setUsers(getArray(u.value.data));
      if (o.status === "fulfilled") setOrders(getArray(o.value.data));
      const next = {};
      Object.keys(endpoints).forEach((key, i) => {
        if (rest[i]?.status === "fulfilled") next[key] = getArray(rest[i].value.data);
      });
      setCollections(next);
    } catch (e) {
      setMessage("Some dashboard data could not be loaded.");
    } finally {
      setDataLoading(false);
    }
  };

  const openCreateProduct = () => {
    setForm({ name: "", price: "", discountPrice: "", category: "", description: "", tags: "", care: "", images: "", inStock: true, featured: false });
    setModal({ type: "product", mode: "create" });
  };

  const openCreate = (type) => {
    if (type === "product") return openCreateProduct();
    if (type === "customerReview") {
      setForm({ title: "", productId: "", userId: "", comment: "", rating: 5, active: true });
    } else {
      setForm({ title: "", productId: "", userId: "", active: true });
    }
    setModal({ type, mode: "create" });
  };

  const openEdit = (type, item) => {
    const product = item?.productId && !Array.isArray(item.productId) ? item.productId : null;
    if (type === "product") {
      setForm({
        ...item,
        tags: (item.tags || []).join(", "),
        care: (item.care || []).join(", "),
        images: (item.images || []).join(", "),
      });
    } else if (type === "customerReview") {
      setForm({ ...item, productId: item.productId?._id || item.productId || "", userId: item.userId?._id || item.userId || "" });
    } else {
      setForm({ ...item, productId: Array.isArray(item.productId) ? item.productId.map(x => x?._id || x).join(",") : item.productId?._id || item.productId || "" });
    }
    setModal({ type, mode: "edit", item });
  };

  const closeModal = () => { setModal(null); setForm({}); };

  const saveItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.type === "product") {
        if (modal.mode === "create") {
          const fd = new FormData();
          Object.entries(form).forEach(([key, value]) => {
            if (key !== "images") fd.append(key, Array.isArray(value) ? value.join(",") : value ?? "");
          });
          const files = e.target.images.files;
          Array.from(files || []).forEach((file) => fd.append("images", file));
          await api.post("/products", fd, { headers: { "Content-Type": "multipart/form-data" } });
        } else {
          const payload = { ...form };
          payload.tags = String(form.tags || "").split(",").map(x => x.trim()).filter(Boolean);
          payload.care = String(form.care || "").split(",").map(x => x.trim()).filter(Boolean);
          payload.images = String(form.images || "").split(",").map(x => x.trim()).filter(Boolean);
          delete payload._id; delete payload.createdAt; delete payload.__v;
          await api.put(`/products/${modal.item._id}`, payload);
        }
      } else if (modal.type === "users") {
        const payload = { ...form };
        delete payload._id; delete payload.createdAt; delete payload.__v;
        if (modal.mode === "create") await api.post("/users", payload);
        else await api.put(`/users/${modal.item._id}`, payload);
      } else {
        const base = endpoints[modal.type];
        const payload = { ...form };
        delete payload._id; delete payload.autoId; delete payload.createdAt; delete payload.__v;
        if (["recommendedProduct", "recentlyViewed", "exploreCollection"].includes(modal.type)) {
          payload.productId = String(form.productId || "").split(",").map(x => x.trim()).filter(Boolean);
        }
        if (modal.mode === "create") await api.post(base, payload);
        else await api.put(`${base}/${modal.item._id}`, payload);
      }
      setMessage(`${labels[modal.type] || "Product"} saved successfully.`);
      closeModal();
      loadAll();
    } catch (err) {
      setMessage(err.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (type, id, label) => {
    if (!window.confirm(`Delete this ${label || "item"}? This cannot be undone.`)) return;
    try {
      const url = type === "product" ? `/products/${id}` : `${endpoints[type]}/${id}`;
      await api.delete(url);
      setMessage(`${label || "Item"} deleted.`);
      loadAll();
    } catch (err) {
      setMessage(err.response?.data?.message || "Delete failed.");
    }
  };

  const updateOrder = async (id, status) => {
    try {
      await api.put("/order", { _id: id, orderStatus: status });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, orderStatus: status } : o));
      setMessage("Order status updated.");
    } catch { setMessage("Unable to update order."); }
  };

  const updateUser = async (user) => {
    setForm({ ...user, passwordHash: "" });
    setModal({ type: "users", mode: "edit", item: user });
  };


  const filteredProducts = useMemo(() => products.filter(p =>
    `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase())
  ), [products, search]);

  const filteredUsers = useMemo(() => users.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email} ${u.phone}`.toLowerCase().includes(search.toLowerCase())
  ), [users, search]);

  const filteredOrders = useMemo(() => orders.filter(o =>
    `${o.orderId} ${o._id} ${o.orderStatus}`.toLowerCase().includes(search.toLowerCase())
  ), [orders, search]);

  if (loading) return <div className="admin-loading">Checking admin access...</div>;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-logo">NOADUA<span>ADMIN</span></div>
        <nav>
          {sections.map(s => (
            <button key={s.id} className={active === s.id ? "active" : ""} onClick={() => { setActive(s.id); setSearch(""); }}>
              <span>{s.icon}</span>{s.label}
            </button>
          ))}
        </nav>
        <button className="admin-store-link" onClick={() => router.push("/")}>↗ View Store</button>
        <button className="admin-logout" onClick={logout}>⇥ Sign out</button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-eyebrow">STORE MANAGEMENT</span>
            <h1>{sections.find(s => s.id === active)?.label}</h1>
          </div>
          <div className="admin-top-actions">
            <button onClick={loadAll} title="Refresh">↻</button>
            <div className="admin-avatar">A</div>
          </div>
        </header>

        {message && <div className="admin-alert success">{message}<button onClick={() => setMessage("")}>×</button></div>}

        {active === "overview" && (
          <Overview products={products} users={users} orders={orders} reviews={collections.customerReview || []}
            onNavigate={setActive} collections={collections} />
        )}

        {active === "products" && (
          <section className="admin-panel">
            <PanelHeader title="Products" count={products.length} search={search} setSearch={setSearch} action="Add Product" onAction={openCreateProduct} />
            <ProductTable products={filteredProducts} onEdit={(p) => openEdit("product", p)} onDelete={(p) => deleteItem("product", p._id, "product")} />
          </section>
        )}

        {["homeproducts","festiveWave","exploreCollection","recommendedProduct","recentlyViewed","customerReview"].includes(active) && (
          <section className="admin-panel">
            <PanelHeader title={labels[active]} count={(collections[active] || []).length} search={search} setSearch={setSearch} action={`Add ${labels[active]}`} onAction={() => openCreate(active)} />
            <CollectionTable type={active} items={collections[active] || []} onEdit={item => openEdit(active, item)} onDelete={item => deleteItem(active, item._id, labels[active])} />
          </section>
        )}

        {active === "users" && (
          <section className="admin-panel">
            <PanelHeader title="User Management" count={users.length} search={search} setSearch={setSearch} action="Add User" onAction={() => openCreate("users")} />
            <UserTable users={filteredUsers} onEdit={updateUser} onDelete={u => deleteItem("users", u._id, "user")} />
          </section>
        )}

        {active === "orders" && (
          <section className="admin-panel">
            <PanelHeader title="Order Management" count={orders.length} search={search} setSearch={setSearch} />
            <OrderTable orders={filteredOrders} users={users} onStatus={updateOrder} />
          </section>
        )}
      </main>

      {modal && (
        <Modal title={`${modal.mode === "create" ? "Add" : "Edit"} ${labels[modal.type] || "Product"}`} onClose={closeModal}>
          <EditForm type={modal.type} form={form} setForm={setForm} onSubmit={saveItem} saving={saving} products={products} />
        </Modal>
      )}
      {dataLoading && <div className="admin-sync">Syncing…</div>}
    </div>
  );
}

function PanelHeader({ title, count, search, setSearch, action, onAction }) {
  return <div className="admin-panel-header">
    <div><h2>{title}</h2><span>{count} records</span></div>
    <div className="admin-tools">
      <div className="admin-search">⌕<input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${title.toLowerCase()}...`} /></div>
      {action && <button className="admin-primary-btn compact" onClick={onAction}>+ {action}</button>}
    </div>
  </div>;
}

function Overview({ products, users, orders, reviews, onNavigate, collections }) {
  const revenue = orders.filter(o => o.paymentStatus === "Paid").reduce((n,o) => n + Number(o.totalAmount || 0), 0);
  return <div className="admin-overview">
    <div className="admin-welcome"><div><span>GOOD DAY</span><h2>Your store at a glance.</h2><p>Manage inventory, customers, content and orders from one place.</p></div><div className="admin-welcome-mark">✦</div></div>
    <div className="admin-stats">
      <Stat title="Products" value={products.length} icon="◈" onClick={() => onNavigate("products")} />
      <Stat title="Customers" value={users.filter(u=>u.role!=="admin").length} icon="♙" onClick={() => onNavigate("users")} />
      <Stat title="Orders" value={orders.length} icon="▤" onClick={() => onNavigate("orders")} />
      <Stat title="Paid Revenue" value={`₹${revenue.toLocaleString("en-IN")}`} icon="₹" />
    </div>
    <div className="admin-overview-grid">
      <div className="admin-card"><h3>Content collections</h3>{[
        ["homeproducts","Home Products"],["festiveWave","Festive Wave"],["exploreCollection","Explore Collection"],["recommendedProduct","Recommended"],["recentlyViewed","Recently Viewed"],["customerReview","Reviews"]
      ].map(([id,name])=><button className="admin-list-link" key={id} onClick={()=>onNavigate(id)}><span>{name}</span><b>{collections?.[id]?.length || 0}</b><i>→</i></button>)}</div>
      <div className="admin-card"><h3>Recent orders</h3>{orders.slice(0,5).map(o=><div className="admin-mini-row" key={o._id}><div><b>#{o.orderId || o._id.slice(-7)}</b><small>{o.paymentStatus || "Pending"}</small></div><strong>₹{Number(o.totalAmount||0).toLocaleString("en-IN")}</strong></div>)}{!orders.length&&<p className="admin-empty">No orders yet.</p>}</div>
    </div>
  </div>;
}

function Stat({ title, value, icon, onClick }) {
  return <button className="admin-stat" onClick={onClick}><span className="stat-icon">{icon}</span><div><small>{title}</small><strong>{value}</strong></div><i>↗</i></button>;
}

function ProductTable({ products, onEdit, onDelete }) {
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Featured</th><th>Actions</th></tr></thead><tbody>
    {products.map(p=><tr key={p._id}><td><div className="table-product">{p.images?.[0] ? <img src={p.images[0]} /> : <div className="no-img">NO</div>}<div><b>{p.name}</b><small>{p._id}</small></div></div></td><td>{p.category || "—"}</td><td>₹{Number(p.discountPrice || p.price || 0).toLocaleString("en-IN")}</td><td><span className={`status-pill ${p.inStock !== false ? "green":"red"}`}>{p.inStock !== false ? "In stock":"Out"}</span></td><td>{p.featured ? "Yes":"No"}</td><td><ActionButtons onEdit={()=>onEdit(p)} onDelete={()=>onDelete(p)} /></td></tr>)}
  </tbody></table>{!products.length&&<Empty />}</div>;
}

function CollectionTable({ type, items, onEdit, onDelete }) {
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Title / ID</th><th>Products</th><th>User</th><th>Active</th><th>Created</th><th>Actions</th></tr></thead><tbody>
    {items.map(item=> {
      const ids = Array.isArray(item.productId) ? item.productId : [item.productId];
      return <tr key={item._id}><td><b>{item.title || labels[type]}</b><small>{item._id}</small></td><td>{ids.filter(Boolean).length} product(s)</td><td>{item.userId?.email || item.userId || "—"}</td><td><span className={`status-pill ${item.active !== false ? "green":"red"}`}>{item.active !== false ? "Active":"Inactive"}</span></td><td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</td><td><ActionButtons onEdit={()=>onEdit(item)} onDelete={()=>onDelete(item)} /></td></tr>
    })}</tbody></table>{!items.length&&<Empty />}</div>;
}

function UserTable({ users, onEdit, onDelete }) {
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Phone</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead><tbody>
    {users.map(u=><tr key={u._id}><td><div className="table-user"><span>{(u.firstName||u.email||"U").charAt(0).toUpperCase()}</span><div><b>{u.firstName} {u.lastName}</b><small>{u.email}</small></div></div></td><td>{u.phone||"—"}</td><td><span className={`status-pill ${u.role==="admin"?"gold":"blue"}`}>{u.role}</span></td><td>{u.createdAt?new Date(u.createdAt).toLocaleDateString():"—"}</td><td><ActionButtons onEdit={()=>onEdit(u)} onDelete={()=>onDelete(u)} /></td></tr>)}
  </tbody></table>{!users.length&&<Empty />}</div>;
}

function OrderTable({ orders, users, onStatus }) {
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead><tbody>
    {orders.map(o=><tr key={o._id}><td><b>#{o.orderId||o._id.slice(-8)}</b><small>{o.createdAt?new Date(o.createdAt).toLocaleString():""}</small></td><td>{users.find(u=>u._id===o.userId)?.email || o.userId || "—"}</td><td>₹{Number(o.totalAmount||0).toLocaleString("en-IN")}</td><td><span className={`status-pill ${o.paymentStatus==="Paid"?"green":o.paymentStatus==="Failed"?"red":"gold"}`}>{o.paymentStatus||"Pending"}</span></td><td><select className="admin-status-select" value={o.orderStatus||"Processing"} onChange={e=>onStatus(o._id,e.target.value)}><option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select></td><td><button className="action-btn view" onClick={()=>alert(`Order: ${o.orderId||o._id}\nAmount: ₹${o.totalAmount}\nPayment: ${o.paymentStatus}\nStatus: ${o.orderStatus}\nProducts: ${o.products?.length||0}`)}>View</button></td></tr>)}
  </tbody></table>{!orders.length&&<Empty />}</div>;
}

function ActionButtons({ onEdit, onDelete }) {
  return <div className="row-actions"><button className="action-btn edit" onClick={onEdit}>Edit</button><button className="action-btn delete" onClick={onDelete}>Delete</button></div>;
}
function Empty(){return <div className="admin-empty">No records found.</div>;}

function Modal({title,onClose,children}){return <div className="admin-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="admin-modal"><div className="modal-head"><h2>{title}</h2><button onClick={onClose}>×</button></div>{children}</div></div>}

function EditForm({type,form,setForm,onSubmit,saving,products}) {
  const set=(key,val)=>setForm(prev=>({...prev,[key]:val}));
  if(type==="product") return <form className="admin-form" onSubmit={onSubmit}>
    <div className="form-grid two"><Field label="Product name"><input value={form.name||""} onChange={e=>set("name",e.target.value)} required /></Field><Field label="Category"><input value={form.category||""} onChange={e=>set("category",e.target.value)} /></Field></div>
    <div className="form-grid three"><Field label="Price"><input type="number" value={form.price||""} onChange={e=>set("price",e.target.value)} required /></Field><Field label="Discount price"><input type="number" value={form.discountPrice||""} onChange={e=>set("discountPrice",e.target.value)} /></Field><Field label="Stock"><select value={String(form.inStock !== false)} onChange={e=>set("inStock",e.target.value==="true")}><option value="true">In stock</option><option value="false">Out of stock</option></select></Field></div>
    <Field label="Description"><textarea rows="4" value={form.description||""} onChange={e=>set("description",e.target.value)} /></Field>
    <Field label="Tags (comma separated)"><input value={form.tags||""} onChange={e=>set("tags",e.target.value)} /></Field>
    <Field label="Care (comma separated)"><input value={form.care||""} onChange={e=>set("care",e.target.value)} /></Field>
    {form._id && <Field label="Image URLs (comma separated)"><input value={form.images||""} onChange={e=>set("images",e.target.value)} /></Field>}
    {!form._id && <Field label="Product images"><input name="images" type="file" accept="image/*" multiple /></Field>}
    <label className="check"><input type="checkbox" checked={!!form.featured} onChange={e=>set("featured",e.target.checked)} /> Featured product</label>
    <FormActions saving={saving}/>
  </form>;

  if(type==="users") return <form className="admin-form" onSubmit={onSubmit}>
    <div className="form-grid two"><Field label="First name"><input value={form.firstName||""} onChange={e=>set("firstName",e.target.value)} required /></Field><Field label="Last name"><input value={form.lastName||""} onChange={e=>set("lastName",e.target.value)} required /></Field></div>
    <div className="form-grid two"><Field label="Email"><input type="email" value={form.email||""} onChange={e=>set("email",e.target.value)} required /></Field><Field label="Phone"><input value={form.phone||""} onChange={e=>set("phone",e.target.value)} /></Field></div>
    <div className="form-grid two"><Field label="Gender"><input value={form.gender||""} onChange={e=>set("gender",e.target.value)} /></Field><Field label="Date of birth"><input type="date" value={form.dob?String(form.dob).slice(0,10):""} onChange={e=>set("dob",e.target.value)} /></Field></div>
    <Field label="Role"><select value={form.role||"user"} onChange={e=>set("role",e.target.value)}><option value="user">User</option><option value="admin">Admin</option></select></Field>
    <Field label={form._id ? "New password (optional)" : "Password"}><input type="password" value={form.passwordHash||""} onChange={e=>set("passwordHash",e.target.value)} {...(!form._id ? {required:true}: {})} /></Field>
    <FormActions saving={saving}/>
  </form>;

  if(type==="customerReview") return <form className="admin-form" onSubmit={onSubmit}>
    <Field label="Product ID"><input value={form.productId||""} onChange={e=>set("productId",e.target.value)} required /></Field>
    <Field label="User ID"><input value={form.userId||""} onChange={e=>set("userId",e.target.value)} /></Field>
    <div className="form-grid two"><Field label="Rating"><select value={form.rating||5} onChange={e=>set("rating",Number(e.target.value))}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></Field><Field label="Active"><select value={String(form.active!==false)} onChange={e=>set("active",e.target.value==="true")}><option value="true">Active</option><option value="false">Inactive</option></select></Field></div>
    <Field label="Comment"><textarea rows="5" value={form.comment||""} onChange={e=>set("comment",e.target.value)} /></Field><FormActions saving={saving}/>
  </form>;

  return <form className="admin-form" onSubmit={onSubmit}>
    <Field label="Title"><input value={form.title||""} onChange={e=>set("title",e.target.value)} /></Field>
    <Field label="Product ID(s), comma separated"><input value={form.productId||""} onChange={e=>set("productId",e.target.value)} required /></Field>
    <Field label="User ID (optional)"><input value={form.userId||""} onChange={e=>set("userId",e.target.value)} /></Field>
    <Field label="Active"><select value={String(form.active!==false)} onChange={e=>set("active",e.target.value==="true")}><option value="true">Active</option><option value="false">Inactive</option></select></Field>
    <FormActions saving={saving}/>
  </form>;
}
function Field({label,children}){return <label className="admin-field"><span>{label}</span>{children}</label>}
function FormActions({saving}){return <div className="modal-actions"><button type="submit" className="admin-primary-btn" disabled={saving}>{saving?"Saving...":"Save changes"}</button></div>}
