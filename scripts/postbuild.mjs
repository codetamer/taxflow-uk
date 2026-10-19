import fs from 'node:fs';

if (!fs.existsSync('.next') && fs.existsSync('apps/web/.next')) {
  try {
    fs.symlinkSync('apps/web/.next', '.next', 'junction');
  } catch {
    // Graceful fallback
  }
}
