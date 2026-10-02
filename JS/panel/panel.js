import { sql } from '../config/neon-config.js';
import { exigirSesion } from '../auth/auth.js';

const usuario = exigirSesion();

if (usuario.rol !== 'administrador' && usuario.rol !== 'empleado') {
  alert('Acceso denegado.');
  window.location.replace('consulta.html');
}

document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('tabla-panel');

  const cargarRegistros = async () => {
    try {
      const registros = await sql`
        SELECT id, codigo_seguimiento, nombre_remitente, estado 
        FROM cotizaciones_envio 
        ORDER BY fecha_registro DESC;
      `;
      
      tbody.innerHTML = registros.map(reg => `
        <tr>
          <td>${reg.id}</td>
          <td>${reg.codigo_seguimiento}</td>
          <td>${reg.nombre_remitente}</td>
          <td>${reg.estado}</td>
          <td>
            <button onclick="eliminarRegistro(${reg.id})">Eliminar</button>
          </td>
        </tr>
      `).join('');
    } catch (error) {
      console.error(error);
    }
  };

  window.eliminarRegistro = async (id) => {
    if (confirm('¿Eliminar definitivamente este registro?')) {
      try {
        await sql`DELETE FROM cotizaciones_envio WHERE id = ${id}`;
        cargarRegistros();
      } catch (error) {
        console.error(error);
      }
    }
  };

  cargarRegistros();
});