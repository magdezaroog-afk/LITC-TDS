import re

file_path = "src/pages/admin/tabs/OperationalStructureTab.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We want to replace the `.filter(u => editEntityLeaderSearchTerm.trim().length > 0 && (u.name.toLowerCase().includes...)) \n .sort(...)`
# with `.filter(u => editEntityLeaderSearchTerm.trim().length > 0 && (u.name.toLowerCase().includes(editEntityLeaderSearchTerm.toLowerCase()) || u.employeeId.toLowerCase().includes(editEntityLeaderSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(editEntityLeaderSearchTerm.toLowerCase())))`

# Let's use regex
content = re.sub(
    r"\.filter\(u => editEntityLeaderSearchTerm\.trim\(\)\.length > 0 && \(u\.name\.toLowerCase\(\)\.includes\(editEntityLeaderSearchTerm\.toLowerCase\(\)\) \|\| \nu\.employeeId\.toLowerCase\(\)\.includes\(editEntityLeaderSearchTerm\.toLowerCase\(\)\) \|\| \nu\.email\.toLowerCase\(\)\.includes\(editEntityLeaderSearchTerm\.toLowerCase\(\)\)\)",
    r".filter(u => editEntityLeaderSearchTerm.trim().length > 0 && (u.name.toLowerCase().includes(editEntityLeaderSearchTerm.toLowerCase()) || \nu.employeeId.toLowerCase().includes(editEntityLeaderSearchTerm.toLowerCase()) || \nu.email.toLowerCase().includes(editEntityLeaderSearchTerm.toLowerCase())))",
    content
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
