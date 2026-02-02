/**
 * Icon Registry for ui-icon component
 *
 * Add new icons here following the pattern:
 * iconName: `<svg>...</svg>`
 *
 * All icons should:
 * - Use currentColor for stroke/fill to support color prop
 * - Have a viewBox attribute
 * - Not have hardcoded width/height (will be set dynamically)
 */
export const ICON_REGISTRY: Record<string, string> = {
  // Close/Remove
  'x': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Navigation
  'chevron-right': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'chevron-left': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'chevron-down': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'chevron-up': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M4 10L8 6L12 10" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'arrow-right': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M3.333 8H12.667M12.667 8L8 3.333M12.667 8L8 12.667" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'arrow-left': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M12.667 8H3.333M3.333 8L8 12.667M3.333 8L8 3.333" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Actions
  'close': `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'plus': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M8 3.333V12.667M3.333 8H12.667" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'minus': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M3.333 8H12.667" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'check': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M13.333 4L6 11.333L2.667 8" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'edit': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M7.333 2.667H2.667A1.333 1.333 0 001.333 4v9.333a1.333 1.333 0 001.334 1.334H12a1.333 1.333 0 001.333-1.334V8M12.333 1.667a1.414 1.414 0 112 2L8 10l-2.667.667L6 8l6.333-6.333z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'trash': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334zM6.667 7.333v4M9.333 7.333v4" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'archive': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14 5.333V14a1.333 1.333 0 01-1.333 1.333H3.333A1.333 1.333 0 012 14V5.333M6 8h4M.667 2.667h14.666v2.666H.667V2.667z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'copy': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M13.333 6H7.333A1.333 1.333 0 006 7.333v6a1.333 1.333 0 001.333 1.334h6a1.333 1.333 0 001.334-1.334v-6A1.333 1.333 0 0013.333 6z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3.333 10h-.666a1.333 1.333 0 01-1.334-1.333v-6a1.333 1.333 0 011.334-1.334h6A1.333 1.333 0 0110 2.667v.666" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'save': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M12.667 14H3.333A1.333 1.333 0 012 12.667V3.333A1.333 1.333 0 013.333 2h7.334L14 5.333v7.334A1.333 1.333 0 0112.667 14z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M11.333 14V8.667H4.667V14M4.667 2v3.333h5.333" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'refresh': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14 8a6 6 0 01-10.2 4.28M2 8a6 6 0 0110.2-4.28M14 2.667V6h-3.333M2 13.333V10h3.333" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // UI Elements
  'search': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14 14l-2.867-2.867m1.534-3.8A5.333 5.333 0 112 7.333a5.333 5.333 0 0110.667 0z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'filter': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M2.5 4h11M4.5 8h7M6.5 12h3" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'menu': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'more-vertical': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="1" fill="currentColor"/>
    <circle cx="8" cy="4" r="1" fill="currentColor"/>
    <circle cx="8" cy="12" r="1" fill="currentColor"/>
  </svg>`,

  'more-horizontal': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="1" fill="currentColor"/>
    <circle cx="4" cy="8" r="1" fill="currentColor"/>
    <circle cx="12" cy="8" r="1" fill="currentColor"/>
  </svg>`,

  'grid': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M6 2H2.667A.667.667 0 002 2.667V6c0 .368.298.667.667.667H6A.667.667 0 006.667 6V2.667A.667.667 0 006 2zM13.333 2H10a.667.667 0 00-.667.667V6c0 .368.299.667.667.667h3.333A.667.667 0 0014 6V2.667A.667.667 0 0013.333 2zM13.333 9.333H10a.667.667 0 00-.667.667v3.333c0 .368.299.667.667.667h3.333a.667.667 0 00.667-.667V10a.667.667 0 00-.667-.667zM6 9.333H2.667A.667.667 0 002 10v3.333c0 .368.298.667.667.667H6a.667.667 0 00.667-.667V10A.667.667 0 006 9.333z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'list': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M6 2.667h8M6 8h8M6 13.333h8M2 2.667h.007M2 8h.007M2 13.333h.007" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Charts & Trends
  'chart-line': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <path d="M2.5 2.5V17.5H17.5M15.8333 7.5L11.6667 11.6667L8.33333 8.33333L5.83333 10.8333" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'trending-up': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M4.66669 6.66667L8.00002 3.33334M8.00002 3.33334L11.3334 6.66667M8.00002 3.33334V12.6667" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round" transform="rotate(45 8 8)"/>
  </svg>`,

  'trending-down': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M4.66669 6.66667L8.00002 3.33334M8.00002 3.33334L11.3334 6.66667M8.00002 3.33334V12.6667" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round" transform="rotate(135 8 8)"/>
  </svg>`,

  // Status
  'help-circle': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6.06 6.00001C6.21674 5.55446 6.5261 5.17875 6.93331 4.9394C7.34051 4.70005 7.81927 4.61264 8.28479 4.69248C8.75031 4.77233 9.17255 5.01436 9.47672 5.3757C9.78089 5.73703 9.94737 6.19435 9.94667 6.66668C9.94667 8.00001 7.94667 8.66668 7.94667 8.66668" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 11.3333H8.00667" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'info': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.667" stroke="currentColor" stroke-width="1.33"/>
    <path d="M8 10.667V8M8 5.333h.007" stroke="currentColor" stroke-width="1.33" stroke-linecap="round"/>
  </svg>`,

  'warning': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M6.86 2.573L1.213 12a1.333 1.333 0 001.14 2h11.294a1.333 1.333 0 001.14-2L9.14 2.573a1.333 1.333 0 00-2.28 0z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 6v2.667M8 11.333h.007" stroke="currentColor" stroke-width="1.33" stroke-linecap="round"/>
  </svg>`,

  'error': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.667" stroke="currentColor" stroke-width="1.33"/>
    <path d="M10 6L6 10M6 6l4 4" stroke="currentColor" stroke-width="1.33" stroke-linecap="round"/>
  </svg>`,

  'success': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.667" stroke="currentColor" stroke-width="1.33"/>
    <path d="M5.333 8l2 2 3.334-3.333" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Objects
  'cart': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M6 14.667a.667.667 0 100-1.334.667.667 0 000 1.334zM13.333 14.667a.667.667 0 100-1.334.667.667 0 000 1.334zM.667.667h2.666l1.787 8.926a1.333 1.333 0 001.333 1.074h6.48a1.333 1.333 0 001.334-1.074L15.333 4H4" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'user': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M13.333 14v-1.333A2.667 2.667 0 0010.667 10H5.333a2.667 2.667 0 00-2.666 2.667V14M8 7.333A2.667 2.667 0 108 2a2.667 2.667 0 000 5.333z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'home': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M6 14.667V8h4v6.667M2 6l6-4.667L14 6v7.333a1.334 1.334 0 01-1.333 1.334H3.333A1.334 1.334 0 012 13.333V6z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'settings': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.33"/>
    <path d="M13.067 10a1.133 1.133 0 00.227 1.253l.04.04a1.373 1.373 0 11-1.94 1.94l-.04-.04a1.133 1.133 0 00-1.254-.227 1.133 1.133 0 00-.687 1.04v.114a1.373 1.373 0 11-2.746 0v-.06a1.133 1.133 0 00-.74-1.04 1.133 1.133 0 00-1.254.227l-.04.04a1.373 1.373 0 11-1.94-1.94l.04-.04A1.133 1.133 0 003 10a1.133 1.133 0 00-1.04-.687h-.113a1.373 1.373 0 110-2.746h.06a1.133 1.133 0 001.04-.74 1.133 1.133 0 00-.227-1.254l-.04-.04a1.374 1.374 0 111.94-1.94l.04.04A1.133 1.133 0 006 2.86v-.007c0-.76.613-1.373 1.373-1.373h0c.76 0 1.373.613 1.373 1.373v.06c.02.444.3.836.687 1.04a1.133 1.133 0 001.254-.227l.04-.04a1.374 1.374 0 111.94 1.94l-.04.04a1.133 1.133 0 00-.227 1.254c.198.386.59.667 1.033.687h.12c.76 0 1.373.613 1.373 1.373h0c0 .76-.613 1.373-1.373 1.373h-.06a1.133 1.133 0 00-1.04.687z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'mail': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M2.667 2.667h10.666c.734 0 1.334.6 1.334 1.333v8c0 .733-.6 1.333-1.334 1.333H2.667c-.734 0-1.334-.6-1.334-1.333V4c0-.733.6-1.333 1.334-1.333z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14.667 4L8 8.667 1.333 4" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'phone': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14.667 11.28v2a1.333 1.333 0 01-1.454 1.333 13.193 13.193 0 01-5.753-2.046 13 13 0 01-4-4 13.193 13.193 0 01-2.047-5.78A1.333 1.333 0 012.74 1.333h2a1.333 1.333 0 011.333 1.147 8.56 8.56 0 00.467 1.873 1.333 1.333 0 01-.3 1.407l-.847.847a10.667 10.667 0 004 4l.847-.847a1.333 1.333 0 011.407-.3 8.56 8.56 0 001.873.467 1.333 1.333 0 011.147 1.353z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'calendar': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M12.667 2.667H3.333C2.597 2.667 2 3.264 2 4v9.333c0 .737.597 1.334 1.333 1.334h9.334c.736 0 1.333-.597 1.333-1.334V4c0-.736-.597-1.333-1.333-1.333zM10.667 1.333V4M5.333 1.333V4M2 6.667h12" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'clock': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.667" stroke="currentColor" stroke-width="1.33"/>
    <path d="M8 4v4l2.667 1.333" stroke="currentColor" stroke-width="1.33" stroke-linecap="round"/>
  </svg>`,

  'file': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M9.333 1.333H4a1.333 1.333 0 00-1.333 1.334v10.666A1.333 1.333 0 004 14.667h8a1.333 1.333 0 001.333-1.334V5.333l-4-4z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9.333 1.333v4h4" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'file-warning': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <path d="M10 7.5V10.833M10 14.167h.008M12.5 1.667H5a1.667 1.667 0 00-1.667 1.666v13.334A1.667 1.667 0 005 18.333h10a1.667 1.667 0 001.667-1.666V5.833L12.5 1.667z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'file-check': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <path d="M12.5 1.667H5a1.667 1.667 0 00-1.667 1.666v13.334A1.667 1.667 0 005 18.333h10a1.667 1.667 0 001.667-1.666V5.833L12.5 1.667z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12.5 1.667v4.166h4.167M7.5 10l1.667 1.667L12.5 8.333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'package-check': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M11 6.667L5 3.333M14 10.667V5.333a1.333 1.333 0 00-.667-1.153L8.667 1.513a1.333 1.333 0 00-1.334 0L2.667 4.18A1.333 1.333 0 002 5.333v5.334a1.333 1.333 0 00.667 1.153l4.666 2.667a1.333 1.333 0 001.334 0l4.666-2.667A1.333 1.333 0 0014 10.667z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2.18 4.667L8 8.007l5.82-3.34M8 14.72V8" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M5.667 10.333l1.333 1.334 3.333-3.334" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'shopping-bag': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M4 1.333L2 4v9.333a1.333 1.333 0 001.333 1.334h9.334A1.333 1.333 0 0014 13.333V4l-2-2.667H4z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2 4h12M10.667 6.667a2.667 2.667 0 01-5.334 0" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'zap': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M8.667 1.333L2 9.333h6l-.667 5.334 6.667-8h-6l.667-5.334z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'component': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M5.667 3.333L8 1.333l2.333 2M5.667 12.667L8 14.667l2.333-2M12.667 5.667L14.667 8l-2 2.333M3.333 5.667L1.333 8l2 2.333" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 6a2 2 0 100 4 2 2 0 000-4z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'file-spreadsheet': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M9.333 1.333H4a1.333 1.333 0 00-1.333 1.334v10.666A1.333 1.333 0 004 14.667h8a1.333 1.333 0 001.333-1.334V5.333l-4-4z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9.333 1.333v4h4M5.333 8h5.334M5.333 10.667h5.334M5.333 6H6" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'image': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M12.667 2H3.333C2.597 2 2 2.597 2 3.333v9.334C2 13.403 2.597 14 3.333 14h9.334c.736 0 1.333-.597 1.333-1.333V3.333C14 2.597 13.403 2 12.667 2z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M5.667 6.667a1 1 0 100-2 1 1 0 000 2zM14 10l-3.333-3.333L3.333 14" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'upload': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14 10v2.667A1.334 1.334 0 0112.667 14H3.333A1.334 1.334 0 012 12.667V10M11.333 5.333L8 2M8 2L4.667 5.333M8 2v8" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'download': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14 10v2.667A1.334 1.334 0 0112.667 14H3.333A1.334 1.334 0 012 12.667V10M4.667 6.667L8 10M8 10l3.333-3.333M8 10V2" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'circle-dot': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.33"/>
    <circle cx="8" cy="8" r="2" fill="currentColor"/>
  </svg>`,

  'link': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M6.667 8.667a3.333 3.333 0 005.026.36l2-2a3.334 3.334 0 00-4.713-4.714l-1.147 1.14" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9.333 7.333a3.333 3.333 0 00-5.026-.36l-2 2a3.333 3.333 0 004.713 4.714l1.14-1.14" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'external-link': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M12 8.667v4A1.333 1.333 0 0110.667 14H3.333A1.333 1.333 0 012 12.667V5.333A1.333 1.333 0 013.333 4h4M10 2h4v4M6.667 9.333L14 2" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'eye': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M.667 8S3.333 2.667 8 2.667 15.333 8 15.333 8 12.667 13.333 8 13.333.667 8 .667 8z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.33"/>
  </svg>`,

  'eye-off': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M9.413 9.413a2 2 0 11-2.826-2.826M11.96 11.96A6.546 6.546 0 018 13.333c-4.667 0-7.333-5.333-7.333-5.333a12.01 12.01 0 013.373-3.96m2.627-1.373A5.92 5.92 0 018 2.667c4.667 0 7.333 5.333 7.333 5.333a12.04 12.04 0 01-1.44 2.127M.667.667l14.666 14.666" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'lock': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M12.667 7.333H3.333C2.597 7.333 2 7.93 2 8.667v4.666c0 .737.597 1.334 1.333 1.334h9.334c.736 0 1.333-.597 1.333-1.334V8.667c0-.737-.597-1.334-1.333-1.334z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4.667 7.333V4.667a3.333 3.333 0 116.666 0v2.666" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'spinner': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <style>.spinner_track{opacity:.25}.spinner_head{stroke-dasharray:60;stroke-dashoffset:45;stroke-linecap:round;animation:spinner_rotate .75s linear infinite}@keyframes spinner_rotate{100%{transform:rotate(360deg);transform-origin:center}}</style>
    <circle class="spinner_track" cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3"/>
    <circle class="spinner_head" cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3"/>
  </svg>`,

  'inbox': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14.667 8H10.667L9.333 10H6.667L5.333 8H1.333" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3.633 3.407L1.333 8v4a1.333 1.333 0 001.334 1.333h10.666A1.333 1.333 0 0014.667 12V8l-2.3-4.593a1.333 1.333 0 00-1.194-.74H4.827a1.333 1.333 0 00-1.194.74z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'truck': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M10.667 2H1.333v9.333h9.334V2zM10.667 6h2.666l2 2v3.333h-4.666V6zM4 14a1.333 1.333 0 100-2.667A1.333 1.333 0 004 14zM12.667 14a1.333 1.333 0 100-2.667 1.333 1.333 0 000 2.667z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'printer': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M4 6V1.333h8V6M4 12H2.667A1.333 1.333 0 011.333 10.667V7.333A1.333 1.333 0 012.667 6h10.666a1.333 1.333 0 011.334 1.333v3.334A1.333 1.333 0 0113.333 12H12" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 9.333H4v5.334h8V9.333z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'file-text': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M9.333 1.333H4a1.333 1.333 0 00-1.333 1.334v10.666A1.333 1.333 0 004 14.667h8a1.333 1.333 0 001.333-1.334V5.333l-4-4z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9.333 1.333v4h4M10.667 8.667H5.333M10.667 11.333H5.333M6.667 6H5.333" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'clipboard-list': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M10.667 2.667H12a1.333 1.333 0 011.333 1.333v9.333A1.333 1.333 0 0112 14.667H4a1.333 1.333 0 01-1.333-1.334V4A1.333 1.333 0 014 2.667h1.333" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 1.333H6a.667.667 0 00-.667.667v1.333c0 .368.299.667.667.667h4a.667.667 0 00.667-.667V2a.667.667 0 00-.667-.667z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M5.333 7.333h5.334M5.333 10h5.334M5.333 12.667h2.667" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'package': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14 10.667V5.333a1.333 1.333 0 00-.667-1.153L8.667 1.513a1.333 1.333 0 00-1.334 0L2.667 4.18A1.333 1.333 0 002 5.333v5.334a1.333 1.333 0 00.667 1.153l4.666 2.667a1.333 1.333 0 001.334 0l4.666-2.667A1.333 1.333 0 0014 10.667z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2.18 4.627L8 8.007l5.82-3.38M8 14.72V8" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'star': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M8 1.333l2.06 4.174 4.607.673-3.334 3.247.787 4.586L8 11.847l-4.12 2.166.787-4.586L1.333 6.18l4.607-.673L8 1.333z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'heart': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M13.893 3.073a3.667 3.667 0 00-5.186 0L8 3.78l-.707-.707a3.667 3.667 0 00-5.186 5.187l.706.707L8 14.153l5.187-5.186.706-.707a3.667 3.667 0 000-5.187z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'bell': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M12 5.333a4 4 0 10-8 0c0 4.667-2 6-2 6h12s-2-1.333-2-6zM9.153 14a1.333 1.333 0 01-2.306 0" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'logout': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M6 14H3.333A1.333 1.333 0 012 12.667V3.333A1.333 1.333 0 013.333 2H6M10.667 11.333L14 8M14 8l-3.333-3.333M14 8H6" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'login': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M10 2h2.667A1.333 1.333 0 0114 3.333v9.334A1.333 1.333 0 0112.667 14H10M6.667 11.333L10 8M10 8L6.667 4.667M10 8H2" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Admin page specific icons
  'arrow-back': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14 8H2M6.667 12.667L2 8l4.667-4.667" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'users': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <path d="M13.333 17.5V15.833a3.333 3.333 0 00-3.333-3.333H5a3.333 3.333 0 00-3.333 3.333V17.5M18.333 17.5v-1.667a3.333 3.333 0 00-2.5-3.225M12.5 2.608a3.333 3.333 0 010 6.459M10.833 5.833a3.333 3.333 0 11-6.666 0 3.333 3.333 0 016.666 0z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'flag': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <path d="M3.333 12.5s.834-.833 3.334-.833 4.166 1.666 6.666 1.666 3.334-.833 3.334-.833V2.5s-.834.833-3.334.833S9.167 1.667 6.667 1.667 3.333 2.5 3.333 2.5V12.5zM3.333 12.5V18.333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'currency': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.67"/>
    <path d="M10 5.833v8.334M7.5 8.333c0-.92.746-1.666 1.667-1.666h1.666c.92 0 1.667.746 1.667 1.666s-.746 1.667-1.667 1.667H9.167c-.92 0-1.667.746-1.667 1.667s.746 1.666 1.667 1.666h1.666c.92 0 1.667-.746 1.667-1.666" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'clipboard-check': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <path d="M13.333 3.333H15a1.667 1.667 0 011.667 1.667v10a1.667 1.667 0 01-1.667 1.667h-2.5M13.333 3.333V5a1.667 1.667 0 01-1.666 1.667H8.333A1.667 1.667 0 016.667 5V3.333M13.333 3.333H6.667M6.667 3.333H5a1.667 1.667 0 00-1.667 1.667v10A1.667 1.667 0 005 16.667h2.5" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M1.667 13.333l2.5 2.5 5-5" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'warehouse': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <path d="M5 15.0012H15M5 11.6678H15M18.3333 6.95943V16.6678C18.3333 17.1098 18.1577 17.5337 17.8452 17.8463C17.5326 18.1588 17.1087 18.3344 16.6667 18.3344H3.33333C2.89131 18.3344 2.46738 18.1588 2.15482 17.8463C1.84226 17.5337 1.66667 17.1098 1.66667 16.6678V6.95943C1.66801 6.62705 1.7688 6.30267 1.9558 6.02795C2.14291 5.75323 2.40788 5.54074 2.71667 5.41776L9.38333 2.75109C9.77932 2.59339 10.2207 2.59339 10.6167 2.75109L17.2833 5.41776C17.5921 5.54074 17.8571 5.75323 18.0442 6.02795C18.2313 6.30267 18.332 6.62705 18.3333 6.95943ZM5 8.33451H15V18.3345H5V8.33451Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'percent': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <path d="M2.5 6.667A4.167 4.167 0 016.667 2.5h6.666A4.167 4.167 0 0117.5 6.667v6.666a4.167 4.167 0 01-4.167 4.167H6.667A4.167 4.167 0 012.5 13.333V6.667z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M7.5 7.5h.008M12.5 12.5h.008M12.5 7.5L7.5 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'clone': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <rect x="5.333" y="5.333" width="9.333" height="9.333" rx="1.333" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3.333 10.667H2.667A1.333 1.333 0 011.333 9.333V2.667A1.333 1.333 0 012.667 1.333h6.666A1.333 1.333 0 0110.667 2.667v.666" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'sort': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M4 10L8 14L12 10M4 6L8 2L12 6" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'sort-asc': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M4 10L8 14L12 10" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round" opacity="0.3"/>
    <path d="M4 6L8 2L12 6" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'sort-desc': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M4 10L8 14L12 10" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 6L8 2L12 6" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round" opacity="0.3"/>
  </svg>`,

  'checkbox-unchecked': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.33"/>
  </svg>`,

  'checkbox-checked': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="12" height="12" rx="2" fill="currentColor" stroke="currentColor" stroke-width="1.33"/>
    <path d="M5 8l2 2 4-4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'export': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14 10v2.667A1.334 1.334 0 0112.667 14H3.333A1.334 1.334 0 012 12.667V10M4.667 6.667L8 10M8 10l3.333-3.333M8 10V2" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'pencil': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M11.333 2A1.886 1.886 0 0114 4.667l-9 9-3.667 1 1-3.667 9-9z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'building': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <path d="M2.5 17.5h15M4.167 17.5V4.167a1.667 1.667 0 011.666-1.667h8.334a1.667 1.667 0 011.666 1.667V17.5M7.5 5.833h1.667M7.5 9.167h1.667M7.5 12.5h1.667M10.833 5.833h1.667M10.833 9.167h1.667M10.833 12.5h1.667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'tag': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <path d="M17.158 11.175l-6.666 6.667a1.667 1.667 0 01-2.359 0L2.5 12.208V2.5h9.708l4.95 4.95a1.667 1.667 0 010 2.358v1.367zM6.667 6.667h.008" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'credit-card': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <rect x="1.667" y="3.333" width="16.667" height="13.333" rx="2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M1.667 8.333h16.666" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'box': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <path d="M17.5 13.333V6.667a1.667 1.667 0 00-.833-1.442l-5.834-3.333a1.667 1.667 0 00-1.666 0L3.333 5.225A1.667 1.667 0 002.5 6.667v6.666a1.667 1.667 0 00.833 1.442l5.834 3.333a1.667 1.667 0 001.666 0l5.834-3.333a1.667 1.667 0 00.833-1.442z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2.725 5.783L10 10.008l7.275-4.225M10 18.4v-8.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'receipt': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <path d="M15.833 2.5H4.167a.833.833 0 00-.834.833V17.5l2.5-1.667L8.333 17.5l1.667-1.667 1.667 1.667 2.5-1.667 2.5 1.667V3.333a.833.833 0 00-.834-.833z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M7.5 6.667h5M7.5 10h5M7.5 13.333h2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'contact': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <path d="M16.667 17.5v-1.667a3.333 3.333 0 00-3.334-3.333H6.667a3.333 3.333 0 00-3.334 3.333V17.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="10" cy="6.667" r="3.333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'globe': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="8.333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M1.667 10h16.666M10 1.667a12.75 12.75 0 013.333 8.333 12.75 12.75 0 01-3.333 8.333 12.75 12.75 0 01-3.333-8.333A12.75 12.75 0 0110 1.667z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'fuel': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <path d="M3.333 17.5V5a1.667 1.667 0 011.667-1.667h5.833a1.667 1.667 0 011.667 1.667v12.5M3.333 17.5H12.5M3.333 17.5H1.667M12.5 10h1.333a1.667 1.667 0 011.667 1.667v2.5a1.667 1.667 0 001.667 1.666 1.667 1.667 0 001.666-1.666V7.5l-2.5-2.5M5 7.5h5.833v4.167H5V7.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Ecommerce Hub icons from Figma (user provided SVGs)
  'hand-coins': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <g clip-path="url(#clip0)">
      <path d="M9.16667 12.5013H10.8333C11.2754 12.5013 11.6993 12.3257 12.0118 12.0131C12.3244 11.7006 12.5 11.2767 12.5 10.8346C12.5 10.3926 12.3244 9.96868 12.0118 9.65612C11.6993 9.34356 11.2754 9.16797 10.8333 9.16797H8.33333C7.83333 9.16797 7.41667 9.33464 7.16667 9.66797L2.5 14.168M5.83333 17.5013L7.16667 16.3347C7.41667 16.0013 7.83333 15.8347 8.33333 15.8347H11.6667C12.5833 15.8347 13.4167 15.5013 14 14.8347L17.8333 11.168C18.1549 10.8641 18.3426 10.4449 18.3551 10.0026C18.3676 9.56036 18.2039 9.13123 17.9 8.80966C17.5961 8.48808 17.1769 8.3004 16.7346 8.2879C16.2924 8.2754 15.8632 8.4391 15.5417 8.74299L12.0417 11.993M1.66667 13.3346L6.66667 18.3346M15.7501 7.50138C15.7501 8.83607 14.6681 9.91805 13.3334 9.91805C11.9987 9.91805 10.9167 8.83607 10.9167 7.50138C10.9167 6.1667 11.9987 5.08472 13.3334 5.08472C14.6681 5.08472 15.7501 6.1667 15.7501 7.50138ZM7.5 4.16797C7.5 5.54868 6.38071 6.66797 5 6.66797C3.61929 6.66797 2.5 5.54868 2.5 4.16797C2.5 2.78726 3.61929 1.66797 5 1.66797C6.38071 1.66797 7.5 2.78726 7.5 4.16797Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>`,

  'receipt-euro': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <path d="M6.66667 9.9974H10.8333M13.3333 7.91414C12.8904 7.39634 12.2994 7.02671 11.6401 6.85502C10.9807 6.68334 10.2845 6.71786 9.64531 6.95393C9.00613 7.18999 8.45465 7.61627 8.06515 8.17535C7.67565 8.73442 7.46684 9.39943 7.46684 10.0808C7.46684 10.7622 7.67565 11.4272 8.06515 11.9863C8.45465 12.5453 9.00613 12.9716 9.64531 13.2077C10.2845 13.4438 10.9807 13.4783 11.6401 13.3066C12.2994 13.1349 12.8904 12.7653 13.3333 12.2475M3.33333 1.66406V18.3307L5 17.4974L6.66667 18.3307L8.33333 17.4974L10 18.3307L11.6667 17.4974L13.3333 18.3307L15 17.4974L16.6667 18.3307V1.66406L15 2.4974L13.3333 1.66406L11.6667 2.4974L10 1.66406L8.33333 2.4974L6.66667 1.66406L5 2.4974L3.33333 1.66406Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'square-percent': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <path d="M12.5 7.5L7.5 12.5M7.5 7.5H7.50833M12.5 12.5H12.5083M4.16667 2.5H15.8333C16.7538 2.5 17.5 3.24619 17.5 4.16667V15.8333C17.5 16.7538 16.7538 17.5 15.8333 17.5H4.16667C3.24619 17.5 2.5 16.7538 2.5 15.8333V4.16667C2.5 3.24619 3.24619 2.5 4.16667 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'banknote': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
    <rect x="1.667" y="5" width="16.667" height="10" rx="1.667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M5 7.5v5M15 7.5v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Rich Text Editor Icons
  'text': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M2.667 4V2.667h10.666V4M6 13.333h4M8 2.667v10.666" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'align-left': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14 12.667H2M10.667 8H2M14 3.333H2" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'align-center': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14 12.667H2M12 8H4M14 3.333H2" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'align-right': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14 12.667H2M14 8H5.333M14 3.333H2" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'align-justify': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14 12.667H2M14 8H2M14 3.333H2" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'code': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M10.667 12l4-4-4-4M5.333 4l-4 4 4 4" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Additional Customer Page Icons
  'hash': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M2.667 6h10.666M2.667 10h10.666M6.667 2L5.333 14M10.667 2L9.333 14" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'calendar-user': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M11.333 12C11.333 11.4696 11.1226 10.9609 10.7475 10.5858C10.3724 10.2107 9.86377 10 9.33337 10H6.66671C6.1363 10 5.62759 10.2107 5.25252 10.5858C4.87745 10.9609 4.66671 11.4696 4.66671 12M5.33337 1.333V2.667M10.6667 1.333V2.667M3.33337 2.667H12.6667C13.4031 2.667 14 3.264 14 4V13.333C14 14.07 13.4031 14.667 12.6667 14.667H3.33337C2.597 14.667 2 14.07 2 13.333V4C2 3.264 2.597 2.667 3.33337 2.667ZM9.33337 6.667C9.33337 7.403 8.73637 8 8.00004 8C7.26371 8 6.66671 7.403 6.66671 6.667C6.66671 5.93 7.26371 5.333 8.00004 5.333C8.73637 5.333 9.33337 5.93 9.33337 6.667Z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'check-circle-large': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" fill="none">
    <path d="M51.333 25.827v2.206a23.333 23.333 0 11-13.836-21.336" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M51.333 9.333L28 32.69l-7-7" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'send': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14.667 1.333L7.333 8.667M14.667 1.333l-4.667 13.334-3-6.667-6.667-3 13.334-4.667z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'paperclip': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14.273 7.393l-6.08 6.08a4 4 0 01-5.66-5.66l6.08-6.08a2.667 2.667 0 013.773 3.774l-6.086 6.08a1.333 1.333 0 01-1.887-1.887l5.614-5.607" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'clipboard': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M10.667 2.667H12a1.333 1.333 0 011.333 1.333v9.333A1.333 1.333 0 0112 14.667H4a1.333 1.333 0 01-1.333-1.334V4A1.333 1.333 0 014 2.667h1.333" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 1.333H6a.667.667 0 00-.667.667v1.333c0 .368.299.667.667.667h4a.667.667 0 00.667-.667V2a.667.667 0 00-.667-.667z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'file-plus': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M9.333 1.333H4a1.333 1.333 0 00-1.333 1.334v10.666A1.333 1.333 0 004 14.667h8a1.333 1.333 0 001.333-1.334V5.333l-4-4z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9.333 1.333v4h4M8 7.333v4M6 9.333h4" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'dollar-sign': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M8 .667v14.666M11.333 3.333H6.333a2.333 2.333 0 000 4.667h3.334a2.333 2.333 0 010 4.667H4" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'map-pin': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14 6.667c0 4.666-6 8.666-6 8.666s-6-4-6-8.666a6 6 0 1112 0z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="8" cy="6.667" r="2" stroke="currentColor" stroke-width="1.33"/>
  </svg>`,

  'layers': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M8 1.333L1.333 5.333 8 9.333l6.667-4L8 1.333zM1.333 10.667L8 14.667l6.667-4M1.333 8L8 12l6.667-4" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'activity': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14.667 8H12L10 14 6 2 4 8H1.333" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'bar-chart': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M12 13.333V6.667M8 13.333V2.667M4 13.333v-4" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
};

/**
 * Helper function to add custom icons at runtime
 */
export function registerIcon(name: string, svg: string): void {
  ICON_REGISTRY[name] = svg;
}
