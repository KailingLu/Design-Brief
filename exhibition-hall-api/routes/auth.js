const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { supabase } = require('../app');

// 注册
router.post('/register', 
  [
    body('name')
      .notEmpty().withMessage('姓名不能为空')
      .isLength({ min: 2, max: 50 }).withMessage('姓名长度必须在2-50个字符之间'),
    body('email')
      .notEmpty().withMessage('邮箱不能为空')
      .isEmail().withMessage('请输入有效的邮箱地址')
      .isLength({ max: 100 }).withMessage('邮箱长度不能超过100个字符'),
    body('password')
      .notEmpty().withMessage('密码不能为空')
      .isLength({ min: 6, max: 50 }).withMessage('密码长度必须在6-50个字符之间')
  ],
  async (req, res) => {
    try {
      // 验证输入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      // 检查用户是否已存在
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        return res.status(500).json({ msg: '检查用户失败', error: checkError.message });
      }

      if (existingUser) {
        return res.status(400).json({ msg: '用户已存在' });
      }

      // 检查是否有默认角色，如果没有则创建
      const { data: defaultRole, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .eq('name', 'user')
        .single();

      if (roleError && roleError.code === 'PGRST116') {
        // 创建默认角色
        const { data: newRole, error: createRoleError } = await supabase
          .from('roles')
          .insert({
            id: Date.now().toString(),
            name: 'user',
            permissions: ['read']
          })
          .select()
          .single();

        if (createRoleError) {
          return res.status(500).json({ msg: '创建角色失败', error: createRoleError.message });
        }
      }

      // 加密密码
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 创建新用户
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: Date.now().toString(),
          name,
          email,
          password: hashedPassword,
          role: 'user'
        })
        .select()
        .single();

      if (createError) {
        return res.status(500).json({ msg: '创建用户失败', error: createError.message });
      }

      // 生成JWT token
      const payload = {
        id: newUser.id,
        name: newUser.name
      };

      const token = jwt.sign(payload, config.secret, { expiresIn: '1h' });

      res.json({ token, user: newUser });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: '服务器错误' });
    }
  }
);

// 登录
router.post('/login', 
  [
    body('email')
      .notEmpty().withMessage('邮箱不能为空')
      .isEmail().withMessage('请输入有效的邮箱地址'),
    body('password')
      .notEmpty().withMessage('密码不能为空')
  ],
  async (req, res) => {
    try {
      // 验证输入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // 检查用户是否存在
      const { data: user, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (findError) {
        return res.status(400).json({ msg: '用户不存在' });
      }

      // 检查密码是否正确
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: '密码错误' });
      }

      // 查找角色
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .eq('name', user.role)
        .single();

      if (role) {
        user.role = role;
      }

      // 生成JWT token
      const payload = {
        id: user.id,
        name: user.name
      };

      const token = jwt.sign(payload, config.secret, { expiresIn: '1h' });

      res.json({ token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: '服务器错误' });
    }
  }
);

module.exports = router;