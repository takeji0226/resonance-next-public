//"use client" 明示的にサーバーコンポーネントに変更
//import { useRouter } from "next/navigation"
import Link from "next/link";
import Header from "@components/Header";
import ChatWindow from "@components/ChatWindow";
import { cookies } from "next/headers";

import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

async function getHealth() {
  const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
  return res.json();
}

export default async function Home() {
  const data = await Promise.all([getHealth()]);
  const uid = (await cookies()).get("uid")?.value;

  //画面主要部
  return (
    <>
      <Header />

      <main
        style={{
          display: "flex",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 8,
          padding: 2,
        }}
      >
        <section
          style={{ width: "15%", maxWidth: "15%", boxSizing: "border-box" }}
        >
          <p>
            Welcome to the prototype.
            <br />
            {JSON.stringify(data)}
          </p>

          <Link
            href="/users"
            style={{
              display: "inline-block",
              padding: "8px 16px",
              background: "#333",
              color: "#fff",
              borderRadius: 4,
              textDecoration: "none",
            }}
          >
            ユーザー一覧を見る
          </Link>
        </section>

        <section
          style={{
            width: "80%",
            maxWidth: "80%",
            boxSizing: "border-box",
            marginLeft: "auto",
          }}
        >
          <ChatWindow uid={uid} />
        </section>
      </main>
    </>
  );
}
