import { esc } from '../../utils/dom.js';
import { icone } from '../../utils/icons.js';
import { AGENDA_FIM, AGENDA_INICIO, AGENDA_PASSO, DIAS, paraHHMM } from '../time.js';

const SIGLA_HOJE = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'][new Date().getDay()];

/**
 * Agenda semanal SEG–DOM, 07:30–23:00.
 * mapaConflitos: Map<turmaId, Set<codigo>> vindo de mapearConflitos().
 */
export function renderAgenda(container, selecionadas, mapaConflitos) {
  const totalSlots = (AGENDA_FIM - AGENDA_INICIO) / AGENDA_PASSO;

  const eventosPorDia = Object.fromEntries(DIAS.map((d) => [d.sigla, []]));
  for (const turma of selecionadas) {
    for (const h of turma.horarios) {
      const inicio = Math.max(h.inicioMin, AGENDA_INICIO);
      const fim = Math.min(h.fimMin, AGENDA_FIM);
      if (fim <= inicio) continue;
      eventosPorDia[h.dia].push({ turma, horario: h, inicio, fim });
    }
  }

  const rotulos = [];
  for (let i = 0; i <= totalSlots; i++) {
    const minutos = AGENDA_INICIO + i * AGENDA_PASSO;
    const cheia = minutos % 60 === 0;
    rotulos.push(
      `<span class="agenda__hora ${cheia ? 'is-cheia' : ''}" style="--i:${i}">${paraHHMM(minutos)}</span>`
    );
  }

  const vazio = selecionadas.every((t) => t.semHorario);

  container.innerHTML = `
    <div class="agenda" style="--slots:${totalSlots}">
      <div class="agenda__canto"></div>
      ${DIAS.map(
        (d) => `<div class="agenda__dia-titulo ${d.sigla === SIGLA_HOJE ? 'is-hoje' : ''}">
          <span class="agenda__dia-nome">${d.nome}</span><span class="agenda__dia-curto">${d.curto}</span>
        </div>`
      ).join('')}
      <div class="agenda__horas">${rotulos.join('')}</div>
      ${DIAS.map(
        (d) => `<div class="agenda__coluna ${d.sigla === SIGLA_HOJE ? 'is-hoje' : ''}" data-dia="${d.sigla}">
          ${distribuirColunas(eventosPorDia[d.sigla]).map((ev) => htmlEvento(ev, mapaConflitos)).join('')}
        </div>`
      ).join('')}
      ${
        vazio
          ? `<div class="agenda__vazia">
              ${icone('calendario')}
              <strong>Sua semana está livre</strong>
              <span>Escolha disciplinas na lista para montar sua grade.</span>
            </div>`
          : ''
      }
    </div>`;
}

/**
 * Distribui eventos sobrepostos lado a lado (como no Google Agenda),
 * para que conflitos fiquem visíveis em vez de um bloco esconder o outro.
 */
function distribuirColunas(eventos) {
  const ordenados = [...eventos].sort((a, b) => a.inicio - b.inicio || b.fim - a.fim);
  const resultado = [];
  let grupo = [];
  let fimDoGrupo = -1;

  const fecharGrupo = () => {
    const fimPorColuna = [];
    for (const ev of grupo) {
      let col = fimPorColuna.findIndex((fim) => fim <= ev.inicio);
      if (col === -1) {
        col = fimPorColuna.length;
        fimPorColuna.push(0);
      }
      fimPorColuna[col] = ev.fim;
      ev.coluna = col;
    }
    grupo.forEach((ev) => (ev.totalColunas = fimPorColuna.length));
    resultado.push(...grupo);
    grupo = [];
  };

  for (const ev of ordenados) {
    if (grupo.length && ev.inicio >= fimDoGrupo) fecharGrupo();
    grupo.push(ev);
    fimDoGrupo = Math.max(fimDoGrupo, ev.fim);
  }
  if (grupo.length) fecharGrupo();
  return resultado;
}

function htmlEvento({ turma, horario, inicio, fim, coluna, totalColunas }, mapaConflitos) {
  const d = turma.disciplina;
  const choques = mapaConflitos.get(turma.id);
  const emConflito = !!choques?.size;
  const duracaoSlots = (fim - inicio) / AGENDA_PASSO;
  const titulo = [
    `${d.codigo} ${turma.numero} — ${d.nome}`,
    `${horario.inicio}–${horario.fim} · ${horario.local}`,
    turma.professores.join(', '),
    emConflito ? `Conflito com: ${[...choques].join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return `
    <div class="evento ${emConflito ? 'evento--conflito' : ''} ${duracaoSlots <= 2 ? 'evento--curto' : ''}"
         style="--inicio:${(inicio - AGENDA_INICIO) / AGENDA_PASSO};--dur:${duracaoSlots};--col:${coluna};--cols:${totalColunas};--h:${d.matiz}"
         title="${esc(titulo)}" data-acao="focar" data-codigo="${esc(d.codigo)}">
      <button type="button" class="evento__remover" data-acao="remover" data-codigo="${esc(d.codigo)}" aria-label="Remover ${esc(d.nome)}">${icone('x')}</button>
      <span class="evento__codigo">${esc(d.codigo)} · ${esc(turma.numero)}</span>
      <span class="evento__nome">${esc(d.nome)}</span>
      <span class="evento__hora">${esc(horario.inicio)}–${esc(horario.fim)}</span>
      <span class="evento__local">${esc(horario.local)}</span>
      ${emConflito ? `<span class="evento__alerta">${icone('alerta')} ${esc([...choques].join(', '))}</span>` : ''}
    </div>`;
}
