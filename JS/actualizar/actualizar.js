import { sql } from '../config/neon-config.js';
import { exigirSesion } from '../auth/auth.js';

const usuario = exigirSesion();

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const idRegistro = params.get('id');
  const form = document.getElementById('form-actualizar');

  if (!idRegistro) return window.location.replace('consulta.html');

  try {
    const registros = await sql`
      SELECT origen, destino, peso, estado 
      FROM cotizaciones_envio 
      WHERE id = ${idRegistro} AND id_usuario = ${usuario.id};
    `;

    if (registros.length === 0) {
      alert('Registro no encontrado o sin permisos.');
      return window.location.replace('consulta.html');
    }

    const reg = registros[0];
    document.getElementById('edit-origen').value = reg.origen;
    document.getElementById('edit-destino').value = reg.destino;
    document.getElementById('edit-peso').value = reg.peso;

    if (reg.estado !== 'registrado') {
      alert('El trámite ya fue atendido, edición bloqueada.');
      document.getElementById('btn-guardar').disabled = true;
    }
  } catch (error) {
    console.error(error);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const origen = document.getElementById('edit-origen').value;
    const destino = document.getElementById('edit-destino').value;
    const peso = document.getElementById('edit-peso').value;

    try {
      await sql`
        UPDATE cotizaciones_envio
        SET origen = ${origen}, destino = ${destino}, peso = ${peso}
        WHERE id = ${idRegistro} AND id_usuario = ${usuario.id} AND estado = 'registrado';
      `;
      alert('Datos actualizados.');
      window.location.href = 'consulta.html';
    } catch (error) {
      console.error(error);
    }
  });
});