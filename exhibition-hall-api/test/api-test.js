const request = require('supertest');
const app = require('../app');
const { expect } = require('chai');
const Storage = require('../utils/storage');

// 测试用户数据
const testUser = {
  name: '测试用户',
  email: 'test@example.com',
  password: 'password123'
};

const adminUser = {
  name: '管理员',
  email: 'admin@example.com',
  password: 'password123'
};

let token;
let adminToken;
let projectId;
let roleId;
let adminUserId;

// 清除测试数据
before(async () => {
  // 清除所有存储的数据
  Storage.clearAll();
  console.log('开始运行测试...');
});

// 测试认证 API
describe('认证 API 测试', () => {
  // 测试注册功能
  it('应该成功注册新用户', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('token');
    expect(res.body.user).to.have.property('name', testUser.name);
    expect(res.body.user).to.have.property('email', testUser.email);
  });

  // 测试登录功能
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
    token = res.body.token;
  });

  // 测试注册管理员用户
  it('应该成功注册管理员用户', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(adminUser);

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('token');
    expect(res.body.user).to.have.property('name', adminUser.name);
    expect(res.body.user).to.have.property('email', adminUser.email);
    adminUserId = res.body.user._id;
  });

  // 测试管理员登录
  it('应该成功登录管理员用户', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminUser.email,
        password: adminUser.password
      });

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('token');
    expect(res.body.user).to.have.property('name', adminUser.name);
    expect(res.body.user).to.have.property('email', adminUser.email);
    adminToken = res.body.token;
  });

  // 测试将管理员用户的角色更改为 admin
  it('应该成功将管理员用户的角色更改为 admin', async () => {
    // 导入 User 模型
    const User = require('../models/User');
    // 将用户角色更改为 admin（ID 为 2）
    const updatedUser = await User.findByIdAndUpdate(adminUserId, { role: '2' });
    expect(updatedUser).to.exist;
    expect(updatedUser.role).to.equal('2');
  });

  // 测试重新登录管理员用户以获取包含新角色信息的 token
  it('应该成功重新登录管理员用户', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminUser.email,
        password: adminUser.password
      });

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('token');
    expect(res.body.user).to.have.property('name', adminUser.name);
    expect(res.body.user).to.have.property('email', adminUser.email);
    // 验证用户角色已更新为 admin
    expect(res.body.user.role).to.have.property('name', 'admin');
    expect(res.body.user.role).to.have.property('permissions');
    expect(res.body.user.role.permissions).to.include('delete');
    adminToken = res.body.token;
  });
});

// 测试角色 API
describe('角色 API 测试', () => {
  // 测试创建角色
  it('应该成功创建角色', async () => {
    const res = await request(app)
      .post('/api/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: '测试角色',
        permissions: ['read', 'create']
      });

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('name', '测试角色');
    expect(res.body).to.have.property('permissions');
    expect(res.body.permissions).to.include('read');
    expect(res.body.permissions).to.include('create');
    roleId = res.body._id;
  });

  // 测试获取角色列表
  it('应该成功获取角色列表', async () => {
    const res = await request(app)
      .get('/api/roles')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.be.an('array');
    expect(res.body.length).to.be.greaterThan(0);
  });

  // 测试获取单个角色
  it('应该成功获取单个角色', async () => {
    const res = await request(app)
      .get(`/api/roles/${roleId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('_id', roleId);
    expect(res.body).to.have.property('name', '测试角色');
  });

  // 测试更新角色
  it('应该成功更新角色', async () => {
    const res = await request(app)
      .put(`/api/roles/${roleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: '更新后的测试角色',
        permissions: ['read', 'create', 'update', 'delete']
      });

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('name', '更新后的测试角色');
    expect(res.body.permissions).to.include('delete');
  });

  // 测试删除角色
  it('应该成功删除角色', async () => {
    const res = await request(app)
      .delete(`/api/roles/${roleId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('msg', '角色删除成功');
  });
});

// 测试项目 API
describe('项目 API 测试', () => {
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

// 测试项目成员 API
describe('项目成员 API 测试', () => {
  // 先创建一个项目用于测试
  before(async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: '测试项目',
        description: '这是一个测试项目'
      });
    projectId = res.body._id;
  });

  // 测试添加项目成员
  it('应该成功添加项目成员', async () => {
    // 先注册一个新用户
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: '测试成员',
        email: 'member@example.com',
        password: 'password123'
      });

    const memberId = res1.body.user._id;

    const res2 = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: memberId,
        role: 'member'
      });

    expect(res2.statusCode).to.equal(200);
    expect(res2.body.members).to.be.an('array');
    expect(res2.body.members.length).to.be.greaterThan(0);
  });

  // 测试更新项目成员角色
  it('应该成功更新项目成员角色', async () => {
    // 获取项目成员列表
    const res1 = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);

    const member = res1.body.members.find(m => m.role === 'member');
    expect(member).to.exist;

    const res2 = await request(app)
      .put(`/api/projects/${projectId}/members/${member.user}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        role: 'admin'
      });

    expect(res2.statusCode).to.equal(200);
    const updatedMember = res2.body.members.find(m => m.user === member.user);
    expect(updatedMember.role).to.equal('admin');
  });

  // 测试移除项目成员
  it('应该成功移除项目成员', async () => {
    // 获取项目成员列表
    const res1 = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);

    const member = res1.body.members.find(m => m.role === 'admin');
    expect(member).to.exist;

    const res2 = await request(app)
      .delete(`/api/projects/${projectId}/members/${member.user}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res2.statusCode).to.equal(200);
    const updatedMembers = res2.body.members;
    const removedMember = updatedMembers.find(m => m.user === member.user);
    expect(removedMember).to.not.exist;
  });
});

console.log('API 测试完成');
