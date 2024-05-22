<template>
  <div>
    <input type="file" @change="handleFileChange" accept=".pdf" />
    <canvas ref="pdfCanvas"></canvas>
    <div v-if="isLoading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else>
      <canvas ref="fabricCanvas"></canvas>
      <button @click="saveChanges">Simpan Perubahan</button>
    </div>
  </div>
</template>

<script>
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import { fabric } from "fabric";
import axios from "axios";

export default {
  data() {
    return {
      pdfData: null,
      isLoading: false,
      error: null,
      fabricCanvas: null,
      scale: 1.5,
    };
  },
  methods: {
    handleFileChange(event) {
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append('pdf', file);

      axios.post('/api/save-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
        .then(response => {
          this.fetchPdfData(response.data.filename); // Ambil data PDF setelah upload
        })
        .catch(error => {
          console.error('Error uploading PDF:', error);
        });
    },
    async fetchPdfData(filename) {
      this.isLoading = true;
      try {
        const response = await axios.get(`/api/pdf-data/${filename}`);
        this.pdfData = response.data.data;
        this.renderPdf();
      } catch (error) {
        this.error = "Terjadi kesalahan saat memuat PDF";
        console.error(error);
      } finally {
        this.isLoading = false;
      }
    },
    renderPdf() {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "//mozilla.github.io/pdf.js/build/pdf.worker.js";
      pdfjsLib.getDocument({ data: this.pdfData }).promise.then((pdf) => {
        pdf.getPage(1).then((page) => {
          const viewport = page.getViewport({ scale: this.scale });
          const canvas = this.$refs.pdfCanvas;
          const context = canvas.getContext("2d");
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          page.render({ canvasContext: context, viewport }).promise.then(() => {
            this.initializeFabricCanvas(page);
          });
        });
      });
    },
    initializeFabricCanvas(page) {
      const viewport = page.getViewport({ scale: this.scale });
      this.fabricCanvas = new fabric.Canvas(this.$refs.fabricCanvas, {
        height: viewport.height,
        width: viewport.width,
      });

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
          this.fabricCanvas.add(fabricRect);
        });
      });

      // ... (tambahkan logika untuk mengambil teks/gambar dari PDF dan tambahkan ke Fabric.js)
    },
    saveChanges() {
  this.isLoading = true; // Set loading to true before the request
  const modifiedPdfData = JSON.stringify(this.fabricCanvas.toJSON());

  const blob = new Blob([modifiedPdfData], { type: 'application/pdf' });
  const file = new File([blob], 'modified.pdf', { type: 'application/pdf' });

  const formData = new FormData();
  formData.append('pdf', file);
  try {
    axios.post('http://localhost:3001/api/save-pdf', formData, { // Perhatikan URL yang sesuai
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(response => {
        console.log(response);
        this.isLoading = false;
      })
      .catch(error => {
        console.error(error);
        this.error = error.response.data.error || 'Terjadi kesalahan saat menyimpan PDF';
        this.isLoading = false;
      });
  } catch (error) {
    console.error("Error getting modified data:", error);
    this.error = 'Terjadi kesalahan saat mengolah data PDF';
    this.isLoading = false;
  }
},



  },
};
</script>
