#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add state variables if not present
if (!content.includes('showExistingSearchModal')) {
  content = content.replace(
    `  const [showModal, setShowModal] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);`,
    `  const [showModal, setShowModal] = useState(false);
  const [showExistingSearchModal, setShowExistingSearchModal] = useState(false);
  const [existingSearchData, setExistingSearchData] = useState<any>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);`
  );
  console.log('✅ Added state variables');
}

// Update handleSearch function
if (content.includes('setShowModal(true); // Show modal with "checking for existing results" state')) {
  content = content.replace(
    `    // Check for existing searches first
    try {
      setShowModal(true); // Show modal with "checking for existing results" state
      
      const { api } = await import('@/lib/leadfinder-api');
      const existingSearch = await api.checkExistingSearch(
        businessName,
        extractedLocation.city,
        extractedLocation.state,
        extractedLocation.placeId
      );

      if (existingSearch.found && existingSearch.bestResult) {
        // TODO: Show existing results UI with option to search again
        console.log('Found existing search:', existingSearch);
        // For now, just proceed with new search
        setShowModal(true);
      } else {
        // No existing search, proceed normally
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error checking existing search:', error);
      // Proceed with new search on error
      setShowModal(true);
    }`,
    `    // Check for existing searches first
    try {
      const { api } = await import('@/lib/leadfinder-api');
      const existingSearch = await api.checkExistingSearch(
        businessName,
        extractedLocation.city,
        extractedLocation.state,
        extractedLocation.placeId
      );

      if (existingSearch.found && existingSearch.bestResult) {
        // Show existing search modal
        console.log('Found existing search:', existingSearch);
        setExistingSearchData(existingSearch);
        setShowExistingSearchModal(true);
      } else {
        // No existing search, proceed with new search
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error checking existing search:', error);
      // Proceed with new search on error
      setShowModal(true);
    }`
  );
  console.log('✅ Updated handleSearch function');
}

// Add ExistingSearchModal component if not present
if (!content.includes('<ExistingSearchModal')) {
  content = content.replace(
    `        {/* Analysis Modal */}
        <AnalysisModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          businessName={businessName}
          niche={niche}
          jobId="direct"
          analysisData={extractedLocation ? {
            place_id: extractedLocation.placeId,
            city: extractedLocation.city,
            state: extractedLocation.state,
            formatted_address: extractedLocation.formattedAddress,
            geometry: extractedLocation.geometry
          } : undefined}
          onComplete={handleAnalysisComplete}
        />

        <Footer />`,
    `        {/* Analysis Modal */}
        <AnalysisModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          businessName={businessName}
          niche={niche}
          jobId="direct"
          analysisData={extractedLocation ? {
            place_id: extractedLocation.placeId,
            city: extractedLocation.city,
            state: extractedLocation.state,
            formatted_address: extractedLocation.formattedAddress,
            geometry: extractedLocation.geometry
          } : undefined}
          onComplete={handleAnalysisComplete}
        />
        
        {/* Existing Search Modal */}
        <ExistingSearchModal
          isOpen={showExistingSearchModal}
          onClose={() => setShowExistingSearchModal(false)}
          existingSearchData={existingSearchData}
          businessName={businessName}
          niche={niche}
          onRunNewSearch={() => {
            setShowExistingSearchModal(false);
            setShowModal(true);
          }}
          onUseExisting={(data) => {
            setShowExistingSearchModal(false);
            handleAnalysisComplete(data);
          }}
        />

        <Footer />`
  );
  console.log('✅ Added ExistingSearchModal component');
}

fs.writeFileSync(filePath, content);
console.log('✨ Page patched successfully!');