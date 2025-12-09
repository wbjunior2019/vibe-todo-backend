import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: {
    type: Date
  }
}, {
  timestamps: true // createdAt, updatedAt 자동 생성
});

// 인덱스 추가 (검색 성능 향상)
todoSchema.index({ completed: 1 });
todoSchema.index({ createdAt: -1 });
todoSchema.index({ dueDate: 1 });

const Todo = mongoose.model('Todo', todoSchema);

export default Todo;




