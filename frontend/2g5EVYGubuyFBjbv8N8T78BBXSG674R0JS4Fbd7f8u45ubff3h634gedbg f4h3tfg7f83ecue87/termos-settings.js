
    (function() {
      'use strict';

      const progressBar = document.getElementById('progressBar');
      const checkHint = document.getElementById('check-hint');
      const tocLinks = document.querySelectorAll('.toc-list a');
      const sections = document.querySelectorAll('.terms-section');
      const checkboxWrapper = document.getElementById('checkboxWrapper');
      const scrollHint = document.getElementById('scrollHint');
      const appHeader = document.getElementById('appHeader');

      let hasShownScrollHint = false;
      let isUnlocked = false;

      // =========================
      // BARRA DE PROGRESSO + TOC
      // =========================
      function updateProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = Math.min(progress, 100) + '%';

        // Scroll hint nos primeiros 20%
        if (progress < 20 && !hasShownScrollHint && !isUnlocked) {
          scrollHint.classList.add('show');
        } else {
          scrollHint.classList.remove('show');
          if (progress >= 20) hasShownScrollHint = true;
        }

        // Active TOC
        let current = '';
        sections.forEach(section => {
          const sectionTop = section.offsetTop;
          if (window.scrollY >= sectionTop - 120) {
            current = section.getAttribute('id');
          }
        });

        tocLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
          }
        });
      }

      window.addEventListener('scroll', updateProgress, { passive: true });

      // =========================
      // CHECKBOX
      // =========================
      check.addEventListener('change', () => {
        if (check.checked) {
          botao.disabled = false;
          botao.classList.add('active');
          botao.innerHTML = '<span>Concordo e Continuar</span><i class="ph ph-arrow-right btn-icon"></i>';
        } else {
          botao.disabled = true;
          botao.classList.remove('active');
        }
      });
      // =========================
      // HEADER SHADOW ON SCROLL
      // =========================
      window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
          appHeader.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
        } else {
          appHeader.style.boxShadow = 'none';
        }
      }, { passive: true });

      // Init
      updateProgress();
    })();
  