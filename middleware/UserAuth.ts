import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Define an interface for the decoded JWT payload
interface DecodedToken extends JwtPayload {
  id: string;
}

// Extend the Request interface to include the `user` property
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };


    }
  }
}

const userAuth = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.header('Authorization');

  // Check if token is provided
  if (!token) {
    res.status(401).json({ status: 0, message: 'Invalid Token or No token Provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_KEY as string) as DecodedToken; // Explicitly cast the decoded token
    req.user = { id: decoded.id}; // Attach user data to req.user
    console.log(req.user, 'user....................');
    next(); // Pass control to the next middleware or route handler
  } catch (err) {
    res.status(401).json({ status: 0, message: 'Invalid Token' });
  }
};

export default userAuth;
