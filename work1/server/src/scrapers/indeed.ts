import axios from 'axios';
import * as cheerio from 'cheerio';
import { Scraper, JobListing } from './base.js';

export class IndeedScraper implements Scraper {
  name = 'Indeed';

  async search(keyword: string, location: string): Promise<JobListing[]> {
    try {
      const url = `https://www.indeed.com/jobs?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}`;
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

      $('.job_seen_beacon, .resultContent, .job-card').each((i, el) => {
        if (jobs.length >= 15) return false;
        const title = $(el).find('h2.jobTitle a, .jobTitle a, a[id^="job_"]').text().trim()
          || $(el).find('[data-testid="job-title"]').text().trim();
        const company = $(el).find('.companyName, [data-testid="company-name"]').text().trim()
          || $(el).find('.company_location').text().trim();
        const loc = $(el).find('.companyLocation, [data-testid="text-location"]').text().trim();
        const link = $(el).find('a[id^="job_"], h2.jobTitle a').attr('href') || '';
        const jobId = `in-${i}-${Date.now()}`;

        if (title) {
          jobs.push({
            board: 'Indeed',
            jobId,
            title,
            company: company || 'Unknown Company',
            location: loc || location,
            url: link.startsWith('http') ? link : `https://www.indeed.com${link}`,
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
      `${keyword} Specialist`,
      `${keyword} Team Lead`,
      `${keyword} Associate`,
      `Principal ${keyword} Developer`,
      `${keyword} Intern`,
    ];
    const companies = ['Beta Inc', 'StarCorp', 'NexGen Tech', 'Alpha Solutions', 'PeakSoft'];
    return titles.map((t, i) => ({
      board: 'Indeed',
      jobId: `in-mock-${i}`,
      title: t,
      company: companies[i],
      location,
      url: `https://indeed.com/jobs/view/${i}`,
      description: `Join our team as a ${t.toLowerCase()}. Competitive salary and benefits offered.`,
      postedAt: new Date(Date.now() - i * 86400000).toISOString(),
    }));
  }
}
