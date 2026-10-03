// JS/registro/registro.js
import { sql } from '../config/neon-config.js'; // <-- ¡RUTA CORREGIDA!
import { cerrarSesion } from '../auth/auth.js'; // <-- Importado arriba por orden

// 1. Redirigir a login.html si no hay sesión activa
const usuarioSesion = JSON.parse(sessionStorage.getItem('usuario'));
if (!usuarioSesion) {
  window.location.href = 'login.html';
}

// 2. Función para insertar la cotización directamente en Neon
export async function guardarRegistro(datos) {
  const codigo = 'COD-' + Date.now().toString().slice(-8);
  
  // Si no viene nombre_remitente, se toma de la sesión activa
  const nombreRemitente = datos.nombre_remitente || usuarioSesion.nombre || 'Usuario Registrado';

  // ¡AGREGAMOS id_usuario PARA QUE SE RELACIONE CON EL CLIENTE!
  await sql`
    INSERT INTO cotizaciones_envio (codigo_seguimiento, nombre_remitente, origen, destino, peso, id_usuario) 
    VALUES (${codigo}, ${nombreRemitente}, ${datos.origen}, ${datos.destino}, ${datos.peso}, ${usuarioSesion.id})
  `;
  
  return codigo;
}

// 3. Lógica del formulario de cotizaciones
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-cotizador');
  const resultadoDiv = document.getElementById('resultado-cotizacion');
  const timelineDiv = document.getElementById('timeline-cotizacion');

  let cotizacionTemporal = null;

  if (form) {
    // PASO 1: Presionar "Calcular Costo"
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const origen = document.getElementById('origen').value;
      const destino = document.getElementById('destino').value;
      const peso = parseFloat(document.getElementById('peso').value);

      // Ocultar timeline si ya estaba visible
      if (timelineDiv) timelineDiv.style.display = 'none';

      // Validar origen y destino diferentes
      if (origen === destino) {
        resultadoDiv.style.display = 'block';
        resultadoDiv.className = 'confirmacion-cotizacion confirmacion-pop error';
        resultadoDiv.style.backgroundColor = '#fee2e2';
        resultadoDiv.style.color = '#991b1b';
        resultadoDiv.style.borderColor = '#fca5a5';
        resultadoDiv.innerHTML = 'El origen y el destino no pueden ser iguales.';
        cotizacionTemporal = null;
        return;
      }

      // Cálculo de costo dinámico
      let base = 12;
      let precioKg = 4.5;

      if ((origen === 'tarapoto' && destino === 'lima') || (origen === 'lima' && destino === 'tarapoto')) {
        base = 15;
        precioKg = 5.5;
      } else if (destino === 'chiclayo') {
        base = 14;
        precioKg = 5.0;
      }

      const total = base + (peso * precioKg);

      // Guardar datos temporalmente
      cotizacionTemporal = {
        nombre_remitente: usuarioSesion.nombre,
        origen: origen,
        destino: destino,
        peso: peso,
        total: total
      };

      // Mostrar el precio estimado y el botón "Cotizar"
      resultadoDiv.style.display = 'block';
      resultadoDiv.className = 'confirmacion-cotizacion confirmacion-pop';
      resultadoDiv.style.backgroundColor = '#dcfce7';
      resultadoDiv.style.color = '#15803d';
      resultadoDiv.style.borderColor = '#bbf7d0';

      resultadoDiv.innerHTML = `
        <div style="text-align: center;">
          <p style="margin-bottom: 12px; font-weight: bold; font-size: 1.15rem;">
            Estimado: S/ ${total.toFixed(2)} soles
          </p>
          <button type="button" id="btn-cotizar-confirmar" class="btn-cotizar" style="width: 100%;">
            Cotizar
          </button>
        </div>
      `;

      // PASO 2: Presionar "Cotizar" para guardar en la base de datos Neon
      document.getElementById('btn-cotizar-confirmar').addEventListener('click', async () => {
        if (!cotizacionTemporal) return;

        const btn = document.getElementById('btn-cotizar-confirmar');
        btn.disabled = true;
        btn.textContent = 'Guardando en la base de datos...';

        try {
          // Guardar en la tabla cotizaciones_envio de Neon
          const codigo = await guardarRegistro(cotizacionTemporal);

          btn.textContent = `¡Registrado! Código: ${codigo}`;
          btn.style.backgroundColor = '#16a34a';

          // RECIÉN AQUÍ SE MUESTRA Y ACTIVA LA ANIMACIÓN
          if (timelineDiv) {
            timelineDiv.style.display = 'block';
            const bar = document.getElementById('barra-progreso');
            if (bar) {
              // Forzamos la barra a quedarse en el paso 1 (Recepción)
              bar.style.animation = 'none';
              bar.style.width = '15%'; 
            }
          }
        } catch (error) {
          console.error('Error al guardar en Neon:', error);
          alert('Ocurrió un error al registrar en la base de datos.');
          btn.disabled = false;
          btn.textContent = 'Reintentar Cotizar';
        }
      });
    });
  }

  // Activa el botón de cerrar sesión
  const btnCerrar = document.getElementById('btn-cerrar-sesion');
  if (btnCerrar) {
    btnCerrar.addEventListener('click', (e) => {
      e.preventDefault();
      cerrarSesion();
    });
  }
});
