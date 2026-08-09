import re
import sys

def main():
    file_path = r"c:\Users\majdi.alzarrouk\OneDrive - LITC\Desktop\المشاريع\v43_Production\src\components\organisms\InteractiveTicketCreatorForm.tsx"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the start of the details step
    start_idx = content.find("step === 'details'")
    if start_idx == -1:
        print("Could not find step === 'details'")
        return

    # Find the end of the details step (just before Footer or Footer itself)
    end_idx = content.find("{/* STEP 3: SUCCESS */}", start_idx)
    if end_idx == -1:
        end_idx = len(content)

    before = content[:start_idx]
    details_step = content[start_idx:end_idx]
    after = content[end_idx:]

    # 1. Revert the dark background container
    details_step = details_step.replace(
        """background: 'linear-gradient(160deg, #0f1729 0%, #111827 40%, #0c1322 100%)',""",
        """background: 'transparent',"""
    )
    details_step = details_step.replace(
        "border: `1px solid ${route.color}25`,",
        ""
    )
    details_step = details_step.replace(
        "boxShadow: `0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.04) inset`,",
        ""
    )

    # 2. Header
    details_step = details_step.replace(
        "background: `linear-gradient(135deg, ${route.color}22, rgba(255,255,255,0.04))`",
        "background: `linear-gradient(135deg, ${route.color}15, rgba(0,0,0,0.02))`"
    )
    details_step = details_step.replace(
        "borderBottom: `1px solid ${route.color}25`",
        "borderBottom: `1px solid rgba(0,0,0,0.06)`"
    )
    # back button
    details_step = details_step.replace(
        "background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)'",
        "background: '#fff', border: '1px solid #e2e8f0'"
    )
    details_step = details_step.replace(
        "color: 'rgba(255,255,255,0.7)'",
        "color: '#64748b'"
    )
    # text
    details_step = details_step.replace(
        "color: '#fff', fontWeight: 700",
        "color: '#0f172a', fontWeight: 800"
    )
    details_step = details_step.replace(
        "color: 'rgba(255,255,255,0.5)'",
        "color: '#64748b'"
    )
    details_step = details_step.replace(
        "color: 'rgba(255,255,255,0.55)'",
        "color: '#64748b'"
    )
    
    # Progress line
    details_step = details_step.replace(
        "background: 'linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, transparent 100%)'",
        "background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 100%)'"
    )

    # Step indicator
    details_step = details_step.replace(
        "background: isCompleted ? route.color : isCurrent ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'",
        "background: isCompleted ? route.color : isCurrent ? '#fff' : '#f8fafc'"
    )
    details_step = details_step.replace(
        "border: `2px solid ${isCompleted ? route.color : isCurrent ? route.color : 'rgba(255,255,255,0.15)'}`",
        "border: `2px solid ${isCompleted ? route.color : isCurrent ? route.color : '#e2e8f0'}`"
    )
    details_step = details_step.replace(
        "color: isCompleted ? '#ffffff' : isCurrent ? route.color : 'rgba(255,255,255,0.4)'",
        "color: isCompleted ? '#fff' : isCurrent ? route.color : '#94a3b8'"
    )
    
    # Step content box
    details_step = details_step.replace(
        "background: isCompleted ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.08)'",
        "background: isCompleted ? 'rgba(255,255,255,0.6)' : '#fff'"
    )
    details_step = details_step.replace(
        "border: `1px solid ${isCurrent ? route.color + '30' : 'rgba(255,255,255,0.1)'}`",
        "border: `1px solid ${isCurrent ? route.color + '40' : 'rgba(0,0,0,0.06)'}`"
    )

    # Text inside forms
    details_step = details_step.replace(
        "color: 'rgba(255,255,255,0.6)'",
        "color: '#475569'"
    )
    details_step = details_step.replace(
        "color: 'rgba(255,255,255,0.75)'",
        "color: '#334155'"
    )
    details_step = details_step.replace(
        "color: 'rgba(255,255,255,0.8)'",
        "color: '#1e293b'"
    )
    # text inputs
    details_step = details_step.replace(
        "border: '1px solid rgba(255,255,255,0.12)'",
        "border: '1.5px solid rgba(0,0,0,0.08)'"
    )
    details_step = details_step.replace(
        "border: `1px solid ${isSelected ? route.color : 'rgba(255,255,255,0.12)'}`",
        "border: `1.5px solid ${isSelected ? route.color : 'rgba(0,0,0,0.08)'}`"
    )
    details_step = details_step.replace(
        "borderColor = 'rgba(255,255,255,0.12)'",
        "borderColor = 'rgba(0,0,0,0.08)'"
    )
    details_step = details_step.replace(
        "background: 'rgba(255,255,255,0.06)'",
        "background: '#f8fafc'"
    )
    details_step = details_step.replace(
        "background: isSelected ? `${route.color}` : 'rgba(255,255,255,0.08)'",
        "background: isSelected ? `${route.color}` : '#fff'"
    )
    
    # Textarea etc. text color
    details_step = details_step.replace(
        "color: '#fff'",
        "color: '#0f172a'"
    )
    
    # Final step static
    details_step = details_step.replace(
        "background: 'rgba(255,255,255,0.12)'",
        "background: '#fff'"
    )
    details_step = details_step.replace(
        "background: 'rgba(255,255,255,0.08)'",
        "background: 'rgba(255,255,255,0.6)'"
    )
    details_step = details_step.replace(
        "border: `1px solid ${route.color}30`",
        "border: `1px solid ${route.color}20`"
    )

    # Attachments
    details_step = details_step.replace(
        "border: '2px dashed rgba(255,255,255,0.12)'",
        "border: '2px dashed rgba(0,0,0,0.1)'"
    )
    details_step = details_step.replace(
        "background: 'rgba(255,255,255,0.04)'",
        "background: '#f8fafc'"
    )
    details_step = details_step.replace(
        "color: 'rgba(255,255,255,0.35)'",
        "color: '#94a3b8'"
    )

    # Footer
    details_step = details_step.replace(
        "borderTop: '1px solid rgba(255,255,255,0.06)'",
        "borderTop: '1px solid rgba(0,0,0,0.06)'"
    )
    details_step = details_step.replace(
        "background: 'rgba(255,255,255,0.04)'",
        "background: 'rgba(255,255,255,0.6)'"
    )
    details_step = details_step.replace(
        "background: (() => {\n                    const isDisabled",
        "background: (() => {\n                    const isDisabled"
    )
    details_step = details_step.replace(
        "isDisabled ? 'rgba(255,255,255,0.08)' :",
        "isDisabled ? '#f1f5f9' :"
    )
    details_step = details_step.replace(
        "isDisabled ? 'rgba(255,255,255,0.3)' : '#fff'",
        "isDisabled ? '#94a3b8' : '#fff'"
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(before + details_step + after)

    print("Success")

if __name__ == '__main__':
    main()
