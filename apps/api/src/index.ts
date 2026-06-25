import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.ALLOWED_ORIGIN ?? '*',
    'http://dealradar-frontend1.s3-website.ap-south-1.amazonaws.com',
    'http://dealradar-frontend.s3-website.ap-south-1.amazonaws.com',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting — 200 req/min per IP
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// TODO: Mount routers as tasks are completed
// app.use('/auth', authRouter);
// app.use('/deals', dealsRouter);
// app.use('/search', searchRouter);
// app.use('/cart', cartRouter);
// app.use('/wishlist', wishlistRouter);
// app.use('/feed', feedRouter);
// app.use('/autocheckout', autoCheckoutRouter);
// app.use('/user', userRouter);
// app.use('/products', productsRouter);

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.info(`[API] Listening on port ${PORT}`);
});

export { app };
