# WSL

wsl2 在windows集成 linux。

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

## network proxy(Ubnutu为例)

WSL2默认网关（该网关充当linux与windows通信桥梁，linux所有流量都会经过这个网关，然后转化到实机windows发送请求）-【Ubnutu】,**下面这个默认网关，会在系统重启会重新分配要注意**，`用于WSL2访问windows`

```terminal
ip route show default
```

WSL2的IP地址（inet第一个地址就是），也就是WSL2在windows下IP地址，windows只能通过这个IP访问WSL2，重启这个地址会**重新分配**，`用于windows访问WSL2`

```terminal
ip addr show eth0
```

**WSL代理**，这里我将是windows代理，所以我将WSL2访问windows地址代理到我在windows下的代理地址（我是windows端口9876代理）,这里是临时配置由于我本机的代理会关闭，所以要的时候打开一下即可【**windows代理要开启允许局域网连接**】，类似网络请求转发。

```terminal
export WIN_IP=$(ip route show default | awk '{print $3}')
export http_proxy="http://$WIN_IP:9876"
export https_proxy="http://$WIN_IP:9876"
export all_proxy="socks5://$WIN_IP:9876"
```
