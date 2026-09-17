import express from 'express';
import logger from './middleware/logger.js'
import cursosRouter from './routes/cursos.routes.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express();
app.use(logger);
app.use(express.json());
app.use('/api/cursos', cursosRouter)

app.use(errorHandler)

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000')
})