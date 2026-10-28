/**
 * Persistência das escolhas do usuário no localStorage.
 * Formato salvo: { versao, atualizadoEm, selecoes: [{ codigo, numero }] }
 */
const CHAVE = 'hub-apps:grade-semestral:v1';
const VERSAO = 1;

function lerBruto() {
  try {
    const texto = localStorage.getItem(CHAVE);
    if (!texto) return null;
    return JSON.parse(texto);
  } catch {
    return null; // JSON corrompido ou localStorage indisponível
  }
}

export function carregarSelecoes() {
  const dados = lerBruto();
  if (!dados || !Array.isArray(dados.selecoes)) return [];
  return dados.selecoes.filter(
    (s) => s && typeof s.codigo === 'string' && typeof s.numero === 'string'
  );
}

export function salvarSelecoes(selecoes) {
  try {
    localStorage.setItem(
      CHAVE,
      JSON.stringify({ versao: VERSAO, atualizadoEm: new Date().toISOString(), selecoes })
    );
    return true;
  } catch {
    return false;
  }
}

export function contarSelecoesSalvas() {
  return carregarSelecoes().length;
}
