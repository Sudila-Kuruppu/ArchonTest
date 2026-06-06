export interface JobListing {
  board: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  postedAt: string;
}

export interface Scraper {
  name: string;
  search(keyword: string, location: string): Promise<JobListing[]>;
}
