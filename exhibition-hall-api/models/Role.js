const Storage = require('../utils/storage');

// 从文件加载角色数据
let roles = Storage.loadRoles();

// 如果没有默认角色，创建默认角色
if (roles.length === 0) {
  roles.push({
    _id: '1',
    name: 'user',
    permissions: ['read'],
    createdAt: new Date()
  });
  
  roles.push({
    _id: '2',
    name: 'admin',
    permissions: ['read', 'create', 'update', 'delete'],
    createdAt: new Date()
  });
  
  // 保存默认角色到文件
  Storage.saveRoles(roles);
}

let nextId = roles.length > 0 ? Math.max(...roles.map(role => role._id)) + 1 : 3;

class Role {
  constructor(data) {
    this._id = data._id || nextId++;
    this.name = data.name;
    this.permissions = data.permissions;
    this.createdAt = data.createdAt || new Date();
  }

  async save() {
    // 检查角色是否已存在（仅在创建新角色时）
    const existingRole = roles.find(role => role.name === this.name && role._id !== this._id);
    if (existingRole) {
      throw new Error('角色已存在');
    }

    // 检查是否是更新操作
    const existingIndex = roles.findIndex(role => role._id == this._id);
    if (existingIndex !== -1) {
      // 更新现有角色
      roles[existingIndex] = this;
    } else {
      // 保存新角色
      roles.push(this);
    }
    // 保存到文件
    Storage.saveRoles(roles);
    return this;
  }

  static async findOne(query) {
    if (query.name) {
      return roles.find(role => role.name === query.name);
    }
    if (query._id) {
      return roles.find(role => role._id == query._id);
    }
    return null;
  }

  static async find() {
    return roles;
  }

  static async findById(id) {
    return roles.find(role => role._id == id);
  }

  async remove() {
    const index = roles.findIndex(role => role._id == this._id);
    if (index !== -1) {
      roles.splice(index, 1);
      // 保存到文件
      Storage.saveRoles(roles);
    }
    return this;
  }
}

module.exports = Role;