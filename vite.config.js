import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import wasm from 'vite-plugin-wasm';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  plugins: [wasm()],
  root: 'public',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        index:       resolve(__dirname, 'public/index.html'),
        addBeer:     resolve(__dirname, 'public/addBeer.html'),
        editBeer:    resolve(__dirname, 'public/editBeer.html'),
        beerDetails: resolve(__dirname, 'public/beerDetails.html'),
      }
    }
  }
}
