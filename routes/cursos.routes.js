import { Router } from 'express'
import {listarCursos, crearCurso, obtenerCurso} from '../controllers/cursos.controller.js'

const router = Router();

router.get('/', listarCursos)
router.get('/:id', obtenerCurso)
router.post('/', crearCurso)

export default router