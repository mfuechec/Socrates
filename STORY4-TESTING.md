# Story 4: Image Upload & OCR Testing Guide

## Prerequisites

1. **OpenAI API key** is set in `.env.local` (already done ✅)
2. **Dev server running**: `npm run dev`
3. **Browser open**: http://localhost:3000

## Features Implemented

✅ **Dual Input Modes**
- Tab selector: "✏️ Type Problem" vs "📷 Upload Image"
- Easy switching between text and image input

✅ **Image Upload**
- Drag-and-drop interface (react-dropzone)
- Click to browse files
- Visual feedback during drag

✅ **Client-Side Validation**
- Format: PNG/JPG only
- Size: Max 5MB
- Dimensions: 200x200px to 4000x4000px
- Instant error messages (no upload for invalid files)

✅ **GPT-4 Vision OCR**
- Calls `/api/vision` with base64 image
- Extracts math problem text
- Loading state with spinner

✅ **Editable Preview**
- Shows extracted text in textarea
- Can edit to fix OCR errors
- "Edit" button to enable editing
- "Use This Problem" button to start chat

✅ **Error Handling**
- Clear error messages for each validation failure
- Suggestion to try manual text input if OCR fails

## Testing Steps

### 1. Test Tab Switching

**Steps:**
1. Go to http://localhost:3000
2. See "✏️ Type Problem" tab selected by default
3. Click "📷 Upload Image" tab
4. Verify: Text input disappears, upload area appears
5. Click "✏️ Type Problem" tab
6. Verify: Text input reappears

**Expected:** Smooth switching, no errors

---

### 2. Test Drag & Drop

**Steps:**
1. Click "📷 Upload Image" tab
2. See dashed border box with camera icon
3. Drag an image file over the box
4. Verify: Border turns blue, text says "Drop image here..."
5. Release the image

**Expected:** File uploads, preview appears

---

### 3. Test Client-Side Validation

#### Valid Image
**Steps:**
1. Upload a PNG or JPG file under 5MB
2. Dimensions between 200x200 and 4000x4000

**Expected:**
- Image preview appears
- "Extracting text from image..." spinner shows
- After 2-5 seconds, extracted text appears

#### Invalid Format (GIF)
**Steps:**
1. Try to upload a GIF file

**Expected:** Error: "Invalid format (use PNG or JPG)"

#### Too Large (>5MB)
**Steps:**
1. Try to upload a file over 5MB

**Expected:** Error: "Image too large (max 5MB)"

#### Too Small (<200px)
**Steps:**
1. Create a tiny image (e.g., 100x100px)
2. Try to upload it

**Expected:** Error: "Image too small (min 200x200px)"

#### Too Large Dimensions (>4000px)
**Steps:**
1. Try to upload an image larger than 4000x4000px

**Expected:** Error: "Image too large (max 4000x4000px)"

---

### 4. Test OCR Extraction

#### Create Test Image
1. Open a text editor or note-taking app
2. Type: **"Solve for x: 2x + 5 = 13"** (large font, 24pt+)
3. Take a screenshot (Cmd+Shift+4 on Mac)
4. Save as PNG

#### Upload and Extract
**Steps:**
1. Upload the test image
2. Wait for "Extracting text from image..." spinner
3. Verify extracted text appears in textarea

**Expected:**
- Text extracted: "Solve for x: 2x + 5 = 13" (or close approximation)
- Textarea is editable
- "Use This Problem" button appears

---

### 5. Test Text Correction

**Steps:**
1. Upload an image (any math problem)
2. After extraction, see text in textarea
3. Click "Edit" button (if needed)
4. Modify the text (fix any OCR errors)
5. Click "Use This Problem"

**Expected:**
- Can edit the extracted text
- Edited text is used as the problem
- Transitions to chat screen with corrected problem

---

### 6. Test Full Flow (Image → Chat)

**Steps:**
1. Click "📷 Upload Image"
2. Upload clear math problem image
3. Review extracted text
4. (Optional) Edit if needed
5. Click "Use This Problem"
6. Verify: Chat screen loads
7. Problem statement in header matches extracted text
8. Send message: "Help me solve this"
9. Verify: GPT-4o responds with Socratic question

**Expected:** Complete end-to-end flow works

---

### 7. Test Image Preview & Remove

**Steps:**
1. Upload an image
2. Verify: Image preview appears (max 300px height)
3. Click red "Remove" button
4. Verify: Preview disappears, returns to upload area
5. Can upload a different image

**Expected:** Remove button works, can re-upload

---

### 8. Test Error Recovery

#### Scenario: OCR Fails
**Steps:**
1. Upload a very blurry or dark image
2. If OCR fails, error appears

**Expected:**
- Error: "Failed to extract text from image"
- Suggestion: "Try uploading a clearer image or upload a different one"
- Can click "upload a different one" to reset

---

### 9. Test Different Problem Types

Upload images with these problem types:

**Algebra:**
- `2x + 5 = 13` ✓
- `3(x - 4) = 15` ✓

**Fractions:**
- `x/2 + 1/4 = 3/4` ✓
- `(2/3)x = 8` ✓

**Quadratic:**
- `x² + 5x + 6 = 0` ✓

**Word Problem:**
- "A train travels at 60 mph for 2 hours. How far does it travel?" ✓

**Expected:** GPT-4 Vision accurately extracts all problem types

---

## Edge Cases

### Empty/Corrupt Image
**Test:** Upload a corrupt image file
**Expected:** Error message or extraction fails gracefully

### Special Characters
**Test:** Upload image with mathematical symbols (÷, ×, ±, √)
**Expected:** GPT-4 Vision handles unicode math symbols

### Handwritten Problems
**Test:** Upload photo of handwritten math problem
**Expected:** GPT-4 Vision attempts extraction (may need editing)

### Multiple Problems in One Image
**Test:** Upload image with 2+ problems
**Expected:** Extracts all problems (user can edit to select one)

---

## Performance Checks

✅ **Upload Speed**
- Image preview appears instantly
- Validation happens immediately (no server call)

✅ **OCR Speed**
- "Extracting..." state shows ~2-5 seconds
- Reasonable wait time for Vision API

✅ **No Memory Leaks**
- Upload multiple images in succession
- Verify: No browser slowdown
- Check: `URL.createObjectURL` cleaned up properly

---

## Known Limitations (MVP)

These are intentional:
- ⚠️ **No camera capture** (only file upload) - Would require `getUserMedia` API
- ⚠️ **Single image only** - Not batch processing
- ⚠️ **No image rotation** - Must be correctly oriented
- ⚠️ **No cropping** - Use full image

---

## Definition of Done

Story 4 is complete when:

- [x] ImageUpload component created
- [x] Client-side validation works
- [x] Tab switching (text vs image) works
- [x] Drag-and-drop interface works
- [x] OCR via GPT-4 Vision works
- [x] Extracted text is editable
- [x] "Use This Problem" starts chat
- [x] Error messages display correctly
- [x] Build succeeds with no errors
- [ ] **Manual testing** passes all test cases above
- [ ] End-to-end flow (upload → extract → chat) works

---

## Troubleshooting

**Issue:** "No image file provided" error
**Solution:** Check that image is properly converted to base64 in `api-client.ts`

**Issue:** OCR returns wrong text
**Solution:** Use clearer image, larger font, better contrast

**Issue:** "OpenAI API error"
**Solution:** Check API key, verify GPT-4o model has vision capabilities

**Issue:** Upload button not clickable
**Solution:** Check react-dropzone is installed: `npm list react-dropzone`

---

## Next Steps

After Story 4 is tested and working:
- **Story 5:** Add LaTeX math rendering (KaTeX)
- **Story 6:** Add retry logic and better error handling

---

**Ready to test!** Upload your first math problem image! 📷
