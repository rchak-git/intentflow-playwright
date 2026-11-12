import path from 'path';

export default {
  root: __dirname,
  build: {
    outDir: path.join(__dirname, 'dist'),
    emptyOutDir: true,
  },
};
