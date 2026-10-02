import { cerrarSesion } from '../auth/auth.js';

// Activa el botón de cerrar sesión
const btnCerrar = document.getElementById('btn-cerrar-sesion');
if (btnCerrar) {
  btnCerrar.addEventListener('click', (e) => {
    e.preventDefault();
    cerrarSesion();
  });
}