import { normalizarDados } from './normalizer.js';

const URL_DADOS = 'data/disciplinas_uefs_2026_2.json';

let cache = null;

/** Carrega e normaliza o JSON de disciplinas (uma única vez por sessão). */
export function carregarDados() {
  if (!cache) {
    cache = fetch(URL_DADOS)
      .then((resp) => {
        if (!resp.ok) throw new Error(`Falha ao carregar disciplinas (HTTP ${resp.status})`);
        return resp.json();
      })
      .then((json) => {
        const dados = normalizarDados(json);
        dados.turmasPorId = new Map(
          dados.disciplinas.flatMap((d) => d.turmas.map((t) => [t.id, t]))
        );
        dados.disciplinasPorCodigo = new Map(dados.disciplinas.map((d) => [d.codigo, d]));
        return dados;
      })
      .catch((erro) => {
        cache = null; // permite tentar novamente
        throw erro;
      });
  }
  return cache;
}
