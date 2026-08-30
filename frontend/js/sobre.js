
(function() {
  'use strict';

  // Scroll progress bar
  const progressBar = document.getElementById('progressBar');
  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = Math.min(progress, 100) + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // Scroll to top button
  const scrollBtn = document.getElementById('scrollTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      scrollBtn.classList.add('visible');
    } else {
      scrollBtn.classList.remove('visible');
    }
  }, { passive: true });
  scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Intersection Observer for section animations
  const sections = document.querySelectorAll('.section');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  sections.forEach(section => observer.observe(section));

  // Share button
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn && navigator.share) {
    shareBtn.addEventListener('click', async () => {
      try {
        await navigator.share({
          title: 'Sobre Nós | EZNY',
          text: 'Conheça a EZNY - A principal plataforma de marketplace em Angola.',
          url: window.location.href
        });
      } catch (err) {
        // Usador cancelou ou erro — silencioso
      }
    });
  } else if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
      const original = shareBtn.innerHTML;
      shareBtn.innerHTML = '<i class="ph-fill ph-check"></i>';
      setTimeout(() => { shareBtn.innerHTML = original; }, 1500);
    });
  }

})();
