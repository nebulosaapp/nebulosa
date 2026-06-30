import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'super_segredo_jwt_nebulosa_v4_2026';

// Middleware para validar o token JWT
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Acesso negado. Nenhum token fornecido.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ success: false, error: 'Erro no token. Formato inválido.' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userIdentificador = decoded.identificador;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token inválido ou expirado.' });
  }
}

// Gera token JWT de acesso rápido (expira em 30 dias)
export function gerarTokenAcesso(user) {
  return jwt.sign(
    { id: user.id, identificador: user.identificador },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}
