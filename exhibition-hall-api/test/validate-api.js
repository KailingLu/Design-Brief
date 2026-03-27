// 验证API功能的简单脚本
console.log('开始验证API功能...');

// 验证文件结构
const fs = require('fs');
const path = require('path');

// 检查必要的文件是否存在
const requiredFiles = [
  'app.js',
  'config/config.js',
  'config/passport.js',
  'models/User.js',
  'models/Role.js',
  'models/Project.js',
  'routes/auth.js',
  'routes/projects.js',
  'routes/roles.js',
  'routes/projectMembers.js',
  'middlewares/auth.js',
  'middlewares/permissions.js'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${file} 存在`);
  } else {
    console.log(`✗ ${file} 不存在`);
    allFilesExist = false;
  }
});

// 验证代码结构
console.log('\n验证代码结构...');

// 检查app.js是否正确配置
const appPath = path.join(__dirname, '..', 'app.js');
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  if (appContent.includes('express')) {
    console.log('✓ Express 已配置');
  } else {
    console.log('✗ Express 未配置');
  }
  
  if (appContent.includes('mongoose')) {
    console.log('✓ Mongoose 已配置');
  } else {
    console.log('✗ Mongoose 未配置');
  }
  
  if (appContent.includes('passport')) {
    console.log('✓ Passport 已配置');
  } else {
    console.log('✗ Passport 未配置');
  }
  
  if (appContent.includes('/api/auth')) {
    console.log('✓ 认证路由已配置');
  } else {
    console.log('✗ 认证路由未配置');
  }
  
  if (appContent.includes('/api/projects')) {
    console.log('✓ 项目路由已配置');
  } else {
    console.log('✗ 项目路由未配置');
  }
  
  if (appContent.includes('/api/roles')) {
    console.log('✓ 角色路由已配置');
  } else {
    console.log('✗ 角色路由未配置');
  }
}

// 验证模型结构
console.log('\n验证模型结构...');

// 检查User模型
const userModelPath = path.join(__dirname, '..', 'models', 'User.js');
if (fs.existsSync(userModelPath)) {
  const userContent = fs.readFileSync(userModelPath, 'utf8');
  
  if (userContent.includes('name')) {
    console.log('✓ User模型包含name字段');
  } else {
    console.log('✗ User模型缺少name字段');
  }
  
  if (userContent.includes('email')) {
    console.log('✓ User模型包含email字段');
  } else {
    console.log('✗ User模型缺少email字段');
  }
  
  if (userContent.includes('password')) {
    console.log('✓ User模型包含password字段');
  } else {
    console.log('✗ User模型缺少password字段');
  }
  
  if (userContent.includes('role')) {
    console.log('✓ User模型包含role字段');
  } else {
    console.log('✗ User模型缺少role字段');
  }
}

// 检查Project模型
const projectModelPath = path.join(__dirname, '..', 'models', 'Project.js');
if (fs.existsSync(projectModelPath)) {
  const projectContent = fs.readFileSync(projectModelPath, 'utf8');
  
  if (projectContent.includes('name')) {
    console.log('✓ Project模型包含name字段');
  } else {
    console.log('✗ Project模型缺少name字段');
  }
  
  if (projectContent.includes('description')) {
    console.log('✓ Project模型包含description字段');
  } else {
    console.log('✗ Project模型缺少description字段');
  }
  
  if (projectContent.includes('creator')) {
    console.log('✓ Project模型包含creator字段');
  } else {
    console.log('✗ Project模型缺少creator字段');
  }
  
  if (projectContent.includes('members')) {
    console.log('✓ Project模型包含members字段');
  } else {
    console.log('✗ Project模型缺少members字段');
  }
}

// 检查Role模型
const roleModelPath = path.join(__dirname, '..', 'models', 'Role.js');
if (fs.existsSync(roleModelPath)) {
  const roleContent = fs.readFileSync(roleModelPath, 'utf8');
  
  if (roleContent.includes('name')) {
    console.log('✓ Role模型包含name字段');
  } else {
    console.log('✗ Role模型缺少name字段');
  }
  
  if (roleContent.includes('permissions')) {
    console.log('✓ Role模型包含permissions字段');
  } else {
    console.log('✗ Role模型缺少permissions字段');
  }
}

console.log('\nAPI验证完成');
if (allFilesExist) {
  console.log('✓ 所有必要文件都存在');
} else {
  console.log('✗ 缺少一些必要文件');
}