import express from 'express';
import Todo from '../models/Todo.js';
import mongoose from 'mongoose';

const router = express.Router();

// 모든 할일 목록 조회 (GET /api/todos)
router.get('/', async (req, res) => {
  try {
    const { completed, priority, sortBy = 'createdAt', order = 'desc' } = req.query;

    // 필터 객체 생성
    const filter = {};
    
    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }
    
    if (priority) {
      filter.priority = priority;
    }

    // 정렬 옵션
    const sortOptions = {};
    const validSortFields = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;
    sortOptions[sortField] = sortOrder;

    // 할일 목록 조회
    const todos = await Todo.find(filter)
      .sort(sortOptions)
      .exec();

    res.status(200).json({
      success: true,
      message: '할일 목록을 성공적으로 조회했습니다.',
      count: todos.length,
      data: todos
    });

  } catch (error) {
    console.error('할일 목록 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '할일 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 특정 할일 상세 조회 (GET /api/todos/:id)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // ID 유효성 검증
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 ID입니다.'
      });
    }

    const todo = await Todo.findById(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: '할일을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      message: '할일을 성공적으로 조회했습니다.',
      data: todo
    });

  } catch (error) {
    console.error('할일 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '할일 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 할일 생성 (POST /api/todos)
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    // 제목 필수 검증
    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '제목은 필수 입력 항목입니다.'
      });
    }

    // 할일 생성
    const todo = new Todo({
      title: title.trim(),
      description: description ? description.trim() : undefined,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined
    });

    const savedTodo = await todo.save();

    res.status(201).json({
      success: true,
      message: '할일이 성공적으로 생성되었습니다.',
      data: savedTodo
    });

  } catch (error) {
    console.error('할일 생성 에러:', error);
    
    // MongoDB 검증 에러 처리
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: '입력 데이터가 유효하지 않습니다.',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: '할일 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 할일 수정 (PUT /api/todos/:id)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed, priority, dueDate } = req.body;

    // ID 유효성 검증
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 ID입니다.'
      });
    }

    // 할일 조회
    const todo = await Todo.findById(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: '할일을 찾을 수 없습니다.'
      });
    }

    // 업데이트할 필드만 수정
    if (title !== undefined) {
      if (title.trim() === '') {
        return res.status(400).json({
          success: false,
          message: '제목은 비어있을 수 없습니다.'
        });
      }
      todo.title = title.trim();
    }

    if (description !== undefined) {
      todo.description = description ? description.trim() : undefined;
    }

    if (completed !== undefined) {
      todo.completed = completed;
    }

    if (priority !== undefined) {
      if (!['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).json({
          success: false,
          message: '우선순위는 low, medium, high 중 하나여야 합니다.'
        });
      }
      todo.priority = priority;
    }

    if (dueDate !== undefined) {
      todo.dueDate = dueDate ? new Date(dueDate) : undefined;
    }

    // 할일 저장
    const updatedTodo = await todo.save();

    res.status(200).json({
      success: true,
      message: '할일이 성공적으로 수정되었습니다.',
      data: updatedTodo
    });

  } catch (error) {
    console.error('할일 수정 에러:', error);
    
    // MongoDB 검증 에러 처리
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: '입력 데이터가 유효하지 않습니다.',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: '할일 수정 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 할일 삭제 (DELETE /api/todos/:id)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // ID 유효성 검증
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 ID입니다.'
      });
    }

    // 할일 조회 및 삭제
    const todo = await Todo.findByIdAndDelete(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: '할일을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      message: '할일이 성공적으로 삭제되었습니다.',
      data: {
        id: todo._id,
        title: todo.title
      }
    });

  } catch (error) {
    console.error('할일 삭제 에러:', error);
    res.status(500).json({
      success: false,
      message: '할일 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;

