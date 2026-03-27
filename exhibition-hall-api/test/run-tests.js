const fs = require('fs');
const path = require('path');

// 简单的测试运行器
function runTests() {
  console.log('开始运行测试...');

  // 测试文件路径
  const testFiles = [
    path.join(__dirname, 'auth.test.js'),
    path.join(__dirname, 'projects.test.js')
  ];

  // 读取并执行每个测试文件
  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`运行测试文件: ${file}`);
      try {
        require(file);
      } catch (error) {
        console.error(`测试文件执行失败: ${error.message}`);
      }
    } else {
      console.error(`测试文件不存在: ${file}`);
    }
  });

  console.log('测试运行完成');
}

// 运行测试
runTests();