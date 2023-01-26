import http.server
import socketserver

class CustomHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.path = 'index.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)
PORT = 8000

handler = CustomHttpRequestHandler
socketserver.TCPServer.allow_reuse_address = True
server=socketserver.TCPServer(("localhost", PORT), handler)

print("Server started at port 8000. Press CTRL+C to close the server.")
try:
	server.serve_forever()
except KeyboardInterrupt:
	server.server_close()
	print("Server Closed")