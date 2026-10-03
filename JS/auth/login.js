import { iniciarSesion, registrarUsuario } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const tabLogin = document.getElementById('tab-login');
  const tabRegistro = document.getElementById('tab-registro');
  const formLogin = document.getElementById('form-login');
  const formRegistro = document.getElementById('form-registro');

  // 1. LÓGICA PARA CAMBIAR DE PESTAÑA (Mostrar / Ocultar)
  if (tabLogin && tabRegistro) {
    tabLogin.addEventListener('click', (e) => {
      e.preventDefault();
      tabLogin.classList.add('activa');
      tabRegistro.classList.remove('activa');
      formLogin.style.display = 'block';
      formRegistro.style.display = 'none';
    });

    tabRegistro.addEventListener('click', (e) => {
      e.preventDefault();
      tabRegistro.classList.add('activa');
      tabLogin.classList.remove('activa');
      formRegistro.style.display = 'block';
      formLogin.style.display = 'none';
    });
  }

  // 2. EVENTO PARA CREAR CUENTA
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
        tabLogin.click(); // Cambia automáticamente a la pestaña de Iniciar Sesión
      } catch (error) {
        console.error('Error al registrar:', error);
        alert('Error al registrar. Es posible que el correo ya esté registrado.');
      }
    });
  }

  // 3. EVENTO PARA INICIAR SESIÓN Y REDIRIGIR SEGÚN EL ROL
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const correo = document.getElementById('login-correo').value;
      const contrasena = document.getElementById('login-contrasena').value;

      try {
        const usuario = await iniciarSesion(correo, contrasena);
        
        if (usuario) {
          // Si el usuario existe, leemos su rol para mandarlo a su página
          if (usuario.rol === 'administrador' || usuario.rol === 'empleado') {
            window.location.href = 'panel.html';
          } else {
            // Si es cliente normal, va al formulario
            window.location.href = 'formulario.html'; 
          }
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
