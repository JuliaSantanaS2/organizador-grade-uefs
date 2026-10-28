import { icone } from '../utils/icons.js';

export function montarNaoEncontrada(raiz) {
  const view = document.createElement('section');
  view.className = 'pagina-centro container';
  view.innerHTML = `
    <div class="nao-encontrada glass">
      <p class="nao-encontrada__codigo text-gradient">404</p>
      <h1>Página não encontrada</h1>
      <p class="em-breve__texto">O endereço acessado não corresponde a nenhuma aplicação do Hub.</p>
      <a href="#/" class="btn btn--primary">${icone('voltar')} Voltar ao Hub</a>
    </div>`;
  raiz.appendChild(view);
}
