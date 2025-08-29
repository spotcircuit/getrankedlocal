// In-memory storage for job results
// This is a temporary solution - in production, use a database or Redis

const jobResults = new Map<string, any>();

export function storeJobResults(jobId: string, results: any): void {
  jobResults.set(jobId, results);
  
  // Optional: Clean up old results after 1 hour
  setTimeout(() => {
    jobResults.delete(jobId);
  }, 60 * 60 * 1000);
}

export function getJobResults(jobId: string): any {
  return jobResults.get(jobId);
}

export function hasJobResults(jobId: string): boolean {
  return jobResults.has(jobId);
}