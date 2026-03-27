const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Role = require('../models/Role');
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/permissions');
const cache = require('../utils/cache');

// 创建角色
router.post('/', 
  auth,
  checkPermission('create'),
  [
    body('name')
      .notEmpty().withMessage('角色名称不能为空')
      .isLength({ min: 2, max: 50 }).withMessage('角色名称长度必须在2-50个字符之间'),
    body('permissions')
      .notEmpty().withMessage('权限不能为空')
      .isArray().withMessage('权限必须是一个数组')
      .custom((value) => {
        const validPermissions = ['read', 'create', 'update', 'delete'];
        return value.every(permission => validPermissions.includes(permission));
      }).withMessage('权限必须是 read、create、update、delete 中的一个或多个')
  ],
  async (req, res) => {
    try {
      // 验证输入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, permissions } = req.body;

      // 检查角色是否已存在
      const existingRole = await Role.findOne({ name });
      if (existingRole) {
        return res.status(400).json({ msg: '角色已存在' });
      }

      // 创建新角色
      const newRole = new Role({
        name,
        permissions
      });

      await newRole.save();

      // 清除角色列表的缓存
      cache.delete('roles:all');

      res.json(newRole);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: '服务器错误' });
    }
  }
);

// 获取所有角色
router.get('/', auth, checkPermission('read'), async (req, res) => {
  try {
    // 检查缓存中是否有角色列表数据
    const cachedRoles = cache.get('roles:all');
    if (cachedRoles) {
      return res.json(cachedRoles);
    }

    // 从数据库中获取角色列表
    const roles = await Role.find();
    
    // 将角色列表存入缓存，缓存时间为1小时
    cache.set('roles:all', roles);
    
    res.json(roles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 获取单个角色
router.get('/:id', auth, checkPermission('read'), async (req, res) => {
  try {
    const roleId = req.params.id;
    
    // 检查缓存中是否有角色数据
    const cachedRole = cache.get(`roles:${roleId}`);
    if (cachedRole) {
      return res.json(cachedRole);
    }

    // 从数据库中获取角色
    const role = await Role.findById(roleId);

    if (!role) {
      return res.status(404).json({ msg: '角色不存在' });
    }

    // 将角色存入缓存，缓存时间为1小时
    cache.set(`roles:${roleId}`, role);

    res.json(role);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

// 更新角色
router.put('/:id', 
  auth,
  checkPermission('update'),
  [
    body('name')
      .optional()
      .isLength({ min: 2, max: 50 }).withMessage('角色名称长度必须在2-50个字符之间'),
    body('permissions')
      .optional()
      .isArray().withMessage('权限必须是一个数组')
      .custom((value) => {
        const validPermissions = ['read', 'create', 'update', 'delete'];
        return value.every(permission => validPermissions.includes(permission));
      }).withMessage('权限必须是 read、create、update、delete 中的一个或多个')
  ],
  async (req, res) => {
    try {
      // 验证输入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, permissions } = req.body;

      const role = await Role.findById(req.params.id);

      if (!role) {
        return res.status(404).json({ msg: '角色不存在' });
      }

      // 更新角色信息
      role.name = name || role.name;
      role.permissions = permissions || role.permissions;

      await role.save();

      // 清除角色列表的缓存
      cache.delete('roles:all');
      // 清除单个角色的缓存
      cache.delete(`roles:${req.params.id}`);

      res.json(role);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: '服务器错误' });
    }
  }
);

// 删除角色
router.delete('/:id', auth, checkPermission('delete'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ msg: '角色不存在' });
    }

    await role.remove();

    // 清除角色列表的缓存
    cache.delete('roles:all');
    // 清除单个角色的缓存
    cache.delete(`roles:${req.params.id}`);

    res.json({ msg: '角色删除成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
});

module.exports = router;