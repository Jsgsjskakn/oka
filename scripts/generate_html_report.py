import os

md_path = r"C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak\AUDIT_REPORT.md"
html_path = r"C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak\AUDIT_REPORT.html"

with open(md_path, "r", encoding="utf-8") as f:
    md_content = f.read()

# Simple markdown to HTML conversion with luxury golden oak styling
html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Golden Oak — Complete Architectural Audit Report</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    :root {{
      --bg: #09090b;
      --card-bg: #121215;
      --text: #f4f4f5;
      --text-muted: #a1a1aa;
      --gold: #c9a84c;
      --gold-light: #e6ca65;
      --border: #27272a;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      padding: 40px 20px;
    }}
    .container {{
      max-width: 1000px;
      margin: 0 auto;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }}
    h1, h2, h3, h4 {{
      color: var(--gold-light);
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 700;
      letter-spacing: -0.02em;
    }}
    h1 {{ font-size: 2.2em; border-bottom: 2px solid var(--gold); padding-bottom: 0.3em; margin-top: 0; }}
    h2 {{ font-size: 1.5em; border-bottom: 1px solid var(--border); padding-bottom: 0.2em; }}
    h3 {{ font-size: 1.2em; }}
    p, li {{ color: var(--text); margin-bottom: 0.8em; font-size: 15px; }}
    ul, ol {{ padding-left: 24px; margin-bottom: 1em; }}
    li {{ margin-bottom: 0.3em; }}
    code {{
      background: #1e1e24;
      color: var(--gold-light);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
    }}
    pre {{
      background: #18181b;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      margin-bottom: 1.5em;
    }}
    pre code {{
      background: transparent;
      padding: 0;
      color: #e4e4e7;
      font-size: 13px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
      font-size: 14px;
      background: #141418;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--border);
    }}
    th, td {{
      padding: 12px 14px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }}
    th {{
      background: #1c1c22;
      color: var(--gold);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.05em;
    }}
    tr:hover td {{
      background: rgba(201, 168, 76, 0.04);
    }}
    hr {{
      border: none;
      height: 1px;
      background: var(--border);
      margin: 2em 0;
    }}
    blockquote {{
      border-left: 4px solid var(--gold);
      padding-left: 16px;
      margin: 1.5em 0;
      color: var(--text-muted);
      background: rgba(201, 168, 76, 0.05);
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
    }}
    .badge {{
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
    }}
    .badge-pass {{ background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }}
    .badge-warn {{ background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }}
    .badge-fail {{ background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }}
    .print-btn {{
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--gold);
      color: #000;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(201, 168, 76, 0.4);
      transition: transform 0.2s;
    }}
    .print-btn:hover {{ transform: scale(1.05); }}
    @media print {{
      body {{ background: #fff; color: #000; padding: 0; }}
      .container {{ border: none; box-shadow: none; max-width: 100%; padding: 0; background: #fff; }}
      .print-btn {{ display: none; }}
      h1, h2, h3 {{ color: #000; }}
      th {{ background: #eee; color: #000; }}
      pre, code {{ background: #f5f5f5; color: #000; }}
    }}
  </style>
</head>
<body>
  <div class="container" id="content"></div>
  <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>

  <script>
    const markdown = {repr(md_content)};
    document.getElementById('content').innerHTML = marked.parse(markdown);
  </script>
</body>
</html>
"""

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Successfully generated HTML report at: {html_path}")
print(f"File size: {os.path.getsize(html_path)} bytes")
