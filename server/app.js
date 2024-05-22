const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // Untuk menangani upload file

const app = express();
const port = 3001;
app.use(cors({
  origin: 'http://localhost:8080', // or your Vue app's origin
  methods: ['GET', 'POST'], 
  allowedHeaders: ['Content-Type', 'Authorization'], 
}));
app.use(express.json());
// Konfigurasi CORS

// Konfigurasi multer untuk menyimpan file PDF
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Direktori penyimpanan
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// Import pdfjs-dist (menggunakan dynamic import)
async function getPdfjsLib() {
  const pdfjsLib = await import('pdfjs-dist');
  return pdfjsLib;
}

// Middleware untuk parsing body JSON
app.use(express.json());

// Endpoint utama
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Endpoint untuk mengambil data PDF
app.get('/api/pdf-data/:filename', async (req, res) => {
  try {
    const pdfjsLib = await getPdfjsLib();
    const pdfPath = path.join(__dirname, 'uploads', req.params.filename);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'File PDF tidak ditemukan' });
    }

    const data = await pdfjsLib.getDocument(pdfPath).promise;
    const page = await data.getPage(1);
    const textContent = await page.getTextContent();

    const pdfData = textContent.items.map(item => item.str).join(' ');

    res.json({ data: pdfData });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data PDF' });
  }
});

// ... (bagian lain dari kode backend)

app.post('/api/save-pdf', upload.single('pdf'), (req, res) => {
  console.log(req.body, "<ini req.body"); // Cek isi req.body
  console.log(req.file, "<ini req.file"); // Cek isi req.file
  if (!req.file) {
    return res.status(400).json({ error: 'Tidak ada file PDF yang diunggah' });
  }

  const modifiedPdfData = req.file.buffer;

  // ... (implementasi penyimpanan file PDF)

  res.json({ success: true, filename: req.file.originalname });
});


app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});
