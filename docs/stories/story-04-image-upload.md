# Story 4: Image Upload & OCR with Correction

**As a** student
**I want** to upload an image of my math problem and correct any OCR errors
**So that** I don't have to manually type complex equations

## Acceptance Criteria

- Drag-and-drop interface (react-dropzone)
- Client-side validation: PNG/JPG only, 5MB max, 200x200 to 4000x4000 px
- Clear error messages for invalid uploads (instant feedback)
- Calls /api/vision, converts to base64, extracts text via Claude Vision
- Extracted text shows in editable preview
- "Use This Problem" button starts chat with corrected text
- If OCR fails, suggests manual text entry
- Loading state during extraction (2-5s)
- Image preview URL persists after reset (can reuse)

## Priority
MVP Important

## Effort
Large (6-8 hours)

## Dependencies
- Story 1 (API Security & Proxy Setup)
- Story 2 (Chat Interface & State Management)

## Technical Notes

### Component Structure
```
ProblemInput
├─ Text input textarea
└─ ImageUpload
   ├─ react-dropzone (drag-drop UI)
   ├─ Client-side validation
   ├─ Image preview
   └─ Extracted text preview (editable)
```

### Client-Side Validation
```typescript
const validateImage = (file: File): string | null => {
  // File type
  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    return 'Invalid format (use PNG or JPG)';
  }

  // File size
  if (file.size > 5 * 1024 * 1024) {
    return 'Image too large (max 5MB)';
  }

  // Dimensions (check after loading)
  const img = new Image();
  img.onload = () => {
    if (img.width < 200 || img.height < 200) {
      return 'Image too small (min 200x200px)';
    }
    if (img.width > 4000 || img.height > 4000) {
      return 'Image too large (max 4000x4000px)';
    }
  };

  return null; // Valid
};
```

### API Integration
```typescript
// lib/api-client.ts
export const extractProblemFromImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/vision', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error);

  return data.extractedText;
};
```

### Vision API Route
```typescript
// pages/api/vision.ts
- Parse multipart form data
- Validate image (redundant with client, but enforce server-side)
- Convert to base64
- Call Claude Vision API with prompt:
  "Extract the math problem from this image. Return only the problem text."
- Return { extractedText: string }
```

### UI Flow
1. User drags image into dropzone
2. Client validates → Show error or proceed
3. Show loading spinner "Extracting text..."
4. Call /api/vision
5. Display extracted text in editable textarea
6. User reviews/edits text
7. User clicks "Use This Problem" → Starts chat

### Error Handling
- Invalid format: "Invalid format (use PNG or JPG)" (instant, no upload)
- Too large: "Image too large (max 5MB)" (instant, no upload)
- OCR failure: "Couldn't read the image. Try uploading a clearer photo or type your problem manually."
- Network error: Use Story 6 retry logic

### Test Images
Include 10 sample images in `/public/test-images/`:
- problem-01.png: Simple algebra (2x + 5 = 13)
- problem-02.png: Fraction equation
- problem-03.png: Geometry (triangle)
- problem-04.png: Word problem
- problem-05.png: Calculus notation
- problem-06.png: System of equations
- problem-07.png: Handwritten (test OCR difficulty)
- problem-08.png: Complex LaTeX
- problem-09.png: Multi-line problem
- problem-10.png: Poor quality (intentional OCR failure test)

## Definition of Done
- [ ] ImageUpload component with react-dropzone implemented
- [ ] Client-side validation works (tested all error cases)
- [ ] Image preview displays before processing
- [ ] /api/vision route extracts text via Claude Vision
- [ ] Extracted text shows in editable preview
- [ ] "Use This Problem" button submits corrected text
- [ ] Loading state shows during extraction
- [ ] Error messages display for all failure cases
- [ ] Image preview URL persists after conversation reset
- [ ] Tested with all 10 sample images (9 succeed, 1 fails gracefully)
