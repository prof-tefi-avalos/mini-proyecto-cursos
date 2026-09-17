import { crearError } from '../middleware/errorHandler.js';

const cursos = [
  {
    id: 1,
    nombre: "Fullstack development",
    horas: 200,
  },
  {
    id: 2,
    nombre: "frontend development",
    horas: 100,
  },
];

export function listarCursos(req, res) {
  res.json({ data: cursos, error: null });
}

export function obtenerCurso(req, res) {
  const { id } = req.params;

  const curso = cursos.find((curso) => curso.id === Number(id));

  if (!curso) {
    throw crearError("No hay cursos con ese ID", 404);
  }

  res.status(200).json({ data: curso, error: null });
}

export function crearCurso(req, res) {
  const { nombre, horas } = req.body;

  if (!nombre || !horas || typeof horas !== 'number') {
    return res.status(400).json({
      data: null,
      error: { message: "Nombre y horas es obligatorio" },
    });
  }

  const nuevoCurso = {id: cursos.length + 1, nombre, horas};
  cursos.push(nuevoCurso);
  
  res.status(201).json({ data: nuevoCurso, error: null });
}
