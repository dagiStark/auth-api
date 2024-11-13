import dotenv from 'dotenv';


dotenv.config();  

const dbUri = process.env.DB_URL 

if (!dbUri) {
  throw new Error('DB_URL is not defined');
}

export default {
  port: 3000,
  dbUri,
  logLevel: 'info',
  smtp: {
    user: 'iauayfsyo5ry7p74@ethereal.email',
    pass: 'WqG945B3SvaU1YcXMh',
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
  },
  accessTokenPrivateKey: "",
  refreshTokenPrivateKey: "",
};
