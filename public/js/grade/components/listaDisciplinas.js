import { esc, pluralizar } from '../../utils/dom.js';
import { icone } from '../../utils/icons.js';
import { NOME_TIPO } from '../normalizer.js';
import { NOME_TURNO } from '../time.js';
import { conflitosDaCandidata } from '../conflicts.js';
import { htmlHorarios, htmlProfessores, htmlTurnos } from './partials.js';

/**
 * Lista de disciplinas agrupadas, com as turmas de cada uma.
 * itens: [{ disciplina, turmas }] (já filtrados)
 */
export function renderListaDisciplinas(container, itens, { store, expandidas }) {
  if (!itens.length) {
    container.innerHTML = `
      <div class="estado-vazio">
        ${icone('busca')}
        <strong>Nenhuma disciplina encontrada</strong>
        <span>Ajuste a busca ou os filtros.</span>
      </div>`;
    return;
  }

  const selecionadas = store.obterSelecionadas();
  container.innerHTML = itens
    .map((item) => cardDisciplina(item, { store, selecionadas, aberta: expandidas.has(item.disciplina.codigo) }))
    .join('');
}

function cardDisciplina({ disciplina, turmas }, { store, selecionadas, aberta }) {
  const escolhida = store.turmaSelecionadaDe(disciplina.codigo);
  const ocultas = disciplina.turmas.length - turmas.length;
  const turnos = disciplina.turnos.map((t) => NOME_TURNO[t]).join(' · ') || 'Horário a definir';

  return `
    <article class="disc ${escolhida ? 'is-selecionada' : ''} ${aberta ? 'is-aberta' : ''}"
             style="--h:${disciplina.matiz}" data-codigo="${esc(disciplina.codigo)}" id="disc-${esc(disciplina.codigo)}">
      <button type="button" class="disc__cabecalho" data-acao="expandir" data-codigo="${esc(disciplina.codigo)}"
              aria-expanded="${aberta}" aria-controls="turmas-${esc(disciplina.codigo)}">
        <span class="disc__cor" aria-hidden="true"></span>
        <span class="disc__info">
          <span class="disc__linha">
            <span class="disc__codigo">${esc(disciplina.codigo)}</span>
            <span class="badge badge--violet">${esc(disciplina.categoria)}</span>
            ${escolhida ? `<span class="badge badge--success">${icone('check')} ${esc(escolhida.numero)}</span>` : ''}
          </span>
          <span class="disc__nome">${esc(disciplina.nome)}</span>
          <span class="disc__meta">${esc(NOME_TIPO[disciplina.tipo])} · ${pluralizar(disciplina.turmas.length, 'turma')} · ${esc(turnos)}</span>
        </span>
        ${icone('chevron', 'disc__chevron')}
      </button>
      ${
        aberta
          ? `<div class="disc__turmas" id="turmas-${esc(disciplina.codigo)}">
              ${turmas.map((t) => cardTurma(t, escolhida, selecionadas)).join('')}
              ${ocultas > 0 ? `<p class="disc__ocultas">${pluralizar(ocultas, 'turma oculta', 'turmas ocultas')} pelo filtro de turno</p>` : ''}
            </div>`
          : ''
      }
    </article>`;
}

function cardTurma(turma, escolhida, selecionadas) {
  const ehEscolhida = escolhida?.id === turma.id;
  const choques = ehEscolhida ? [] : conflitosDaCandidata(turma, selecionadas);

  let botao;
  if (ehEscolhida) {
    botao = `<button type="button" class="btn btn--sm btn--danger" data-acao="remover" data-codigo="${esc(turma.disciplina.codigo)}">${icone('x')} Remover</button>`;
  } else if (escolhida) {
    botao = `<button type="button" class="btn btn--sm" data-acao="adicionar" data-turma="${esc(turma.id)}" title="Substitui a ${esc(escolhida.numero)} na sua grade">${icone('trocar')} Trocar</button>`;
  } else {
    botao = `<button type="button" class="btn btn--sm btn--primary" data-acao="adicionar" data-turma="${esc(turma.id)}">${icone('mais')} Adicionar</button>`;
  }

  const aviso = choques.length
    ? `<p class="turma__aviso">${icone('alerta')}<span>Choca com ${choques
        .map((c) => `<strong>${esc(c.disciplina.codigo)}</strong> ${esc(c.disciplina.nome)}`)
        .join(', ')}</span></p>`
    : '';

  return `
    <div class="turma ${ehEscolhida ? 'is-selecionada' : ''} ${choques.length ? 'tem-conflito' : ''}">
      <div class="turma__topo">
        <span class="turma__numero">${esc(turma.numero)}</span>
        <span class="turma__turnos">${htmlTurnos(turma.turnos)}</span>
        ${botao}
      </div>
      ${htmlHorarios(turma)}
      ${htmlProfessores(turma)}
      ${aviso}
    </div>`;
}
