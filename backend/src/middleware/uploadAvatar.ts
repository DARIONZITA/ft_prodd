import path										from 'path';
import multer, { MulterError }					from 'multer';
import { ApiError }								from '../utils/ApiError';
import type { Request, Response, NextFunction } from 'express';

const AVATAR_DIR = 'uploads/avatars';

const storageEngine = multer.diskStorage({
	destination: ( _req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string ) => void) => { cb(null, AVATAR_DIR); },
	filename: ( req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string ) => void) => { cb(null, `user-${req.user!.id}${path.extname(file.originalname)}`); }
});

const fileFilter = ( _req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback ) => {
	if (!file.mimetype.startsWith('image/'))
		return cb(new ApiError(400, 'Only image files are allowed'));
	cb(null, true);
};

const multerInstance = multer({
	storage: storageEngine,
	limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
	fileFilter
});

export function uploadAvatar(field: string)
{
	return ( req: Request, res: Response, next: NextFunction ) => {
		multerInstance.single(field)(req, res, (err: unknown) => {
			if (err instanceof MulterError)
			{
				if (err.code === 'LIMIT_FILE_SIZE')
					return next(new ApiError(400, 'File too large. Maximum size is 5 MB.'));
				return next(new ApiError(400, err.message));
			}
			if (err)
				return next(err);
			next();
		});
	};
}
