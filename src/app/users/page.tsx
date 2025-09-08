import { User } from "../types"
import Link from "next/link";
import Header from "@components/Header"

async function getUsers(): Promise<User[]> {
  const res = await fetch("http://localhost:3001/api/users", {
    // 開発中は最新取得。頻繁に叩くなら revalidate を設定
    cache: "no-store",
  })
  if (!res.ok) throw new Error("Failed to fetch users")
  return res.json()
}

export default async function UsersPage() {
  const users = await getUsers()
  return (
    <>
    <Header />
      <main style={{padding:16}}>
        <h1>Users</h1>
        <ul>
          {users.map(u => (
            <li key={u.id}>
              <strong>{u.name}</strong> — {u.email}
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}