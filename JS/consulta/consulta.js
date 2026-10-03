// JS/consulta/consulta.js
import { sql } from '../config/neon-config.js';
import { exigirSesion, cerrarSesion } from '../auth/auth.js';

const usuario = exigirSesion();
if (usuario && usuario.rol !== 'cliente') {
  window.location.href = 'panel.html';
}

document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('tabla-registros');

  if (tbody) {
    try {
      // 1. TRUCO DE EXPOSICIÓN: Actualizar a 'en tránsito' si pasaron más de 120 segundos (2 min)
      await sql`
        UPDATE cotizaciones_envio 
        SET estado = 'en tránsito' 
        WHERE id_usuario = ${usuario.id} 
        AND estado = 'registrado' 
        AND EXTRACT(EPOCH FROM (NOW() - fecha_registro)) > 120;
      `;

      // 2. RF-30.5: Consultar solo los registros propios
      const registros = await sql`
        SELECT id, codigo_seguimiento, origen, destino, peso, estado
        FROM cotizaciones_envio
        WHERE id_usuario = ${usuario.id}
        ORDER BY fecha_registro DESC;
      `;

      if (registros.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">No tienes cotizaciones registradas aún.</td></tr>`;
      } else {
        tbody.innerHTML = registros.map(reg => `
          <tr>
            <td><strong>${reg.codigo_seguimiento}</strong></td>
            <td style="text-transform: capitalize;">${reg.origen}</td>
            <td style="text-transform: capitalize;">${reg.destino}</td>
            <td>${reg.peso} kg</td>
            <td><span style="padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; background: ${reg.estado === 'registrado' ? '#dbeafe' : '#dcfce7'}; color: ${reg.estado === 'registrado' ? '#1e3a8a' : '#166534'};">${reg.estado}</span></td>
            <td>
              ${reg.estado === 'registrado' 
                ? `<a href="actualizar.html?id=${reg.id}" style="background:#ffb800; color:#fff; padding:6px 12px; border-radius:4px; text-decoration:none; font-weight:bold;">Editar Cotización</a>` 
                : `<span style="color:#999; font-style:italic;">Solo lectura</span>`}
            </td>
          </tr>
        `).join('');
      }
    } catch (error) {
      console.error('Error al cargar la tabla:', error);
    }
  }

  const btnCerrar = document.getElementById('btn-cerrar-sesion');
  if (btnCerrar) {
    btnCerrar.addEventListener('click', (e) => {
      e.preventDefault();
      cerrarSesion();
    });
  }
});
