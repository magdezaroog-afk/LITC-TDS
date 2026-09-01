import re

file_path = "src/pages/admin/tabs/OperationalStructureTab.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove mock data constants
patterns_to_remove = [
    r"const initialOperationalUsers: OperationalUser\[\] = \[.*?\];\n",
    r"const initialDepartments: OrgDepartment\[\] = \[.*?\];\n",
    r"const mockInterfaces: AvailableUI\[\] = \[.*?\];\n",
    r"const mockNodes: any\[\] = \[.*?\];\n",
    r"// ─── Mock Data for Interfaces \(UI Engine\) ───\n",
    r"// ─── Mock Data for Org Structure ───\n",
    r"// ─── Mock Data for Independent Nodes ───\n"
]

for p in patterns_to_remove:
    content = re.sub(p, "", content, flags=re.DOTALL)

# 2. Update state initialization
content = re.sub(
    r"const \[operationalUsers, setOperationalUsers\] = useState<OperationalUser\[\]>\(\(\) => \{[^}]*return saved \? JSON\.parse\(saved\) : initialOperationalUsers;\s*\}\);",
    "const [operationalUsers, setOperationalUsers] = useState<OperationalUser[]>([]);",
    content,
    flags=re.DOTALL
)

content = re.sub(
    r"const \[departments, setDepartments\] = useState<OrgDepartment\[\]>\(\(\) => \{[^}]*return saved \? JSON\.parse\(saved\) : initialDepartments;\s*\}\);",
    "const [departments, setDepartments] = useState<OrgDepartment[]>([]);",
    content,
    flags=re.DOTALL
)

# 3. Add useEffect for data fetching
fetch_effect = """
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, deptsRes] = await Promise.all([
          fetch('/api/v1/admin/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
          fetch('/api/v1/admin/departments', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
        ]);
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setOperationalUsers(usersData.map((u: any) => ({
            id: String(u.id),
            name: u.fullName,
            email: u.email,
            employeeId: u.username,
            role: 'EMPLOYEE',
            departmentId: String(u.departmentId || ''),
          })));
        }
        if (deptsRes.ok) {
          const deptsData = await deptsRes.json();
          setDepartments(deptsData.map((d: any) => ({
            id: String(d.id),
            name: d.name,
            divisions: (d.divisions || []).map((div: any) => ({
              id: String(div.id),
              name: div.name,
              isIndependent: false,
              teams: (div.teams || []).map((t: any) => ({
                id: String(t.id),
                name: t.name,
                assignedUsers: []
              })),
              unassignedUsers: []
            }))
          })));
        }
      } catch (err) {
        console.error('Error fetching operational structure', err);
      }
    };
    fetchData();
  }, []);
"""

content = re.sub(
    r"(const \[departments, setDepartments\] = useState<OrgDepartment\[\]>\(\[\]\);)",
    r"\1\n" + fetch_effect,
    content
)

# 4. Remove localStorage sync effects
content = re.sub(
    r"React\.useEffect\(\(\) => \{\s*localStorage\.setItem\('mockOperationalUsers', JSON\.stringify\(operationalUsers\)\);\s*\}, \[operationalUsers\]\);",
    "",
    content
)
content = re.sub(
    r"React\.useEffect\(\(\) => \{\s*localStorage\.setItem\('mockDepartments', JSON\.stringify\(departments\)\);\s*\}, \[departments\]\);",
    "",
    content
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Refactoring OperationalStructureTab.tsx complete.")
