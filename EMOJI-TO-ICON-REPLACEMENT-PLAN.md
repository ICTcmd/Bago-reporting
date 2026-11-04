# Emoji to Professional Icon Replacement Plan

## Summary
Replacing all emoji icons across Bago Safe app with professional Lucide React icons for a more government-appropriate and accessible design.

## Files to Update

### ✅ COMPLETED
1. **app/report/page.tsx** - Incident category icons (Flooding, Fire, etc.)
   - Replaced emojis with: Waves, Flame, Construction, TreeDeciduous, Home, Stethoscope, ShieldAlert, ClipboardList
   
2. **app/track/page.tsx** - Status badge icons
   - Replaced emojis with: FileText, Eye, CheckCircle, Settings, Lock, X, Copy

3. **app/report/page.tsx** - Location markers and tips
   - Replaced 📍 with MapPin component
   - Replaced 💡 with info circle SVG

### 🔄 IN PROGRESS

4. **lib/emergency-locations.ts** - Emergency service location icons
   - 🚒 Fire Station → `Flame` or `Truck` icon
   - 👮 Police → `Shield` icon
   - 🏥 Hospital → `Hospital` or `HeartPulse` icon
   - 🚑 Rescue → `Ambulance` icon
   - 🚨 CDRRMC → `Siren` or `AlertTriangle` icon
   - 🤝 CSWDO → `HandHeart` or `Users` icon
   - 🐾 Veterinary → `PawPrint` icon
   - 🌳 Environment → `TreeDeciduous` or `Leaf` icon
   - 🗺️ Tourism → `Map` icon
   - 🏫 School → `School` or `GraduationCap` icon

5. **lib/emergency-contacts.ts** - Contact list icons
   - Similar to emergency-locations.ts

6. **components/MapFilters.tsx** - Filter button icons
   - 🚨 Critical → `AlertTriangle` icon
   - 📋 New Submissions → `FileText` icon

7. **components/IncidentMap.tsx** - Map popup icons
   - 📍 Location → `MapPin` icon

8. **components/EmergencyServicesMap.tsx** - Service map icons
   - ⏰/🕐 Hours → `Clock` icon
   - 📞 Call → `Phone` icon
   - 📍 Marker info → `MapPin` icon

9. **app/emergency-map/page.tsx** - Emergency page icons
   - 📞 Phone → `Phone` icon

10. **app/dashboard/page.tsx** - Dashboard icons
    - 📍 Location → `MapPin` icon

## Icon Mapping Reference

### Emergency Services
- Fire: `Flame` or `FireExtinguisher`
- Police: `Shield` or `ShieldCheck`
- Hospital: `Hospital` or `Cross`
- Ambulance: `Ambulance` or `HeartPulse`
- DRRM: `Siren` or `AlertTriangle`

### Government Offices
- General Office: `Building` or `Building2`
- Social Welfare: `HandHeart` or `Users`
- Environment: `TreeDeciduous` or `Leaf`
- Tourism: `Map` or `MapPin`
- School: `School` or `GraduationCap`

### Status & Actions
- Submitted: `FileText`
- Under Review: `Eye`
- Verified: `CheckCircle`
- In Progress: `Settings` or `RefreshCw`
- Resolved: `CheckCircle` with green
- Closed: `Lock`
- Invalid: `X` or `XCircle`
- Duplicate: `Copy`

### UI Elements
- Location: `MapPin`
- Phone: `Phone`
- Time/Hours: `Clock`
- Info/Tip: `Info` or `Lightbulb`
- Filter: `Filter` or `SlidersHorizontal`

## Implementation Notes

1. **Import Icons**: Add all required Lucide icons to imports
2. **Dynamic Components**: Use component variables for dynamic rendering
3. **Accessibility**: Ensure aria-labels are present
4. **Color Coding**: Maintain color associations (red for fire, blue for police, etc.)
5. **Consistency**: Use same icon across all locations for same concept

## Benefits
- Professional government-appropriate design
- Better accessibility (screen reader friendly)
- Consistent sizing and styling
- No emoji rendering issues across devices/browsers
- Better print compatibility
