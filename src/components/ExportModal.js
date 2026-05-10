import React, { useState } from 'react';
import { X, FileText, Table, Download } from 'lucide-react';
import { exportCSV, exportPDF } from '../services/export';

export default function ExportModal({ books, onClose }) {
  const [exporting, setExporting] = useState(null);

  const doExport = async (type) => {
    setExporting(type);
    await new Promise(r => setTimeout(r, 100));
    try {
      if (type === 'csv') exportCSV(books);
      else exportPDF(books);
    } catch(e) { console.error(e); }
    setExporting(null);
    onClose();
  };

  const nonWishlist = books.filter(b => !b.wishlist).length;
  const wishlist = books.filter(b => b.wishlist).length;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.45)' }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:'var(--paper-card)', borderRadius:'var(--radius-xl)', padding:32, maxWidth:400, width:'90%', boxShadow:'var(--shadow-lg)', animation:'fadeUp 0.3s ease' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:'var(--ink)' }}>Export Library</div>
            <div style={{ fontSize:13, color:'var(--ink-muted)', marginTop:2 }}>{nonWishlist} books · {wishlist} wishlist items</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--ink-muted)', cursor:'pointer' }}><X size={20}/></button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* CSV */}
          <button onClick={()=>doExport('csv')} disabled={!!exporting} style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px', background:'var(--paper-warm)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', cursor:'pointer', textAlign:'left', transition:'var(--transition)' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--sepia-light)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
          >
            <div style={{ width:44, height:44, borderRadius:'var(--radius-md)', background:'var(--green-pale)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Table size={22} color="var(--green)"/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--ink)', marginBottom:2 }}>Export as CSV</div>
              <div style={{ fontSize:12, color:'var(--ink-muted)' }}>Open in Excel, Google Sheets, or any spreadsheet app. All fields included.</div>
            </div>
            {exporting==='csv' ? <div style={{ width:16, height:16, border:'2px solid var(--border)', borderTopColor:'var(--green)', borderRadius:'50%', animation:'spin 0.8s linear infinite', flexShrink:0 }}/> : <Download size={16} color="var(--ink-faint)"/>}
          </button>

          {/* PDF */}
          <button onClick={()=>doExport('pdf')} disabled={!!exporting} style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px', background:'var(--paper-warm)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', cursor:'pointer', textAlign:'left', transition:'var(--transition)' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--sepia-light)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
          >
            <div style={{ width:44, height:44, borderRadius:'var(--radius-md)', background:'var(--accent-pale)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <FileText size={22} color="var(--accent)"/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--ink)', marginBottom:2 }}>Export as PDF</div>
              <div style={{ fontSize:12, color:'var(--ink-muted)' }}>A formatted, printable document with all book details and reviews.</div>
            </div>
            {exporting==='pdf' ? <div style={{ width:16, height:16, border:'2px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite', flexShrink:0 }}/> : <Download size={16} color="var(--ink-faint)"/>}
          </button>
        </div>

        <p style={{ marginTop:16, fontSize:12, color:'var(--ink-faint)', textAlign:'center' }}>
          CSV is best for backup & data. PDF is best for sharing & printing.
        </p>
      </div>
    </div>
  );
}
