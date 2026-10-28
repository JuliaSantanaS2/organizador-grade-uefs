import { APLICACOES } from '../apps.js';
import { esc } from '../utils/dom.js';
import { icone } from '../utils/icons.js';
import { contarSelecoesSalvas } from '../grade/storage.js';

export function montarHub(raiz) {
  const qtdGrade = contarSelecoesSalvas();
  const ativos = APLICACOES.filter((a) => a.status === 'ativo').length;

  const view = document.createElement('div');
  view.className = 'hub';
  view.innerHTML = `
    <header class="hub-topo container">
      <a href="#/" class="marca" aria-label="Hub de Aplicações — início">
        <span class="marca__logo">${icone('grade')}</span>
        <span class="marca__nome">Hub<span class="text-gradient">.apps</span></span>
      </a>
      <span class="badge badge--success"><span class="ponto-vivo"></span>${ativos} ${ativos === 1 ? 'app ativo' : 'apps ativos'}</span>
    </header>

    <section class="hub-hero container">
      <p class="hub-hero__eyebrow">${icone('foguete')} Sua central de ferramentas acadêmicas</p>
      <h1 class="hub-hero__titulo">Tudo o que você precisa para o <span class="text-gradient">semestre</span>, em um só lugar.</h1>
      <p class="hub-hero__texto">Escolha uma aplicação abaixo. Seus dados ficam salvos apenas no seu navegador — sem cadastro, sem servidor.</p>
    </section>

    <section class="container" aria-labelledby="titulo-biblioteca">
      <div class="hub-secao__cabecalho">
        <h2 id="titulo-biblioteca" class="hub-secao__titulo">Biblioteca</h2>
        <span class="hub-secao__contador">${APLICACOES.length} aplicações</span>
      </div>
      <div class="hub-grid">
        ${APLICACOES.map((app) => cardAplicacao(app, app.id === 'grade-semestral' ? qtdGrade : 0)).join('')}
      </div>
    </section>

    <footer class="hub-rodape container">
      <p>Feito para estudantes · Dados salvos localmente via <code>localStorage</code></p>
    </footer>
  `;

  // Efeito de inclinação 3D nos cards ativos
  const aoMover = (e) => {
    const card = e.target.closest('.app-card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
    card.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
    card.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`);
    card.style.setProperty('--my', `${((y + 0.5) * 100).toFixed(1)}%`);
  };
  const aoSair = (e) => {
    const card = e.target.closest('.app-card');
    if (!card || card.contains(e.relatedTarget)) return;
    card.style.removeProperty('--rx');
    card.style.removeProperty('--ry');
  };
  view.addEventListener('pointermove', aoMover);
  view.addEventListener('pointerout', aoSair);

  raiz.appendChild(view);
}

function cardAplicacao(app, qtdSalvas) {
  const ativo = app.status === 'ativo';
  const statusBadge = ativo
    ? `<span class="badge badge--success">${icone('check')} Disponível</span>`
    : `<span class="badge badge--warning">${icone('cadeado')} Em breve</span>`;

  const progresso =
    ativo && qtdSalvas > 0
      ? `<span class="app-card__info">${icone('livro')} ${qtdSalvas} ${qtdSalvas === 1 ? 'disciplina salva' : 'disciplinas salvas'}</span>`
      : '';

  return `
    <a href="#${esc(app.rota)}" id="card-${esc(app.id)}"
       class="app-card ${ativo ? '' : 'app-card--bloqueado'}"
       style="--destaque:${esc(app.destaque)}"
       aria-label="${esc(app.titulo)}${ativo ? '' : ' (em breve)'}">
      <div class="app-card__capa">
        <img src="${esc(app.capa)}" alt="" loading="lazy" />
        <div class="app-card__brilho"></div>
        <div class="app-card__status">${statusBadge}</div>
      </div>
      <div class="app-card__corpo">
        <div class="app-card__tags">${app.tags.map((t) => `<span class="badge">${esc(t)}</span>`).join('')}</div>
        <h3 class="app-card__titulo">${esc(app.titulo)}${ativo ? '' : ' <small>(Em breve)</small>'}</h3>
        <p class="app-card__descricao">${esc(app.descricao)}</p>
        <div class="app-card__rodape">
          ${progresso}
          <span class="app-card__acao">${ativo ? `${icone('play')} Abrir` : 'Ver detalhes'} ${icone('seta')}</span>
        </div>
      </div>
    </a>`;
}
