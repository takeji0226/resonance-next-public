// app/components/BlankPane.tsx
export default function BlankPane({ title }: { title: string }) {
  return (
    <div
      style={{
        height: "90vh",
        minHeight: 420,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          このセクションは準備中です。のちほど内容を表示します。
        </div>
      </div>
    </div>
  );
}
