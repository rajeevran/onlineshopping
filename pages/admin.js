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
    localStorage.removeItem("adminSession");
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
    setForm({ name: "", price: "", discountPrice: "", category: "", description: "", tags: [], care: [], colors: [], sizes: [], images: [], imageFiles: [], primaryImageIndex: 0, inStock: true, featured: false });
    setModal({ type: "product", mode: "create" });
  };

  const openCreate = (type) => {
    if (type === "product") return openCreateProduct();
    if (type === "customerReview") {
      setForm({ title: "", productId: "", userId: "", comment: "", rating: 5, active: true, selectedImages: [] });
    } else {
      setForm({ title: "", productId: "", userId: "", active: true, selectedImages: [] });
    }
    setModal({ type, mode: "create" });
  };

  const openEdit = (type, item) => {
    const product = item?.productId && !Array.isArray(item.productId) ? item.productId : null;
    if (type === "product") {
      setForm({
        ...item,
        tags: Array.isArray(item.tags) ? item.tags.filter(Boolean) : [],
        care: Array.isArray(item.care) ? item.care.filter(Boolean) : [],
        colors: Array.isArray(item.colors) ? item.colors.filter(Boolean) : [],
        sizes: Array.isArray(item.sizes) ? item.sizes.filter(Boolean) : [],
        images: Array.isArray(item.images) ? item.images : [],
        imageFiles: [],
        primaryImageIndex: 0,
      });
    } else if (type === "customerReview") {
      const selectedImages = buildSelectedImages(item, products, false);
      setForm({ ...item, productId: item.productId?._id || item.productId || "", userId: item.userId?._id || item.userId || "", selectedImages });
    } else {
      const selectedImages = buildSelectedImages(item, products, type !== "homeproducts");
      setForm({ ...item, productId: selectedImages.map(x => x.productId).join(","), selectedImages, userId: item.userId?._id || item.userId || "" });
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
            if (key !== "images" && key !== "imageFiles" && key !== "primaryImageIndex") fd.append(key, Array.isArray(value) ? value.join(",") : value ?? "");
          });
          const files = Array.isArray(form.imageFiles) ? form.imageFiles : Array.from(e.target.images.files || []);
          files.forEach((file) => fd.append("images", file));
          fd.append("primaryImageIndex", String(form.primaryImageIndex || 0));
          await api.post("/products", fd, { headers: { "Content-Type": "multipart/form-data" } });
        } else {
          const payload = { ...form };
          payload.tags = Array.isArray(form.tags)
            ? form.tags.map(x => String(x).trim()).filter(Boolean)
            : String(form.tags || "").split(",").map(x => x.trim()).filter(Boolean);
          payload.care = Array.isArray(form.care)
            ? form.care.map(x => String(x).trim()).filter(Boolean)
            : String(form.care || "").split(",").map(x => x.trim()).filter(Boolean);
          payload.colors = Array.isArray(form.colors)
            ? form.colors.map(x => String(x).trim()).filter(Boolean)
            : String(form.colors || "").split(",").map(x => x.trim()).filter(Boolean);
          payload.sizes = Array.isArray(form.sizes)
            ? form.sizes.map(x => String(x).trim()).filter(Boolean)
            : String(form.sizes || "").split(",").map(x => x.trim()).filter(Boolean);
          payload.images = Array.isArray(form.images) ? form.images.filter(Boolean) : [];
          delete payload._id; delete payload.createdAt; delete payload.__v; delete payload.primaryImageIndex;
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
        // Do not send an empty optional ObjectId. Mongoose rejects "" for ObjectId fields.
        if (payload.userId === "" || payload.userId === null || payload.userId === undefined) delete payload.userId;
        const selectedImages = Array.isArray(form.selectedImages) ? form.selectedImages : [];
        if (!selectedImages.length) {
          setMessage("Select at least one product image before saving.");
          return;
        }
        const selectedProductIds = selectedImages.map(item => item.productId).filter(Boolean);
        if (modal.type === "homeproducts" || modal.type === "customerReview") {
          payload.productId = selectedProductIds[0] || "";
        } else {
          payload.productId = selectedProductIds;
        }
        payload.images = selectedImages.map(item => item.image).filter(Boolean);
        delete payload.selectedImages;
        if (modal.mode === "create") {
          if (modal.type === "homeproducts") {
            const fd = new FormData();
            fd.append("title", payload.title || "");
            fd.append("productId", payload.productId || "");
            fd.append("active", String(payload.active !== false));
            fd.append("images", JSON.stringify(payload.images || []));
            await api.post(base, fd, { headers: { "Content-Type": "multipart/form-data" } });
          } else {
            await api.post(base, payload);
          }
        } else await api.put(`${base}/${modal.item._id}`, payload);
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
      const selected = Array.isArray(item.images) && item.images.length
        ? item.images.filter(Boolean)
        : (Array.isArray(item.productId)
          ? item.productId.map(product => product?.images?.[0]).filter(Boolean)
          : [item.productId?.images?.[0]].filter(Boolean));
      return <tr key={item._id}><td><b>{item.title || labels[type]}</b><small>{item._id}</small></td><td><div className="collection-thumb-list">{selected.slice(0,4).map((image, imageIndex)=><img key={`${item._id}-${imageIndex}`} src={image} alt="" />)}<span>{ids.filter(Boolean).length} product{ids.filter(Boolean).length === 1 ? "" : "s"}</span></div></td><td>{item.userId?.email || item.userId || "—"}</td><td><span className={`status-pill ${item.active !== false ? "green":"red"}`}>{item.active !== false ? "Active":"Inactive"}</span></td><td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</td><td><ActionButtons onEdit={()=>onEdit(item)} onDelete={()=>onDelete(item)} /></td></tr>
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
    <Field label="Tags">
      <ValueListManager
        values={Array.isArray(form.tags) ? form.tags : String(form.tags || "").split(",").map(x => x.trim()).filter(Boolean)}
        setValues={(values) => set("tags", values)}
        placeholder="Add a tag, e.g. festive"
        emptyText="No tags added"
      />
    </Field>
    <Field label="Care instructions">
      <ValueListManager
        values={Array.isArray(form.care) ? form.care : String(form.care || "").split(",").map(x => x.trim()).filter(Boolean)}
        setValues={(values) => set("care", values)}
        placeholder="Add care instruction, e.g. Hand wash"
        emptyText="No care instructions added"
      />
    </Field>
    <div className="form-grid two">
      <Field label="Colors">
        <ValueListManager
          values={Array.isArray(form.colors) ? form.colors : String(form.colors || "").split(",").map(x => x.trim()).filter(Boolean)}
          setValues={(values) => set("colors", values)}
          placeholder="Add a color, e.g. Maroon"
          emptyText="No colors added"
        />
      </Field>
      <Field label="Sizes">
        <ValueListManager
          values={Array.isArray(form.sizes) ? form.sizes : String(form.sizes || "").split(",").map(x => x.trim()).filter(Boolean)}
          setValues={(values) => set("sizes", values)}
          placeholder="Add a size, e.g. M"
          emptyText="No sizes added"
        />
      </Field>
    </div>
    <Field label="Product images">
      <ProductImageManager
        productId={form._id}
        images={Array.isArray(form.images) ? form.images : []}
        setImages={(images) => set("images", images)}
        setImageFiles={(files) => set("imageFiles", files)}
        primaryIndex={Number(form.primaryImageIndex) || 0}
        setPrimaryIndex={(index) => set("primaryImageIndex", index)}
        createInputName="images"
      />
    </Field>
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
    <Field label="Selected product image">
      <SelectedImageManager
        products={products}
        selected={Array.isArray(form.selectedImages) ? form.selectedImages : []}
        setSelected={(selected) => { set("selectedImages", selected); set("productId", selected[0]?.productId || ""); }}
        multiple={false}
      />
    </Field>
    <Field label="User ID"><input value={form.userId||""} onChange={e=>set("userId",e.target.value)} /></Field>
    <div className="form-grid two"><Field label="Rating"><select value={form.rating||5} onChange={e=>set("rating",Number(e.target.value))}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></Field><Field label="Active"><select value={String(form.active!==false)} onChange={e=>set("active",e.target.value==="true")}><option value="true">Active</option><option value="false">Inactive</option></select></Field></div>
    <Field label="Comment"><textarea rows="5" value={form.comment||""} onChange={e=>set("comment",e.target.value)} /></Field><FormActions saving={saving}/>
  </form>;

  return <form className="admin-form" onSubmit={onSubmit}>
    <Field label="Title"><input value={form.title||""} onChange={e=>set("title",e.target.value)} /></Field>
    <Field label="Selected images">
      <SelectedImageManager
        products={products}
        selected={Array.isArray(form.selectedImages) ? form.selectedImages : []}
        setSelected={(selected) => { set("selectedImages", selected); set("productId", selected.map(x => x.productId).join(",")); }}
        multiple={type !== "homeproducts"}
      />
    </Field>
    <Field label="User ID (optional)"><input value={form.userId||""} onChange={e=>set("userId",e.target.value)} /></Field>
    <Field label="Active"><select value={String(form.active!==false)} onChange={e=>set("active",e.target.value==="true")}><option value="true">Active</option><option value="false">Inactive</option></select></Field>
    <FormActions saving={saving}/>
  </form>;
}

function buildSelectedImages(item, products, multiple) {
  const productIds = Array.isArray(item?.productId)
    ? item.productId.map(x => x?._id || x).filter(Boolean)
    : [item?.productId?._id || item?.productId].filter(Boolean);
  const storedImages = Array.isArray(item?.images) ? item.images.filter(Boolean) : [];

  return productIds.map((productId, index) => {
    const product = products.find(p => String(p._id) === String(productId));
    const image = storedImages[index] || product?.images?.[0] || "";
    return image ? { productId: String(productId), image, productName: product?.name || "Product" } : null;
  }).filter(Boolean).slice(0, multiple ? 20 : 1);
}

function SelectedImageManager({ products, selected, setSelected, multiple = true }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [preview, setPreview] = useState(null);
  const selectedList = Array.isArray(selected) ? selected : [];

  const openPicker = (index = null) => {
    setEditingIndex(index);
    setPickerOpen(true);
  };

  const chooseImage = (product, image) => {
    const entry = { productId: String(product._id), image, productName: product.name || "Product" };
    if (editingIndex !== null) {
      const next = selectedList.map((item, index) => index === editingIndex ? entry : item);
      setSelected(next);
    } else if (multiple) {
      const existingIndex = selectedList.findIndex(item => String(item.productId) === String(product._id));
      if (existingIndex >= 0) {
        setSelected(selectedList.map((item, index) => index === existingIndex ? entry : item));
      } else {
        setSelected([...selectedList, entry]);
      }
    } else {
      setSelected([entry]);
    }
    setPickerOpen(false);
    setEditingIndex(null);
  };

  const remove = (index) => setSelected(selectedList.filter((_, i) => i !== index));

  return (
    <div className="selected-image-manager">
      <div className="selected-image-grid">
        {selectedList.map((item, index) => (
          <div className="selected-image-card" key={`${item.productId}-${item.image}-${index}`}>
            <div className="selected-image-preview">
              <img src={item.image} alt={item.productName || `Selected ${index + 1}`} />
              <span className="selected-image-number">{index + 1}</span>
            </div>
            <div className="selected-image-info">
              <b title={item.productName}>{item.productName}</b>
              <small>{item.productId}</small>
            </div>
            <div className="selected-image-actions">
              <button type="button" className="action-btn view" onClick={() => setPreview(item.image)}>View</button>
              <button type="button" className="action-btn edit" onClick={() => openPicker(index)}>Edit</button>
              <button type="button" className="action-btn delete" onClick={() => remove(index)}>Delete</button>
            </div>
          </div>
        ))}
        <button type="button" className="selected-image-add" onClick={() => openPicker(null)}>
          <span>＋</span>
          <strong>Add selected image{multiple ? "s" : ""}</strong>
          <small>Choose from product images</small>
        </button>
      </div>

      {!selectedList.length && <div className="selected-image-empty">No images selected yet. Add an image from your product catalogue.</div>}

      {pickerOpen && (
        <div className="image-picker-backdrop" onMouseDown={e => e.target === e.currentTarget && setPickerOpen(false)}>
          <div className="image-picker-modal">
            <div className="image-picker-head">
              <div><span>PRODUCT IMAGE LIBRARY</span><h3>{editingIndex !== null ? "Replace selected image" : "Add selected images"}</h3></div>
              <button type="button" onClick={() => { setPickerOpen(false); setEditingIndex(null); }}>×</button>
            </div>
            <div className="image-picker-grid">
              {products.map(product => (
                <div className="image-picker-product" key={product._id}>
                  <div className="image-picker-product-title"><b>{product.name}</b><small>{product._id}</small></div>
                  <div className="image-picker-images">
                    {(Array.isArray(product.images) ? product.images : []).map((image, imageIndex) => (
                      <button type="button" className="image-picker-option" key={`${product._id}-${image}-${imageIndex}`} onClick={() => chooseImage(product, image)}>
                        <img src={image} alt={`${product.name} ${imageIndex + 1}`} />
                        <span>Image {imageIndex + 1}</span>
                      </button>
                    ))}
                    {!product.images?.length && <small className="image-picker-no-image">No product images</small>}
                  </div>
                </div>
              ))}
              {!products.length && <div className="selected-image-empty">No products are available. Add products first.</div>}
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="image-viewer-backdrop" onMouseDown={e => e.target === e.currentTarget && setPreview(null)}>
          <div className="image-viewer">
            <button type="button" className="image-viewer-close" onClick={() => setPreview(null)}>×</button>
            <img src={preview} alt="Selected product preview" />
          </div>
        </div>
      )}
    </div>
  );
}

function ValueListManager({ values, setValues, placeholder, emptyText }) {
  const [draft, setDraft] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [viewingValue, setViewingValue] = useState(null);

  const cleanValues = (list) => Array.from(new Set(
    list.map(value => String(value ?? "").trim()).filter(Boolean)
  ));

  const addValue = () => {
    const value = draft.trim();
    if (!value) return;
    setValues(cleanValues([...values, value]));
    setDraft("");
  };

  const removeValue = (index) => {
    setValues(values.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingValue("");
    }
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditingValue(values[index] || "");
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const value = editingValue.trim();
    if (!value) {
      removeValue(editingIndex);
      return;
    }
    setValues(cleanValues(values.map((item, i) => i === editingIndex ? value : item)));
    setEditingIndex(null);
    setEditingValue("");
  };

  return (
    <div className="value-list-manager">
      <div className="value-list-add">
        <input
          value={draft}
          placeholder={placeholder}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addValue(); } }}
        />
        <button type="button" className="value-add-btn" onClick={addValue}>+ Add</button>
      </div>

      <div className="value-list" aria-live="polite">
        {!values.length && <span className="value-list-empty">{emptyText}</span>}
        {values.map((value, index) => (
          <div className="value-list-row" key={`${value}-${index}`}>
            {editingIndex === index ? (
              <div className="value-edit-row">
                <input
                  autoFocus
                  value={editingValue}
                  onChange={e => setEditingValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") { e.preventDefault(); saveEdit(); }
                    if (e.key === "Escape") { setEditingIndex(null); setEditingValue(""); }
                  }}
                />
                <button type="button" className="value-action save" onClick={saveEdit}>Save</button>
                <button type="button" className="value-action cancel" onClick={() => { setEditingIndex(null); setEditingValue(""); }}>Cancel</button>
              </div>
            ) : (
              <>
                <span className="value-text" title={value}>{value}</span>
                <div className="value-actions">
                  <button type="button" className="value-action view" title="View value" onClick={() => setViewingValue(value)}>View</button>
                  <button type="button" className="value-action edit" title="Edit value" onClick={() => startEdit(index)}>Edit</button>
                  <button type="button" className="value-action delete" title="Delete value" onClick={() => removeValue(index)}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {viewingValue !== null && (
        <div className="value-view-backdrop" onMouseDown={e => e.target === e.currentTarget && setViewingValue(null)}>
          <div className="value-viewer">
            <button type="button" className="value-view-close" onClick={() => setViewingValue(null)}>×</button>
            <span className="value-view-label">Value</span>
            <div className="value-view-content">{viewingValue}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductImageManager({ productId, images, setImages, setImageFiles, createInputName, primaryIndex = 0, setPrimaryIndex }) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [newFiles, setNewFiles] = useState([]);

  const getFilePreview = (file) => URL.createObjectURL(file);

  const addImages = async (files) => {
    const selected = Array.from(files || []);
    if (!selected.length) return;

    if (!productId) {
      const combined = [...newFiles, ...selected];
      if (combined.length > 10) {
        alert("A product can have a maximum of 10 images.");
        return;
      }
      setNewFiles(combined);
      if (setImageFiles) setImageFiles(combined);
      if (setPrimaryIndex) setPrimaryIndex(Math.min(primaryIndex || 0, combined.length - 1));
      return;
    }

    if ((images || []).length + selected.length > 10) {
      alert("A product can have a maximum of 10 images.");
      return;
    }

    const fd = new FormData();
    selected.forEach(file => fd.append("images", file));
    setUploading(true);
    try {
      const res = await api.post(`/products/${productId}/images`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImages(res.data?.images || []);
    } catch (err) {
      alert(err.response?.data?.message || "Unable to upload image(s).");
    } finally {
      setUploading(false);
    }
  };

  const replaceImage = async (index, file) => {
    if (!file) return;
    if (!productId) {
      const next = [...newFiles];
      next[index] = file;
      setNewFiles(next);
      if (setImageFiles) setImageFiles(next);
      return;
    }
    const fd = new FormData();
    fd.append("image", file);
    fd.append("index", String(index));
    setUploading(true);
    try {
      const res = await api.put(`/products/${productId}/images`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImages(res.data?.images || []);
    } catch (err) {
      alert(err.response?.data?.message || "Unable to replace image.");
    } finally {
      setUploading(false);
    }
  };

  const setPrimary = async (index) => {
    const availableCount = productId ? (images || []).length : newFiles.length;
    if (!availableCount || index < 0 || index >= availableCount) return;
    if (index === 0 && productId) return;

    if (!productId) {
      if (setPrimaryIndex) setPrimaryIndex(index);
      return;
    }

    setUploading(true);
    try {
      const res = await api.patch(`/products/${productId}/images`, { primaryIndex: index });
      setImages(res.data?.images || []);
      if (setPrimaryIndex) setPrimaryIndex(0);
    } catch (err) {
      alert(err.response?.data?.message || "Unable to set primary image.");
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (index) => {
    if (!window.confirm("Delete this image? This cannot be undone.")) return;

    if (!productId) {
      const next = newFiles.filter((_, i) => i !== index);
      setNewFiles(next);
      if (setImageFiles) setImageFiles(next);
      if (setPrimaryIndex) {
        if (!next.length) setPrimaryIndex(0);
        else if (primaryIndex === index) setPrimaryIndex(0);
        else if (primaryIndex > index) setPrimaryIndex(primaryIndex - 1);
      }
      return;
    }

    try {
      const wasPrimary = index === 0;
      const res = await api.delete(`/products/${productId}/images`, {
        data: { index },
      });
      setImages(res.data?.images || []);
      if (wasPrimary && setPrimaryIndex) setPrimaryIndex(0);
    } catch (err) {
      alert(err.response?.data?.message || "Unable to delete image.");
    }
  };

  const displayImages = productId ? (images || []) : newFiles.map(file => ({ file, src: getFilePreview(file) }));

  return <>
    <div className="product-image-manager">
      {displayImages.map((item, index) => {
        const src = productId ? item : item.src;
        const isPrimary = productId ? index === 0 : index === primaryIndex;
        return (
          <div className={`product-image-card ${isPrimary ? "primary" : ""}`} key={`${src}-${index}`}>
            <div className="product-image-preview">
              <img src={src} alt={`Product ${index + 1}`} />
              {isPrimary && <span className="primary-image-badge">Primary</span>}
            </div>
            <div className="product-image-actions">
              <button type="button" title="View image" onClick={() => setPreview(src)}>◉</button>
              <label className="image-icon-btn" title="Replace image">
                ✎
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={e => replaceImage(index, e.target.files?.[0])}
                />
              </label>
              {!isPrimary && (
                <button type="button" className="set-primary-btn" title="Set as primary" onClick={() => setPrimary(index)} disabled={uploading}>★</button>
              )}
              <button type="button" className="danger" title="Delete image" onClick={() => deleteImage(index)} disabled={uploading}>♲</button>
            </div>
          </div>
        );
      })}

      <label className={`add-image-card ${uploading ? "disabled" : ""}`}>
        <span className="add-image-icon">⇧</span>
        <strong>{uploading ? "Updating..." : "Add Images"}</strong>
        <small>JPG, PNG, WebP</small>
        <input
          name={createInputName}
          type="file"
          accept="image/*"
          multiple
          hidden={!!productId}
          onChange={e => addImages(e.target.files)}
          disabled={uploading}
        />
      </label>
    </div>

    {!productId && <small className="image-manager-note">Select images, then click ★ on any image to make it primary. The selected primary image will be saved first.</small>}
    {productId && <small className="image-manager-note">Use ◉ to view, ✎ to replace, ★ to set primary, and ♲ to delete. The primary image is always stored first and changes are saved immediately.</small>}

    {preview && <div className="image-viewer-backdrop" onMouseDown={e => e.target === e.currentTarget && setPreview(null)}>
      <div className="image-viewer">
        <button type="button" className="image-viewer-close" onClick={() => setPreview(null)}>×</button>
        <img src={preview} alt="Product preview" />
      </div>
    </div>}
  </>;
}
function Field({label,children}){return <label className="admin-field"><span>{label}</span>{children}</label>}
function FormActions({saving}){return <div className="modal-actions"><button type="submit" className="admin-primary-btn" disabled={saving}>{saving?"Saving...":"Save changes"}</button></div>}
