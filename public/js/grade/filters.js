import { normalizarTexto } from '../utils/dom.js';

export function criarFiltrosPadrao() {
  return { busca: '', turnos: [], semestre: '', tipo: '' };
}

export function haFiltrosAtivos(f) {
  return Boolean(f.busca.trim() || f.turnos.length || f.semestre || f.tipo);
}

/** Filtros de nível de disciplina: busca, semestre (categoria curta) e tipo. */
export function disciplinaPassa(disciplina, f) {
  if (f.semestre && disciplina.categoria !== f.semestre) return false;
  if (f.tipo && disciplina.tipo !== f.tipo) return false;
  const termo = normalizarTexto(f.busca);
  if (termo && !termo.split(/\s+/).every((p) => disciplina.textoBusca.includes(p))) return false;
  return true;
}

/** Filtro de nível de turma: turno (a turma passa se tiver aula em algum turno marcado). */
export function turmaPassa(turma, f) {
  if (!f.turnos.length) return true;
  return turma.turnos.some((t) => f.turnos.includes(t));
}

/** Retorna [{ disciplina, turmas }] contendo apenas turmas que passam nos filtros. */
export function aplicarFiltros(disciplinas, f) {
  const resultado = [];
  for (const disciplina of disciplinas) {
    if (!disciplinaPassa(disciplina, f)) continue;
    const turmas = disciplina.turmas.filter((t) => turmaPassa(t, f));
    if (turmas.length) resultado.push({ disciplina, turmas });
  }
  return resultado;
}

/** Opções de semestre/categoria presentes nos dados, já ordenadas (1º…9º, depois optativas). */
export function opcoesDeSemestre(disciplinas) {
  const mapa = new Map();
  for (const d of disciplinas) {
    const atual = mapa.get(d.categoria) ?? { valor: d.categoria, ordem: d.categoriaOrdem, qtd: 0 };
    atual.qtd++;
    mapa.set(d.categoria, atual);
  }
  return [...mapa.values()].sort((a, b) => a.ordem - b.ordem);
}

export function contarPorTipo(disciplinas) {
  const contagem = {};
  for (const d of disciplinas) contagem[d.tipo] = (contagem[d.tipo] ?? 0) + 1;
  return contagem;
}
