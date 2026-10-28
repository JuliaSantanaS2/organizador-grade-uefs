import { esc, pluralizar } from '../../utils/dom.js';
import { icone } from '../../utils/icons.js';
import { formatarDuracao } from '../time.js';
import { htmlHorarios, htmlProfessores } from './partials.js';

/** Painel inferior com as disciplinas escolhidas. */
export function renderPainelSelecionadas(container, selecionadas, mapaConflitos, { aberto }) {
  const cargaTotal = selecionadas.reduce((s, t) => s + t.cargaSemanalMin, 0);
  const qtdConflitos = selecionadas.filter((t) => mapaConflitos.get(t.id)?.size).length;

  container.classList.toggle('is-aberto', aberto);
  container.innerHTML = `
    <div class="painel__barra">
      <button type="button" class="painel__toggle" data-acao="toggle-painel" aria-expanded="${aberto}" aria-controls="painel-conteudo">
        ${icone('chevron', 'painel__chevron')}
        <span class="painel__titulo">Disciplinas selecionadas</span>
        <span class="painel__contador">${selecionadas.length}</span>
      </button>
      <div class="painel__stats">
        <span class="badge badge--cyan">${icone('relogio')} ${formatarDuracao(cargaTotal)}/semana</span>
        ${
          qtdConflitos
            ? `<span class="badge badge--danger">${icone('alerta')} ${pluralizar(qtdConflitos, 'turma', 'turmas')} em conflito</span>`
            : selecionadas.length
              ? `<span class="badge badge--success">${icone('check')} Sem conflitos</span>`
              : ''
        }
      </div>
      <button type="button" class="btn btn--sm btn--danger" id="btn-limpar-tudo" data-acao="limpar" ${selecionadas.length ? '' : 'disabled'}>
        ${icone('lixeira')} <span class="ocultar-mobile">Limpar tudo</span>
      </button>
    </div>
    <div class="painel__conteudo" id="painel-conteudo" ${aberto ? '' : 'hidden'}>
      ${
        selecionadas.length
          ? `<div class="painel__lista">${selecionadas.map((t) => cardSelecionada(t, mapaConflitos)).join('')}</div>`
          : `<div class="estado-vazio">${icone('livro')}<span>Nenhuma disciplina selecionada ainda.</span></div>`
      }
    </div>`;
}

function cardSelecionada(turma, mapaConflitos) {
  const d = turma.disciplina;
  const choques = mapaConflitos.get(turma.id);
  return `
    <article class="sel ${choques?.size ? 'tem-conflito' : ''}" style="--h:${d.matiz}">
      <div class="sel__topo">
        <button type="button" class="sel__titulo" data-acao="focar" data-codigo="${esc(d.codigo)}" title="Ver na lista">
          <span class="sel__codigo">${esc(d.codigo)} · ${esc(turma.numero)}</span>
          <span class="sel__nome">${esc(d.nome)}</span>
        </button>
        <button type="button" class="btn btn--icon btn--sm btn--ghost btn--danger" data-acao="remover" data-codigo="${esc(d.codigo)}" aria-label="Remover ${esc(d.nome)}">${icone('x')}</button>
      </div>
      <div class="sel__badges">
        <span class="badge badge--violet">${esc(d.categoria)}</span>
        ${turma.semHorario ? '<span class="badge badge--warning">Fora da agenda</span>' : ''}
      </div>
      ${htmlHorarios(turma, { compacto: true })}
      ${htmlProfessores(turma)}
      ${choques?.size ? `<p class="turma__aviso">${icone('alerta')}<span>Conflito com ${esc([...choques].join(', '))}</span></p>` : ''}
    </article>`;
}
