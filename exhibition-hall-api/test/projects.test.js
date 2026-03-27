const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const Project = require('../models/Project');
const { expect } = require('chai');

// 测试用户数据
const testUser = {
  name: '测试用户',
  email: 'test@example.com',
  password: 'password123'
};

let token;

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
  await Project.deleteMany({});

  // 创建默认角色
  await Role.create({
    name: 'user',
    permissions: ['read', 'create', 'update', 'delete']
  });

  // 注册测试用户
  const res = await request(app)
    .post('/api/auth/register')
    .send(testUser);

  token = res.body.token;
});

// 断开数据库连接
after(async () => {
  await mongoose.connection.close();
});

// 测试项目管理功能
describe('项目管理测试', () => {
  let projectId;

  // 测试创建项目
  it('应该成功创建项目', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: '测试项目',
        description: '这是一个测试项目'
      });

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('name', '测试项目');
    expect(res.body).to.have.property('description', '这是一个测试项目');
    projectId = res.body._id;
  });

  // 测试获取项目列表
  it('应该成功获取项目列表', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.be.an('array');
    expect(res.body.length).to.be.greaterThan(0);
  });

  // 测试获取单个项目
  it('应该成功获取单个项目', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('_id', projectId);
    expect(res.body).to.have.property('name', '测试项目');
  });

  // 测试更新项目
  it('应该成功更新项目', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: '更新后的测试项目',
        description: '这是更新后的测试项目'
      });

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('name', '更新后的测试项目');
    expect(res.body).to.have.property('description', '这是更新后的测试项目');
  });

  // 测试删除项目
  it('应该成功删除项目', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('msg', '项目删除成功');
  });
});