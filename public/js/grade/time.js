/** Utilitários de dias, horários e turnos. */

export const DIAS = [
  { sigla: 'SEG', nome: 'Segunda', curto: 'Seg' },
  { sigla: 'TER', nome: 'Terça', curto: 'Ter' },
  { sigla: 'QUA', nome: 'Quarta', curto: 'Qua' },
  { sigla: 'QUI', nome: 'Quinta', curto: 'Qui' },
  { sigla: 'SEX', nome: 'Sexta', curto: 'Sex' },
  { sigla: 'SAB', nome: 'Sábado', curto: 'Sáb' },
  { sigla: 'DOM', nome: 'Domingo', curto: 'Dom' },
];

export const ORDEM_DIA = Object.fromEntries(DIAS.map((d, i) => [d.sigla, i]));
export const NOME_DIA = Object.fromEntries(DIAS.map((d) => [d.sigla, d.nome]));

/** Janela visível da agenda: 07:30 às 23:00 */
export const AGENDA_INICIO = 7 * 60 + 30;
export const AGENDA_FIM = 23 * 60;
export const AGENDA_PASSO = 30;

export const TURNOS = [
  { id: 'manha', nome: 'Manhã' },
  { id: 'tarde', nome: 'Tarde' },
  { id: 'noite', nome: 'Noite' },
];
export const NOME_TURNO = Object.fromEntries(TURNOS.map((t) => [t.id, t.nome]));

const REGEX_HORA = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function horaValida(texto) {
  return typeof texto === 'string' && REGEX_HORA.test(texto.trim());
}

export function paraMinutos(hhmm) {
  const [h, m] = hhmm.trim().split(':').map(Number);
  return h * 60 + m;
}

export function paraHHMM(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Turno pelo horário de início:
 * Manhã < 12:00 | Tarde 12:00–17:59 | Noite ≥ 18:00
 */
export function calcularTurno(inicioMin) {
  if (inicioMin < 12 * 60) return 'manha';
  if (inicioMin < 18 * 60) return 'tarde';
  return 'noite';
}

/** Dois horários se sobrepõem (inclusive parcialmente) no mesmo dia? */
export function horariosSobrepoem(a, b) {
  return a.dia === b.dia && a.inicioMin < b.fimMin && b.inicioMin < a.fimMin;
}

export function formatarDuracao(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h && m) return `${h}h${String(m).padStart(2, '0')}`;
  if (h) return `${h}h`;
  return `${m}min`;
}
