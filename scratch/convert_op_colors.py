import re

filepath = r"src\components\admin\tabs\OperationalStructureTab.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Common color replacements
content = content.replace("color: '#0f172a'", "color: OA.text")
content = content.replace("color: '#475569'", "color: OA.textSub")
content = content.replace("color: '#64748b'", "color: OA.textTer")
content = content.replace("color: '#334155'", "color: OA.textSub")

content = content.replace("background: 'rgba(241, 245, 249, 0.95)'", "background: OA.bg")
content = content.replace("background: 'rgba(241,245,249,0.95)'", "background: OA.bg")
content = content.replace("background: 'rgba(99,102,241,0.04)'", "background: OA.bg")

content = content.replace("background: 'rgba(0, 0, 0, 0.4)'", "background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)'")
content = content.replace("background: 'rgba(0, 0, 0, 0.6)'", "background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)'")
content = content.replace("background: 'rgba(241, 245, 249, 0.95)', backdropFilter: 'blur(10px)'", "background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)'")

content = content.replace("background: 'rgba(255, 255, 255, 0.98)'", "background: OA.surface")
content = content.replace("border: '1px solid rgba(255,255,255,0.1)'", f"border: `1px solid ${{OA.sep}}`")
content = content.replace("borderBottom: '1px solid rgba(255,255,255,0.1)'", f"borderBottom: `1px solid ${{OA.sep}}`")
content = content.replace("borderBottom: '1px dashed rgba(255,255,255,0.1)'", f"borderBottom: `1px dashed ${{OA.sep}}`")

content = content.replace("boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'", "boxShadow: '0 16px 40px rgba(0,0,0,0.08)'")

content = content.replace("background: 'linear-gradient(135deg, #10b981, #059669)'", "background: OA.green")
content = content.replace("background: 'rgba(239, 68, 68, 0.2)'", f"background: `${{OA.red}}15`")
content = content.replace("color: '#fca5a5'", "color: OA.red")
content = content.replace("border: '1px solid rgba(239, 68, 68, 0.3)'", f"border: `1px solid ${{OA.red}}30`")

content = content.replace("background: 'rgba(139, 92, 246, 0.2)'", f"background: `${{OA.purple}}15`")
content = content.replace("color: '#c4b5fd'", "color: OA.purple")
content = content.replace("border: '1px solid #8b5cf6'", f"border: `1px solid ${{OA.purple}}30`")

content = content.replace("background: 'rgba(2, 132, 199, 0.2)'", f"background: `${{OA.blue}}15`")
content = content.replace("color: '#bae6fd'", "color: OA.blue")
content = content.replace("border: '1px solid #0284c7'", f"border: `1px solid ${{OA.blue}}30`")

content = content.replace("borderBottom: '1px solid rgba(255,255,255,0.05)'", f"borderBottom: `1px solid ${{OA.sep}}`")
content = content.replace("background: selectedPoolUsers.includes(user.id) ? 'rgba(56, 189, 248, 0.1)' : 'transparent'", f"background: selectedPoolUsers.includes(user.id) ? `${{OA.blue}}10` : 'transparent'")

content = content.replace("color: '#10b981'", "color: OA.green")
content = content.replace("color: '#ef4444'", "color: OA.red")
content = content.replace("color: '#eab308'", "color: OA.amber")
content = content.replace("color: '#f59e0b'", "color: OA.amber")

content = content.replace("border: '1px solid rgba(56, 189, 248, 0.3)'", f"border: `1px solid ${{OA.blue}}30`")
content = content.replace("color: '#7dd3fc'", "color: OA.blue")

content = content.replace("border: '1px solid rgba(255,255,255,0.2)'", f"border: `1px solid ${{OA.sepStr}}`")
content = content.replace("background: 'rgba(255, 255, 255, 0.05)'", "background: OA.bg")

content = content.replace("color: '#38bdf8'", "color: OA.blue")
content = content.replace("background: '#38bdf8'", "background: OA.blue")
content = content.replace("background: 'rgba(56, 189, 248, 0.1)'", f"background: `${{OA.blue}}15`")

content = content.replace("background: 'rgba(248, 113, 113, 0.1)'", f"background: `${{OA.red}}15`")
content = content.replace("color: '#f87171'", "color: OA.red")
content = content.replace("border: '1px solid rgba(248, 113, 113, 0.3)'", f"border: `1px solid ${{OA.red}}30`")

content = content.replace("background: 'rgba(250, 204, 21, 0.1)'", f"background: `${{OA.amber}}15`")
content = content.replace("color: '#fde047'", "color: OA.amber")

content = content.replace("background: '#1e293b'", "background: OA.bg")
content = content.replace("color: '#cbd5e1'", "color: OA.textSub")

content = content.replace("background: '#0f172a'", "background: OA.surface")

content = content.replace("background: 'rgba(99, 102, 241, 0.2)'", f"background: `${{OA.indigo}}15`")
content = content.replace("color: '#818cf8'", "color: OA.indigo")
content = content.replace("border: '1px solid rgba(99, 102, 241, 0.3)'", f"border: `1px solid ${{OA.indigo}}30`")

# Also modify the text style block to include fontFamily
content = content.replace("style={{ width: '100%', borderCollapse: 'collapse', color: '#0f172a' }}", "style={{ width: '100%', borderCollapse: 'collapse', color: OA.text, fontFamily: OA.font }}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
