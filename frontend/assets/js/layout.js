/**
 * Shared layout loader.
 *
 * Shared components are optional.
 * They are loaded only when their placeholders exist.
 * Components can contain placeholders of other components (e.g. navbar inside header).
 *
 * Preloader is intentionally NOT loaded here.
 */
(function () {
  'use strict';

  // Frontend root, derived from the URL of this script (.../frontend/)
  var BASE = (function () {
    var script = document.currentScript;
    return script && script.src ? new URL('../../', script.src).href : '';
  })();

  var COMPONENT_IDS = [
    'header',
    'footer',
    'navbar',
    'mobile-menu',
    'breadcrumb',
    'modal',
    'toast',
    'product-grid',
    'product-card',
    'product-categories',
    'category-card',
    'search', 
    'filters',
    'price-filter',
    'sorting',
    'wishlist',
    'ratings-reviews',
    'cart', 
    'cart-item', 
    'mini-cart', 
    'checkout', 
    'coupon',
    'newsletter', 
    'hero',
    'related-products', 
    'product-gallery', 
    'quantity'
  ];

  // Links and images inside components are resolved from the frontend root,
  // so "/index.html", "./assets/x.svg" and "assets/x.svg" all work from any page depth.
  function fixUrls(root) {
    if (!BASE) {
      return;
    }

    var external = /^(?:[a-z][a-z0-9+.-]*:|#|\?|\/\/)/i;

    root.querySelectorAll('[href], [src]').forEach(function (el) {
      ['href', 'src'].forEach(function (attr) {
        var value = el.getAttribute(attr);

        if (!value || external.test(value)) {
          return;
        }

        el.setAttribute(attr, new URL(value.replace(/^\/+/, ''), BASE).href);
      });
    });
  }

  function loadComponent(id, ancestors) {
    var target = document.getElementById(id);

    if (!target) {
      return Promise.resolve();
    }

    var chain = ancestors.concat(id);
    var src = 'components/' + id + '.html';

    return fetch(BASE + src)
      .then(function (res) {
        if (!res.ok) {
          throw new Error(
            'Failed to fetch ' + src + ' (HTTP ' + res.status + ')'
          );
        }

        return res.text();
      })
      .then(function (html) {
        target.innerHTML = html;
        fixUrls(target);
        return loadNested(target, chain);
      })
      .catch(function (err) {
        console.error('[layout.js] Could not load ' + src + ':', err);
      });
  }

  // Loads components whose placeholders live inside an already loaded component.
  function loadNested(root, chain) {
    return Promise.all(
      COMPONENT_IDS.map(function (id) {
        // Prevent infinite loops: a component already in the chain is skipped
        if (chain.indexOf(id) !== -1) {
          return Promise.resolve();
        }

        if (!root.querySelector('#' + id)) {
          return Promise.resolve();
        }

        return loadComponent(id, chain);
      })
    );
  }

  function initFooterYear() {
    var yearEl = document.getElementById('footer-year');

    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  function init() {
    Promise.all(
      COMPONENT_IDS.map(function (id) {
        return loadComponent(id, []);
      })
    ).then(initFooterYear);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
