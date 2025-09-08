// app/components/Header.tsx
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import LogoutButton from "./LogoutButton";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

// ログイン中ユーザ取得
type Me = { id: string; name: string; email: string };
async function getMe(token?: string): Promise<Me | null> {
  const headers: HeadersInit = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api/me`, { cache: "no-store", headers });
  if (!res.ok) return null; // 未ログイン/トークン無効など
  return res.json();
}

// ヘッダー本体
export default async function Header() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const me = await getMe(token);
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        padding: "2px 16px",
        background: "#fff",
        borderBottom: "1px solid #ddd",
      }}
    >
      <Link href="/">
        <Image
          src="/resonance-logo.png"
          alt="Resonance Logo"
          width={190}
          height={50}
          style={{ marginRight: 12 }}
        />
      </Link>
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontWeight: "bold" }}>{me ? me.name : "Guest"}さん</span>
        <LogoutButton />
      </div>
    </header>
  );
}
