import app from './app';

const PORT = process.env.PORT || 4000;

// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Servidor escuchando en puerto ${PORT}`);
  });
}

// Para Vercel
export default app; 