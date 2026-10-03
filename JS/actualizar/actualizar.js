// JS/actualizar/actualizar.js
import { sql } from '../config/neon-config.js';
import { exigirSesion } from '../auth/auth.js';

const usuario = exigirSesion();

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const idRegistro = params.get('id');
  const form = document.getElementById('form-actualizar');

  if (!idRegistro) {
    window.location.href = usuario.rol === 'cliente' ? 'consulta.html' : 'panel.html';
    return;
  }

  try {
    let registros = [];
    
    // 1. Consulta según el rol
    if (usuario.rol === 'cliente') {
      registros = await sql`SELECT origen, destino, peso, estado FROM cotizaciones_envio WHERE id = ${idRegistro} AND id_usuario = ${usuario.id}`;
    } else {
      registros = await sql`SELECT origen, destino, peso, estado FROM cotizaciones_envio WHERE id = ${idRegistro}`;
    }

    if (registros.length === 0) {
      alert('Registro no encontrado o sin permisos.');
      window.location.href = usuario.rol === 'cliente' ? 'consulta.html' : 'panel.html';
      return;
    }

    const reg = registros[0];
    
    // 2. Rellenar los campos básicos
    document.getElementById('edit-origen').value = reg.origen.toLowerCase();
    document.getElementById('edit-destino').value = reg.destino.toLowerCase();
    document.getElementById('edit-peso').value = reg.peso;

    // 3. REGLA ESTRICTA PARA ADMIN/EMPLEADO: Solo puede Cancelar
    if (usuario.rol === 'administrador' || usuario.rol === 'empleado') {
      document.getElementById('div-estado').style.display = 'block';
      const selectEstado = document.getElementById('edit-estado');
      
      // Construimos las opciones dinámicamente con JavaScript
      if (reg.estado === 'cancelado') {
        selectEstado.innerHTML = `<option value="cancelado">Cancelado</option>`;
      } else {
        selectEstado.innerHTML = `
          <option value="${reg.estado}">${reg.estado.toUpperCase()} (Estado actual)</option>
          <option value="cancelado">CANCELAR COTIZACIÓN</option>
        `;
      }
    }

    // 4. LÓGICA DE "SOLO LECTURA"
    if (reg.estado !== 'registrado') {
      document.getElementById('edit-origen').disabled = true;
      document.getElementById('edit-destino').disabled = true;
      document.getElementById('edit-peso').disabled = true;

      if (usuario.rol === 'cliente') {
        document.getElementById('btn-guardar').disabled = true;
        document.getElementById('btn-guardar').textContent = 'Solo lectura (Trámite iniciado)';
        document.getElementById('btn-guardar').style.background = '#94a3b8';
      } else {
        // Si el admin lo ve y ya está cancelado, bloqueamos todo
        if (reg.estado === 'cancelado') {
          document.getElementById('btn-guardar').disabled = true;
          document.getElementById('btn-guardar').textContent = 'Cotización Cancelada';
          document.getElementById('btn-guardar').style.background = '#94a3b8';
        } else {
          document.getElementById('btn-guardar').textContent = 'Actualizar a Cancelado';
          document.getElementById('btn-guardar').style.background = '#b91c1c'; // Botón rojo
        }
      }
    }

    // 5. GUARDAR EN BASE DE DATOS
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const origen = document.getElementById('edit-origen').value;
      const destino = document.getElementById('edit-destino').value;
      const peso = document.getElementById('edit-peso').value;
      const estado = (usuario.rol === 'cliente') ? 'registrado' : document.getElementById('edit-estado').value;

      try {
        if (usuario.rol === 'cliente') {
          await sql`
            UPDATE cotizaciones_envio 
            SET origen = ${origen}, destino = ${destino}, peso = ${peso} 
            WHERE id = ${idRegistro} AND id_usuario = ${usuario.id} AND estado = 'registrado'
          `;
        } else {
          if (reg.estado !== 'registrado') {
            await sql`UPDATE cotizaciones_envio SET estado = ${estado} WHERE id = ${idRegistro}`;
          } else {
            await sql`
              UPDATE cotizaciones_envio 
              SET origen = ${origen}, destino = ${destino}, peso = ${peso}, estado = ${estado} 
              WHERE id = ${idRegistro}
            `;
          }
        }
        
        alert('Modificación guardada exitosamente.');
        window.location.href = usuario.rol === 'cliente' ? 'consulta.html' : 'panel.html';
      } catch (error) {
        console.error(error);
        alert('Ocurrió un error al intentar guardar.');
      }
    });

  } catch (error) {
    console.error(error);
  }
});
