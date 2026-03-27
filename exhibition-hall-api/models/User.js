const bcrypt = require('bcryptjs');
const Storage = require('../utils/storage');

// 从文件加载用户数据
let users = Storage.loadUsers();
let nextId = users.length > 0 ? Math.max(...users.map(user => user._id)) + 1 : 1;

class User {
  constructor(data = {}) {
    this._id = data._id || nextId++;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role;
    this.createdAt = data.createdAt || new Date();
  }

  async save() {
    // 从文件加载最新的用户数据
    users = Storage.loadUsers();
    
    // 检查用户是否已存在
    const existingUser = users.find(user => user.email === this.email);
    if (existingUser) {
      throw new Error('用户已存在');
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    // 保存到内存
    users.push(this);
    // 保存到文件
    Storage.saveUsers(users);
    return this;
  }

  async matchPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  static async findOne(query) {
    // 从文件加载最新的用户数据
    users = Storage.loadUsers();
    
    let user;
    if (query.email) {
      user = users.find(user => user.email === query.email);
    }
    if (query._id) {
      user = users.find(user => user._id == query._id);
    }
    if (user) {
      // 将普通对象转换为 User 类的实例
      return Object.assign(new User(), user);
    }
    return null;
  }

  static async find() {
    return users;
  }

  static async findByIdAndUpdate(id, update) {
    // 从文件加载最新的用户数据
    users = Storage.loadUsers();
    
    const user = users.find(user => user._id == id);
    if (user) {
      Object.assign(user, update);
      // 保存到文件
      Storage.saveUsers(users);
      return user;
    }
    return null;
  }
}

module.exports = User;