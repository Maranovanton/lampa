/*
 * Lampa plugin: «Верхняя панель»
 * Позволяет скрывать/показывать иконки верхней панели (поиск, уведомления,
 * настройки, профиль, иконки других плагинов), часы, дату и день недели.
 * Настройки → Верхняя панель
 */
(function () {
  'use strict';
  if (window.headcfg_plugin_loaded) return;
  window.headcfg_plugin_loaded = true;

  var PREFIX = 'headcfg_';
  var COMPONENT = 'headcfg';
  var IGNORE = ['head__action', 'selector', 'focus', 'hide', 'active', 'animate', 'hover', 'enabled', 'disabled'];
  var NAMES = {
    'open--search': 'Поиск',
    'notice--icon': 'Уведомления',
    'open--notice': 'Уведомления',
    'open--settings': 'Настройки',
    'open--profile': 'Профиль',
    'full--screen': 'Полный экран',
    'open--broadcast': 'Трансляция',
    'open--premium': 'Премиум',
    'open--feed': 'Лента'
  };
  var TIME_PARTS = [
    { key: 'time', sel: '.head__time-now', name: 'Часы' },
    { key: 'date', sel: '.head__time-date', name: 'Дата' },
    { key: 'week', sel: '.head__time-week', name: 'День недели' }
  ];

  var registered = {};
  var style;
  var scanTimer;

  function isOn(key) {
    var v = Lampa.Storage.get(PREFIX + key, 'true');
    return !(v === false || v === 'false');
  }

  function esc(s) {
    return window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/([^\w-])/g, '\\$1');
  }

  function keyOf(el) {
    var cls = typeof el.className === 'string' ? el.className.split(/\s+/) : [];
    for (var i = 0; i < cls.length; i++) {
      if (cls[i] && IGNORE.indexOf(cls[i]) < 0) return cls[i];
    }
    return null;
  }

  function apply() {
    var css = '.headcfg-ico{display:inline-flex;width:1.3em;height:1.3em;margin-right:.6em;vertical-align:middle}' +
              '.headcfg-ico svg{width:100%;height:100%}';
    Object.keys(registered).forEach(function (k) {
      if (!isOn(k)) css += '.head .' + esc(k) + '{display:none!important}';
    });
    TIME_PARTS.forEach(function (p) {
      if (!isOn(p.key)) css += '.head ' + p.sel + '{display:none!important}';
    });
    if (!isOn('time') && !isOn('date') && !isOn('week')) css += '.head .head__time{display:none!important}';
    style.textContent = css;
  }

  function addToggle(key, name, desc) {
    Lampa.SettingsApi.addParam({
      component: COMPONENT,
      param: { name: PREFIX + key, type: 'trigger', default: true },
      field: { name: name, description: desc || '' },
      onChange: apply
    });
  }

  function scan() {
    var items = document.querySelectorAll('.head__actions > *');
    if (!items.length) items = document.querySelectorAll('.head .head__action');
    var added = false;

    Array.prototype.forEach.call(items, function (el) {
      var k = keyOf(el);
      if (!k || registered[k]) return;
      registered[k] = true;
      added = true;

      var svg = el.querySelector('svg');
      var label = NAMES[k] || el.getAttribute('title') || el.getAttribute('data-name') || k;
      var icon = svg ? '<span class="headcfg-ico">' + svg.outerHTML + '</span>' : '';
      addToggle(k, icon + label, 'Иконка в верхней панели (' + k + ')');
    });

    if (added) apply();
  }

  function scanLater() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 500);
  }

  function start() {
    style = document.createElement('style');
    style.id = 'headcfg-style';
    document.head.appendChild(style);

    Lampa.SettingsApi.addComponent({
      component: COMPONENT,
      name: 'Верхняя панель',
      icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<rect x="2" y="3" width="20" height="6" rx="2" stroke="currentColor" stroke-width="2"/>' +
            '<rect x="2" y="12" width="20" height="9" rx="2" stroke="currentColor" stroke-width="2" opacity=".4"/></svg>'
    });

    TIME_PARTS.forEach(function (p) { addToggle(p.key, p.name, 'Блок времени справа'); });

    apply();
    scan();
    setTimeout(scan, 3000); // иконки других плагинов появляются позже

    var head = document.querySelector('.head');
    if (head && window.MutationObserver) {
      new MutationObserver(scanLater).observe(head, { childList: true, subtree: true });
    }
  }

  if (window.appready) start();
  else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();
