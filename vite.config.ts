import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "lycoris",
      fileName: "lycoris",
    },
    rollupOptions: {
      external: ["vue-demi"],
      output: {
        globals: {
          "vue-demi": "VueDemi",
        },
      },
    },
  },
});
