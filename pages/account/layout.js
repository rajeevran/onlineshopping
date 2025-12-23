
"use client";

import { usePathname, useRouter } from "next/navigation";

export default function AccountLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const menu = [
    { name: "My Profile", path: "/account" },
    { name: "My Orders", path: "/account/orders" },
    { name: "My Wishlist", path: "/account/wishlist" },
    { name: "My Addresses", path: "/account/addresses" },
    { name: "My Bank Account", path: "/account/bank" }
  ];

  return (
    <div className="account-container">
      <aside className="account-sidebar">
        <div className="profile-card">
          <div className="avatar">👤</div>
          <h4>Rrr Tttt</h4>
          <p className="email">rajnanjan505@gmail.com</p>
        </div>

        <ul className="menu">
          {menu.map((item) => (
            <li
              key={item.path}
              className={pathname === item.path ? "active" : ""}
              onClick={() => router.push(item.path)}
            >
              {item.name}
            </li>
          ))}
        </ul>
      </aside>

      <main className="account-content">{children}</main>
    </div>
  );
}
