import { spawn } from 'child_process';
import { readFileSync, createReadStream, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { Client } from 'ssh2';

// ========== 构建dist.zip并上传到服务器中,解决内存不够的问题 ================

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// 执行命令并实时输出
function spawnAsync(command, args, options) {
   return new Promise((resolve, reject) => {
      const proc = spawn(command, args, { ...options, stdio: 'inherit', shell: true });
      proc.on('close', (code) => {
         if (code !== 0) {
            reject(new Error(`Command exited with code ${code}`));
         } else {
            console.log('\n✅ Build completed\n');
            resolve();
         }
      });
      proc.on('error', reject);
   });
}

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
   const required = ['SERVER_USER', 'SERVER_HOST', 'SERVER_PASSWORD', 'SERVER_PATH'];
   const missing = required.filter((key) => !env[key]);

   if (missing.length > 0) {
      console.error(`❌ Error: Missing required environment variables: ${missing.join(', ')}`);
      process.exit(1);
   }
}

// 创建 ZIP 文件
function createZipArchive(sourceDir, outputPath) {
   return new Promise((resolve, reject) => {
      const output = createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
         console.log(`✅ Archive created: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
         resolve();
      });

      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
   });
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

      conn.connect({
         host: config.SERVER_HOST,
         port: 22,
         username: config.SERVER_USER,
         password: config.SERVER_PASSWORD
      });
   });
}

// 主函数
async function main() {
   try {
      // 加载环境变量
      const env = loadEnv();
      validateEnv(env);

      // 1. 构建 VitePress
      await spawnAsync('pnpm', ['run', 'docs:build'], { cwd: rootDir });

      // 2. 创建 ZIP 文件
      const distPath = join(rootDir, 'docs', '.vitepress', 'dist');
      const zipPath = join(rootDir, 'docs', '.vitepress', 'dist.zip');
      await createZipArchive(distPath, zipPath);

      // 3. 上传到服务器
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const remotePath = `${env.SERVER_PATH}/${timestamp}.zip`;
      await uploadToServer(zipPath, remotePath, env);

      console.log('🎉 Done!');
   } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
   }
}

main();
