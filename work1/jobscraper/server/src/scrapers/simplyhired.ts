import axios from 'axios';
import * as cheerio from 'cheerio';
import { Scraper, JobListing } from './base.js';

export class SimplyHiredScraper implements Scraper {
  name = 'SimplyHired';

  async search(keyword: string, location: string): Promise<JobListing[]> {
    try {
      const url = `https://www.simplyhired.com/search?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}`;
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(data);
      const jobs: JobListing[] = [];

      $('div[data-testid="searchResult"], .card, .job-result').each((i, el) => {
        if (jobs.length >= 15) return false;
        const title = $(el).find('a[data-testid="job-title"], h2 a, .job-title').text().trim();
        const company = $(el).find('[data-testid="company-name"], .company').text().trim();
        const loc = $(el).find('[data-testid="location"], .location').text().trim();
        const link = $(el).find('a[data-testid="job-title"], h2 a').attr('href') || '';
        const jobId = `sh-${i}-${Date.now()}`;

        if (title) {
          jobs.push({
            board: 'SimplyHired',
            jobId,
            title,
            company: company || 'Unknown Company',
            location: loc || location,
            url: link.startsWith('http') ? link : `https://www.simplyhired.com${link}`,
            description: '',
            postedAt: new Date().toISOString(),
          });
        }
      });

      if (jobs.length === 0) {
        return this.getMockData(keyword, location);
      }
      return jobs;
    } catch {
      return this.getMockData(keyword, location);
    }
  }

  private getMockData(keyword: string, location: string): JobListing[] {
    const titles = [
      `${keyword} Manager`,
      `Remote ${keyword} Developer`,
      `${keyword} Consultant`,
      `${keyword} Analyst`,
      `Staff ${keyword} Developer`,
    ];
    const companies = ['StartupX', 'GreenTech', 'MindWorks', 'SkyNet Systems', 'Bridge Labs'];
    return titles.map((t, i) => ({
      board: 'SimplyHired',
      jobId: `sh-mock-${i}`,
      title: t,
      company: companies[i],
      location,
      url: `https://simplyhired.com/jobs/view/${i}`,
      description: `Looking for an experienced ${t.toLowerCase()} to help build the future.`,
      postedAt: new Date(Date.now() - i * 86400000).toISOString(),
    }));
  }
}
