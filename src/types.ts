export interface Work {
  title: string;
  image: string;
  description: string;
  author?: string;
  venue?: string;
  placeholder?: boolean;
  invited?: boolean;
}

export interface Archive {
  group: string;
  year: string;
  title: string;
  url: string;
  image?: string;
}
