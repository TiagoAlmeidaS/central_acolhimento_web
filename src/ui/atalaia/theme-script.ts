export const THEME_STORAGE_KEY = "atalaia-theme";

/**
 * Executado no <head> antes da hidratacao: aplica o tema escolhido sem piscar.
 * Escuro e o padrao; so "light" altera o <html>.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();`;
