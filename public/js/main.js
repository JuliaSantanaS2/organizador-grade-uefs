import { iniciarRouter } from './router.js';
import { montarHub } from './views/hub.js';
import { montarGrade } from './views/grade.js';
import { montarEmBreve } from './views/emBreve.js';
import { montarNaoEncontrada } from './views/naoEncontrada.js';

iniciarRouter({
  container: document.getElementById('app'),
  rotas: [
    {
      caminho: '/',
      titulo: 'Hub de Aplicações — Ferramentas Acadêmicas',
      descricao:
        'Hub de aplicações acadêmicas: organize sua grade semestral e acesse novas ferramentas em um só lugar.',
      montar: montarHub,
    },
    {
      caminho: '/grade',
      titulo: 'Organizador de Grade Semestral — UEFS 2026.2',
      descricao:
        'Escolha disciplinas e turmas de Engenharia de Computação da UEFS, visualize sua agenda semanal, detecte conflitos e receba sugestões.',
      montar: montarGrade,
    },
    {
      caminho: '/app-2',
      titulo: 'Aplicação 2 (Em breve) — Hub de Aplicações',
      descricao: 'Nova aplicação do Hub em desenvolvimento.',
      montar: montarEmBreve,
    },
  ],
  rotaNaoEncontrada: {
    titulo: 'Página não encontrada — Hub de Aplicações',
    descricao: 'A página solicitada não existe.',
    montar: montarNaoEncontrada,
  },
});
