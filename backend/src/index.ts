import express, { Request, Response } from 'express';

const app = express();
const PORT = 3001;

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Hello World!' });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ message: 'API healthty!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
