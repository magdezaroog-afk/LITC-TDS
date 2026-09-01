import re

file_path = "src/pages/admin/tabs/GlobalUserMatrixTab.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Remove the mock data block
content = re.sub(
    r"// Inject mock data for UI testing if backend doesn't provide it yet.*?const mockUsersData = \[.*?\];\n",
    "",
    content,
    flags=re.DOTALL
)

# Update mappedData initialization
content = re.sub(
    r"const mappedData = \(Array\.isArray\(data\) && data\.length > 0 \? data : mockUsersData\)\.map",
    r"const mappedData = (Array.isArray(data) ? data : []).map",
    content
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("GlobalUserMatrixTab refactored.")
