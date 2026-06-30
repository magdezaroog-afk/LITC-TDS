import re

path = r"C:\Users\majdi.alzarrouk\OneDrive - LITC\Desktop\المشاريع\v43_Production\src\components\admin\tabs\UILayoutEngineTab.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Find the start of the ticket_create inspector
start_marker = "{/* ═══ ticket_create Inspector ═══ */}"
if start_marker not in content:
    print("Could not find start marker")

# Replace the block entirely
new_block = """{/* ═══ ticket_create Inspector ═══ */}
                  {selectedComponent.id === 'ticket_create' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>خصائص مكون إنشاء تذكرة:</h5>
                      
                      <div style={{ background: 'rgba(99,102,241,0.04)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#6366f1', margin: '0 0 10px 0' }}>المسارات المسموحة (يمكن للموظف اختيارها):</h6>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>ملاحظة: المرفقات والمستدلات تتم إدارتها من (تبويب مسارات التذاكر). هنا نحدد فقط المسارات التي ستظهر للموظف.</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                          {(selectedComponent.properties.destinationRoutes || []).map((route: string, idx: number) => {
                            const rDef = savedRoutes.find(r => r.id === route);
                            return (
                              <span key={idx} style={{backgroundColor: '#312e81', color: '#a5b4fc', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                {rDef ? rDef.name : route}
                                <span style={{ cursor: 'pointer', color: '#f87171' }} onClick={() => {
                                  const routes = selectedComponent.properties.destinationRoutes.filter((r: string) => r !== route);
                                  handlePropertyChange(selectedComponent.id, 'destinationRoutes', routes);
                                }}>x</span>
                              </span>
                            );
                          })}
                        </div>
<>{isPropertyAllowed("destinationRoutes", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
<select style={styles.input} onChange={e => {
                          const routes = selectedComponent.properties.destinationRoutes || [];
                          if (!routes.includes(e.target.value) && e.target.value !== '') {
                            handlePropertyChange(selectedComponent.id, 'destinationRoutes', [...routes, e.target.value]);
                          }
                          e.target.value = ''; // reset
                        }}>
                          <option value="">إضافة مسار مسموح...</option>
                          {savedRoutes.filter(r => r.isActive).length > 0 
                            ? savedRoutes.filter(r => r.isActive).map((r, i) => <option key={i} value={r.id}>{r.name}</option>)
                            : <option value="support">الدعم الفني (افتراضي)</option>
                          }
                        </select>
<DelegationToggle propKey="destinationRoutes" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['destinationRoutes']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="destinationRoutes" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["destinationRoutes"]} onChange={handleCeilingChange} />
</div>
)}</>
                      </div>
                    </div>
                  )}"""

# Replace the specific block. Use regex to replace everything from the marker to the end of the block.
import re
pattern = re.compile(r"\{\/\* ═══ ticket_create Inspector ═══ \*\/\}.*?(?=\{\/\* ═══ admin_)", re.DOTALL)
new_content = pattern.sub(new_block + "\n\n                  ", content)

with open(path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Updated UILayoutEngineTab.tsx")

path_emp = r"C:\Users\majdi.alzarrouk\OneDrive - LITC\Desktop\المشاريع\v43_Production\src\components\dashboard\EmployeeWorkspace.tsx"
with open(path_emp, "r", encoding="utf-8") as f:
    emp_content = f.read()

# Update handleFileChange
old_file_change = """const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const rules = ticketCreateSettings || {};
    const maxSizeMB = rules.maxAttachmentSizeMB || 5;
    const allowedExts = (rules.allowedExtensions || '*').split(',').map((s: string) => s.trim().toLowerCase());"""

new_file_change = """const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const routeDef = savedRoutes.find(r => r.id === selectedRouteId);
    const rules = routeDef?.formConfig || {};
    const maxSizeMB = rules.maxAttachmentSizeMB || 5;
    const allowedExts = (rules.allowedExtensions || '*').split(',').map((s: string) => s.trim().toLowerCase());"""

if old_file_change in emp_content:
    emp_content = emp_content.replace(old_file_change, new_file_change)
    with open(path_emp, "w", encoding="utf-8") as f:
        f.write(emp_content)
    print("Updated EmployeeWorkspace.tsx")
else:
    print("Could not find handleFileChange block in EmployeeWorkspace.tsx")
