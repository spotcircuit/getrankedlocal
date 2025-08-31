# LeadCaptureForm.tsx Updates Required

## 1. Update the function signature (around line 42-50)

**FROM:**
```typescript
export default function LeadCaptureForm({ 
  isOpen, 
  onClose, 
  onSubmit,
  title = "Get Your Free Competitive Analysis",
  subtitle = "See exactly how to outrank your competitors",
  businessName = "",
  businessWebsite = ""
}: LeadCaptureFormProps) {
```

**TO:**
```typescript
export default function LeadCaptureForm({ 
  isOpen, 
  onClose, 
  onSubmit,
  title = "Get Your Free Competitive Analysis",
  subtitle = "See exactly how to outrank your competitors",
  businessName = "",
  businessWebsite = "",
  searchedPlaceId,
  currentRank,
  monthlyLoss,
  topCompetitors,
  city,
  state,
  niche
}: LeadCaptureFormProps) {
```

## 2. Update the initial state (around line 51-57)

**FROM:**
```typescript
  const [formData, setFormData] = useState<LeadData>({
    businessName: businessName || '',
    name: '',
    email: '',
    phone: '',
    website: businessWebsite || ''
  });
```

**TO:**
```typescript
  const [formData, setFormData] = useState<LeadData>({
    businessName: businessName || '',
    name: '',
    email: '',
    phone: '',
    website: businessWebsite || '',
    searchedPlaceId,
    currentRank,
    monthlyLoss,
    topCompetitors,
    city,
    state,
    niche
  });
```

## 3. Update the useEffect for prefilling (around line 66-74)

**FROM:**
```typescript
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ 
        ...prev, 
        businessName: businessName || prev.businessName || '',
        website: businessWebsite || prev.website || ''
      }));
    }
  }, [businessName, businessWebsite, isOpen]);
```

**TO:**
```typescript
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ 
        ...prev, 
        businessName: businessName || prev.businessName || '',
        website: businessWebsite || prev.website || '',
        searchedPlaceId,
        currentRank,
        monthlyLoss,
        topCompetitors,
        city,
        state,
        niche
      }));
    }
  }, [businessName, businessWebsite, isOpen, searchedPlaceId, currentRank, monthlyLoss, topCompetitors, city, state, niche]);
```

## 4. Update the handleSubmit function (around line 87-94)

**FROM:**
```typescript
    try {
      // Store lead data
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
```

**TO:**
```typescript
    try {
      // Try the enhanced endpoint first with business context
      const enhancedResponse = await fetch('/api/leads/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }).catch(() => null);

      // If enhanced endpoint fails, fallback to original endpoint
      if (!enhancedResponse || !enhancedResponse.ok) {
        await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: formData.businessName,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            website: formData.website
          })
        });
      }
```

These are the key changes needed to properly accept the business context and pass it through to the enhanced API endpoint.