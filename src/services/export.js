import { jsPDF } from 'jspdf';

export function exportCSV(books) {
  const headers = ['Title', 'Author', 'Language', 'Genre', 'Status', 'Rating', 'Shelf', 'Publisher', 'Year', 'ISBN', 'Total Pages', 'Current Page', 'Acquired', 'Wishlist', 'Review', 'Notes'];
  const rows = books.map(b => [
    b.title || '',
    b.author || '',
    b.language || '',
    b.genre || '',
    b.wishlist ? 'Wishlist' : (b.status || ''),
    b.rating || 0,
    b.shelf || '',
    b.publisher || '',
    b.year || '',
    b.isbn || '',
    b.totalPages || '',
    b.currentPage || '',
    b.acquired || '',
    b.wishlist ? 'Yes' : 'No',
    (b.review || '').replace(/\n/g, ' '),
    (b.notes || '').replace(/\n/g, ' '),
  ]);

  const escape = (val) => {
    const s = String(val);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel UTF-8
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BookSphere_Library_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(books) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210, margin = 14, colW = pageW - margin * 2;
  let y = margin;

  // Header
  doc.setFillColor(139, 111, 71);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('BookSphere — My Library', margin, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Exported ${new Date().toLocaleDateString()} · ${books.length} books`, pageW - margin, 14, { align: 'right' });

  y = 30;
  doc.setTextColor(30, 20, 10);

  const nonWishlist = books.filter(b => !b.wishlist);
  const wishlist = books.filter(b => b.wishlist);

  const drawSection = (title, list) => {
    if (list.length === 0) return;
    // Section title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 111, 71);
    doc.text(title, margin, y);
    y += 6;
    doc.setDrawColor(200, 180, 150);
    doc.line(margin, y, pageW - margin, y);
    y += 4;

    list.forEach((book, i) => {
      if (y > 270) { doc.addPage(); y = margin; }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 15, 10);
      const titleText = doc.splitTextToSize(`${i + 1}. ${book.title || 'Untitled'}`, colW - 30);
      doc.text(titleText, margin, y);

      // Status badge on right
      const status = book.status || 'To Read';
      const statusColors = { 'Reading':'#2980b9', 'Finished':'#27ae60', 'To Read':'#d4a017', 'Paused':'#8b6f47', 'Dropped':'#c0392b' };
      const [r, g, b2] = hexToRgb(statusColors[status] || '#888');
      doc.setFillColor(r, g, b2);
      doc.roundedRect(pageW - margin - 22, y - 4, 22, 5.5, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(status, pageW - margin - 11, y - 0.3, { align: 'center' });

      y += titleText.length * 4.5;
      doc.setTextColor(80, 70, 60);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);

      const meta = [
        book.author ? `Author: ${book.author}` : '',
        book.language ? `Language: ${book.language}` : '',
        book.genre ? `Genre: ${book.genre}` : '',
        book.year ? `Year: ${book.year}` : '',
        book.publisher ? `Publisher: ${book.publisher}` : '',
        book.isbn ? `ISBN: ${book.isbn}` : '',
        book.shelf ? `Shelf: ${book.shelf}` : '',
        book.rating ? `Rating: ${'★'.repeat(book.rating)}${'☆'.repeat(5 - book.rating)}` : '',
        book.totalPages ? `Pages: ${book.currentPage ? `${book.currentPage}/${book.totalPages}` : book.totalPages}` : '',
        book.tags?.length ? `Tags: ${book.tags.join(', ')}` : '',
      ].filter(Boolean);

      // Two column meta
      const half = Math.ceil(meta.length / 2);
      meta.slice(0, half).forEach(m => { doc.text(m, margin + 3, y); y += 4; });
      // Reset y for right column
      y -= half * 4;
      meta.slice(half).forEach(m => { doc.text(m, margin + colW / 2, y); y += 4; });
      if (meta.slice(half).length < half) y += (half - meta.slice(half).length) * 4;

      if (book.review) {
        doc.setTextColor(100, 90, 80);
        doc.setFontSize(8);
        const reviewLines = doc.splitTextToSize(`Review: ${book.review}`, colW - 6);
        reviewLines.slice(0, 2).forEach(line => { doc.text(line, margin + 3, y); y += 3.8; });
      }

      y += 3;
      doc.setDrawColor(230, 220, 210);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
    });
    y += 4;
  };

  drawSection('My Books', nonWishlist);
  drawSection('Wishlist', wishlist);

  // Footer on each page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(180, 170, 160);
    doc.text(`BookSphere · Page ${i} of ${pageCount}`, pageW / 2, 292, { align: 'center' });
  }

  doc.save(`BookSphere_Library_${new Date().toISOString().slice(0,10)}.pdf`);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return [r, g, b];
}
