const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDir = path.join(__dirname, '../uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function isProduction(){ return process.env.NODE_ENV === 'production' || !!process.env.VERCEL; }
function isRemoteAsset(value){ return typeof value === 'string' && /^https?:\/\//i.test(value); }
function localFilename(originalname){
  const ext=path.extname(originalname||'').toLowerCase()||'.jpg';
  return `img-${Date.now()}-${crypto.randomInt(1_000_000_000)}${ext}`;
}
function validateFile(req,file,cb){
  if(!ALLOWED_TYPES.has(file.mimetype)) return cb(new Error('Formato inválido. Use JPG, PNG ou WebP.'));
  cb(null,true);
}
const localStorage=multer.diskStorage({
  destination:(req,file,cb)=>{if(!fs.existsSync(uploadDir))fs.mkdirSync(uploadDir,{recursive:true});cb(null,uploadDir)},
  filename:(req,file,cb)=>cb(null,localFilename(file.originalname))
});
const memoryStorage=multer.memoryStorage();
const localMulter=multer({storage:localStorage,fileFilter:validateFile,limits:{fileSize:MAX_FILE_SIZE,files:MAX_FILES}});
const memoryMulter=multer({storage:memoryStorage,fileFilter:validateFile,limits:{fileSize:MAX_FILE_SIZE,files:MAX_FILES}});
const baseMulter=()=>isProduction()?memoryMulter:localMulter;

async function uploadToVercelBlob(file){
  if(!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('Vercel Blob não está configurado. Defina BLOB_READ_WRITE_TOKEN no projeto Vercel.');
  const { put } = await import('@vercel/blob');
  const safe=String(file.originalname||'imagem').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-').slice(-100);
  const pathname=`ezny/${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safe}`;
  const blob=await put(pathname,file.buffer,{access:'public',contentType:file.mimetype,addRandomSuffix:false});
  return blob.url;
}

function withRemoteUpload(mw){
  return (req,res,next)=>mw(req,res,async err=>{
    if(err)return next(err);
    if(!isProduction())return next();
    try{
      const files=[];
      if(Array.isArray(req.files)) files.push(...req.files);
      else if(req.files&&typeof req.files==='object') Object.values(req.files).forEach(list=>files.push(...(list||[])));
      if(req.file) files.push(req.file);
      for(const file of files){file.filename=await uploadToVercelBlob(file);delete file.buffer;}
      next();
    }catch(e){req.files=Array.isArray(req.files)?[]:{};next(e);}
  });
}
const upload={
  array:(field,maxCount=MAX_FILES)=>withRemoteUpload(baseMulter().array(field,maxCount)),
  single:(field)=>withRemoteUpload(baseMulter().single(field)),
  fields:(fields)=>withRemoteUpload(baseMulter().fields(fields))
};
function tratarErroUpload(err,req,res,next){
  if(!err)return next();
  const message=err.code==='LIMIT_FILE_SIZE'?'Cada imagem pode ter no máximo 5 MB.':err.code==='LIMIT_FILE_COUNT'?'Demasiadas imagens.':err.message||'Upload inválido.';
  return res.status(400).json({erro:message});
}
module.exports={upload,tratarErroUpload,isRemoteAsset,uploadToVercelBlob};
