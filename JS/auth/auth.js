// JS/auth.js
import { sql } from '../config/neon-config.js';

export async function registrarUsuario(nombre, correo, contrasena) {
  await sql`INSERT INTO usuarios (nombre, correo, contrasena) VALUES (${nombre}, ${correo}, ${contrasena})`;
}

export async function iniciarSesion(correo, contrasena) {
  const filas = await sql`
    SELECT id, nombre FROM usuarios
    WHERE correo = ${correo} AND contrasena = ${contrasena};
  `;
  if (filas.length === 0) return null;
  sessionStorage.setItem('usuario', JSON.stringify(filas[0]));
  return filas[0];
}

export function cerrarSesion() {
  sessionStorage.removeItem('usuario');
}

// EVENTOS DE PESTAÑAS Y FORMULARIOS
document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const tabLogin = document.getElementById('tab-login');
  const tabRegistro = document.getElementById('tab-registro');
  const formLogin = document.getElementById('form-login');
  const formRegistro = document.getElementById('form-registro');
  const mensajeAuth = document.getElementById('mensaje-auth');

  // 1. LÓGICA PARA CAMBIAR DE PESTAÑA (Mostrar / Ocultar formularios)
  if (tabLogin && tabRegistro) {
    tabLogin.addEventListener('click', (e) => {
      e.preventDefault();
      tabLogin.classList.add('activa');
      tabRegistro.classList.remove('activa');
      formLogin.style.display = 'block';
      formRegistro.style.display = 'none';
      if (mensajeAuth) mensajeAuth.textContent = '';
    });

    tabRegistro.addEventListener('click', (e) => {
      e.preventDefault();
      tabRegistro.classList.add('activa');
      tabLogin.classList.remove('activa');
      formRegistro.style.display = 'block';
      formLogin.style.display = 'none';
      if (mensajeAuth) mensajeAuth.textContent = '';
    });
  }

  // 2. EVENTO PARA REGISTRAR USUARIO
  if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombre = document.getElementById('reg-nombre').value;
      const correo = document.getElementById('reg-correo').value;
      const contrasena = document.getElementById('reg-contrasena').value;

      try {
        await registrarUsuario(nombre, correo, contrasena);
        alert('Cuenta creada correctamente. Ahora puedes iniciar sesión.');
        formRegistro.reset();
        // Cambiar automáticamente a la pestaña de Iniciar Sesión
        tabLogin.click();
      } catch (error) {
        console.error('Error al registrar:', error);
        alert('Error al registrar. Es posible que el correo ya esté registrado.');
      }
    });
  }

  // 3. EVENTO PARA INICIAR SESIÓN
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const correo = document.getElementById('login-correo').value;
      const contrasena = document.getElementById('login-contrasena').value;

      try {
        const usuario = await iniciarSesion(correo, contrasena);
        if (usuario) {
          window.location.href = 'formulario.html';
        } else {
          alert('Correo o contraseña incorrectos.');
        }
      } catch (error) {
        console.error('Error al iniciar sesión:', error);
        alert('Error al conectar con la base de datos.');
      }
    });
  }
});