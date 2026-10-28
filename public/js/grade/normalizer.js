import { normalizarTexto } from '../utils/dom.js';
import { ORDEM_DIA, calcularTurno, horaValida, paraMinutos } from './time.js';

/** Rótulos dos tipos de disciplina (inclui tipos extras encontrados no JSON). */
export const TIPOS = [
  { id: 'modulo_obrigatorio', nome: 'Módulo obrigatório' },
  { id: 'modulo_integrador', nome: 'Módulo integrador (MI)' },
  { id: 'disciplina_obrigatoria', nome: 'Disciplina obrigatória' },
  { id: 'optativa_profissionalizante', nome: 'Optativa profissionalizante' },
  { id: 'optativa_humanistica', nome: 'Optativa humanística' },
  { id: 'optativa_complementar', nome: 'Optativa complementar' },
  { id: 'estagio', nome: 'Estágio' },
  { id: 'tcc', nome: 'TCC' },
  { id: 'extensao', nome: 'Extensão' },
  { id: 'projeto_empreendedor', nome: 'Projeto empreendedor' },
  { id: 'nao_classificada', nome: 'Não classificada' },
];
export const NOME_TIPO = Object.fromEntries(TIPOS.map((t) => [t.id, t.nome]));

const PREFIXO_OBRIGATORIA = /^obrigat[óo]ria\s+do\s+/i;

const CATEGORIAS_OPTATIVAS = {
  'optativa profissionalizante': { curta: 'Opt. Profissionalizante', ordem: 100 },
  'optativa humanistica': { curta: 'Opt. Humanística', ordem: 101 },
  'optativa complementar': { curta: 'Opt. Complementar', ordem: 102 },
};

/**
 * "Obrigatória do 6º semestre" → "6º semestre"
 * "Optativa humanística"       → "Opt. Humanística"
 * "Não classificada na resolução" → "Não classificada"
 */
export function encurtarCategoria(texto) {
  const original = String(texto ?? '').trim();
  const chave = normalizarTexto(original);

  if (PREFIXO_OBRIGATORIA.test(original)) {
    const curta = original.replace(PREFIXO_OBRIGATORIA, '').trim();
    const numero = parseInt(curta, 10);
    return { curta, ordem: Number.isFinite(numero) ? numero : 50 };
  }
  if (CATEGORIAS_OPTATIVAS[chave]) return CATEGORIAS_OPTATIVAS[chave];
  if (chave.startsWith('optativa ')) {
    const resto = original.slice('optativa '.length);
    return { curta: `Opt. ${resto.charAt(0).toUpperCase()}${resto.slice(1)}`, ordem: 110 };
  }
  if (!chave || chave.startsWith('nao classificada')) return { curta: 'Não classificada', ordem: 200 };
  return { curta: original, ordem: 150 };
}

/**
 * Remove entradas inválidas ("0 0", "¹", "² ³", textos de cabeçalho do SAGRES com ":")
 * e nomes repetidos na mesma turma.
 */
export function limparProfessores(lista) {
  if (!Array.isArray(lista)) return [];
  const vistos = new Set();
  const resultado = [];

  for (const bruto of lista) {
    if (typeof bruto !== 'string') continue;
    const nome = bruto.replace(/\s+/g, ' ').trim();
    if (!nomeProfessorValido(nome)) continue;
    const chave = normalizarTexto(nome);
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    resultado.push(nome);
  }
  return resultado;
}

function nomeProfessorValido(nome) {
  if (nome.length < 3 || nome.includes(':')) return false;
  const letras = nome.match(/\p{L}/gu)?.length ?? 0;
  return letras >= 3;
}

function normalizarHorario(h) {
  if (!h || !horaValida(h.inicio) || !horaValida(h.fim)) return null;
  const dia = String(h.dia ?? '').trim().toUpperCase();
  if (!(dia in ORDEM_DIA)) return null;

  const inicioMin = paraMinutos(h.inicio);
  const fimMin = paraMinutos(h.fim);
  if (fimMin <= inicioMin) return null;

  const local = typeof h.local === 'string' && h.local.trim() ? h.local.trim() : 'A definir';

  return {
    dia,
    inicio: h.inicio.trim().padStart(5, '0'),
    fim: h.fim.trim().padStart(5, '0'),
    inicioMin,
    fimMin,
    local,
    turno: calcularTurno(inicioMin),
  };
}

function normalizarTurma(turmaBruta, disciplina, indice, idsUsados) {
  const numero = String(turmaBruta?.numero ?? '').trim() || `Turma ${indice + 1}`;

  let id = `${disciplina.codigo}::${numero}`;
  if (idsUsados.has(id)) id = `${id}#${indice}`;
  idsUsados.add(id);

  const horarios = (Array.isArray(turmaBruta?.horarios) ? turmaBruta.horarios : [])
    .map(normalizarHorario)
    .filter(Boolean)
    .sort((a, b) => ORDEM_DIA[a.dia] - ORDEM_DIA[b.dia] || a.inicioMin - b.inicioMin);

  const professores = limparProfessores(turmaBruta?.professores);

  return {
    id,
    numero,
    professores,
    horarios,
    semHorario: horarios.length === 0,
    turnos: [...new Set(horarios.map((h) => h.turno))],
    cargaSemanalMin: horarios.reduce((soma, h) => soma + (h.fimMin - h.inicioMin), 0),
    disciplina, // referência de volta para facilitar a renderização
  };
}

/** Matiz HSL estável por código da disciplina (cor consistente na agenda). */
function corDaDisciplina(codigo) {
  let hash = 0;
  for (const c of codigo) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return (hash * 137.508) % 360;
}

export function normalizarDisciplina(bruta) {
  const codigo = String(bruta?.codigo ?? '').trim();
  if (!codigo) return null;

  const categoria = encurtarCategoria(bruta.categoria_exibicao);
  const disciplina = {
    codigo,
    nome: String(bruta.nome ?? codigo).trim(),
    tipo: bruta.tipo && NOME_TIPO[bruta.tipo] ? bruta.tipo : 'nao_classificada',
    semestre: Number.isInteger(bruta.semestre_obrigatorio) ? bruta.semestre_obrigatorio : null,
    categoria: categoria.curta,
    categoriaOrdem: categoria.ordem,
    situacao: bruta.situacao_curricular ?? null,
    matiz: Math.round(corDaDisciplina(codigo)),
    turmas: [],
  };

  const idsUsados = new Set();
  const turmasBrutas = Array.isArray(bruta.turmas) ? bruta.turmas : [];
  disciplina.turmas = turmasBrutas.map((t, i) => normalizarTurma(t, disciplina, i, idsUsados));
  disciplina.turnos = [...new Set(disciplina.turmas.flatMap((t) => t.turnos))];
  disciplina.textoBusca = normalizarTexto(
    [codigo, disciplina.nome, ...disciplina.turmas.flatMap((t) => t.professores)].join(' ')
  );

  return disciplina;
}

export function normalizarDados(json) {
  const lista = Array.isArray(json?.disciplinas) ? json.disciplinas : [];
  const vistos = new Set();

  const disciplinas = lista
    .map(normalizarDisciplina)
    .filter((d) => d && d.turmas.length > 0 && !vistos.has(d.codigo) && vistos.add(d.codigo))
    .sort((a, b) => a.categoriaOrdem - b.categoriaOrdem || a.nome.localeCompare(b.nome, 'pt-BR'));

  return {
    meta: {
      curso: json?.curso ?? 'Curso',
      instituicao: json?.instituicao ?? '',
      periodo: json?.periodo ?? '',
    },
    disciplinas,
  };
}
