<template>
  <div>
    <input type="file" @change="handleFileChange" accept=".pdf" />
    <div v-if="isLoading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else class="pdf-container">
      <div v-for="(pageData, index) in pdfData" :key="index" class="page">
        <canvas :ref="'pdfCanvas' + index" :id="'pdfCanvas' + index"></canvas>
        <canvas :ref="'fabricCanvas' + index" :id="'fabricCanvas' + index" @click="handleFabricCanvasClick(index)"></canvas>
        <div v-if="selectedCanvasIndex === index" class="text-editor">
          <input type="text" v-model="currentText" @blur="updateText(index)">
        </div>
      </div>
    </div>
    <button v-if="!isLoading && !error && pdfData.length > 0" @click="saveChanges">Simpan Perubahan</button>
  </div>
</template>

<script>
import * as pdfjsLib from "pdfjs-dist";
import { fabric } from "fabric";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:3001";

export default {
  data() {
    return {
      pdfFile: null,
      pdfData: [],
      totalPages: 0,
      isLoading: false,
      error: null,
      fabricCanvases: [],
      scale: 1.5,
      selectedCanvasIndex: null,
      currentText: "",
      showEditor: false, // Variabel untuk mengontrol tampilan editor
    };
  },
  methods: {
    handleFileChange(event) {
      this.isLoading = true;
      this.error = null;
      this.pdfData = [];
      this.fabricCanvases = [];

      this.pdfFile = event.target.files[0];

      const formData = new FormData();
      formData.append("pdf", this.pdfFile);

      axios
        .post("/api/upload-pdf", formData, { // Kirim ke endpoint upload
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((response) => {
          console.log("Upload PDF berhasil:", response.data.filename);
          this.fetchPdfData(response.data.filename);
        })
        .catch((error) => {
          this.error = "Terjadi kesalahan saat mengunggah PDF";
          console.error("Error uploading PDF:", error);
          this.isLoading = false;
        });
    },
    async fetchPdfData(filename) {
      this.isLoading = true;
      try {
        console.log('Fetching PDF data with filename:', filename); // Logging
        const response = await axios.get(`/api/pdf-data/${filename}`);
        console.log('PDF data received:', response.data); // Logging
        this.pdfData = response.data.data;
        this.totalPages = response.data.numPages;
        await this.renderPdf();
      } catch (error) {
        this.error = this.handleError(error);
        console.error('Error details:', error.response);
      } finally {
        this.isLoading = false;
      }
    },

    async renderPdf() {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "//mozilla.github.io/pdf.js/build/pdf.worker.js";

      const promises = [];
      for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
        promises.push(this.renderPage(pageNum));
      }

      await Promise.all(promises);
    },

    async renderPage(pageNum) {
      try {
        const page = await this.pdfData.getPage(pageNum); // Mendapatkan halaman dari pdfData
        const viewport = page.getViewport({ scale: this.scale });
        const canvas = this.$refs['pdfCanvas' + (pageNum - 1)][0];
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport }).promise;
      } catch (error) {
        console.error('Error rendering page:', error); // Logging jika terjadi error saat merender halaman
      }
    },


    handleError(error) {
      if (error.response && error.response.status === 404) {
        return "File PDF tidak ditemukan";
      } else if (error.response) {
        return "Terjadi kesalahan pada server: " + error.response.status;
      } else if (error.request) {
        return "Tidak ada respons dari server";
      } else {
        return "Terjadi kesalahan yang tidak diketahui";
      }
    },

    initializeFabricCanvas(page, pageNum, images) {
      const viewport = page.getViewport({ scale: this.scale });
      const fabricCanvasId = `fabricCanvas-${pageNum}`;
      const fabricCanvas = this.$refs[fabricCanvasId][0];

      const fabricInstance = new fabric.Canvas(fabricCanvas, {
        height: viewport.height,
        width: viewport.width,
      });
      this.fabricCanvases.push(fabricInstance);

      // Add text objects from the PDF to the Fabric.js canvas
      page.getAnnotations().then((annotations) => {
        annotations.forEach((annotation) => {
          const { x, y, width, height } = annotation.rect;
          const fabricRect = new fabric.Rect({
            left: x,
            top: y,
            width,
            height,
            fill: "transparent",
            stroke: "blue",
            strokeWidth: 1,
          });
          fabricInstance.add(fabricRect);
        });
      });

      // Add text objects from the PDF to the Fabric.js canvas
      page.getTextContent().then((items) => {
        items.items.forEach((item) => {
          const text = new fabric.Textbox(item.str, {
            left: item.transform[4],
            top: item.transform[5],
            width: item.width,
            fontSize: item.transform[0],
            fontFamily: item.fontName,
            fill: item.color,
          });
          fabricInstance.add(text);
          text.on("selected", () => {
            this.selectedCanvasIndex = pageNum - 1; // Set indeks saat teks dipilih
            this.currentText = text.text;
          });
        });
      });

      // Add images to Fabric.js canvas
      images.forEach((imageSrc) => {
        fabric.Image.fromURL(imageSrc, (img) => {
          img.set({
            left: 0, // Atur posisi gambar sesuai kebutuhan Anda
            top: 0,
            scaleX: viewport.width / img.width, // Sesuaikan ukuran gambar dengan viewport
            scaleY: viewport.height / img.height,
          });
          fabricInstance.add(img);
        });
      });
    },
    handleFabricCanvasClick(index) {
      this.selectedCanvasIndex = index;
    },
    updateText(index) {
      const canvas = this.fabricCanvases[index];
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === "textbox") {
        activeObject.set("text", this.currentText);
        canvas.renderAll();
      }
    },

    async saveChanges() {
  this.isLoading = true;

  try {
    // Mengumpulkan data dari setiap canvas Fabric.js
    const modifiedPages = this.fabricCanvases.map(canvas => canvas.toJSON());

    // Buat FormData
    const formData = new FormData();
    // Pastikan data yang dikirimkan sesuai dengan yang dibutuhkan di backend
    formData.append('modifiedPages', JSON.stringify(modifiedPages));

    const response = await axios.post('/api/save-pdf', formData, { // Ganti URL jika perlu
      headers: {
        'Content-Type': 'multipart/form-data' // Tetapkan header Content-Type
      }
    });

    console.log(response.data); 

  } catch (error) {
    this.error = this.handleError(error);
    console.error('Error saving changes:', error.response);
  } finally {
    this.isLoading = false;
  }
}

// ... (sisa kode)

  },
};
</script>

<style>
/* Tambahkan gaya CSS sesuai kebutuhan */
.pdf-container {
  display: flex;
  flex-direction: column;
}

.page {
  position: relative;
}
.page canvas {
  border: 1px solid #ccc;
}
</style>
