/**
 * @file audio.interface.ts
 * @description Database-agnostic interface for the Audio entity.
 *
 * An "Audio" represents a single audio file (lecture, sermon, etc.) stored
 * on S3 with its associated metadata persisted in the database.
 */

/** Read-model representation of an Audio record. */
export interface IAudio {
  /** Unique identifier (mapped from the DB primary key). */
  id: string;
  /** S3 object key — relative path inside the bucket (e.g. "files/audios/abc.mp3"). */
  uri: string;
  /** Thematic category, upper-cased (e.g. "TAWHID"). */
  theme: string;
  /** Author / speaker name, upper-cased (e.g. "DIALLO"). Defaults to "INCONNU". */
  author: string;
  /** Free-text description of the audio content. */
  description: string;
  /** Search keywords — used by the MongoDB `$text` index. */
  keywords: string;
  /** Date the audio was recorded or published. */
  date: Date;
}

/** Fields required when creating a new audio entry (all except the auto-generated `id`). */
export type IAudioCreate = Omit<IAudio, 'id'>;

/** Fields that may be updated on an existing audio entry (all optional). */
export type IAudioUpdate = Partial<Omit<IAudio, 'id'>>;
