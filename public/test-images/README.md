# Test Images for Image Upload Feature

## How to Create Test Images

For testing the image upload feature, you can:

### Option 1: Take Screenshots of Math Problems
1. Open a word processor or note-taking app
2. Type a math problem (large font, clear text)
3. Take a screenshot (Cmd+Shift+4 on Mac)
4. Save as PNG or JPG

### Option 2: Use Online Math Problem Images
1. Search for "math problems" on Google Images
2. Download clear, well-lit images
3. Make sure they're under 5MB

### Option 3: Write on Paper and Photograph
1. Write a math problem clearly on white paper
2. Take a photo with good lighting
3. Ensure text is legible

## Recommended Test Problems

Create images with these problems:

### Simple Algebra
- `2x + 5 = 13`
- `3(x - 4) = 15`

### Fractions
- `x/2 + 1/4 = 3/4`
- `(2/3)x = 8`

### Quadratic
- `x² + 5x + 6 = 0`
- `2x² - 8x + 6 = 0`

### Word Problem
- "A train travels at 60 mph for 2 hours. How far does it travel?"

### Geometry
- "Find the area of a triangle with base 10cm and height 6cm"

## Image Requirements

✅ **Valid:**
- Format: PNG or JPG
- Size: Under 5MB
- Dimensions: 200x200px to 4000x4000px
- Clear, legible text

❌ **Invalid (for testing error handling):**
- GIF files
- Files over 5MB
- Images smaller than 200x200px
- Very blurry or dark images

## Testing Checklist

- [ ] Upload valid image → Extracts text correctly
- [ ] Edit extracted text → Can correct OCR errors
- [ ] Click "Use This Problem" → Starts chat session
- [ ] Upload invalid format → Shows error
- [ ] Upload too large → Shows "Image too large (max 5MB)"
- [ ] Upload too small → Shows "Image too small (min 200x200px)"
