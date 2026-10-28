import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3000;

const app = express();

app.disable('x-powered-by');

app.use(
  express.static(PUBLIC_DIR, {
    extensions: ['html'],
    setHeaders(res, filePath) {
      // O JSON de disciplinas pode ser atualizado a cada semestre: evita cache longo
      if (filePath.endsWith('.json')) res.setHeader('Cache-Control', 'no-cache');
    },
  })
);

// Fallback: qualquer rota desconhecida devolve o SPA (o roteamento é feito via hash no front-end)
app.use((req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Hub de Aplicações rodando em http://localhost:${PORT}`);
});
