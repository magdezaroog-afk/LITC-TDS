import re

file_path = r'C:\Users\majdi.alzarrouk\OneDrive - LITC\Desktop\المشاريع\v43_Production\src\components\admin\tabs\UILayoutEngineTab.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove usages of DelegationToggle and HardCeilingToggle
content = re.sub(r'^\s*<DelegationToggle.*?\n', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*<HardCeilingToggle.*?\n', '', content, flags=re.MULTILINE)

# We also need to remove the component definitions
delegation_def_pattern = r'const DelegationToggle =.*?^\};\n'
content = re.sub(delegation_def_pattern, '', content, flags=re.MULTILINE | re.DOTALL)

hard_ceiling_def_pattern = r'const HardCeilingToggle =.*?^\};\n'
content = re.sub(hard_ceiling_def_pattern, '', content, flags=re.MULTILINE | re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Successfully removed DelegationToggle and HardCeilingToggle.')
