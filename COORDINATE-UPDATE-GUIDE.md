# 📍 EMERGENCY SERVICES COORDINATE UPDATE GUIDE

**Current Status:** Coordinates are approximate placeholders  
**Need:** Exact GPS coordinates for accurate map markers

---

## 🎯 HOW TO GET EXACT COORDINATES

### Method 1: Google Maps (Computer)
1. Go to https://www.google.com/maps
2. Search for the location (e.g., "Bago City Police Station")
3. **Right-click** on the exact building
4. Click the **coordinates** that appear (looks like: 10.5380, 122.8424)
5. Coordinates are copied to clipboard!
6. Paste into the table below

### Method 2: Google Maps (Phone)
1. Open Google Maps app
2. Navigate to the location
3. **Long-press** on the exact spot
4. Coordinates appear at the top
5. Tap to copy

### Method 3: At The Location
1. Go to the actual building
2. Open Google Maps
3. Tap the blue dot (your location)
4. Coordinates shown at the bottom
5. Tap to copy

---

## 📋 COORDINATES TO COLLECT

Fill in the exact coordinates for each location:

### 🚒 FIRE STATIONS

#### 1. Bago Fire Station (Main)
- **Current (placeholder):** 10.5380, 122.8424
- **Exact coordinates:** _________________ , _________________
- **How to find:** Search "Bago Fire Station" or "BFP Bago City"
- **Expected area:** Poblacion, near City Hall

#### 2. Bago Fire Sub-Station (Ma-ao)
- **Current (placeholder):** 10.5500, 122.8600
- **Exact coordinates:** _________________ , _________________
- **How to find:** Search "Fire Station Ma-ao Bago" or ask locals
- **Expected area:** Ma-ao barangay

---

### 👮 POLICE STATION

#### 3. Bago City Police Station
- **Current (placeholder):** 10.5370, 122.8420
- **Exact coordinates:** _________________ , _________________
- **How to find:** Search "Bago City Police Station" or "PNP Bago"
- **Expected area:** Poblacion, near City Hall

---

### 🏥 HOSPITALS & HEALTH

#### 4. Bago City Hospital
- **Current (placeholder):** 10.5360, 122.8430
- **Exact coordinates:** _________________ , _________________
- **How to find:** Search "Bago City Hospital"
- **Expected area:** Poblacion
- **Note:** This one is VERY inaccurate (shows in San Gabriel in screenshot)

---

### 🚑 RESCUE UNITS

#### 5. Ma-ao Volunteers Rescue Unit
- **Current (placeholder):** 10.5500, 122.8590
- **Exact coordinates:** _________________ , _________________
- **How to find:** Ask Ma-ao residents or barangay office
- **Expected area:** Ma-ao barangay

---

### 🏛️ GOVERNMENT OFFICES

#### 6. Bago City Hall
- **Current (placeholder):** 10.5380, 122.8424
- **Exact coordinates:** _________________ , _________________
- **How to find:** Search "Bago City Hall"
- **Expected area:** Poblacion (this should be the most accurate as reference point)

#### 7. CDRRMC Office
- **Location:** Inside Bago City Hall
- **Coordinates:** Same as City Hall
- **Note:** Use City Hall coordinates

#### 8. City Health Office
- **Location:** Inside Bago City Hall
- **Coordinates:** Same as City Hall
- **Note:** Use City Hall coordinates

#### 9. Bago City College
- **Current (placeholder):** 10.5400, 122.8450
- **Exact coordinates:** _________________ , _________________
- **How to find:** Search "Bago City College"
- **Expected area:** Bago City proper

---

## 🔧 HOW TO UPDATE THE MAP

Once you have the coordinates, there are 2 options:

### Option A: Send Me the Coordinates
Just reply with the coordinates in this format:
```
Fire Station: 10.5385, 122.8428
Police: 10.5375, 122.8425
Hospital: 10.5392, 122.8435
etc.
```

I'll update the file and push to GitHub → auto-deploys!

---

### Option B: Update Yourself (Quick!)

1. Open this file:
```
lib/emergency-locations.ts
```

2. Find each location and update the coordinates:

```typescript
{
  id: 'city-hospital',
  name: 'Bago City Hospital',
  category: 'hospital',
  coordinates: [10.5360, 122.8430], // ← CHANGE THESE!
  // Change to: [YOUR_LAT, YOUR_LNG]
  ...
}
```

3. Save, commit, push:
```bash
git add lib/emergency-locations.ts
git commit -m "fix: Update emergency services with exact GPS coordinates"
git push origin main
```

4. ✅ Auto-deploys in 1 minute!

---

## 📱 EXAMPLE: How to Find Bago City Hall

**Step-by-step:**

1. Open Google Maps
2. Search: "Bago City Hall, Negros Occidental"
3. Map shows the building
4. **Right-click** on the building
5. Click the coordinates (e.g., "10.5380, 122.8424")
6. Paste here: **10.5380, 122.8424**

**That's it!** Repeat for all 9 locations.

---

## 🎯 PRIORITY ORDER

If you can only get a few, prioritize these:

1. **🏥 Bago City Hospital** - Most inaccurate (urgent!)
2. **🏛️ Bago City Hall** - Reference point for others
3. **👮 Police Station** - Critical emergency service
4. **🚒 Main Fire Station** - Critical emergency service
5. **🚒 Fire Sub-Station Ma-ao** - Serves Ma-ao area
6. **🚑 Ma-ao Rescue** - Community service
7. **🎓 Bago City College** - May be evacuation center

---

## ✅ VERIFICATION

After updating, verify on the map:
1. Go to: https://bago-reporting.vercel.app/emergency-map
2. Check if markers are on the correct buildings
3. Zoom in to see if they're accurate

---

## 📞 QUICK REFERENCE - What We're Looking For

| Location | Search Term | Expected Barangay |
|----------|-------------|-------------------|
| Fire Station | "Bago Fire Station" | Poblacion |
| Fire Ma-ao | "Fire Station Ma-ao" | Ma-ao |
| Police | "Bago City Police" | Poblacion |
| Hospital | "Bago City Hospital" | Poblacion |
| Ma-ao Rescue | (Ask locals) | Ma-ao |
| City Hall | "Bago City Hall" | Poblacion |
| BCC | "Bago City College" | Bago City |

---

## 🎉 ONCE UPDATED

Your emergency map will show:
- ✅ Accurate marker positions
- ✅ Citizens can find exact locations
- ✅ Reliable directions
- ✅ Professional emergency services map

---

## 💡 TIP: Use Street View

After getting coordinates:
1. Click "Street View" in Google Maps
2. Verify it's the correct building
3. Look for signs, landmarks
4. Confirm it's the right place!

---

**Need help getting coordinates? Just share them with me and I'll update the file!**

**Format:**
```
Bago City Hall: 10.5380, 122.8424
Police Station: 10.5375, 122.8425
Fire Station: 10.5385, 122.8428
Hospital: 10.5392, 122.8435
```

I'll handle the rest! 🚀
