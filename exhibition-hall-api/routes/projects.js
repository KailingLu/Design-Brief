const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middlewares/auth');
const cache = require('../utils/cache');
const { supabase } = require('../app');

// 创建项目
router.post('/', 
  auth,
  [
    body('name')
      .notEmpty().withMessage('项目名称不能为空')
      .isLength({ min: 2, max: 100 }).withMessage('项目名称长度必须在2-100个字符之间'),
    body('description')
      .isLength({ max: 500 }).withMessage('项目描述长度不能超过500个字符')
  ],
  async (req, res) => {
    try {
      // 验证输入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description } = req.body;

      // 创建新项目
      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert({
          id: Date.now().toString(),
          name,
          description,
          creator: req.user._id,
          members: [{
            user: req.user._id,
            role: 'owner'
          }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        return res.status(500).json({ msg: '创建项目失败', error: createError.message });
      }

      // 清除用户的项目列表缓存
      cache.delete(`projects:user:${req.user._id}`);

      res.json(newProject);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: '服务器错误' });
    }
  }
);

// 获取用户的所有项目
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 检查缓存中是否有用户的项目列表数据
    const cachedProjects = cache.get(`projects:user:${userId}`);
    if (cachedProjects) {
      return res.json(cachedProjects);
    }

    // 从Supabase中获取项目列表
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('*');

    if (fetchError) {
      return res.status(500).json({ msg: '获取项目失败', error: fetchError.message });
    }

    // 过滤出用户是成员的项目
    const userProjects = projects.filter(project => 
      project.members.some(member => member.user == userId)
    );

    // 将用户的项目列表存入缓存，缓存时间为15分钟
    cache.set(`projects:user:${userId}`, userProjects, 15 * 60 * 1000);

    res.json(userProjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 获取单个项目
router.get('/:id', auth, async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user._id;
    
    // 检查缓存中是否有项目数据
    const cachedProject = cache.get(`projects:${projectId}`);
    if (cachedProject) {
      // 检查用户是否是项目成员
      const isMember = cachedProject.members.some(member => member.user == userId);
      if (!isMember) {
        return res.status(403).json({ msg: '无权访问此项目' });
      }
      return res.json(cachedProject);
    }

    // 从Supabase中获取项目
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (fetchError) {
      return res.status(404).json({ msg: '项目不存在' });
    }

    // 检查用户是否是项目成员
    const isMember = project.members.some(member => member.user == userId);
    if (!isMember) {
      return res.status(403).json({ msg: '无权访问此项目' });
    }

    // 将项目存入缓存，缓存时间为15分钟
    cache.set(`projects:${projectId}`, project, 15 * 60 * 1000);

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 更新项目
router.put('/:id', 
  auth,
  [
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 }).withMessage('项目名称长度必须在2-100个字符之间'),
    body('description')
      .optional()
      .isLength({ max: 500 }).withMessage('项目描述长度不能超过500个字符')
  ],
  async (req, res) => {
    try {
      // 验证输入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description } = req.body;
      const projectId = req.params.id;

      // 从Supabase中获取项目
      const { data: project, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (fetchError) {
        return res.status(404).json({ msg: '项目不存在' });
      }

      // 检查用户是否是项目所有者或管理员
      const userRole = project.members.find(member => member.user == req.user._id);
      if (!userRole || (userRole.role !== 'owner' && userRole.role !== 'admin')) {
        return res.status(403).json({ msg: '无权更新此项目' });
      }

      // 更新项目信息
      const { data: updatedProject, error: updateError } = await supabase
        .from('projects')
        .update({
          name: name || project.name,
          description: description || project.description,
          updatedAt: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({ msg: '更新项目失败', error: updateError.message });
      }

      // 清除项目缓存
      cache.delete(`projects:${projectId}`);
      
      // 清除所有项目成员的项目列表缓存
      project.members.forEach(member => {
        cache.delete(`projects:user:${member.user}`);
      });

      res.json(updatedProject);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: '服务器错误' });
    }
  }
);

// 删除项目
router.delete('/:id', auth, async (req, res) => {
  try {
    const projectId = req.params.id;

    // 先获取项目信息，以便清除相关缓存
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (fetchError) {
      return res.status(404).json({ msg: '项目不存在' });
    }

    // 检查用户是否是项目所有者
    const userRole = project.members.find(member => member.user == req.user._id);
    if (!userRole || userRole.role !== 'owner') {
      return res.status(403).json({ msg: '只有项目所有者可以删除项目' });
    }

    // 删除项目
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (deleteError) {
      return res.status(500).json({ msg: '删除项目失败', error: deleteError.message });
    }

    // 清除项目缓存
    cache.delete(`projects:${projectId}`);
    
    // 清除所有项目成员的项目列表缓存
    if (project) {
      project.members.forEach(member => {
        cache.delete(`projects:user:${member.user}`);
      });
    }

    res.json({ msg: '项目删除成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

module.exports = router;