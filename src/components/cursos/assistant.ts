// Conexión del asistente. Hoy no hay IA: responde con un mensaje fijo. Cuando se integre un modelo,
// esta función es el único punto que hay que cambiar; la mascota ya espera la respuesta de forma asíncrona.
export async function replyTo(message: string): Promise<string> {
  return `Todavía no tengo IA conectada, así que no puedo responder a «${message}». Mientras tanto, puedes empezar por uno de los cursos de abajo.`;
}
