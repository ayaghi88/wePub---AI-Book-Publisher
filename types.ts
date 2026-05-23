
export interface Chapter {
  id: string;
  title: string;
  content: string;
}

export interface Character {
  id: string;
  name: string;
  traits: string;
  description: string;
}

export interface StorySettings {
  targetChapters: number;
  direction: string;
  characters: Character[];
}

export interface BookMetadata {
  title: string;
  author: string;
  description: string;
  language: string;
  publisher: string;
  rights: string;
}

export interface BookState {
  metadata: BookMetadata;
  chapters: Chapter[];
  storySettings: StorySettings;
}
