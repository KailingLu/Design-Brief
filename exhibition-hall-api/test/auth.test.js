const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const { expect } = require('chai');

// 测试用户数据
const testUser = {
  name: '测试用户',
  email: 'test@example.com',
  password: 'password123'
};

// 连接测试数据库
before(async () => {
  // 连接到测试数据库
  await mongoose.connect('mongodb://localhost:27017/test-exhibition-hall', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  });

  // 清除测试数据
  await User.deleteMany({});
  await Role.deleteMany({});

  // 创建默认角色
  await Role.create({
    name: 'user',
    permissions: ['read']
  });
});

// 断开数据库连接
after(async () => {
  await mongoose.connection.close();
});

// 测试注册功能
describe('注册测试', () => {
  it('应该成功注册新用户', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('token');
    expect(res.body.user).to.have.property('name', testUser.name);
    expect(res.body.user).to.have.property('email', testUser.email);
  });

  it('应该返回错误当用户已存在', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).to.equal(400);
    expect(res.body).to.have.property('msg', '用户已存在');
  });
});

// 测试登录功能
describe('登录测试', () => {
  it('应该成功登录', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('token');
    expect(res.body.user).to.have.property('name', testUser.name);
    expect(res.body.user).to.have.property('email', testUser.email);
  });

  it('应该返回错误当用户不存在', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: testUser.password
      });

    expect(res.statusCode).to.equal(400);
    expect(res.body).to.have.property('msg', '用户不存在');
  });

  it('应该返回错误当密码错误', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      });

    expect(res.statusCode).to.equal(400);
    expect(res.body).to.have.property('msg', '密码错误');
  });
});