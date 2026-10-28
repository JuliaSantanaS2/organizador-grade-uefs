import { horariosSobrepoem, paraHHMM } from './time.js';

/**
 * Detecta todos os choques entre as turmas selecionadas.
 * Retorna [{ a, b, dia, inicio, fim }] onde inicio/fim é o intervalo exato de sobreposição.
 */
export function detectarConflitos(turmas) {
  const conflitos = [];
  for (let i = 0; i < turmas.length; i++) {
    for (let j = i + 1; j < turmas.length; j++) {
      const a = turmas[i];
      const b = turmas[j];
      for (const ha of a.horarios) {
        for (const hb of b.horarios) {
          if (!horariosSobrepoem(ha, hb)) continue;
          conflitos.push({
            a,
            b,
            dia: ha.dia,
            inicio: paraHHMM(Math.max(ha.inicioMin, hb.inicioMin)),
            fim: paraHHMM(Math.min(ha.fimMin, hb.fimMin)),
          });
        }
      }
    }
  }
  return conflitos;
}

/** Mapa turmaId -> Set de códigos das disciplinas com que ela conflita. */
export function mapearConflitos(conflitos) {
  const mapa = new Map();
  const registrar = (turma, outra) => {
    if (!mapa.has(turma.id)) mapa.set(turma.id, new Set());
    mapa.get(turma.id).add(outra.disciplina.codigo);
  };
  for (const { a, b } of conflitos) {
    registrar(a, b);
    registrar(b, a);
  }
  return mapa;
}

/**
 * Verifica se uma turma candidata choca com a grade atual.
 * A turma já escolhida da MESMA disciplina é ignorada (seria substituída).
 */
export function conflitosDaCandidata(turma, selecionadas) {
  const choques = [];
  for (const outra of selecionadas) {
    if (outra.disciplina.codigo === turma.disciplina.codigo) continue;
    if (turma.horarios.some((h) => outra.horarios.some((o) => horariosSobrepoem(h, o)))) {
      choques.push(outra);
    }
  }
  return choques;
}
