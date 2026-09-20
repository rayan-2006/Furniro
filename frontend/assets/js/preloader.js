(function () {
  'use strict';

  function hidePreloader() {
    var preloader =
      document.getElementById('preloader');

    if (!preloader) {
      return;
    }

    preloader.classList.add('is-hidden');

    var remove = function () {
      if (
        preloader &&
        preloader.parentNode
      ) {
        preloader.parentNode.removeChild(
          preloader
        );
      }
    };

    preloader.addEventListener(
      'transitionend',
      remove,
      { once: true }
    );

    window.setTimeout(
      remove,
      700
    );
  }

  if (
    document.readyState ===
    'complete'
  ) {
    window.requestAnimationFrame(
      hidePreloader
    );
  } else {
    window.addEventListener(
      'load',
      function () {
        window.requestAnimationFrame(
          hidePreloader
        );
      },
      { once: true }
    );
  }
})();
