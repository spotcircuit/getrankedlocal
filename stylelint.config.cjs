/* Stylelint Configuration - CSS Linting Rules */

module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-css-modules'
  ],
  plugins: [
    'stylelint-order',
    'stylelint-declaration-block-no-ignored-properties',
    'stylelint-high-performance-animation'
  ],
  rules: {
    // Mobile-first enforcement
    'plugin/no-low-performance-animation-properties': [true, {
      ignoreProperties: ['color', 'background-color', 'border-color']
    }],
    
    // Property order (mobile-first approach)
    'order/properties-order': [
      // Positioning
      'position',
      'top',
      'right',
      'bottom',
      'left',
      'z-index',
      
      // Display & Box Model
      'display',
      'flex',
      'flex-direction',
      'flex-wrap',
      'flex-grow',
      'flex-shrink',
      'flex-basis',
      'grid',
      'grid-template',
      'grid-template-columns',
      'grid-template-rows',
      'grid-gap',
      'gap',
      'align-items',
      'align-content',
      'align-self',
      'justify-content',
      'justify-items',
      'justify-self',
      'order',
      
      // Box Model
      'box-sizing',
      'width',
      'min-width',
      'max-width',
      'height',
      'min-height',
      'max-height',
      'margin',
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left',
      'padding',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',
      
      // Typography
      'font',
      'font-family',
      'font-size',
      'font-weight',
      'font-style',
      'line-height',
      'letter-spacing',
      'text-align',
      'text-decoration',
      'text-transform',
      'text-overflow',
      'white-space',
      'word-break',
      'word-spacing',
      'color',
      
      // Visual
      'background',
      'background-color',
      'background-image',
      'background-repeat',
      'background-position',
      'background-size',
      'background-attachment',
      'background-clip',
      'border',
      'border-width',
      'border-style',
      'border-color',
      'border-top',
      'border-right',
      'border-bottom',
      'border-left',
      'border-radius',
      'outline',
      'outline-width',
      'outline-style',
      'outline-color',
      'outline-offset',
      'box-shadow',
      'opacity',
      'visibility',
      'overflow',
      'overflow-x',
      'overflow-y',
      
      // Animation & Transitions
      'transition',
      'transition-property',
      'transition-duration',
      'transition-timing-function',
      'transition-delay',
      'animation',
      'animation-name',
      'animation-duration',
      'animation-timing-function',
      'animation-delay',
      'animation-iteration-count',
      'animation-direction',
      'animation-fill-mode',
      'animation-play-state',
      'transform',
      'transform-origin',
      'transform-style',
      
      // Other
      'cursor',
      'user-select',
      'pointer-events',
      'resize',
      'appearance',
      'content',
      'quotes',
      'counter-reset',
      'counter-increment',
      'will-change',
      'perspective',
      'perspective-origin',
      'backface-visibility'
    ],
    
    // General rules
    'color-hex-case': 'lower',
    'color-hex-length': 'short',
    'color-no-invalid-hex': true,
    'font-family-no-duplicate-names': true,
    'font-family-no-missing-generic-family-keyword': true,
    'function-calc-no-unspaced-operator': true,
    'function-linear-gradient-no-nonstandard-direction': true,
    'string-no-newline': true,
    'unit-no-unknown': true,
    'property-no-unknown': [true, {
      ignoreProperties: ['container-type', 'container-name']
    }],
    'keyframe-declaration-no-important': true,
    'declaration-block-no-duplicate-properties': true,
    'declaration-block-no-shorthand-property-overrides': true,
    'block-no-empty': true,
    'selector-pseudo-class-no-unknown': [true, {
      ignorePseudoClasses: ['global', 'local', 'export']
    }],
    'selector-pseudo-element-no-unknown': true,
    'selector-type-no-unknown': true,
    'media-feature-name-no-unknown': true,
    'at-rule-no-unknown': [true, {
      ignoreAtRules: ['layer', 'container', 'starting-style']
    }],
    'comment-no-empty': true,
    'no-duplicate-at-import-rules': true,
    'no-duplicate-selectors': true,
    'no-empty-source': true,
    'no-invalid-double-slash-comments': true,
    
    // Stylistic rules
    'alpha-value-notation': 'number',
    'hue-degree-notation': 'angle',
    'color-function-notation': 'modern',
    'length-zero-no-unit': true,
    'font-weight-notation': 'numeric',
    'number-no-trailing-zeros': true,
    'string-quotes': 'single',
    'unit-case': 'lower',
    'value-keyword-case': 'lower',
    'function-name-case': 'lower',
    'selector-type-case': 'lower',
    'selector-pseudo-element-case': 'lower',
    'selector-pseudo-class-case': 'lower',
    'media-feature-name-case': 'lower',
    'at-rule-name-case': 'lower',
    'declaration-block-trailing-semicolon': 'always',
    'declaration-colon-space-after': 'always',
    'declaration-colon-space-before': 'never',
    'declaration-block-semicolon-space-before': 'never',
    'declaration-block-single-line-max-declarations': 1,
    'block-closing-brace-newline-after': 'always',
    'block-closing-brace-newline-before': 'always',
    'block-opening-brace-newline-after': 'always',
    'block-opening-brace-space-before': 'always',
    'selector-attribute-brackets-space-inside': 'never',
    'selector-attribute-operator-space-after': 'never',
    'selector-attribute-operator-space-before': 'never',
    'selector-combinator-space-after': 'always',
    'selector-combinator-space-before': 'always',
    'selector-list-comma-newline-after': 'always',
    'selector-list-comma-space-before': 'never',
    'rule-empty-line-before': ['always', {
      except: ['first-nested'],
      ignore: ['after-comment']
    }],
    'media-feature-colon-space-after': 'always',
    'media-feature-colon-space-before': 'never',
    'media-feature-parentheses-space-inside': 'never',
    'media-feature-range-operator-space-after': 'always',
    'media-feature-range-operator-space-before': 'always',
    'at-rule-name-space-after': 'always',
    'at-rule-semicolon-newline-after': 'always',
    'indentation': 2,
    'max-empty-lines': 2,
    'no-eol-whitespace': true,
    'no-missing-end-of-source-newline': true,
    
    // Performance rules
    'selector-max-compound-selectors': 3,
    'selector-max-specificity': '0,4,2', // id,class,type
    'selector-max-type': 3,
    'selector-max-universal': 1,
    'selector-no-qualifying-type': [true, {
      ignore: ['attribute', 'class']
    }],
    
    // Accessibility
    'plugin/declaration-block-no-ignored-properties': true,
    'media-feature-name-no-vendor-prefix': true,
    'at-rule-no-vendor-prefix': true,
    'selector-no-vendor-prefix': true,
    'property-no-vendor-prefix': true,
    'value-no-vendor-prefix': true,
    
    // CSS Custom Properties
    'custom-property-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
    
    // Disallow important
    'declaration-no-important': true,
    
    // Mobile-first media queries
    'media-feature-name-disallowed-list': ['max-width'],
    
    // Enforce modern CSS
    'declaration-property-value-disallowed-list': {
      'display': ['table', 'table-row', 'table-cell'] // Prefer flexbox/grid
    }
  },
  ignoreFiles: [
    'node_modules/**/*.css',
    '.next/**/*.css',
    'build/**/*.css',
    'dist/**/*.css',
    '**/*.min.css'
  ]
}