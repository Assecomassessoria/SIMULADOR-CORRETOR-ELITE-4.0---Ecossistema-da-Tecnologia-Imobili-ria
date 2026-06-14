

## Issues to Fix

### 1. CRM Cadastro not opening (closing screen instead)
The `CrmCadastro` component is used in `CrmPage.tsx` (the standalone `/crm` route), not in the main `CrmTab.tsx`. The "Novo Lead" button in `CrmTab.tsx` opens the `CrmLeadForm` dialog correctly. The issue is likely that clicking "Nova Construtora" or "Novo Lead" triggers a dialog but clicking the button may be propagating an event that switches tabs or navigates away. 

Looking at the code, the `Dialog onOpenChange` in `CrmConstrutoras.tsx` line 163 uses `() => { setFormOpen(false); resetForm(); }` — this always closes the dialog regardless of the boolean passed. When the dialog opens and the overlay renders, `onOpenChange(false)` is called immediately, closing it. **Fix**: Change to `(open) => { if (!open) { setFormOpen(false); resetForm(); } }`.

### 2. Add "Link do Empreendimento" field to CrmConstrutoras
Add a new text input field below "Responsável" for a link/URL to the construction project.

### 3. Add Construtora link selector to CrmLeadForm
The `construtora_id` selector already exists. The user wants the construtora order number displayed as a "link" reference. This is already implemented with `({c.ordem}) {c.nome_empreendimento}`. May need to move it below "Responsável" instead of below "Notas Internas", or the user wants both: the dropdown AND a simple text showing the linked construtora order.

### 4. Add legal notice to ProSoluto PDF print
Add the specified text ("Aqui está o seu plano de parcelamento...") to the PDF print output in `ProSoluto.tsx`, between the content and the footer.

## Plan

### A. Fix CrmConstrutoras dialog not staying open
- **File**: `src/components/crm/CrmConstrutoras.tsx` line 163
- Change `onOpenChange={() => { setFormOpen(false); resetForm(); }}` to `onOpenChange={(open) => { if (!open) { setFormOpen(false); resetForm(); } }}`

### B. Fix CrmLeadForm dialog similarly
- **File**: `src/components/crm/CrmLeadForm.tsx` — check if same issue exists with `onOpenChange={onClose}`
- The `onClose` prop is called with a boolean by Radix, but it just closes. This should be fine since `onClose` toggles state in parent. Actually, looking at CrmTab line 39-42, `handleCloseForm` sets `formOpen=false`. When Radix calls `onOpenChange(true)` on open, it would call `handleCloseForm()` closing it immediately. **Fix**: wrap `onClose` to only fire when `open=false`.

### C. Add "Link Empreendimento" field to CrmConstrutoras
- Add `link_empreendimento` to the form state and UI (below Responsável)
- Add column to `crm_construtoras` table via migration
- Update `crm-api` edge function to handle the new field

### D. Move Construtora selector in CrmLeadForm
- Already exists below "Notas Internas" — keep as is since user confirmed that position

### E. Add legal notice to ProSoluto PDF
- **File**: `src/components/ProSoluto.tsx` lines 177-181
- Add a styled paragraph with the legal text before the footer div

## Changes Summary

| File | Change |
|------|--------|
| `src/components/crm/CrmConstrutoras.tsx` | Fix dialog onOpenChange, add link_empreendimento field |
| `src/components/crm/CrmLeadForm.tsx` | Fix dialog closing issue |
| `src/components/CrmTab.tsx` | Fix dialog closing for lead form |
| `src/components/ProSoluto.tsx` | Add legal notice to PDF print |
| `supabase migration` | Add `link_empreendimento` column to `crm_construtoras` |
| `supabase/functions/crm-api/index.ts` | Include new field in construtoras operations |

