/**
 * Shared layout loader.
 *
 * Shared components are optional.
 * They are loaded only when their placeholders exist.
 *
 * Preloader is intentionally NOT loaded here.
 */
(function () {
  'use strict';

  var COMPONENTS = [
    {
      id: 'header',
      src: 'components/header.html'
    },
    {
      id: 'footer',
      src: 'components/footer.html'
    },
    {
      id: 'navbar',
      src: 'components/navbar.html'
    },
    {
      id: 'mobile-menu',
      src: 'components/mobile-menu.html'
    },
    {
      id: 'breadcrumb',
      src: 'components/breadcrumb.html'
    },
    {
      id: 'modal',
      src: 'components/modal.html'
    },
    {
      id: 'toast',
      src: 'components/toast.html'
    },
    {
      id: 'product-grid',
      src: 'components/product-grid.html'
    },
    {
      id: 'product-card',
      src: 'components/product-card.html'
    },
    {
      id: 'product-categories',
      src: 'components/product-categories.html'
    },
    {
      id: 'category-card',
      src: 'components/category-card.html'
    },
    {
      id: 'search',
      src: 'components/search.html'
    },
    {
      id: 'filters',
      src: 'components/filters.html'
    },
    {
      id: 'price-filter',
      src: 'components/price-filter.html'
    },
    {
      id: 'sorting',
      src: 'components/sorting.html'
    },
    {
      id: 'wishlist',
      src: 'components/wishlist.html'
    },
    {
      id: 'ratings-reviews',
      src: 'components/ratings-reviews.html'
    },
    {
      id: 'cart',
      src: 'components/cart.html'
    },
    {
      id: 'cart-item',
      src: 'components/cart-item.html'
    },
    {
      id: 'mini-cart',
      src: 'components/mini-cart.html'
    },
    {
      id: 'checkout',
      src: 'components/checkout.html'
    },
    {
      id: 'coupon',
      src: 'components/coupon.html'
    },
    {
      id: 'newsletter',
      src: 'components/newsletter.html'
    },
    {
      id: 'related-products',
      src: 'components/related-products.html'
    },
    {
      id: 'product-gallery',
      src: 'components/product-gallery.html'
    },
    {
      id: 'quantity',
      src: 'components/quantity.html'
    }
  ];

  function loadComponent(id, src) {
    var target = document.getElementById(id);

    if (!target) {
      return Promise.resolve();
    }

    return fetch(src)
      .then(function (res) {
        if (!res.ok) {
          throw new Error(
            'Failed to fetch ' +
            src +
            ' (HTTP ' +
            res.status +
            ')'
          );
        }

        return res.text();
      })
      .then(function (html) {
        target.innerHTML = html;
      })
      .catch(function (err) {
        console.error(
          '[layout.js] Could not load ' + src + ':',
          err
        );
      });
  }

  function initFooterYear() {
    var yearEl = document.getElementById('footer-year');

    if (yearEl) {
      yearEl.textContent =
        String(new Date().getFullYear());
    }
  }

  function init() {
    Promise.all(
      COMPONENTS.map(function (component) {
        return loadComponent(
          component.id,
          component.src
        );
      })
    ).then(initFooterYear);
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      init
    );
  } else {
    init();
  }
})();
