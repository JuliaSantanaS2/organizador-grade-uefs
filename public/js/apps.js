/**
 * Registro central das aplicações do Hub.
 * Para adicionar uma nova aplicação: inclua um item aqui e registre a rota em main.js.
 */
export const APLICACOES = [
  {
    id: 'grade-semestral',
    titulo: 'Organizador de Grade Semestral',
    descricao:
      'Monte sua grade de Engenharia de Computação (UEFS 2026.2), visualize a semana, detecte choques de horário e receba sugestões para os horários vagos.',
    rota: '/grade',
    status: 'ativo',
    capa: 'assets/capa-grade-semestral.jpg',
    tags: ['Acadêmico', 'Agenda', 'UEFS'],
    destaque: 'hsl(258, 90%, 66%)',
  },
  {
    id: 'aplicacao-2',
    titulo: 'Aplicação 2',
    descricao: 'Uma nova ferramenta está sendo preparada para o Hub. Fique de olho!',
    rota: '/app-2',
    status: 'em-breve',
    capa: 'assets/capa-em-breve.jpg',
    tags: ['Em breve'],
    destaque: 'hsl(188, 86%, 53%)',
  },
];
