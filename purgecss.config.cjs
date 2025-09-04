/* PurgeCSS Configuration - Remove Unused CSS */

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './styles/**/*.css'
  ],
  
  // CSS files to process
  css: [
    './styles/**/*.css',
    './app/globals.css'
  ],
  
  // Default extractor for JavaScript/TypeScript files
  defaultExtractor: content => {
    // Capture as liberally as possible, including things like `h-(screen-1.5)`
    const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || []
    
    // Capture classes within other delimiters like .block(class="w-1/2") in Pug
    const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || []
    
    return broadMatches.concat(innerMatches)
  },
  
  // Safelist patterns - always keep these classes
  safelist: {
    standard: [
      /^(hover|focus|active|visited|disabled|group-hover|peer|first|last|odd|even|focus-within|focus-visible):/,
      /^(sm|md|lg|xl|2xl):/,
      /^(dark|light):/,
      // Keep animation classes
      /^animate-/,
      // Keep gradient classes
      /^(from|via|to)-/,
      /^bg-gradient-/,
      // Keep commonly dynamically generated classes
      /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)/,
      /^text-(primary|secondary|muted|disabled)/,
      /^text-(purple|blue|green|red|yellow|gray)-\d{3}/,
      /^bg-(purple|blue|green|red|yellow|gray)-\d{3}/,
      /^border-(purple|blue|green|red|yellow|gray)-\d{3}/,
      // Grid and layout
      /^(grid-cols|col-span|row-span)-/,
      /^(gap|gap-x|gap-y)-/,
      // Spacing
      /^(m|p)(t|r|b|l|x|y)?-/,
      // Width and height
      /^(w|h)-(full|screen|min|max|fit)/,
      /^(min|max)-(w|h)-/,
      // Position
      /^(top|right|bottom|left|inset)-/,
      // Flexbox
      /^flex-/,
      /^(items|justify|content)-/,
      // Display
      /^(block|inline|flex|grid|hidden)/,
      // Opacity
      /^opacity-/,
      // Shadow
      /^shadow-/,
      // Border radius
      /^rounded-/,
      // Z-index
      /^z-/,
      // Transitions
      /^transition-/,
      /^duration-/,
      // Transforms
      /^(scale|rotate|translate)-/,
      // Skeleton loading
      /skeleton/,
      // Container queries
      /^cq:/
    ],
    deep: [
      // Keep all children of these selectors
      /^pre$/,
      /^code$/,
      /^kbd$/,
      /^table$/,
      /^thead$/,
      /^tbody$/,
      /^tfoot$/
    ],
    greedy: [
      // Keep classes that contain these strings
      /card/,
      /btn/,
      /badge/,
      /modal/,
      /dropdown/,
      /tooltip/,
      /breadcrumb/,
      /stat/,
      /hero/,
      /container/
    ]
  },
  
  // Variables to keep
  variables: true,
  
  // Keep all keyframes
  keyframes: true,
  
  // Keep font-face rules
  fontFace: true,
  
  // Rejected selectors - never remove these
  rejected: true,
  rejectedCss: false,
  
  // Output settings
  output: process.env.NODE_ENV === 'production' ? './styles/purged/' : false,
  
  // Extractors for specific file types
  extractors: [
    {
      extractor: content => {
        // Extract CSS module classes
        const moduleClasses = content.match(/styles\.\w+/g) || []
        return moduleClasses.map(match => match.replace('styles.', ''))
      },
      extensions: ['tsx', 'jsx']
    }
  ],
  
  // Blocklist - always remove these
  blocklist: [
    'unused-*',
    'test-*',
    'debug-*'
  ],
  
  // Skip processing these files
  skip: [
    'node_modules/**/*',
    '.next/**/*'
  ]
}