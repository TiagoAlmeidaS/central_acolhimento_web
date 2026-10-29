// Percorre a demonstração em Chromium (desktop e celular), exercita os fluxos principais
// e falha se houver erro de JavaScript, overflow horizontal ou requisição externa além das fontes.
// Uso: node examples/atalaia/scripts/smoke.mjs [pasta-de-capturas]
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const url = pathToFileURL(join(here, '..', 'index.html')).href;
const shots = process.argv[2];
if (shots) mkdirSync(shots, { recursive: true });

const checks = [];
const check = (name, ok, detail = '') => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
for (const vp of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  // Escuro é o padrão; o claro é a escolha explícita salva pelo seletor de tema.
  for (const scheme of ['dark', 'light']) {
    const ctx = await browser.newContext({ viewport: vp });
    if (scheme === 'light')
      await ctx.addInitScript(() => localStorage.setItem('atalaia-theme', 'light'));
    const page = await ctx.newPage();
    const errors = [];
    const external = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on(
      'console',
      (m) => m.type() === 'error' && !/fonts\.g/.test(m.location().url) && errors.push(m.text()),
    );
    page.on('request', (r) => {
      const u = r.url();
      if (!u.startsWith('file:') && !/fonts\.(googleapis|gstatic)\.com/.test(u)) external.push(u);
    });
    // Fontes podem não carregar offline; o teste não depende delas.
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    const tag = `${vp.name}/${scheme}`;
    const overflow = async (where) => {
      const w = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(`${tag} ${where}: sem rolagem horizontal`, w <= 1, `${w}px`);
    };
    const shot = async (n) =>
      shots &&
      (await page.screenshot({
        path: join(shots, `${vp.name}-${scheme}-${n}.png`),
        fullPage: false,
      }));

    await page.goto(url + '#inicio');
    await page.waitForSelector('#hero-frame');
    check(`${tag} landing renderiza`, (await page.locator('h1').innerText()).includes('esquecido'));
    // Loops ambientes derivados de reference/postman-home: duração e repetição lidas da Web Animations API.
    const loops = await page.evaluate(() => {
      const of = (q) => {
        const el = document.querySelector(q);
        const a = el && el.getAnimations()[0];
        return a ? [a.effect.getTiming().duration, a.effect.getTiming().iterations] : null;
      };
      return {
        cursor: of('#hero-cursor'),
        glow: of('.l-dawn .glow'),
        drift: of('.l-dawn .drift'),
        veil: of('.l-dawn .veil'),
        marquee: of('.l-marquee'),
        pulse: of('.l-cmd-note .dot'),
      };
    });
    const want = {
      cursor: 1050,
      glow: 9000,
      drift: 22000,
      veil: 26000,
      marquee: 60000,
      pulse: 2000,
    };
    for (const [k, ms] of Object.entries(want))
      check(
        `${tag} loop ${k} ${ms}ms infinito`,
        !!loops[k] && loops[k][0] === ms && loops[k][1] === Infinity,
        JSON.stringify(loops[k]),
      );
    for (const id of ['rede', 'cadastro', 'mapa', 'fluxo', 'papeis', 'fechamento'])
      check(`${tag} seção ${id} presente`, (await page.locator(`#${id}`).count()) === 1);
    await overflow('landing');
    await shot('01-landing');

    for (const r of ['painel', 'contatos', 'assistidos', 'saidas', 'encontros', 'ajustes']) {
      await page.evaluate((h) => (location.hash = h), r);
      await page.waitForFunction((h) => window.__atalaia.route() === h, r);
      await overflow(r);
      await shot(`02-${r}`);
    }

    if (scheme === 'dark') {
      // Linha de cadastro da landing cria o contato e abre o quadro
      await page.evaluate(() => (location.hash = 'inicio'));
      await page.waitForSelector('#hero-frame');
      const s0 = await page.evaluate(() => window.__atalaia.counts().seeds);
      await page.fill('#hc-who', 'Josefa Teste Lucena · (83) 98888-1234 · Torre');
      await page.locator('#hero form button').click();
      await page.waitForFunction(() => window.__atalaia.route() === 'contatos');
      check(
        `${tag} cadastro pela landing`,
        (await page.evaluate(() => window.__atalaia.counts().seeds)) === s0 + 1,
      );
      await page.evaluate(() => (location.hash = 'inicio'));
      await page.waitForSelector('#hero-frame');
      await page.fill('#hc-who', 'sem telefone');
      await page.locator('#hero form button').click();
      check(
        `${tag} erro da linha de cadastro`,
        (await page.locator('#hc-err').innerText()).includes('telefone'),
      );
      await page.selectOption('#l-role', 'cuidador');
      check(
        `${tag} passos mudam por papel`,
        (await page.locator('#l-steps').innerText()).includes('Registrar'),
      );

      // Novo contato pelo drawer
      await page.evaluate(() => (location.hash = 'contatos'));
      const before = await page.evaluate(() => window.__atalaia.counts().seeds);
      await page.getByRole('button', { name: 'Novo contato' }).first().click();
      await page.getByRole('button', { name: 'Cadastrar contato' }).click();
      check(
        `${tag} validação do cadastro`,
        (await page.locator('#pf-err').innerText()).includes('nome'),
      );
      await page.fill('#pf-ref', 'Severino Teste Galdino');
      await page.fill('#pf-tel', '(83) 99876-5432');
      await page.getByRole('button', { name: 'Cadastrar contato' }).click();
      const after = await page.evaluate(() => window.__atalaia.counts().seeds);
      check(`${tag} contato criado`, after === before + 1);
      await page.getByRole('button', { name: /Severino Teste Galdino/ }).click();
      await page.getByRole('button', { name: /Avançar para contatado/ }).click();
      check(
        `${tag} avançar etapa`,
        (await page.locator('#drawer-title').innerText()).includes('Severino'),
      );
      await page.keyboard.press('Escape');
      check(`${tag} Esc fecha o drawer`, await page.locator('#drawer-layer').isHidden());

      for (const v of ['Lista', 'Mapa']) {
        await page.getByRole('button', { name: v, exact: true }).click();
        await overflow(`contatos ${v.toLowerCase()}`);
        await shot(`03-contatos-${v.toLowerCase()}`);
      }

      // Acompanhamento
      await page.evaluate(() => (location.hash = 'assistidos'));
      const f0 = await page.evaluate(() => window.__atalaia.counts().followups);
      await page.locator('tbody tr').first().click();
      await page.getByRole('button', { name: 'Registrar acompanhamento' }).click();
      await page.fill('#fu-notes', 'Visita com a família, oramos juntos.');
      await page.getByRole('button', { name: 'Salvar acompanhamento' }).click();
      check(
        `${tag} acompanhamento salvo`,
        (await page.evaluate(() => window.__atalaia.counts().followups)) === f0 + 1,
      );

      // Saídas: montar grupos
      await page.evaluate(() => (location.hash = 'saidas'));
      const draft = page.getByRole('button', { name: /Saída de sábado/ }).first();
      await draft.click();
      await page.getByRole('button', { name: 'Montar grupos' }).click();
      check(`${tag} grupos montados`, (await page.locator('.car').count()) > 0);
      await shot('04-saidas-grupos');

      // Papel cuidador
      await page.getByRole('button', { name: 'Cuidador', exact: true }).click();
      await page.evaluate(() => (location.hash = 'contatos'));
      await page.waitForFunction(() => window.__atalaia.route() === 'contatos');
      check(
        `${tag} cuidador não vê ajustes da igreja`,
        !(await page.getByRole('link', { name: 'Ajustes' }).count()),
      );
      await page.getByRole('button', { name: 'Coordenação', exact: true }).click();

      // Ajustes: canal novo
      await page.evaluate(() => (location.hash = 'ajustes'));
      await page.getByRole('button', { name: 'Canais de cadastro' }).click();
      await page.getByRole('button', { name: 'Novo canal' }).click();
      await page.fill('#chn-name', 'Equipe de recepção');
      await page.getByRole('button', { name: 'Criar canal' }).click();
      check(
        `${tag} canal criado`,
        (await page.getByRole('heading', { name: 'Equipe de recepção' }).count()) === 1,
      );
      await shot('05-ajustes-canais');

      // Onboarding até a central vazia
      await page.evaluate(() => (location.hash = 'comecar'));
      await page.fill('#onb-church', 'Igreja Central Sousa');
      await page.getByRole('button', { name: 'Continuar' }).click();
      await page.fill('#onb-name', 'Conceição Medeiros');
      await page.fill('#onb-email', 'conceicao@centralsousa.org.br');
      await page.getByRole('button', { name: 'Continuar' }).click();
      await shot('06-onboarding');
      await page.getByRole('button', { name: 'Criar a central' }).click();
      await page.waitForFunction(() => window.__atalaia.route() === 'painel');
      check(
        `${tag} central nova mostra vazio que ensina`,
        (await page.locator('.empty').count()) === 1,
      );
      for (const r of ['contatos', 'assistidos', 'saidas', 'encontros', 'ajustes']) {
        await page.evaluate((h) => (location.hash = h), r);
        await page.waitForFunction((h) => window.__atalaia.route() === h, r);
      }
      await shot('07-central-vazia');
    }

    check(`${tag} sem erros de JavaScript`, errors.length === 0, errors.slice(0, 3).join(' | '));
    check(`${tag} sem requisições externas`, external.length === 0, external.slice(0, 3).join(' '));
    await ctx.close();
  }
}

// Movimento reduzido: título fixo; letreiro, cursor e arco parados; ponto do diagrama removido.
const ctx = await browser.newContext({ reducedMotion: 'reduce' });
const page = await ctx.newPage();
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(url);
await page.waitForTimeout(3200);
check(
  'reduced-motion: palavra do título não troca',
  (await page.locator('#hero-word').innerText()) === 'Acolhimento',
);
const anim = await page.evaluate(() =>
  ['.l-marquee', '#hero-cursor', '.l-dawn .glow'].map(
    (q) => getComputedStyle(document.querySelector(q)).animationName,
  ),
);
check(
  'reduced-motion: letreiro, cursor e arco parados',
  anim.every((a) => a === 'none'),
  anim.join(','),
);
check(
  'reduced-motion: ponto do diagrama removido',
  (await page.locator('#flow-dot').count()) === 0,
);
await ctx.close();
await browser.close();

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} verificações passaram`);
process.exit(failed.length ? 1 : 0);
