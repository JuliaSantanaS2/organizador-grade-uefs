import { esc, pluralizar } from '../../utils/dom.js';
import { icone } from '../../utils/icons.js';
import { NOME_TIPO } from '../normalizer.js';
import { formatarDuracao } from '../time.js';
import { calcularHorariosLivres, sugerirDisciplinas } from '../suggestions.js';
import { haFiltrosAtivos } from '../filters.js';
import { htmlHorarios, htmlProfessores, htmlTurnos } from './partials.js';

const JANELA_MINIMA = 60; // só exibe janelas livres de pelo menos 1h

/**
 * Modal de sugestões para horários vagos.
 * Recalcula automaticamente quando a grade muda (ex.: ao adicionar uma sugestão).
 */
export function abrirModalSugestoes({ dados, store, obterFiltros, aoAdicionar }) {
  const dialog = document.createElement('dialog');
  dialog.className = 'modal modal--sugestoes';
  dialog.setAttribute('aria-labelledby', 'sugestoes-titulo');
  document.body.appendChild(dialog);

  function render() {
    const selecionadas = store.obterSelecionadas();
    const filtros = obterFiltros();
    const sugestoes = sugerirDisciplinas(dados.disciplinas, selecionadas, filtros);
    const livres = calcularHorariosLivres(selecionadas).filter((d) => d.dia !== 'DOM');
    const rolagem = dialog.querySelector('.modal__body')?.scrollTop ?? 0;

    dialog.innerHTML = `
      <div class="modal__header">
        <div>
          <h2 class="modal__title" id="sugestoes-titulo">${icone('brilho', 'icone-titulo')} Sugestões para horários vagos</h2>
          <p class="modal__subtitle">
            Turmas que cabem na sua grade <strong>sem nenhum conflito</strong>.
            ${
              haFiltrosAtivos(filtros)
                ? `<span class="badge badge--cyan">${icone('filtro')} Filtros ativos aplicados</span>`
                : '<span class="badge">Considerando todas as disciplinas</span>'
            }
          </p>
        </div>
        <button type="button" class="btn btn--icon btn--ghost" data-acao="fechar" aria-label="Fechar">${icone('x')}</button>
      </div>
      <div class="modal__body">
        <h3 class="sug__secao">Seus horários livres (Seg–Sáb, 07:30–23:00)</h3>
        <div class="livres">
          ${livres
            .map((d) => {
              const janelas = d.janelas.filter((j) => j.minutos >= JANELA_MINIMA);
              return `<div class="livres__dia">
                <span class="livres__nome">${d.nome}</span>
                <span class="livres__janelas">
                  ${
                    janelas.length
                      ? janelas.map((j) => `<span class="livres__janela">${j.inicio}–${j.fim} <small>${formatarDuracao(j.minutos)}</small></span>`).join('')
                      : '<span class="livres__cheio">Sem janelas livres</span>'
                  }
                </span>
              </div>`;
            })
            .join('')}
        </div>

        <h3 class="sug__secao">${pluralizar(sugestoes.length, 'disciplina se encaixa', 'disciplinas se encaixam')}</h3>
        ${
          sugestoes.length
            ? `<div class="sug__lista">${sugestoes.map(cardSugestao).join('')}</div>`
            : `<div class="estado-vazio">${icone('calendario')}<strong>Nenhuma turma cabe nos horários vagos</strong><span>Tente remover filtros ou liberar horários na grade.</span></div>`
        }
      </div>`;

    const corpo = dialog.querySelector('.modal__body');
    if (corpo) corpo.scrollTop = rolagem;
  }

  const cancelarAssinatura = store.assinar(render);

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.closest('[data-acao="fechar"]')) {
      dialog.close();
      return;
    }
    const botao = e.target.closest('[data-acao="adicionar"]');
    if (botao) aoAdicionar(botao.dataset.turma);
  });

  dialog.addEventListener('close', () => {
    cancelarAssinatura();
    dialog.remove();
  });

  render();
  dialog.showModal();
  return () => dialog.open && dialog.close();
}

function cardSugestao({ disciplina, turmas }) {
  return `
    <article class="sug" style="--h:${disciplina.matiz}">
      <header class="sug__cabecalho">
        <span class="disc__codigo">${esc(disciplina.codigo)}</span>
        <span class="badge badge--violet">${esc(disciplina.categoria)}</span>
        <span class="badge">${esc(NOME_TIPO[disciplina.tipo])}</span>
      </header>
      <h4 class="sug__nome">${esc(disciplina.nome)}</h4>
      <div class="sug__turmas">
        ${turmas
          .map(
            (t) => `
          <div class="sug__turma">
            <div class="turma__topo">
              <span class="turma__numero">${esc(t.numero)}</span>
              <span class="turma__turnos">${htmlTurnos(t.turnos)}</span>
              <button type="button" class="btn btn--sm btn--primary" data-acao="adicionar" data-turma="${esc(t.id)}">${icone('mais')} Adicionar</button>
            </div>
            ${htmlHorarios(t, { compacto: true })}
            ${htmlProfessores(t)}
          </div>`
          )
          .join('')}
      </div>
    </article>`;
}
