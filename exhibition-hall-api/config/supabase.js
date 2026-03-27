const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://olypslbjbipdrxytzwpc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9seXBzbGJqYmlwZHJ4eXR6d3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODA3ODEsImV4cCI6MjA4ODY1Njc4MX0.pvdjWHNArJSst3JrzWjNd7GYk4mEjIf_tGpl5fcHa-w';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;