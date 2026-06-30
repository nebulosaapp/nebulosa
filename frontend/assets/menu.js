// Função utilitária para renderizar e gerenciar o Menu Hamburguer Global com i18n
import { I18N, getLang, setLang, LANG_NAMES } from './i18n.js';

export function injetarMenuGlobal() {
  const currentPath = window.location.pathname;
  const lang = getLang();
  const L = I18N[lang] || I18N['pt'];

  // 1. Overlay
  const overlay = document.createElement('div');
  overlay.className = 'menu-overlay';
  overlay.id = 'menuOverlay';
  document.body.appendChild(overlay);

  // 2. Menu drawer
  const drawer = document.createElement('div');
  drawer.className = 'menu-drawer';
  drawer.id = 'menuDrawer';
  
  const userName = localStorage.getItem('bdsm_user_name') || (lang === 'en' ? 'Guest' : lang === 'es' ? 'Invitado' : 'Convidado');

    drawer.innerHTML = `
      <button class="menu-close" id="menuCloseBtn">✕ ${lang === 'en' ? 'Close' : lang === 'es' ? 'Cerrar' : 'Fechar'}</button>
      <div style="margin-top: 1rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem;">
        <span style="font-size: 0.85rem; color: #8e92a2; text-transform: uppercase; font-weight: 600;">${lang === 'en' ? 'Active Account' : lang === 'es' ? 'Cuenta Activa' : 'Conta Ativa'}</span>
        <div style="font-size: 1.1rem; font-weight: 800; color: var(--accent-color); margin-top: 0.25rem; word-break: break-all;">${userName}</div>
      </div>
      <div class="menu-links">
        <a href="home.html" class="menu-link ${currentPath.includes('home') ? 'active' : ''}">${lang === 'en' ? 'Home' : lang === 'es' ? 'Inicio' : 'Início'}</a>
        <a href="perfil.html" class="menu-link ${currentPath.includes('perfil') ? 'active' : ''}">${L.menu_profile}</a>
        <a href="index.html" class="menu-link ${currentPath.includes('index') || currentPath.endsWith('/') ? 'active' : ''}">${L.menu_new_test}</a>
        <a href="biblioteca.html" class="menu-link ${currentPath.includes('biblioteca') ? 'active' : ''}">${L.menu_library || 'Biblioteca Nebulosa'}</a>
        <a href="relacional-test.html" class="menu-link ${currentPath.includes('relacional') ? 'active' : ''}" style="color:#c084fc; border-color:rgba(124,92,252,0.3);">Mapa Relacional</a>
      </div>

    <!-- Seletor de Idioma no Menu -->
    <div style="margin-top: auto; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 1.25rem;">
      <span style="font-size: 0.75rem; color: #8e92a2; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 0.75rem;">${L.menu_language}</span>
      <div style="display: flex; gap: 0.4rem;">
        <button onclick="menuChangeLang('pt')" id="menuLangPt" style="flex:1; padding: 0.5rem; border-radius: 8px; border: 1.5px solid ${lang === 'pt' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)'}; background: ${lang === 'pt' ? 'rgba(255,51,51,0.08)' : 'none'}; color: ${lang === 'pt' ? 'var(--accent-color)' : 'var(--text-muted)'}; font-size: 0.75rem; font-weight: 600; cursor: pointer;">PT</button>
        <button onclick="menuChangeLang('en')" id="menuLangEn" style="flex:1; padding: 0.5rem; border-radius: 8px; border: 1.5px solid ${lang === 'en' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)'}; background: ${lang === 'en' ? 'rgba(255,51,51,0.08)' : 'none'}; color: ${lang === 'en' ? 'var(--accent-color)' : 'var(--text-muted)'}; font-size: 0.75rem; font-weight: 600; cursor: pointer;">EN</button>
        <button onclick="menuChangeLang('es')" id="menuLangEs" style="flex:1; padding: 0.5rem; border-radius: 8px; border: 1.5px solid ${lang === 'es' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)'}; background: ${lang === 'es' ? 'rgba(255,51,51,0.08)' : 'none'}; color: ${lang === 'es' ? 'var(--accent-color)' : 'var(--text-muted)'}; font-size: 0.75rem; font-weight: 600; cursor: pointer;">ES</button>
      </div>
    </div>

    <a href="#" class="menu-link" id="menuLogoutBtn" style="color: #ff3333; margin-top: 1rem;">${L.menu_logout}</a>
  `;
  document.body.appendChild(drawer);

  // 3. Bind de Eventos
  const openBtn = document.getElementById('menuOpenBtn');
  const closeBtn = document.getElementById('menuCloseBtn');
  const logoutBtn = document.getElementById('menuLogoutBtn');

  const toggleMenu = () => {
    drawer.classList.toggle('open');
    overlay.classList.toggle('show');
  };

  if (openBtn) openBtn.addEventListener('click', toggleMenu);
  if (closeBtn) closeBtn.addEventListener('click', toggleMenu);
  overlay.addEventListener('click', toggleMenu);

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const msg = lang === 'en' ? 'Are you sure you want to log out?' : lang === 'es' ? '¿Seguro que quieres cerrar sesión?' : 'Deseja realmente sair da conta?';
      if (confirm(msg)) {
        localStorage.clear();
        window.location.href = 'login.html';
      }
    });
  }

  // Trocar idioma via menu
  window.menuChangeLang = function(newLang) {
    setLang(newLang);
    window.location.reload();
  };
}
