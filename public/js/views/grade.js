import { esc, debounce, pluralizar } from '../utils/dom.js';
import { icone } from '../utils/icons.js';
import { toast } from '../utils/toast.js';
import { confirmar } from '../utils/confirm.js';
import { carregarDados } from '../grade/dataService.js';
import { criarStore } from '../grade/store.js';
import { TIPOS, NOME_TIPO } from '../grade/normalizer.js';
import { TURNOS, NOME_DIA } from '../grade/time.js';
import {
  aplicarFiltros,
  contarPorTipo,
  criarFiltrosPadrao,
  haFiltrosAtivos,
  opcoesDeSemestre,
} from '../grade/filters.js';
import { detectarConflitos, mapearConflitos } from '../grade/conflicts.js';
import { renderListaDisciplinas } from '../grade/components/listaDisciplinas.js';
import { renderAgenda } from '../grade/components/agenda.js';
import { renderPainelSelecionadas } from '../grade/components/painelSelecionadas.js';
import { abrirModalSugestoes } from '../grade/components/modalSugestoes.js';

const CHAVE_PAINEL = 'hub-apps:grade-semestral:painel-aberto';

export async function montarGrade(raiz) {
  const view = document.createElement('div');
  view.className = 'grade';
  view.innerHTML = `
    <div class="grade-carregando">
      <div class="spinner"></div>
      <p>Carregando disciplinas…</p>
    </div>`;
  raiz.appendChild(view);

  let dados;
  try {
    dados = await carregarDados();
  } catch (erro) {
    view.innerHTML = `
      <div class="grade-carregando">
        ${icone('alerta')}
        <h1>Não foi possível carregar as disciplinas</h1>
        <p>${esc(erro.message)}</p>
        <div class="em-breve__acoes">
          <a href="#/" class="btn">${icone('voltar')} Voltar ao Hub</a>
          <button type="button" class="btn btn--primary" id="btn-tentar-novamente">Tentar novamente</button>
        </div>
      </div>`;
    view.querySelector('#btn-tentar-novamente').addEventListener('click', () => {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    return;
  }

  const store = criarStore(dados);
  const estado = {
    filtros: criarFiltrosPadrao(),
    expandidas: new Set(),
    painelAberto: localStorage.getItem(CHAVE_PAINEL) !== '0',
    abaMobile: 'disciplinas',
  };
  let fecharModal = null;

  view.innerHTML = templateBase(dados);
  view.dataset.aba = estado.abaMobile;

  const el = {
    lista: view.querySelector('#lista-disciplinas'),
    contador: view.querySelector('#contador-resultados'),
    agenda: view.querySelector('#agenda'),
    conflitos: view.querySelector('#alerta-conflitos'),
    resumo: view.querySelector('#resumo-grade'),
    painel: view.querySelector('#painel-selecionadas'),
    busca: view.querySelector('#busca'),
    semestre: view.querySelector('#filtro-semestre'),
    turno: view.querySelector('#filtro-turno'),
    tipo: view.querySelector('#filtro-tipo'),
    limparFiltros: view.querySelector('#btn-limpar-filtros'),
    contadorAba: view.querySelector('#contador-aba-agenda'),
  };

  /* ------------------------------ Renderização ------------------------------ */

  function renderLista() {
    const itens = aplicarFiltros(dados.disciplinas, estado.filtros);
    renderListaDisciplinas(el.lista, itens, { store, expandidas: estado.expandidas });
    el.contador.textContent = `${pluralizar(itens.length, 'disciplina')} de ${dados.disciplinas.length}`;
    el.limparFiltros.hidden = !haFiltrosAtivos(estado.filtros);
  }

  function renderGrade() {
    const selecionadas = store.obterSelecionadas();
    const conflitos = detectarConflitos(selecionadas);
    const mapa = mapearConflitos(conflitos);

    renderAgenda(el.agenda, selecionadas, mapa);
    renderAlertaConflitos(el.conflitos, conflitos);
    renderPainelSelecionadas(el.painel, selecionadas, mapa, { aberto: estado.painelAberto });

    const semHorario = selecionadas.filter((t) => t.semHorario).length;
    el.resumo.innerHTML = `
      ${pluralizar(selecionadas.length, 'disciplina')} na grade
      ${semHorario ? ` · <span class="texto-aviso">${semHorario} sem horário definido</span>` : ''}`;
    el.contadorAba.textContent = selecionadas.length;
    el.contadorAba.hidden = selecionadas.length === 0;
  }

  function renderTudo() {
    renderLista();
    renderGrade();
  }

  /* --------------------------------- Ações --------------------------------- */

  function adicionarTurma(turmaId) {
    const resultado = store.adicionar(turmaId);
    if (resultado.acao === 'invalida' || resultado.acao === 'ja-existe') return;

    const { turma, anterior } = resultado;
    const nome = `${turma.disciplina.codigo} ${turma.numero}`;
    const choques = detectarConflitos(store.obterSelecionadas()).filter(
      (c) => c.a.id === turma.id || c.b.id === turma.id
    );

    if (choques.length) {
      const outras = [...new Set(choques.map((c) => (c.a.id === turma.id ? c.b : c.a).disciplina.codigo))];
      toast(`${nome} adicionada, mas choca com ${outras.join(', ')}`, 'warning', 4200);
    } else if (anterior) {
      toast(`Turma trocada: ${anterior.numero} → ${turma.numero} (${turma.disciplina.codigo})`, 'success');
    } else {
      toast(`${nome} adicionada à grade`, 'success');
    }
  }

  function removerDisciplina(codigo) {
    const turma = store.remover(codigo);
    if (turma) toast(`${turma.disciplina.codigo} removida da grade`, 'info');
  }

  async function limparTudo() {
    const qtd = store.obterSelecionadas().length;
    if (!qtd) return;
    const ok = await confirmar({
      titulo: 'Limpar toda a grade?',
      mensagem: `${pluralizar(qtd, 'disciplina será removida', 'disciplinas serão removidas')}. Essa ação não pode ser desfeita.`,
      textoConfirmar: 'Limpar tudo',
      perigo: true,
    });
    if (ok) {
      store.limpar();
      toast('Grade limpa', 'info');
    }
  }

  function focarDisciplina(codigo) {
    const disciplina = dados.disciplinasPorCodigo.get(codigo);
    if (!disciplina) return;

    // Garante que a disciplina apareça na lista mesmo com filtros ativos
    const visivel = aplicarFiltros([disciplina], estado.filtros).length > 0;
    if (!visivel) {
      estado.filtros = criarFiltrosPadrao();
      sincronizarControlesDeFiltro();
    }
    estado.expandidas.add(codigo);
    estado.abaMobile = 'disciplinas';
    view.dataset.aba = 'disciplinas';
    atualizarAbas();
    renderLista();

    const card = el.lista.querySelector(`#disc-${CSS.escape(codigo)}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.remove('is-destaque');
      void card.offsetWidth;
      card.classList.add('is-destaque');
    }
  }

  function sincronizarControlesDeFiltro() {
    el.busca.value = estado.filtros.busca;
    el.semestre.value = estado.filtros.semestre;
    el.turno.value = estado.filtros.turnos[0] ?? '';
    el.tipo.value = estado.filtros.tipo;
  }

  function atualizarAbas() {
    view.querySelectorAll('[data-aba-alvo]').forEach((b) => {
      const ativa = b.dataset.abaAlvo === estado.abaMobile;
      b.classList.toggle('is-ativa', ativa);
      b.setAttribute('aria-selected', ativa);
    });
  }

  /* -------------------------------- Eventos -------------------------------- */

  view.addEventListener('click', (e) => {
    const alvo = e.target.closest('[data-acao], [data-turno], [data-aba-alvo]');
    if (!alvo || !view.contains(alvo)) return;

    if (alvo.dataset.turno) {
      const t = alvo.dataset.turno;
      const lista = estado.filtros.turnos;
      estado.filtros.turnos = lista.includes(t) ? lista.filter((x) => x !== t) : [...lista, t];
      sincronizarControlesDeFiltro();
      renderLista();
      return;
    }

    if (alvo.dataset.abaAlvo) {
      estado.abaMobile = alvo.dataset.abaAlvo;
      view.dataset.aba = estado.abaMobile;
      atualizarAbas();
      return;
    }

    const { acao, codigo, turma } = alvo.dataset;
    switch (acao) {
      case 'expandir':
        estado.expandidas.has(codigo) ? estado.expandidas.delete(codigo) : estado.expandidas.add(codigo);
        renderLista();
        break;
      case 'adicionar':
        adicionarTurma(turma);
        break;
      case 'remover':
        e.stopPropagation();
        removerDisciplina(codigo);
        break;
      case 'focar':
        focarDisciplina(codigo);
        break;
      case 'limpar':
        limparTudo();
        break;
      case 'toggle-painel':
        estado.painelAberto = !estado.painelAberto;
        localStorage.setItem(CHAVE_PAINEL, estado.painelAberto ? '1' : '0');
        renderGrade();
        break;
      case 'limpar-filtros':
        estado.filtros = criarFiltrosPadrao();
        sincronizarControlesDeFiltro();
        renderLista();
        break;
      case 'sugerir':
        fecharModal = abrirModalSugestoes({
          dados,
          store,
          obterFiltros: () => estado.filtros,
          aoAdicionar: adicionarTurma,
        });
        break;
    }
  });

  el.busca.addEventListener(
    'input',
    debounce(() => {
      estado.filtros.busca = el.busca.value;
      renderLista();
    }, 150)
  );
  el.semestre.addEventListener('change', () => {
    estado.filtros.semestre = el.semestre.value;
    renderLista();
  });
  el.turno.addEventListener('change', () => {
    estado.filtros.turnos = el.turno.value ? [el.turno.value] : [];
    renderLista();
  });
  el.tipo.addEventListener('change', () => {
    estado.filtros.tipo = el.tipo.value;
    renderLista();
  });

  // Mantém a grade sincronizada se o usuário editar em outra aba do navegador
  const aoMudarStorage = (e) => {
    if (e.key && e.key.startsWith('hub-apps:grade-semestral:v')) {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  };
  window.addEventListener('storage', aoMudarStorage);

  const cancelarAssinatura = store.assinar(renderTudo);
  renderTudo();

  function desmontar() {
    cancelarAssinatura();
    window.removeEventListener('storage', aoMudarStorage);
    if (fecharModal) fecharModal();
  }
  return desmontar;
}

/* ------------------------------- Templates ------------------------------- */

function templateBase(dados) {
  const { meta, disciplinas } = dados;
  const semestres = opcoesDeSemestre(disciplinas);
  const porTipo = contarPorTipo(disciplinas);

  return `
    <header class="grade-topo">
      <div class="grade-topo__esq">
        <a href="#/" class="btn btn--icon btn--ghost" aria-label="Voltar ao Hub" title="Voltar ao Hub">${icone('voltar')}</a>
        <div>
          <h1 class="grade-topo__titulo">Organizador de <span class="text-gradient">Grade Semestral</span></h1>
          <p class="grade-topo__sub">${esc(meta.curso)} · ${esc(meta.instituicao)} · ${esc(meta.periodo)}</p>
        </div>
      </div>
      <button type="button" class="btn btn--primary" id="btn-sugerir" data-acao="sugerir">
        ${icone('brilho')} <span>Sugerir para horários vagos</span>
      </button>
    </header>

    <nav class="abas-mobile" role="tablist" aria-label="Seções">
      <button type="button" role="tab" class="aba is-ativa" data-aba-alvo="disciplinas" aria-selected="true">${icone('livro')} Disciplinas</button>
      <button type="button" role="tab" class="aba" data-aba-alvo="agenda" aria-selected="false">${icone('calendario')} Agenda <span class="aba__contador" id="contador-aba-agenda" hidden>0</span></button>
    </nav>

    <div class="grade-layout">
      <aside class="grade-lateral glass" aria-label="Disciplinas disponíveis">
        <div class="filtros">
          <label class="busca">
            ${icone('busca')}
            <span class="sr-only">Buscar por nome, código ou professor</span>
            <input type="search" id="busca" class="input" placeholder="Buscar por nome, código ou professor…" autocomplete="off" />
          </label>

          <div class="filtros__linha">
            <label class="field">
              <span class="field__label">Semestre</span>
              <select id="filtro-semestre" class="select">
                <option value="">Todos</option>
                ${semestres.map((s) => `<option value="${esc(s.valor)}">${esc(s.valor)} (${s.qtd})</option>`).join('')}
              </select>
            </label>
            <label class="field">
              <span class="field__label">Turno</span>
              <select id="filtro-turno" class="select">
                <option value="">Todos</option>
                ${TURNOS.map((t) => `<option value="${t.id}">${t.nome}</option>`).join('')}
              </select>
            </label>
            <label class="field">
              <span class="field__label">Tipo</span>
              <select id="filtro-tipo" class="select">
                <option value="">Todos</option>
                ${TIPOS.map(
                  (t) => `<option value="${t.id}" ${porTipo[t.id] ? '' : 'disabled'}>${esc(NOME_TIPO[t.id])} (${porTipo[t.id] ?? 0})</option>`
                ).join('')}
              </select>
            </label>
          </div>

          <div class="filtros__rodape">
            <span id="contador-resultados" class="filtros__contador"></span>
            <button type="button" class="btn btn--sm btn--ghost" id="btn-limpar-filtros" data-acao="limpar-filtros" hidden>${icone('x')} Limpar filtros</button>
          </div>
        </div>
        <div class="lista" id="lista-disciplinas"></div>
      </aside>

      <section class="grade-principal" aria-labelledby="titulo-agenda">
        <div class="grade-principal__topo">
          <div>
            <h2 id="titulo-agenda" class="grade-principal__titulo">${icone('calendario')} Agenda semanal</h2>
            <p class="grade-principal__resumo" id="resumo-grade"></p>
          </div>
          <div class="legenda">
            ${TURNOS.map((t) => `<span class="legenda__item legenda__item--${t.id}">${t.nome}</span>`).join('')}
            <span class="legenda__item legenda__item--conflito">Conflito</span>
          </div>
        </div>
        <div id="alerta-conflitos"></div>
        <div class="agenda-wrapper glass" id="agenda"></div>
        <section class="painel glass" id="painel-selecionadas" aria-label="Disciplinas selecionadas"></section>
      </section>
    </div>
  `;
}

function renderAlertaConflitos(container, conflitos) {
  if (!conflitos.length) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = `
    <div class="alerta-conflitos" role="alert">
      <div class="alerta-conflitos__icone">${icone('alerta')}</div>
      <div class="alerta-conflitos__conteudo">
        <strong>${pluralizar(conflitos.length, 'conflito de horário detectado', 'conflitos de horário detectados')}</strong>
        <ul>
          ${conflitos
            .map(
              (c) => `<li>
                <button type="button" class="link-disc" data-acao="focar" data-codigo="${esc(c.a.disciplina.codigo)}">${esc(c.a.disciplina.codigo)} ${esc(c.a.numero)}</button>
                <span class="alerta-conflitos__nome">${esc(c.a.disciplina.nome)}</span>
                <span class="alerta-conflitos__x">×</span>
                <button type="button" class="link-disc" data-acao="focar" data-codigo="${esc(c.b.disciplina.codigo)}">${esc(c.b.disciplina.codigo)} ${esc(c.b.numero)}</button>
                <span class="alerta-conflitos__nome">${esc(c.b.disciplina.nome)}</span>
                <span class="badge badge--danger">${esc(NOME_DIA[c.dia])} ${esc(c.inicio)}–${esc(c.fim)}</span>
              </li>`
            )
            .join('')}
        </ul>
      </div>
    </div>`;
}
