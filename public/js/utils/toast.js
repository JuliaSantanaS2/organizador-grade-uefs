import { esc } from './dom.js';

/** Exibe uma notificação temporária. tipo: 'info' | 'success' | 'warning' | 'danger' */
export function toast(mensagem, tipo = 'info', duracao = 2800) {
  const area = document.getElementById('toasts');
  if (!area) return;

  const el = document.createElement('div');
  el.className = `toast toast--${tipo}`;
  el.innerHTML = `<span>${esc(mensagem)}</span>`;
  area.appendChild(el);

  // Limita a quantidade de toasts empilhados
  while (area.children.length > 4) area.firstElementChild.remove();

  setTimeout(() => {
    el.classList.add('is-saindo');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, duracao);
}
