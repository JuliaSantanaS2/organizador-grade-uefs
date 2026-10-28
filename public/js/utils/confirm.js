import { esc } from './dom.js';

/**
 * Diálogo de confirmação estilizado (substitui window.confirm).
 * Retorna uma Promise<boolean>.
 */
export function confirmar({ titulo, mensagem, textoConfirmar = 'Confirmar', perigo = false }) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'modal modal--sm';
    dialog.innerHTML = `
      <div class="modal__header">
        <div>
          <h2 class="modal__title">${esc(titulo)}</h2>
          <p class="modal__subtitle">${esc(mensagem)}</p>
        </div>
      </div>
      <div class="modal__footer">
        <button type="button" class="btn" data-resposta="nao">Cancelar</button>
        <button type="button" class="btn ${perigo ? 'btn--danger' : 'btn--primary'}" data-resposta="sim">${esc(textoConfirmar)}</button>
      </div>`;

    document.body.appendChild(dialog);

    let resposta = false;
    dialog.addEventListener('click', (e) => {
      const botao = e.target.closest('[data-resposta]');
      if (botao) {
        resposta = botao.dataset.resposta === 'sim';
        dialog.close();
      } else if (e.target === dialog) {
        dialog.close();
      }
    });
    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(resposta);
    });

    dialog.showModal();
    dialog.querySelector('[data-resposta="nao"]').focus();
  });
}
