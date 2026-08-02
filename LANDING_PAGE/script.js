/* =========================================================
   Sonrisa Imperial — Clínica Dental
   Interacciones de la landing page
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Año en el footer ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sombra del header al hacer scroll ---------- */
  var header = document.getElementById('header');
  var onScroll = function () {
    header.classList.toggle('is-stuck', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Animación de entrada ---------- */
  var revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

    revealables.forEach(function (el) { observer.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Formulario de cita ---------- */
  var form = document.getElementById('booking-form');
  if (!form) return;

  var statusEl  = document.getElementById('form-status');
  var successEl = document.getElementById('success-panel');
  var detailEl  = document.getElementById('success-detail');
  var resetBtn  = document.getElementById('reset-form');
  var fechaEl   = document.getElementById('fecha');

  // La fecha mínima es hoy; no aceptamos reservas a más de 6 meses.
  var today = new Date();
  var toISO = function (d) { return d.toISOString().split('T')[0]; };
  fechaEl.min = toISO(today);
  var maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + 6);
  fechaEl.max = toISO(maxDate);

  var RULES = {
    nombre: function (v) {
      if (!v.trim()) return 'Escribe tu nombre.';
      if (v.trim().length < 3) return 'El nombre parece demasiado corto.';
      return '';
    },
    telefono: function (v) {
      if (!v.trim()) return 'Necesitamos un teléfono para confirmar la cita.';
      var digits = v.replace(/\D/g, '');
      if (digits.length < 7) return 'Introduce un teléfono válido.';
      return '';
    },
    email: function (v) {
      if (!v.trim()) return ''; // opcional
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Revisa el formato del correo.';
    },
    servicio: function (v) {
      return v ? '' : 'Selecciona el motivo de la consulta.';
    },
    fecha: function (v) {
      if (!v) return 'Elige una fecha preferida.';
      var picked = new Date(v + 'T00:00:00');
      var start  = new Date(toISO(today) + 'T00:00:00');
      if (picked < start) return 'La fecha ya pasó.';
      if (picked.getDay() === 0) return 'Los domingos permanecemos cerrados.';
      return '';
    },
    consentimiento: function (_v, el) {
      return el.checked ? '' : 'Necesitamos tu autorización para contactarte.';
    }
  };

  var setError = function (name, message) {
    var input   = form.elements[name];
    var errorEl = form.querySelector('[data-error-for="' + name + '"]');
    var wrapper = input.closest('.field');

    if (errorEl) errorEl.textContent = message;
    if (wrapper) wrapper.classList.toggle('has-error', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  };

  var validateField = function (name) {
    var input = form.elements[name];
    var error = RULES[name](input.value, input);
    setError(name, error);
    return !error;
  };

  // Valida al salir del campo y limpia el error mientras se corrige.
  Object.keys(RULES).forEach(function (name) {
    var input = form.elements[name];
    if (!input) return;
    input.addEventListener('blur', function () { validateField(name); });
    input.addEventListener('input', function () {
      if (input.closest('.field') && input.closest('.field').classList.contains('has-error')) {
        validateField(name);
      }
    });
    if (input.type === 'checkbox' || input.tagName === 'SELECT') {
      input.addEventListener('change', function () { validateField(name); });
    }
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    statusEl.textContent = '';

    var names   = Object.keys(RULES);
    var invalid = names.filter(function (name) { return !validateField(name); });

    if (invalid.length) {
      statusEl.textContent = 'Revisa los campos marcados para continuar.';
      var firstEl = form.elements[invalid[0]];
      firstEl.focus();
      firstEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    form.classList.add('is-submitting');

    // Punto de integración: aquí se envían los datos al backend / CRM.
    var data = {
      nombre:   form.elements.nombre.value.trim(),
      telefono: form.elements.telefono.value.trim(),
      email:    form.elements.email.value.trim(),
      servicio: form.elements.servicio.value,
      fecha:    form.elements.fecha.value,
      horario:  form.querySelector('input[name="horario"]:checked').value,
      mensaje:  form.elements.mensaje.value.trim()
    };
    console.log('Solicitud de cita:', data);

    window.setTimeout(function () {
      form.classList.remove('is-submitting');

      var fechaTexto = new Date(data.fecha + 'T00:00:00')
        .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

      detailEl.textContent =
        'Gracias, ' + data.nombre.split(' ')[0] + '. Hemos recibido tu solicitud para el ' +
        fechaTexto + ' por la ' + data.horario.toLowerCase() +
        '. Te confirmaremos el horario al ' + data.telefono + ' en menos de 24 horas.';

      form.hidden = true;
      successEl.hidden = false;
      successEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 600);
  });

  resetBtn.addEventListener('click', function () {
    form.reset();
    Object.keys(RULES).forEach(function (name) { setError(name, ''); });
    statusEl.textContent = '';
    successEl.hidden = true;
    form.hidden = false;
    form.elements.nombre.focus();
  });
})();
