"""
Local static file server for parquet data files.

DuckDB WASM needs two things the standard `python -m http.server` doesn't provide:
  - CORS headers (frontend runs on a different port)
  - Range request support (NOT built into SimpleHTTPRequestHandler — implemented here)

Usage:
  python serve-data.py            # serves data/ at http://localhost:8001
  python serve-data.py 9000       # custom port

Set VITE_DATA_BASE_URL=http://localhost:8001/parquet in frontend/.env.local
"""

import os
import sys
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler


def _fmt_size(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.0f} {unit}"
        n //= 1024
    return f"{n:.0f} TB"


class CORSHandler(SimpleHTTPRequestHandler):
    # --- response size tracking ---

    def send_response(self, code, message=None):
        self._log_code = code
        self._log_size = None
        super().send_response(code, message)

    def send_header(self, keyword, value):
        kl = keyword.lower()
        if kl == "content-length":
            try:
                self._log_size = int(value)
            except (ValueError, TypeError):
                pass
        elif kl == "content-range":
            # "bytes start-end/total" — extract actual bytes served
            try:
                byte_range = value.split(" ")[1]          # "start-end/total"
                start, rest = byte_range.split("-")
                end = rest.split("/")[0]
                self._log_size = int(end) - int(start) + 1
            except Exception:
                pass
        super().send_header(keyword, value)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Range, Content-Type")
        self.send_header("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length")
        super().end_headers()
        size_str = _fmt_size(self._log_size) if self._log_size is not None else "-"
        print(f"{self._log_code}  {size_str:>10}  {self.requestline}", file=sys.stderr)

    # --- suppress the default log_request line (we log in end_headers instead) ---

    def log_request(self, code="-", size="-"):
        pass

    # --- OPTIONS preflight ---

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    # --- Range request support ---
    # SimpleHTTPRequestHandler does NOT handle Range headers — it always returns
    # the full file (200 OK). DuckDB WASM relies on 206 Partial Content to read
    # only the parquet footer and relevant row groups instead of the whole file.

    def send_head(self):
        self._range_length = None  # set below when serving a partial response
        range_header = self.headers.get("Range")
        if range_header is None:
            return super().send_head()

        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()

        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None

        try:
            file_size = os.fstat(f.fileno()).st_size
            start, end = self._parse_range(range_header, file_size)
            if start is None:
                self.send_error(416, "Requested Range Not Satisfiable")
                self.send_header("Content-Range", f"bytes */{file_size}")
                f.close()
                return None

            length = end - start + 1
            f.seek(start)
            self._range_length = length

            import mimetypes
            ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
            self.send_response(206)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(length))
            self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
            self.send_header("Accept-Ranges", "bytes")
            self.end_headers()
            return f
        except Exception:
            f.close()
            raise

    def _parse_range(self, header: str, file_size: int):
        """Parse 'bytes=start-end' and return (start, end) clamped to file size."""
        try:
            unit, ranges = header.split("=", 1)
            if unit.strip() != "bytes":
                return None, None
            parts = ranges.split("-", 1)
            raw_start = parts[0].strip()
            raw_end = parts[1].strip() if len(parts) > 1 else ""

            if raw_start == "":
                # suffix range: bytes=-N (last N bytes)
                n = int(raw_end)
                start = max(0, file_size - n)
                end = file_size - 1
            else:
                start = int(raw_start)
                end = int(raw_end) if raw_end else file_size - 1

            end = min(end, file_size - 1)
            if start > end or start < 0:
                return None, None
            return start, end
        except (ValueError, IndexError):
            return None, None

    def do_GET(self):
        f = self.send_head()
        if f:
            try:
                if self._range_length is not None:
                    # Partial response: copy exactly _range_length bytes from seeked position.
                    remaining = self._range_length
                    buf = 64 * 1024
                    while remaining > 0:
                        chunk = f.read(min(buf, remaining))
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                        remaining -= len(chunk)
                else:
                    import shutil
                    shutil.copyfileobj(f, self.wfile)
            finally:
                f.close()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    server = HTTPServer(("", port), partial(CORSHandler, directory="data"))
    print(f"Serving data/ at http://localhost:{port}")
    print(f"Set in frontend/.env.local:")
    print(f"  VITE_DATA_BASE_URL=http://localhost:{port}/parquet")
    print("Press Ctrl+C to stop.\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
