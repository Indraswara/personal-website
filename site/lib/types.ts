export interface TimelineItem {
  title: string;
  date: string;
  description: string;
  tags: string[];
}

export interface ProjectItem extends TimelineItem {
  link?: string;
  slug?: string;
  web?: { subdomain: string; port: number; checkHost: string; checkPort: number };
  lab?: { kind: "cli"; cmd: string; blurb: string };
  site?: string;
}

export interface ContactLink {
  id: string;
  label: string;
  url: string;
  iconPath?: string;
}

export interface PostFrontmatter {
  title: string;
  date: string;
  description: string;
  tags: string[];
  category?: string;
}

export interface PostMeta extends PostFrontmatter {
  slug: string;
}

export interface CtfFrontmatter {
  title: string;
  event: string;
  eventDate: string;
  eventUrl?: string;
  category?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  points?: number;
}

export interface CtfWriteupMeta extends CtfFrontmatter {
  slug: string;
}

export interface CtfEventGroup {
  event: string;
  eventDate: string;
  eventUrl?: string;
  writeups: CtfWriteupMeta[];
}

export interface HomelabService {
  subdomain: string;
  name: string;
  description: string;
  category: string;
}

export interface HomelabServiceStatus {
  subdomain: string;
  online: boolean;
}

export interface RegistryLabEntry {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  repo: string;
  lab?: { kind: "cli"; cmd: string; blurb: string };
  web?: { subdomain: string; port: number; checkHost: string; checkPort: number };
  site?: string;
}
