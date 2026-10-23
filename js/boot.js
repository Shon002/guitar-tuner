/* Колок — тема до первой отрисовки, чтобы не мелькала тёмная. Отдельным файлом: политика безопасности страницы запрещает встроенные скрипты. */
try { var k = JSON.parse(localStorage.getItem('kolok.v1') || 'null'); if (k && k.theme === 'light') document.documentElement.dataset.theme = 'light'; } catch (e) {}
