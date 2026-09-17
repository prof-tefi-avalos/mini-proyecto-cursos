export function crearError(message, status = 500) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({
    data: null,
    error: { message: err.message || 'Error interno del servidor' },
  });
}

// export class AppError extends Error {
//   constructor(message, status = 500) {
//     super(message)
//     this.status = status
//   }
// }

// export function errorHandler(err, req, res, next) {
//   console.error(err)
//   res.status(err.status || 500).json({
//     data: null,
//     error: { message: err.message || 'Error interno del servidor' },
//   })
// }