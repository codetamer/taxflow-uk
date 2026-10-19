/**
 * Centralized Reviewer Mode Configuration
 * 
 * REVIEWER_MODE allows stakeholders, external reviewers, and auditors to inspect
 * all dashboards, filing wizards, risk audits, document studios, and admin telemetry
 * without requiring account creation, database setups, or session persistence.
 * 
 * State:
 * - Default: true (active for public Vercel inspection)
 * - To disable and enforce strict production auth + live DB:
 *   Set environment variable REVIEWER_MODE=false or NEXT_PUBLIC_REVIEWER_MODE=false
 */

export function isReviewerMode(): boolean {
  if (
    process.env.REVIEWER_MODE === 'false' ||
    process.env.REVIEWER_MODE === '0' ||
    process.env.NEXT_PUBLIC_REVIEWER_MODE === 'false' ||
    process.env.NEXT_PUBLIC_REVIEWER_MODE === '0'
  ) {
    return false;
  }
  return true;
}

