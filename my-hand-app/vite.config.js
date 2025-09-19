import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import mkcert from 'vite-plugin-mkcert'

// export default defineConfig({
//   plugins: [react(), mkcert()],
//   server: {
//     https: true
//   }
// })
