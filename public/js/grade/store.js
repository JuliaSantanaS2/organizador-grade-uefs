import { carregarSelecoes, salvarSelecoes } from './storage.js';

/**
 * Estado da grade: no máximo UMA turma por disciplina.
 * Toda alteração é persistida no localStorage e notifica os assinantes.
 */
export function criarStore(dados) {
  const selecao = new Map(); // codigo da disciplina -> turma
  const assinantes = new Set();

  // Restaura a grade salva, ignorando turmas que não existem mais no JSON
  for (const { codigo, numero } of carregarSelecoes()) {
    const disciplina = dados.disciplinasPorCodigo.get(codigo);
    const turma = disciplina?.turmas.find((t) => t.numero === numero);
    if (turma && !selecao.has(codigo)) selecao.set(codigo, turma);
  }

  function persistirENotificar() {
    salvarSelecoes([...selecao.values()].map((t) => ({ codigo: t.disciplina.codigo, numero: t.numero })));
    assinantes.forEach((fn) => fn());
  }

  return {
    obterSelecionadas() {
      return [...selecao.values()];
    },
    turmaSelecionadaDe(codigo) {
      return selecao.get(codigo) ?? null;
    },
    estaSelecionada(turmaId) {
      const turma = dados.turmasPorId.get(turmaId);
      return !!turma && selecao.get(turma.disciplina.codigo)?.id === turmaId;
    },
    /** Adiciona (ou troca) a turma da disciplina. Retorna { acao, anterior }. */
    adicionar(turmaId) {
      const turma = dados.turmasPorId.get(turmaId);
      if (!turma) return { acao: 'invalida' };
      const anterior = selecao.get(turma.disciplina.codigo) ?? null;
      if (anterior?.id === turmaId) return { acao: 'ja-existe', turma };
      selecao.set(turma.disciplina.codigo, turma);
      persistirENotificar();
      return { acao: anterior ? 'trocada' : 'adicionada', turma, anterior };
    },
    remover(codigo) {
      const turma = selecao.get(codigo);
      if (!turma) return null;
      selecao.delete(codigo);
      persistirENotificar();
      return turma;
    },
    limpar() {
      if (selecao.size === 0) return;
      selecao.clear();
      persistirENotificar();
    },
    assinar(fn) {
      assinantes.add(fn);
      return () => assinantes.delete(fn);
    },
  };
}
