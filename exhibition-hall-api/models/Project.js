const Storage = require('../utils/storage');

// 从文件加载项目数据
let projects = Storage.loadProjects();
let nextId = projects.length > 0 ? Math.max(...projects.map(project => project._id)) + 1 : 1;

class Project {
  constructor(data) {
    this._id = data._id || nextId++;
    this.name = data.name;
    this.description = data.description;
    this.creator = data.creator;
    this.members = data.members || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    // 保存到内存
    projects.push(this);
    // 保存到文件
    Storage.saveProjects(projects);
    return this;
  }

  static async find() {
    return projects;
  }

  static async findOne(query) {
    if (query._id) {
      return projects.find(project => project._id == query._id);
    }
    return null;
  }

  static async findById(id) {
    return projects.find(project => project._id == id);
  }

  static async deleteOne(query) {
    if (query._id) {
      const index = projects.findIndex(project => project._id == query._id);
      if (index !== -1) {
        projects.splice(index, 1);
        // 保存到文件
        Storage.saveProjects(projects);
        return { deletedCount: 1 };
      }
    }
    return { deletedCount: 0 };
  }
}

module.exports = Project;