// JS/panel/panel.js
import { sql } from '../config/neon-config.js';
import { exigirSesion, cerrarSesion } from '../auth/auth.js';

const usuario = exigirSesion();
if (usuario.rol !== 'administrador' && usuario.rol !== 'empleado') {
  window.location.href = 'consulta.html';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('etiqueta-rol').textContent = usuario.rol.toUpperCase();

  const tbody = document.getElementById('tabla-panel');
  const inputBusqueda = document.getElementById('input-busqueda');
  const btnBuscar = document.getElementById('btn-buscar');
  const btnLimpiar = document.getElementById('btn-limpiar');

  const cargarRegistros = async (termino = '') => {
    try {
      // 1. Limpieza de BD: Cambiar cualquier "en proceso" antiguo a "en tránsito"
      await sql`UPDATE cotizaciones_envio SET estado = 'en tránsito' WHERE estado = 'en proceso'`;

      // 2. Cronómetro automático de avance de estados (para simular el progreso real)
      await sql`
        UPDATE cotizaciones_envio
        SET estado = CASE
          WHEN EXTRACT(EPOCH FROM (NOW() - fecha_registro)) >= 240 THEN 'entregado'
          WHEN EXTRACT(EPOCH FROM (NOW() - fecha_registro)) >= 180 THEN 'en local'
          WHEN EXTRACT(EPOCH FROM (NOW() - fecha_registro)) >= 120 THEN 'en tránsito'
          ELSE estado
        END
        WHERE estado NOT IN ('cancelado', 'entregado');
      `;

      let registros = [];
      const busquedaSQL = termino ? `%${termino}%` : null;

      // 3. Consulta de datos (Read) incluyendo todas las columnas nuevas
      if (termino) {
        registros = await sql`
          SELECT c.id, c.codigo_seguimiento, c.nombre_remitente, c.origen, c.destino, c.peso, c.fecha_registro, c.estado, u.nombre as cliente_base
          FROM cotizaciones_envio c
          LEFT JOIN usuarios u ON c.id_usuario = u.id
          WHERE c.codigo_seguimiento ILIKE ${busquedaSQL} 
             OR c.nombre_remitente ILIKE ${busquedaSQL}
             OR u.nombre ILIKE ${busquedaSQL}
          ORDER BY c.fecha_registro DESC;
        `;
      } else {
        registros = await sql`
          SELECT c.id, c.codigo_seguimiento, c.nombre_remitente, c.origen, c.destino, c.peso, c.fecha_registro, c.estado, u.nombre as cliente_base
          FROM cotizaciones_envio c
          LEFT JOIN usuarios u ON c.id_usuario = u.id
          ORDER BY c.fecha_registro DESC;
        `;
      }
      
      if (registros.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px;">No se encontraron registros.</td></tr>`;
        return;
      }

      tbody.innerHTML = registros.map(reg => {
        // Asignación de colores por estado
        let bgEstado = '#dbeafe', colorEstado = '#1e3a8a'; 
        if (reg.estado === 'en tránsito') { bgEstado = '#fef08a'; colorEstado = '#854d0e'; } 
        if (reg.estado === 'en local') { bgEstado = '#fed7aa'; colorEstado = '#9a3412'; } 
        if (reg.estado === 'entregado') { bgEstado = '#dcfce7'; colorEstado = '#166534'; } 
        if (reg.estado === 'cancelado') { bgEstado = '#fee2e2'; colorEstado = '#991b1b'; } 

        // Formateo elegante de fecha y hora local
        const dateObj = new Date(reg.fecha_registro);
        const fechaTxt = dateObj.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const horaTxt = dateObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

        return `
          <tr>
            <td><strong>${reg.codigo_seguimiento}</strong></td>
            <td>${reg.cliente_base || reg.nombre_remitente}</td>
            <td style="text-transform: capitalize;">${reg.origen}</td>
            <td style="text-transform: capitalize;">${reg.destino}</td>
            <td>${reg.peso} kg</td>
            <td>
              <div style="font-size: 0.9rem;">${fechaTxt}</div>
              <div style="font-size: 0.8rem; color: #64748b; font-weight: bold;">${horaTxt}</div>
            </td>
            <td>
              <span style="padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; background: ${bgEstado}; color: ${colorEstado}; text-transform: uppercase;">
                ${reg.estado}
              </span>
            </td>
            <td>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <a href="actualizar.html?id=${reg.id}" style="background:#0d2c6c; color:#fff; padding:6px 12px; border-radius:4px; text-decoration:none; font-weight:bold; text-align:center; font-size: 0.85rem;">Editar</a>
                
                ${reg.estado !== 'cancelado' 
                  ? `<button onclick="cancelarRegistro(${reg.id})" style="background:#64748b; color:#fff; padding:6px 12px; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size: 0.85rem;">Cancelar</button>` 
                  : ''}
                
                <button onclick="eliminarRegistro(${reg.id})" style="background:#ef4444; color:#fff; padding:6px 12px; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size: 0.85rem;">Eliminar</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } catch (error) {
      console.error('Error al cargar panel:', error);
    }
  };

  btnBuscar.addEventListener('click', () => {
    const termino = inputBusqueda.value.trim();
    if (termino) {
      cargarRegistros(termino);
      btnLimpiar.style.display = 'inline-block';
    }
  });

  btnLimpiar.addEventListener('click', () => {
    inputBusqueda.value = '';
    cargarRegistros();
    btnLimpiar.style.display = 'none';
  });

  window.cancelarRegistro = async (id) => {
    if (confirm('¿Estás seguro de marcar esta cotización como CANCELADA?')) {
      try {
        await sql`UPDATE cotizaciones_envio SET estado = 'cancelado' WHERE id = ${id}`;
        cargarRegistros(inputBusqueda.value.trim()); 
      } catch (error) {
        console.error(error);
        alert('Error al cancelar el registro.');
      }
    }
  };

  window.eliminarRegistro = async (id) => {
    if (confirm('¿Eliminar definitivamente este registro de la base de datos?')) {
      try {
        await sql`DELETE FROM cotizaciones_envio WHERE id = ${id}`;
        cargarRegistros(inputBusqueda.value.trim());
      } catch (error) {
        console.error(error);
        alert('Error al eliminar.');
      }
    }
  };

  document.getElementById('btn-cerrar-sesion')?.addEventListener('click', (e) => {
    e.preventDefault();
    cerrarSesion();
  });

  cargarRegistros();
});
