const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');
const port = 3001;
// Import the correct CommonJS module
async function getPdfjsLib() {
  const pdfjsLib = await import('pdfjs-dist');
  return pdfjsLib;
}

// ... inside your app.get route ...
app.get('/api/pdf-data/:filename', async (req, res) => {
  try {
    const pdfjsLib = await getPdfjsLib();

    // Rest of your code to process the PDF
    const pdfPath = `./public/pdfs/${req.params.filename}`;
    const data = await pdfjsLib.getDocument(pdfPath).promise;
    // ...
  } catch (error) {
    // ... error handling
  }
});


// Konfigurasi CORS 
app.use(cors({
  origin: 'http://localhost:8080', 
  methods: ['GET', 'POST'], 
  allowedHeaders: ['Content-Type', 'Authorization'], 
}));

app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.get('/api/pdf-data/:filename', async (req, res) => {
  try {
    const pdfPath = `./public/pdfs/${req.params.filename}`; // Path ke file PDF
    const data = await pdfjsLib.getDocument(pdfPath).promise;
    const page = await data.getPage(1); // Ambil halaman pertama (bisa dimodifikasi)
    const textContent = await page.getTextContent();

    const pdfData = textContent.items.map(item => item.str).join(' ');

    res.json({ data: pdfData });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data PDF' });
  }
});
// ... (endpoint /api/pdf-data/:filename seperti sebelumnya)

app.post('/api/save-pdf', (req, res) => {
  const modifiedPdfData = req.body.data;
  // ... (proses dan simpan modifiedPdfData, misalnya dengan menulis ke file baru)
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})