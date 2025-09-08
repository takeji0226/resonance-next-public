// app/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";
import Image from "next/image";

type Item = {
  id: string;
  label: string;
  sub?: string;
  divider?: boolean;
  imagsrc?: string;
};

const ITEMS: Item[] = [
  { id: "chat", label: "言葉にする", imagsrc: "/conversation.png" },
  {
    id: "timeline",
    label: "前に進む",
    imagsrc: "/goal.jpg",
  },
  {
    id: "goals",
    label: "自分を知る",
    imagsrc: "/record.jpg",
  },
];

export default function Sidebar({ active }: { active?: string }) {
  const current = active ?? "chat";

  return (
    <aside
      style={{
        width: "260px",
        minWidth: "240px",
        boxSizing: "border-box",
        borderRight: "1px solid #e5e7eb",
        padding: "12px 8px",
        background: "#fff",
        height: "calc(100vh - 60px)", // Headerの高さ相当
        overflowY: "auto",
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        {ITEMS.map((it) => {
          if (it.divider) {
            return (
              <div
                key={it.id}
                style={{
                  marginTop: 12,
                  marginBottom: 4,
                  fontSize: 12,
                  color: "#333333",
                  paddingLeft: "4px",
                  paddingTop: "10px",
                }}
              >
                {it.label}
              </div>
            );
          }
          const isActive = current === it.id;
          return (
            <a
              key={it.id}
              href={`/?pane=${it.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 8,
                padding: "10px 12px",
                borderRadius: 10,
                fontWeight: "bold",
                textDecoration: "none",
                color: isActive ? "#111827" : "#374151",
                background: isActive ? "#f3f4f6" : "transparent",
                border: isActive
                  ? "1px solid #e5e7eb"
                  : "1px solid transparent",
              }}
            >
              {it.imagsrc && <img src={it.imagsrc} alt={it.label} width={30} />}
              <span style={{ fontSize: 14 }}>{it.label}</span>
              {it.sub && (
                <span style={{ fontSize: 11, color: "#6b7280" }}>{it.sub}</span>
              )}
            </a>
          );
        })}
      </div>
    </aside>
  );
}
