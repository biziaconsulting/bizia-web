/* BizIA · hero.js
   Pointer depth for the hero planes. The engine owns the scroll (the clip and
   --sc-p); this only publishes a lerped pointer position as --mx / --my
   (-1..1) on the hero, and the CSS moves each plane by its own amount:
   the plate the least, the light more. Fine pointers only,
   never with motion off, and idle once the hero has scrolled away. */
(function () {
  'use strict';
  var hero = document.querySelector('.hero');
  if (!hero) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var tx = 0, ty = 0, cx = 0, cy = 0, running = false;

  function visible() { return scrollY < hero.offsetHeight; }

  function loop() {
    cx += (tx - cx) * 0.075;
    cy += (ty - cy) * 0.075;
    hero.style.setProperty('--mx', cx.toFixed(4));
    hero.style.setProperty('--my', cy.toFixed(4));
    if (visible() && (Math.abs(tx - cx) > 0.0005 || Math.abs(ty - cy) > 0.0005)) requestAnimationFrame(loop);
    else running = false;
  }

  addEventListener('pointermove', function (e) {
    if (!visible()) return;
    tx = (e.clientX / innerWidth) * 2 - 1;
    ty = (e.clientY / innerHeight) * 2 - 1;
    if (!running) { running = true; requestAnimationFrame(loop); }
  }, { passive: true });

  // When the pointer leaves the window the scene settles back to rest.
  document.addEventListener('pointerleave', function () {
    tx = 0; ty = 0;
    if (!running) { running = true; requestAnimationFrame(loop); }
  });
})();
