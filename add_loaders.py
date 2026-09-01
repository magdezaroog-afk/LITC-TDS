import re

def add_loading(file_path, fetch_func_name):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    if "const [isLoading, setIsLoading] = useState(true);" not in content:
        # 1. Add state
        content = content.replace(
            "const [searchQuery, setSearchQuery]",
            "const [isLoading, setIsLoading] = useState(true);\n  const [searchQuery, setSearchQuery]"
        )
        content = content.replace(
            "const [poolSearchQuery, setPoolSearchQuery]",
            "const [isLoading, setIsLoading] = useState(true);\n  const [poolSearchQuery, setPoolSearchQuery]"
        )

        # 2. Add setIsLoading(false)
        if fetch_func_name == "fetchData":
            content = content.replace("fetchData();", "fetchData().finally(() => setIsLoading(false));")
        else:
            content = content.replace("fetchUsers();", "fetchUsers().finally(() => setIsLoading(false));")
            
        # 3. Add UI
        ui = """
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(59,130,246,0.1)', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ marginTop: '15px', color: '#64748b', fontSize: '14px' }}>OOO1US O O-U.USO_ O O U,OU+OO ...</div>
      </div>
    );
  }
"""
        content = content.replace("return (", ui + "\n  return (", 1)
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Added loading to {file_path}")

add_loading("src/pages/admin/tabs/OperationalStructureTab.tsx", "fetchData")
add_loading("src/pages/admin/tabs/GlobalUserMatrixTab.tsx", "fetchUsers")
