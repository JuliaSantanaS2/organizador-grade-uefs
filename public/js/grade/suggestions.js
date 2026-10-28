import { AGENDA_FIM, AGENDA_INICIO, DIAS, paraHHMM } from './time.js';
import { conflitosDaCandidata } from './conflicts.js';
import { disciplinaPassa, haFiltrosAtivos, turmaPassa } from './filters.js';

/**
 * Janelas livres de cada dia dentro da agenda (07:30–23:00), considerando a grade atual.
 * Retorna [{ dia, nome, janelas: [{ inicio, fim, minutos }] }]
 */
export function calcularHorariosLivres(selecionadas) {
  return DIAS.map(({ sigla, nome }) => {
    const ocupados = selecionadas
      .flatMap((t) => t.horarios)
      .filter((h) => h.dia === sigla)
      .map((h) => [Math.max(h.inicioMin, AGENDA_INICIO), Math.min(h.fimMin, AGENDA_FIM)])
      .filter(([i, f]) => f > i)
      .sort((x, y) => x[0] - y[0]);

    const janelas = [];
    let cursor = AGENDA_INICIO;
    for (const [i, f] of ocupados) {
      if (i > cursor) janelas.push(criarJanela(cursor, i));
      cursor = Math.max(cursor, f);
    }
    if (cursor < AGENDA_FIM) janelas.push(criarJanela(cursor, AGENDA_FIM));

    return { dia: sigla, nome, janelas };
  });
}

function criarJanela(inicio, fim) {
  return { inicio: paraHHMM(inicio), fim: paraHHMM(fim), minutos: fim - inicio };
}

/**
 * Sugere turmas que cabem inteiramente nos horários vagos (zero conflito).
 * - Ignora disciplinas que já estão na grade e turmas sem horário definido.
 * - Se houver filtros ativos, respeita-os; caso contrário considera todas as disciplinas.
 * Retorna [{ disciplina, turmas }] ordenado por semestre/categoria.
 */
export function sugerirDisciplinas(disciplinas, selecionadas, filtros) {
  const usarFiltros = haFiltrosAtivos(filtros);
  const codigosNaGrade = new Set(selecionadas.map((t) => t.disciplina.codigo));
  const sugestoes = [];

  for (const disciplina of disciplinas) {
    if (codigosNaGrade.has(disciplina.codigo)) continue;
    if (usarFiltros && !disciplinaPassa(disciplina, filtros)) continue;

    const turmas = disciplina.turmas.filter(
      (t) =>
        !t.semHorario &&
        (!usarFiltros || turmaPassa(t, filtros)) &&
        conflitosDaCandidata(t, selecionadas).length === 0
    );
    if (turmas.length) sugestoes.push({ disciplina, turmas });
  }

  return sugestoes.sort(
    (a, b) =>
      a.disciplina.categoriaOrdem - b.disciplina.categoriaOrdem ||
      a.disciplina.nome.localeCompare(b.disciplina.nome, 'pt-BR')
  );
}
