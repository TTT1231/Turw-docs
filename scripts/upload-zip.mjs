import { readFileSync, createReadStream, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'ssh2';

// ========== 直接上传zip文件到服务器 ================

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// 读取 .env 文件
function loadEnv() {
   try {
      const envPath = join(rootDir, '.env');
      const envContent = readFileSync(envPath, 'utf-8');
      const env = {};

      envContent.split('\n').forEach((line) => {
         const match = line.match(/^\s*([^#][^=]*?)\s*=\s*(.*)$/);
         if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            env[key] = value;
         }
      });

      return env;
   } catch (error) {
      console.error('❌ Error: .env 文件未找到，请创建一个.env文件并放置到项目根目录');
      process.exit(1);
   }
}

// 验证必要服务器环境变量
function validateEnv(env) {
   const required = ['SERVER_USER', 'SERVER_HOST', 'SERVER_PATH'];
   const missing = required.filter((key) => !env[key]);

   if (missing.length > 0) {
      console.error(`❌ Error: Missing required environment variables: ${missing.join(', ')}`);
      process.exit(1);
   }

   // 必须有密码或私钥之一
   if (!env.SERVER_PASSWORD && !env.SERVER_PRIVATE_KEY && !env.SERVER_PRIVATE_KEY_PATH) {
      console.error(
         '❌ Error: Must provide either SERVER_PASSWORD, SERVER_PRIVATE_KEY, or SERVER_PRIVATE_KEY_PATH'
      );
      process.exit(1);
   }
}

// 上传文件到服务器
function uploadToServer(localPath, remotePath, config) {
   return new Promise((resolve, reject) => {
      const conn = new Client();
      const fileSize = statSync(localPath).size;
      let uploadedSize = 0;

      conn.on('ready', () => {
         conn.sftp((err, sftp) => {
            if (err) {
               conn.end();
               return reject(err);
            }
            const writeStream = sftp.createWriteStream(remotePath);
            const readStream = createReadStream(localPath);

            readStream.on('data', (chunk) => {
               uploadedSize += chunk.length;
               const percentage = ((uploadedSize / fileSize) * 100).toFixed(2);
               const uploaded = (uploadedSize / 1024 / 1024).toFixed(2);
               const total = (fileSize / 1024 / 1024).toFixed(2);
               process.stdout.write(
                  `\r⬆️  Uploading Server: ${uploaded}MB / ${total}MB (${percentage}%)`
               );
            });

            writeStream.on('close', () => {
               console.log('\n✅ Upload completed');
               console.log(`📍 Remote path: ${remotePath}\n`);
               conn.end();
               resolve();
            });

            writeStream.on('error', (err) => {
               conn.end();
               reject(err);
            });

            readStream.pipe(writeStream);
         });
      });

      conn.on('error', reject);

      // 构建连接配置
      const connectConfig = {
         host: config.SERVER_HOST,
         port: 22,
         username: config.SERVER_USER,
         readyTimeout: 60000,
         keepaliveInterval: 5000,
         keepaliveCountMax: 3
      };

      // 优先使用私钥认证
      if (config.SERVER_PRIVATE_KEY_PATH) {
         // 从文件读取私钥
         const privateKeyPath = join(rootDir, config.SERVER_PRIVATE_KEY_PATH);
         if (existsSync(privateKeyPath)) {
            connectConfig.privateKey = readFileSync(privateKeyPath);
            console.log('🔑 Using private key with ssh\n');
         } else {
            return reject(new Error(`Private key file not found: ${privateKeyPath}`));
         }
      } else if (config.SERVER_PRIVATE_KEY) {
         // 直接使用私钥内容
         connectConfig.privateKey = config.SERVER_PRIVATE_KEY.replace(/\\n/g, '\n');
         console.log('🔑 Using private key from env\n');
      } else if (config.SERVER_PASSWORD) {
         // 使用密码认证
         connectConfig.password = config.SERVER_PASSWORD;
         console.log('🔐 Using password authentication\n');
      }

      conn.connect(connectConfig);
   });
}

// 主函数
async function main() {
   try {
      // 加载环境变量
      const env = loadEnv();
      validateEnv(env);

      // 检查 dist.zip 是否存在
      const zipPath = join(rootDir, 'docs', '.vitepress', 'dist.zip');
      if (!existsSync(zipPath)) {
         console.error('❌ Error: dist.zip 文件不存在，请先运行构建命令');
         process.exit(1);
      }

      console.log(`📦 Found zip file: ${zipPath}`);
      const fileSize = (statSync(zipPath).size / 1024 / 1024).toFixed(2);
      console.log(`📊 File size: ${fileSize} MB\n`);

      // 上传到服务器
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const tempPath = env.SERVER_TEMP_ZIP_PATH || 'temp';
      const remotePath = `${env.SERVER_PATH}/${tempPath}/${timestamp}.zip`;

      await uploadToServer(zipPath, remotePath, env);

      console.log('🎉 Upload Done!');
   } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
   }
}

// 仅在直接运行时执行
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
   main();
}

// 导出函数供其他脚本使用
export { loadEnv, validateEnv, uploadToServer };
