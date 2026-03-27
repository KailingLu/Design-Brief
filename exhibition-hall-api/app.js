const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const supabase = require('./config/supabase');

// 导入路由
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const roleRoutes = require('./routes/roles');
const projectMemberRoutes = require('./routes/projectMembers');

// 初始化应用
const app = express();

// 速率限制配置
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10, // 每个IP在15分钟内最多请求10次
  message: {
    msg: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 跳过非认证路由
    return !req.path.startsWith('/api/auth');
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP在15分钟内最多请求100次
  message: {
    msg: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(passport.initialize());
app.use(authLimiter); // 应用认证速率限制
app.use('/api', apiLimiter); // 应用API速率限制

// 配置Passport
require('./config/passport')(passport);

// 连接Supabase
console.log('使用Supabase数据库');

// 初始化默认角色
async function initRoles() {
  try {
    // 检查是否已有角色
    const { data: existingRoles, error } = await supabase
      .from('roles')
      .select('*');

    if (error) {
      console.error('检查角色失败:', error);
      return;
    }

    if (existingRoles.length === 0) {
      // 创建默认角色
      const { error: createError } = await supabase
        .from('roles')
        .insert([
          { id: '1', name: 'user', permissions: ['read'] },
          { id: '2', name: 'admin', permissions: ['read', 'write', 'delete'] }
        ]);

      if (createError) {
        console.error('创建默认角色失败:', createError);
      } else {
        console.log('默认角色创建成功');
      }
    }
  } catch (error) {
    console.error('初始化角色失败:', error);
  }
}

// 初始化角色
initRoles();

// 导出Supabase客户端
module.exports = {
  supabase
};

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/projects', projectMemberRoutes);

// 启动服务器
app.listen(config.port, () => {
  console.log(`服务器运行在端口 ${config.port}`);
});

module.exports = app;