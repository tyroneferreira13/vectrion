(() => {
  'use strict';

  /* ===== Configuração ===== */
  const CONFIG = {
    total: 300,          // quantidade de frames
    dir: 'frames/',      // pasta dos frames, ao lado do index.html
    prefix: 'frame-',    // frame-0001.webp ... frame-0300.webp
    ext: '.webp',
    pad: 4,
    concurrency: 8,      // downloads simultâneos
    fps: 20,             // velocidade do vídeo (300 frames a 20 fps = 15 s)
    maxDpr: 2            // limite de resolução do canvas (economiza memória no celular)
  };
  const WHATSAPP = 'https://wa.me/5583991940529';

  /* ===== Textos detalhados que abrem ao clicar nos cards ===== */
  const DETAILS = {
    sites: { title: 'Sites que vendem',
      intro: 'Criamos sites e páginas de captura pensados para um objetivo: fazer o visitante entrar em contato ou comprar.',
      label: 'O que está incluído',
      items: ['Design exclusivo, sem modelos prontos', 'Carregamento rápido e boa experiência no celular', 'Botões de WhatsApp e formulários de contato', 'Estrutura preparada para aparecer no Google'] },
    sistemas: { title: 'Sistemas sob medida',
      intro: 'Desenvolvemos o sistema do jeito que o seu negócio funciona, em vez de obrigar você a se adaptar a um programa pronto.',
      label: 'Exemplos do que podemos fazer',
      items: ['Cadastro e controle de clientes', 'Agenda, pedidos e estoque', 'Relatórios para decidir com dados', 'Acesso pelo computador e pelo celular'] },
    apps: { title: 'Aplicativos',
      intro: 'Do protótipo ao aplicativo funcionando no celular dos seus clientes.',
      label: 'Etapas',
      items: ['Planejamento das telas e do fluxo de uso', 'Desenvolvimento e testes', 'Publicação nas lojas de aplicativos, quando necessário', 'Atualizações e melhorias depois do lançamento'] },
    como: { title: 'Como funciona',
      intro: 'Um processo simples, com você acompanhando cada etapa.',
      label: 'Passo a passo',
      items: ['Conversa inicial para entender seu negócio e seu objetivo', 'Proposta com escopo, prazo e valor combinados antes de começar', 'Desenvolvimento com entregas parciais para você opinar', 'Entrega, orientação de uso e ajustes finais'] },
    suporte: { title: 'Suporte contínuo',
      intro: 'Depois que o projeto entra no ar, a gente continua cuidando dele.',
      label: 'O que você recebe',
      items: ['Correção de problemas e ajustes', 'Atualizações de segurança', 'Pequenas melhorias sob demanda', 'Atendimento direto pelo WhatsApp'] },
    dica: { title: 'Dica rápida',
      intro: 'Quando alguém pesquisa o seu serviço no Google, um site rápido e claro costuma ajudar a ser encontrado.',
      label: 'Boas práticas',
      items: ['Coloque sua cidade e seus serviços nos títulos e textos', 'Garanta que o site abra rápido no celular', 'Deixe o contato visível em toda a página', 'Mantenha o Instagram e o perfil do Google atualizados'] },
    orcamento: { title: 'Orçamento grátis',
      intro: 'Conte sua ideia e receba uma proposta sem compromisso.',
      label: 'Como funciona',
      items: ['Retorno em até um dia útil', 'Conversar e montar a proposta não tem custo', 'Proposta com prazo e valor definidos'] }
  };

  const $ = (s) => document.querySelector(s);
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const behavior = reduce.matches ? 'auto' : 'smooth';

  /* ================= VÍDEO EM LOOP (independente da rolagem) ================= */
  const hero = $('#inicio');
  const canvas = $('#stage');
  const ctx = canvas.getContext('2d', { alpha: false });
  const loader = $('#loader');
  const loaderBar = $('#loaderBar');
  const loaderText = $('#loaderText');
  const toggle = $('#videoToggle');

  const frames = new Array(CONFIG.total).fill(null);
  const url = (i) => `${CONFIG.dir}${CONFIG.prefix}${String(i).padStart(CONFIG.pad, '0')}${CONFIG.ext}`;
  let shown = 0, playing = true, inView = true, started = false, raf = 0, t0 = 0;

  function loadFrame(i) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { frames[i] = img; resolve(true); };
      img.onerror = () => resolve(false);
      img.src = url(i + 1);
    });
  }

  function setLoader(done) {
    const pct = Math.round((done / CONFIG.total) * 100);
    loaderBar.style.width = pct + '%';
    loaderText.textContent = 'Carregando ' + pct + '%';
  }

  function finishLoader() {
    root.classList.remove('is-loading');
    loader.classList.add('is-done');
    setTimeout(() => loader.remove(), 600);
  }

  function nearest(i) {
    if (frames[i]) return frames[i];
    for (let d = 1; d < CONFIG.total; d++) {
      if (frames[i - d]) return frames[i - d];
      if (frames[i + d]) return frames[i + d];
    }
    return null;
  }

  function draw(i) {
    const img = nearest(i);
    if (!img) return;
    shown = i;
    const cw = canvas.width, ch = canvas.height;
    // "cover": preenche a área inteira sem distorcer (corta o excesso).
    // Para mostrar o frame inteiro com bordas, troque Math.max por Math.min.
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr);
    const w = Math.max(1, Math.round(hero.clientWidth * dpr));
    const h = Math.max(1, Math.round(hero.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    draw(shown);
  }

  function loop(now) {
    raf = 0;
    if (!playing || !inView) return;
    if (!t0) t0 = now - shown * 1000 / CONFIG.fps;
    const i = Math.floor((now - t0) * CONFIG.fps / 1000) % CONFIG.total;
    if (i !== shown) draw(i);
    raf = requestAnimationFrame(loop);
  }

  function play() {
    if (started && !raf && playing && inView) { t0 = 0; raf = requestAnimationFrame(loop); }
  }

  async function preload() {
    const ok = await loadFrame(0);
    if (!ok) {
      loaderText.textContent = 'Não encontrei ' + url(1) + '. Confira se a pasta "frames" está ao lado do index.html.';
      root.classList.remove('is-loading');
      return;
    }
    resizeCanvas();
    let done = 1, next = 1;
    setLoader(done);
    const worker = async () => {
      while (next < CONFIG.total) { const i = next++; await loadFrame(i); setLoader(++done); }
    };
    await Promise.all(Array.from({ length: CONFIG.total > CONFIG.concurrency ? CONFIG.concurrency : 1 }, worker));
    finishLoader();
    started = true;
    play();
  }

  new ResizeObserver(resizeCanvas).observe(hero);
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) play(); }).observe(hero);

  toggle.addEventListener('click', () => {
    playing = !playing;
    toggle.textContent = playing ? 'Pausar vídeo' : 'Reproduzir vídeo';
    toggle.setAttribute('aria-pressed', String(!playing));
    if (playing) play();
  });

  if (reduce.matches) {
    // Movimento reduzido: só o primeiro frame, parado.
    root.classList.remove('is-loading');
    loader.remove();
    loadFrame(0).then(resizeCanvas);
  } else {
    preload();
  }
  reduce.addEventListener('change', () => location.reload());

  /* ================= CARROSSEL DE DESTAQUES ================= */
  const vp = $('#carousel');
  const prev = $('#carPrev');
  const next = $('#carNext');
  const autoBtn = $('#carAuto');
  const cards = [...vp.querySelectorAll('.card')];

  const step = () => cards[0].getBoundingClientRect().width + 16;
  const updateArrows = () => {
    prev.disabled = vp.scrollLeft <= 2;
    next.disabled = vp.scrollLeft + vp.clientWidth >= vp.scrollWidth - 2;
  };
  prev.addEventListener('click', () => vp.scrollBy({ left: -step(), behavior }));
  next.addEventListener('click', () => vp.scrollBy({ left: step(), behavior }));
  vp.addEventListener('scroll', updateArrows, { passive: true });
  vp.addEventListener('keydown', (e) => {
    if (e.target !== vp) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); vp.scrollBy({ left: step(), behavior }); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); vp.scrollBy({ left: -step(), behavior }); }
  });
  updateArrows();

  // Arrastar com o mouse (no celular, é só deslizar o dedo)
  let drag = null, moved = false;
  vp.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: vp.scrollLeft }; moved = false;
  });
  vp.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 5) { moved = true; vp.classList.add('is-dragging'); }
    if (moved) vp.scrollLeft = drag.left - dx;
  });
  const endDrag = () => {
    if (!drag) return;
    drag = null; vp.classList.remove('is-dragging');
    setTimeout(() => { moved = false; }, 0);
  };
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => vp.addEventListener(t, endDrag));

  // Rolagem automática: desligada por padrão, liga e desliga no botão
  let auto = false, hold = false, acc = 0, lastT = 0;
  const autoTick = (t) => {
    if (!auto) return;
    const dt = lastT ? Math.min(t - lastT, 64) : 0; lastT = t;
    if (!hold) {
      acc += 40 * dt / 1000;
      const px = Math.floor(acc);
      if (px >= 1) {
        acc -= px;
        if (vp.scrollLeft + vp.clientWidth >= vp.scrollWidth - 1) vp.scrollLeft = 0; else vp.scrollLeft += px;
      }
    }
    requestAnimationFrame(autoTick);
  };
  autoBtn.addEventListener('click', () => {
    auto = !auto;
    autoBtn.setAttribute('aria-pressed', String(auto));
    autoBtn.textContent = auto ? 'Rolagem automática: ligada' : 'Rolagem automática: desligada';
    vp.classList.toggle('is-auto', auto);
    lastT = 0;
    if (auto) requestAnimationFrame(autoTick);
  });
  ['mouseenter', 'focusin', 'touchstart'].forEach((t) => vp.addEventListener(t, () => { hold = true; }, { passive: true }));
  ['mouseleave', 'focusout', 'touchend'].forEach((t) => vp.addEventListener(t, () => { hold = false; }, { passive: true }));

  /* ================= JANELA DE DETALHES ================= */
  const dlg = $('#detail');
  const dTitle = $('#detailTitle');
  const dBody = $('#detailBody');
  const dCta = $('#detailCta');
  let opener = null;

  function openDetail(key, from) {
    const d = DETAILS[key];
    if (!d) return;
    opener = from;
    dTitle.textContent = d.title;
    dBody.replaceChildren();
    const p = document.createElement('p'); p.textContent = d.intro;
    const h = document.createElement('h4'); h.textContent = d.label;
    const ul = document.createElement('ul');
    d.items.forEach((t) => { const li = document.createElement('li'); li.textContent = t; ul.append(li); });
    dBody.append(p, h, ul);
    dCta.href = WHATSAPP + '?text=' + encodeURIComponent('Olá! Quero saber mais sobre: ' + d.title);
    dlg.showModal();
  }
  cards.forEach((c) => c.addEventListener('click', () => {
    if (moved) return;
    openDetail(c.dataset.key, c.querySelector('.card__more'));
  }));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => { if (opener) opener.focus(); });

  /* ================= EFEITO DO MOUSE ================= */
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const glow = $('#cursorGlow');
  if (fine.matches && !reduce.matches && glow) {
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, g = 0;
    const move = () => {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      glow.style.transform = 'translate3d(' + (x - 240) + 'px,' + (y - 240) + 'px,0)';
      g = (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) ? requestAnimationFrame(move) : 0;
    };
    addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      glow.classList.add('is-on');
      if (!g) g = requestAnimationFrame(move);
    }, { passive: true });
    root.addEventListener('mouseleave', () => glow.classList.remove('is-on'));
    cards.forEach((c) => c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }));
  }
})();
