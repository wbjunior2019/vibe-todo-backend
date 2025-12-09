import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import todoRoutes from './routes/todo.js';

const app = express();
const PORT = process.env.PORT || 5001;

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/toto';

// MongoDB 연결 함수
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10초 타임아웃
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB 연결 성공');
    console.log(`📊 데이터베이스: ${mongoose.connection.name}`);
    console.log(`🔗 호스트: ${mongoose.connection.host}`);
    
    // 연결 상태 이벤트 리스너
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB 연결 에러:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB 연결이 끊어졌습니다.');
    });
    
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error.message);
    console.error('💡 MongoDB URI를 확인하세요:', MONGODB_URI);
    process.exit(1); // 연결 실패 시 서버 종료
  }
};

// 미들웨어 - CORS 설정 (개발 환경: 모든 origin 허용)
app.use(cors({
  origin: true, // 모든 origin 허용 (개발 환경)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
}));
app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: true })); // URL 인코딩된 데이터 파싱

// 라우터
app.use('/api/todos', todoRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: 'Toto Backend API is running!',
    timestamp: new Date().toISOString()
  });
});

// 서버 시작 (MongoDB 연결 후)
const startServer = async () => {
  try {
    // MongoDB 연결 대기
    await connectDB();
    
    // 서버 시작 (Heroku 호환)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
};

// 서버 시작
startServer();

// 에러 핸들링
app.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ 포트 ${PORT}가 이미 사용 중입니다. 다른 포트를 사용하거나 기존 프로세스를 종료해주세요.`);
    console.log(`💡 해결 방법: lsof -ti:${PORT} | xargs kill -9`);
  } else {
    console.error('서버 에러:', error);
  }
  process.exit(1);
});

// MongoDB 연결 종료 핸들러
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} 신호를 받았습니다. 서버를 종료합니다...`);
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB 연결이 정상적으로 종료되었습니다.');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB 연결 종료 중 오류 발생:', error);
    process.exit(1);
  }
};

// 프로세스 종료 시그널 처리
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

