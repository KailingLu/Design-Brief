// 缓存管理模块
class Cache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 3600000; // 默认缓存时间：1小时
  }

  // 设置缓存
  set(key, value, ttl = this.defaultTTL) {
    const item = {
      value,
      expiry: Date.now() + ttl
    };
    this.cache.set(key, item);
  }

  // 获取缓存
  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    // 检查缓存是否过期
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  // 删除缓存
  delete(key) {
    this.cache.delete(key);
  }

  // 清空缓存
  clear() {
    this.cache.clear();
  }

  // 检查缓存是否存在
  has(key) {
    return this.cache.has(key);
  }

  // 获取缓存大小
  size() {
    return this.cache.size;
  }
}

// 导出缓存实例
module.exports = new Cache();
