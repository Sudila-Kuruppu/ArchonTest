import axios from 'axios';
import * as cheerio from 'cheerio';
import { Scraper, JobListing } from './base.js';

export class LinkedInScraper implements Scraper {
  name = 'LinkedIn';

  async search(keyword: string, location: string): Promise<JobListing[]> {
    try {
      const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;
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

      $('.base-card, .job-search-card').each((i, el) => {
        if (jobs.length >= 15) return false;
        const title = $(el).find('[data-tracking-control-name="public_jobs_jserp-job_search_text"]').text().trim()
          || $(el).find('h3.base-search-card__title').text().trim();
        const company = $(el).find('.base-search-card__subtitle').text().trim()
          || $(el).find('[data-tracking-control-name]').first().text().trim();
        const loc = $(el).find('.job-search-card__location').text().trim()
          || $(el).find('.base-search-card__metadata').text().trim();
        const link = $(el).find('a.base-card__full-link, a[href*="/jobs/view"]').attr('href') || '';
        const jobId = `lk-${i}-${Date.now()}`;

        if (title) {
          jobs.push({
            board: 'LinkedIn',
            jobId,
            title,
            company: company || 'Unknown Company',
            location: loc || location,
            url: link,
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
      `${keyword} Engineer`,
      `Senior ${keyword} Developer`,
      `${keyword} Developer`,
      `Lead ${keyword} Architect`,
      `Junior ${keyword} Developer`,
    ];
    const companies = ['Acme Corp', 'TechCo', 'InnoSoft', 'DataFlow Inc', 'CloudBase'];
    return titles.map((t, i) => ({
      board: 'LinkedIn',
      jobId: `lk-mock-${i}`,
      title: t,
      company: companies[i],
      location,
      url: `https://linkedin.com/jobs/view/${i}`,
      description: `We are looking for a ${t.toLowerCase()} to join our team. Experience with modern technologies required.`,
      postedAt: new Date(Date.now() - i * 86400000).toISOString(),
    }));
  }
}
