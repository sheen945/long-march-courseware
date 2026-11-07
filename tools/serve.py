# -*- coding: utf-8 -*-
"""本地静态服务 + 浏览器验证本地化课件"""
import http.server, os, socketserver, threading, functools

ROOT = r"D:\daima\rea-aifuneng\dist"
PORT = 8765

class H(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        if path.endswith(".js") or path.endswith(".mjs"):
            return "text/javascript"
        if path.endswith(".json"):
            return "application/json"
        if path.endswith(".css"):
            return "text/css"
        return super().guess_type(path)
    def log_message(self, *a):
        pass

os.chdir(ROOT)
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.ThreadingTCPServer(("127.0.0.1", PORT), H)
print("serving on", PORT)
httpd.serve_forever()
