import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // The API key is hardcoded directly into the application build process.
    'process.env.API_KEY': JSON.stringify('AIzaSyDf5hjvkNWC1CEl395DR80XNWeOnxk5Xzw')
  }
});