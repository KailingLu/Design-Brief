const fs = require('fs');
const path = require('path');

// 存储文件路径
const STORAGE_PATH = path.join(__dirname, '..', 'storage');
const USERS_FILE = path.join(STORAGE_PATH, 'users.json');
const ROLES_FILE = path.join(STORAGE_PATH, 'roles.json');
const PROJECTS_FILE = path.join(STORAGE_PATH, 'projects.json');

// 确保存储目录存在
if (!fs.existsSync(STORAGE_PATH)) {
  fs.mkdirSync(STORAGE_PATH, { recursive: true });
}

// 存储管理类
class Storage {
  // 保存数据到文件
  static saveData(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`保存数据到 ${filePath} 失败:`, error);
      return false;
    }
  }

  // 从文件加载数据
  static loadData(filePath, defaultValue = []) {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
      return defaultValue;
    } catch (error) {
      console.error(`从 ${filePath} 加载数据失败:`, error);
      return defaultValue;
    }
  }

  // 保存用户数据
  static saveUsers(users) {
    return this.saveData(USERS_FILE, users);
  }

  // 加载用户数据
  static loadUsers() {
    return this.loadData(USERS_FILE, []);
  }

  // 保存角色数据
  static saveRoles(roles) {
    return this.saveData(ROLES_FILE, roles);
  }

  // 加载角色数据
  static loadRoles() {
    return this.loadData(ROLES_FILE, []);
  }

  // 保存项目数据
  static saveProjects(projects) {
    return this.saveData(PROJECTS_FILE, projects);
  }

  // 加载项目数据
  static loadProjects() {
    return this.loadData(PROJECTS_FILE, []);
  }

  // 清除所有存储的数据
  static clearAll() {
    try {
      // 清除用户数据
      this.saveData(USERS_FILE, []);
      // 清除角色数据
      this.saveData(ROLES_FILE, []);
      // 清除项目数据
      this.saveData(PROJECTS_FILE, []);
      return true;
    } catch (error) {
      console.error('清除所有存储数据失败:', error);
      return false;
    }
  }
}

module.exports = Storage;
