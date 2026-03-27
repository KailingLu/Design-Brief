// 检查用户是否有特定的权限
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      // 确保用户已登录
      if (!req.user) {
        return res.status(401).json({ msg: '未登录' });
      }

      // 检查用户角色是否有所需权限
      if (!req.user.role || !req.user.role.permissions.includes(requiredPermission)) {
        return res.status(403).json({ msg: '无权执行此操作' });
      }

      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: '服务器错误' });
    }
  };
};

module.exports = checkPermission;