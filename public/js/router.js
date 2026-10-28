/**
 * Roteador baseado em hash (#/rota). Funciona em hospedagem estática
 * (Vercel/Netlify) sem precisar de regras de rewrite no servidor.
 */
export function iniciarRouter({ rotas, container, rotaNaoEncontrada }) {
  let desmontarAtual = null;
  let navegacaoId = 0;

  async function navegar() {
    const id = ++navegacaoId;
    const caminho = obterCaminhoAtual();
    const rota = rotas.find((r) => r.caminho === caminho) ?? rotaNaoEncontrada;

    if (typeof desmontarAtual === 'function') desmontarAtual();
    desmontarAtual = null;

    container.innerHTML = '';
    container.style.animation = 'none';
    void container.offsetWidth; // reinicia a animação de entrada
    container.style.animation = '';
    window.scrollTo({ top: 0 });

    atualizarMeta(rota);

    const desmontar = await rota.montar(container);
    // Se o usuário navegou de novo enquanto a view carregava, descarta a montagem antiga
    if (id !== navegacaoId) {
      if (typeof desmontar === 'function') desmontar();
      return;
    }
    desmontarAtual = desmontar;
  }

  window.addEventListener('hashchange', navegar);
  navegar();
}

export function obterCaminhoAtual() {
  const hash = window.location.hash.replace(/^#/, '');
  return hash === '' ? '/' : hash.split('?')[0];
}

export function navegarPara(caminho) {
  window.location.hash = caminho;
}

function atualizarMeta(rota) {
  document.title = rota.titulo;
  const meta = document.querySelector('meta[name="description"]');
  if (meta && rota.descricao) meta.setAttribute('content', rota.descricao);
}
