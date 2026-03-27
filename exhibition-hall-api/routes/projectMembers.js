const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middlewares/auth');
const cache = require('../utils/cache');
const { supabase } = require('../app');

// 添加项目成员
router.post('/:projectId/members', 
  auth,
  [
    body('userId')
      .notEmpty().withMessage('用户ID不能为空'),
    body('role')
      .notEmpty().withMessage('角色不能为空')
      .isIn(['owner', 'admin', 'member']).withMessage('角色必须是 owner、admin 或 member 中的一个')
  ],
  async (req, res) => {
    try {
      // 验证输入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId } = req.params;
      const { userId, role } = req.body;

      // 检查项目是否存在
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
        return res.status(403).json({ msg: '无权添加成员' });
      }

      // 检查用户是否存在
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        return res.status(404).json({ msg: '用户不存在' });
      }

      // 检查用户是否已经是项目成员
      const isMember = project.members.some(member => member.user == userId);
      if (isMember) {
        return res.status(400).json({ msg: '用户已经是项目成员' });
      }

      // 添加成员
      const updatedMembers = [...project.members, {
        user: userId,
        role
      }];

      // 更新项目
      const { data: updatedProject, error: updateError } = await supabase
        .from('projects')
        .update({
          members: updatedMembers,
          updatedAt: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({ msg: '添加成员失败', error: updateError.message });
      }

      // 清除项目缓存
      cache.delete(`projects:${projectId}`);
      
      // 清除所有项目成员的项目列表缓存
      updatedMembers.forEach(member => {
        cache.delete(`projects:user:${member.user}`);
      });

      res.json(updatedProject);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: '服务器错误' });
    }
  }
);

// 移除项目成员
router.delete('/:projectId/members/:userId', auth, async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    // 检查项目是否存在
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (fetchError) {
      return res.status(404).json({ msg: '项目不存在' });
    }

    // 检查用户是否是项目所有者或管理员，或者是要移除自己
    const userRole = project.members.find(member => member.user == req.user._id);
    if (!userRole || (userRole.role !== 'owner' && userRole.role !== 'admin' && req.user._id != userId)) {
      return res.status(403).json({ msg: '无权移除成员' });
    }

    // 检查要移除的用户是否是项目所有者
    const memberToRemove = project.members.find(member => member.user == userId);
    if (!memberToRemove) {
      return res.status(404).json({ msg: '用户不是项目成员' });
    }

    if (memberToRemove.role === 'owner') {
      return res.status(403).json({ msg: '无法移除项目所有者' });
    }

    // 移除成员
    const updatedMembers = project.members.filter(member => member.user != userId);

    // 更新项目
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        members: updatedMembers,
        updatedAt: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ msg: '移除成员失败', error: updateError.message });
    }

    // 清除项目缓存
    cache.delete(`projects:${projectId}`);
    
    // 清除所有项目成员的项目列表缓存
    updatedMembers.forEach(member => {
      cache.delete(`projects:user:${member.user}`);
    });
    // 清除被移除成员的项目列表缓存
    cache.delete(`projects:user:${userId}`);

    res.json(updatedProject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 更新项目成员角色
router.put('/:projectId/members/:userId', 
  auth,
  [
    body('role')
      .notEmpty().withMessage('角色不能为空')
      .isIn(['admin', 'member']).withMessage('角色必须是 admin 或 member 中的一个')
  ],
  async (req, res) => {
    try {
      // 验证输入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, userId } = req.params;
      const { role } = req.body;

      // 检查项目是否存在
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
        return res.status(403).json({ msg: '只有项目所有者可以更新成员角色' });
      }

      // 检查要更新的用户是否是项目成员
      const memberToUpdate = project.members.find(member => member.user == userId);
      if (!memberToUpdate) {
        return res.status(404).json({ msg: '用户不是项目成员' });
      }

      // 不能更改项目所有者的角色
      if (memberToUpdate.role === 'owner') {
        return res.status(403).json({ msg: '无法更改项目所有者的角色' });
      }

      // 更新角色
      const updatedMembers = project.members.map(member => {
        if (member.user == userId) {
          return { ...member, role };
        }
        return member;
      });

      // 更新项目
      const { data: updatedProject, error: updateError } = await supabase
        .from('projects')
        .update({
          members: updatedMembers,
          updatedAt: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({ msg: '更新角色失败', error: updateError.message });
      }

      // 清除项目缓存
      cache.delete(`projects:${projectId}`);
      
      // 清除所有项目成员的项目列表缓存
      updatedMembers.forEach(member => {
        cache.delete(`projects:user:${member.user}`);
      });

      res.json(updatedProject);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: '服务器错误' });
    }
  }
);

module.exports = router;