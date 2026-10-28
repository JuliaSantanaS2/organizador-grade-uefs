import { esc } from '../../utils/dom.js';
import { icone } from '../../utils/icons.js';
import { NOME_DIA, NOME_TURNO } from '../time.js';

/** Fragmentos HTML reutilizados por lista, painel e modal. */

export function htmlHorarios(turma, { compacto = false } = {}) {
  if (turma.semHorario) {
    return `<p class="info-linha info-linha--aviso">${icone('relogio')} Horário a definir</p>`;
  }
  return `<ul class="horarios ${compacto ? 'horarios--compacto' : ''}">
    ${turma.horarios
      .map(
        (h) => `<li>
          <span class="horarios__dia">${esc(compacto ? h.dia : NOME_DIA[h.dia])}</span>
          <span class="horarios__hora">${esc(h.inicio)}–${esc(h.fim)}</span>
          <span class="horarios__local ${h.local === 'A definir' ? 'is-indefinido' : ''}">${icone('local')}${esc(h.local)}</span>
        </li>`
      )
      .join('')}
  </ul>`;
}

export function htmlProfessores(turma) {
  const texto = turma.professores.length ? turma.professores.join(', ') : 'Professor(a) a definir';
  return `<p class="info-linha ${turma.professores.length ? '' : 'is-indefinido'}">${icone('usuario')}<span>${esc(texto)}</span></p>`;
}

export function htmlTurnos(turnos) {
  return turnos.map((t) => `<span class="badge badge--turno badge--${t}">${NOME_TURNO[t]}</span>`).join('');
}
