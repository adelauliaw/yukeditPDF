import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { fileURLToPath } from 'url';

const app = express();
const port = 3001;

// Dapatkan __dirname di ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigurasi Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Direktori untuk file yang diunggah dan hasil edit
const uploadsDir = path.join(__dirname, 'uploads');
const editedPdfsDir = path.join(__dirname, 'edited_pdfs');

// Buat direktori jika belum ada
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(editedPdfsDir)) {
  fs.mkdirSync(editedPdfsDir);
}

// Konfigurasi Multer untuk upload file
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Tambahkan timestamp pada nama file
  },
});
const upload = multer({ storage });


try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'node_modules/pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).toString();
} catch (error) {
  console.error('Error setting workerSrc:', error);
}


// Endpoint utama
app.get('/', (req, res) => {
  res.send('Server PDF Editor Berjalan!');
});

// Endpoint untuk mengunggah PDF sementara
app.post('/api/upload-pdf', upload.single('pdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file PDF yang diunggah.' });
    }
    res.json({ success: true, filename: req.file.originalname });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fungsi untuk mengambil data PDF
async function extractPdfData(pdfPath) {
  try {
    const data = await getDocument(pdfPath).promise;
    const pages = [];
    for (let i = 1; i <= data.numPages; i++) {
      const page = await data.getPage(i);
      const textContent = await page.getTextContent();
      pages.push(textContent.items.map(item => item.str).join(' '));
    }
    return pages;
  } catch (error) {
    console.error('Error extracting PDF data:', error);
    throw new Error('Terjadi kesalahan saat mengambil data PDF.');
  }
}

// Endpoint untuk mengambil data PDF
app.get('/api/pdf-data/:filename', async (req, res) => {
  try {
    const pdfPath = path.join(uploadsDir, req.params.filename);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'File PDF tidak ditemukan.' });
    }

    const pdfData = await extractPdfData(pdfPath);
    res.json({ data: pdfData, numPages: pdfData.length });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk menyimpan PDF yang telah diedit
app.post('/api/save-pdf', express.json(), (req, res) => {
  try {
    const modifiedPagesData = req.body.data;
    const originalFilename = req.body.originalFilename;

    // Validasi data yang dimodifikasi
    if (!Array.isArray(modifiedPagesData) || !originalFilename) {
      return res.status(400).json({ error: 'Data tidak valid.' });
    }

    const fileName = `edited_${Date.now()}_${originalFilename}`;
    const filePath = path.join(editedPdfsDir, fileName);

    // TODO: Implementasikan logika untuk membuat PDF baru berdasarkan modifiedPagesData
    // dan simpan ke filePath

    res.json({ success: true, filename: fileName });
  } catch (error) {
    console.error('Error saving PDF:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat menyimpan PDF.' });
  }
});

app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});
