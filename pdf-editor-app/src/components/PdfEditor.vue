<template>
  <canvas ref="pdfCanvas"></canvas>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="error">{{ error }}</div>
  <div v-else>
    <canvas ref="fabricCanvas"></canvas>
    <button @click="saveChanges">Simpan Perubahan</button>
  </div>
</template>

<script>
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { fabric } from 'fabric';
import axios from 'axios';

export default {
  data() {
    return {
      pdfData: null,
      isLoading: true,
      error: null,
      fabricCanvas: null,
    };
  },
  async mounted() {
    await this.fetchPdfData();
  },
  methods: {
    async fetchPdfData() {
      try {
        const response = await axios.get('/api/pdf-data/your-file.pdf'); // Sesuaikan dengan endpoint API Anda
        this.pdfData = response.data.data;
        this.renderPdf();
      } catch (error) {
        this.error = 'Terjadi kesalahan saat memuat PDF';
        console.error(error);
      } finally {
        this.isLoading = false;
      }
    },
    async renderPdf() {
        pdfjsLib.getDocument({ data: this.pdfData }).promise.then(pdf => {
          // Ambil halaman pertama (bisa dimodifikasi)
          pdf.getPage(1).then(page => {
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = this.$refs.pdfCanvas
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            page.render({canvasContext: context, viewport: viewport});
            this.initializeFabricCanvas();
          });
        });
      },
    initializeFabricCanvas() {
      this.fabricCanvas = new fabric.Canvas(this.$refs.fabricCanvas);
      // ... (add text and image objects from PDF to the Fabric canvas)
    },
    saveChanges() {
      const modifiedPdfData = this.fabricCanvas.toJSON(); // Dapatkan data yang diubah dari Fabric.js
      try {
        axios.post('/api/save-pdf', { data: modifiedPdfData })
          .then(response => {
            console.log(response);
            // ... (handle successful save)
          })
          .catch(error => {
            console.error(error);
            // ... (handle save error)
          });
      } catch (error) {
        console.error("Error getting modified data:", error);
        // ... (handle errors getting modified data)
      }
    },
  },
};
</script>

