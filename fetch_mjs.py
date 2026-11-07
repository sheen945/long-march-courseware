import requests, os
h = {'User-Agent': 'Mozilla/5.0 Chrome/156.0', 'Referer': 'https://aifunengjiaoyu.com/'}
os.chdir(r'D:\daima\rea-aifuneng\recon')
for name in ['long-march-playback-host.mjs', 'long-march-save-host.mjs']:
    u = 'https://aifunengjiaoyu.com/course-compat/' + name
    r = requests.get(u, headers=h, timeout=30)
    open(name, 'wb').write(r.content)
    print(r.status_code, len(r.content), name)
