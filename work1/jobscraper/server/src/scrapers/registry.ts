import { Scraper, JobListing } from './base.js';
import { LinkedInScraper } from './linkedin.js';
import { IndeedScraper } from './indeed.js';
import { SimplyHiredScraper } from './simplyhired.js';

interface ScraperError {
  board: string;
  error: string;
}

interface SearchAllResult {
  jobs: JobListing[];
  errors: ScraperError[];
}

const scrapers: Scraper[] = [
  new LinkedInScraper(),
  new IndeedScraper(),
  new SimplyHiredScraper(),
];

export async function searchAll(keyword: string, location: string): Promise<SearchAllResult> {
  const results = await Promise.allSettled(
    scrapers.map((s) => s.search(keyword, location))
  );

  const jobs: JobListing[] = [];
  const errors: ScraperError[] = [];

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      jobs.push(...r.value);
    } else {
      errors.push({
        board: scrapers[i].name,
        error: r.reason?.message || 'Unknown error',
      });
    }
  });

  return { jobs, errors };
}
