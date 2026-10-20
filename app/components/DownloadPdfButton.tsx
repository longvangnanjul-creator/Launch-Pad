'use client';

export default function DownloadPdfButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print"
      type="button"
      style={{
        padding: '10px 20px',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        background: '#fff',
        color: '#0f172a',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
      }}
    >
      Download PDF
    </button>
  );
}
