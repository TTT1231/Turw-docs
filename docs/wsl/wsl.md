# WSL

wsl2 在windows集成 linux，主要就是解决网络代理问题，docker能够访问外网拉取镜像。

## Quick Start

**1、在管理员模式启动powershell**

```powershell
wsl --install
```

**2、打开Ubuntu，设置用户名和密码**

**3、配置ssh服务**

```terminal
sudo apt update && sudo apt install openssh-server
```

**4、修改 SSH 配置并添加以下内容**

使得能够**允许通过密码验证登录 SSH 服务器**。

```terminal
sudo nano /etc/ssh/sshd_config
```

```content
Port 22
ListenAddress 0.0.0.0
PasswordAuthentication yes
```

**5、启动SSH服务**

```terminal
sudo service ssh start
```

## 网络代理 (Ubuntu 为例)

<Warning title="注意">
下面代理，属于`VPN`网络代理请求转发，本质上还是`VPN`。
</Warning>

**1. 获取默认网关（让 WSL2 访问 Windows）**

- 默认网关负责在 Linux 与 Windows 之间转发网络流量
- **重启 Windows 后网关地址会重新分配**

```bash
ip route show default
```

**2. 获取 WSL2 的 IP（让 Windows 访问 WSL2）**

- `eth0` 网卡中的 `inet` 字段即为当前 WSL2 IP
- **每次重启都会变动**

```bash
ip addr show eth0
```

**3. 配置 WSL 代理（将流量转发至 Windows 代理端口 9876）**

- 确保 Windows 代理已开启并勾选「允许局域网连接」
- 以下为临时设置，关闭终端或代理后需重新执行

```bash
export WIN_IP=$(ip route show default | awk '{print $3}')
export http_proxy="http://${WIN_IP}:9876"
export https_proxy="http://${WIN_IP}:9876"
export all_proxy="socks5://${WIN_IP}:9876"
```
