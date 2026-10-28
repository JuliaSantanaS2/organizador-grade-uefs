import { icone } from '../utils/icons.js';

/**
 * Espaço reservado para a Aplicação 2.
 * Quando for desenvolvida, substitua esta view pela implementação real
 * (ex.: views/aplicacao2.js) e atualize a rota em main.js.
 */
export function montarEmBreve(raiz) {
  const view = document.createElement('section');
  view.className = 'pagina-centro container';
  view.innerHTML = `
    <div class="em-breve glass">
      <div class="em-breve__capa">
        <img src="assets/capa-em-breve.jpg" alt="" />
      </div>
      <div class="em-breve__conteudo">
        <span class="badge badge--warning">${icone('cadeado')} Em desenvolvimento</span>
        <h1 class="em-breve__titulo">Aplicação 2 <span class="text-gradient">em breve</span></h1>
        <p class="em-breve__texto">Este espaço já está reservado no Hub. Uma nova ferramenta acadêmica será publicada aqui em uma próxima versão.</p>
        <div class="em-breve__acoes">
          <a href="#/" class="btn">${icone('voltar')} Voltar ao Hub</a>
          <a href="#/grade" class="btn btn--primary">${icone('calendario')} Abrir Organizador de Grade</a>
        </div>
      </div>
    </div>`;
  raiz.appendChild(view);
}
