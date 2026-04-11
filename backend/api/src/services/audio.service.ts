/**
 * @file audio.service.ts
 * @description Business-logic layer for Audio operations.
 *
 * Responsibilities:
 * - CRUD operations on audio metadata records.
 * - Date string parsing & validation (DD-MM-YYYY → `Date` via `date-fns`).
 * - Input normalisation (uppercase theme / author).
 * - Querying with optional full-text search and date-range filtering.
 * - Providing distinct theme / author lists for frontend dropdowns.
 *
 * This class depends on {@link IAudioRepository} (injected via DI).
 */

import { parse, isValid } from 'date-fns';

import type { IAudio, IAudioCreate } from '../models/interfaces/index.js';
import type { IAudioRepository } from '../repositories/interfaces/index.js';
import { AppError } from '../lib/app-error.js';
import { DATE_FORMAT, FILE_LOCATION } from '../config/constants.js';

export class AudioService {
  constructor(private readonly audioRepo: IAudioRepository) {}

  /* ── CRUD ────────────────────────────────────────────────────────────── */

  /**
   * Create a new audio metadata record.
   *
   * - Parses the optional date string into a `Date` object.
   * - Normalises theme and author to uppercase.
   * - Defaults author to "INCONNU" when not provided.
   *
   * @throws {AppError} 400 if the date string is present but invalid.
   */
  async create(data: {
    theme: string;
    author?: string;
    description: string;
    keywords: string;
    date?: string;
    uri?: string;
  }): Promise<IAudio> {
    // Parse the optional date string; default to "now" if absent.
    let parsedDate = new Date();
    if (data.date) {
      parsedDate = parse(data.date, DATE_FORMAT, new Date());
      if (!isValid(parsedDate)) {
        throw AppError.badRequest('Format de date invalide. Utilisez DD-MM-YYYY.');
      }
    }

    const toCreate: IAudioCreate = {
      uri: data.uri ?? FILE_LOCATION.AUDIO_FILE_LOCATION,
      theme: data.theme.toUpperCase(),
      author: data.author ? data.author.toUpperCase() : 'INCONNU',
      description: data.description,
      keywords: data.keywords,
      date: parsedDate,
      taskId: null, // Manual uploads are not linked to a task.
    };

    return this.audioRepo.create(toCreate);
  }

  /** Return a single audio by ID, or `null` if not found. */
  async findById(id: string): Promise<IAudio | null> {
    return this.audioRepo.findById(id);
  }

  /** Return a single audio by its S3 URI key, or `null` if not found. */
  async findByUri(uri: string): Promise<IAudio | null> {
    return this.audioRepo.findByUri(uri);
  }

  /**
   * Return a paginated, filtered list of audio records.
   *
   * Date strings (`minDate`, `maxDate`) are parsed from DD-MM-YYYY format.
   * Invalid date strings are silently ignored (the filter is simply not applied).
   */
  async findMany(
    filter: {
      theme?: string;
      author?: string;
      keywords?: string;
      minDate?: string;
      maxDate?: string;
    },
    skip: number,
    limit: number,
  ): Promise<IAudio[]> {
    // Convert string-based filters to the typed object expected by the repository.
    const parsed: {
      theme?: string;
      author?: string;
      keywords?: string;
      minDate?: Date;
      maxDate?: Date;
    } = {};

    if (filter.theme) parsed.theme = filter.theme;
    if (filter.author) parsed.author = filter.author;
    if (filter.keywords) parsed.keywords = filter.keywords;

    // Parse date strings — silently skip if the format is invalid.
    if (filter.minDate) {
      const d = parse(filter.minDate, DATE_FORMAT, new Date());
      if (isValid(d)) parsed.minDate = d;
    }
    if (filter.maxDate) {
      const d = parse(filter.maxDate, DATE_FORMAT, new Date());
      if (isValid(d)) parsed.maxDate = d;
    }

    return this.audioRepo.findMany(parsed, skip, limit);
  }

  /**
   * Update an existing audio record's metadata.
   *
   * @throws {AppError} 404 if the audio does not exist.
   * @throws {AppError} 400 if a date string is provided but has an invalid format.
   */
  async update(
    id: string,
    data: {
      theme?: string;
      author?: string;
      description?: string;
      keywords?: string;
      date?: string;
      uri?: string;
    },
  ): Promise<boolean> {
    const audio = await this.audioRepo.findById(id);
    if (!audio) {
      throw AppError.notFound('Audio introuvable.');
    }

    // Build an update payload from only the fields that were actually provided.
    const updateData: Record<string, unknown> = {};
    if (data.theme !== undefined) updateData.theme = data.theme.toUpperCase();
    if (data.author !== undefined) updateData.author = data.author.toUpperCase();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.keywords !== undefined) updateData.keywords = data.keywords;
    if (data.uri !== undefined) updateData.uri = data.uri;

    if (data.date) {
      const parsedDate = parse(data.date, DATE_FORMAT, new Date());
      if (!isValid(parsedDate)) {
        throw AppError.badRequest('Format de date invalide. Utilisez DD-MM-YYYY.');
      }
      updateData.date = parsedDate;
    }

    return this.audioRepo.updateById(id, updateData);
  }

  /**
   * Delete an audio record by ID.
   *
   * @throws {AppError} 404 if the audio does not exist.
   */
  async deleteById(id: string): Promise<boolean> {
    const audio = await this.audioRepo.findById(id);
    if (!audio) {
      throw AppError.notFound('Audio introuvable.');
    }
    return this.audioRepo.deleteById(id);
  }

  /* ── Distinct value helpers ─────────────────────────────────────────── */

  /** Return all unique theme values (for the frontend filter dropdown). */
  async getDistinctThemes(): Promise<string[]> {
    return this.audioRepo.getDistinctValues('theme');
  }

  /** Return all unique author values (for the frontend filter dropdown). */
  async getDistinctAuthors(): Promise<string[]> {
    return this.audioRepo.getDistinctValues('author');
  }
}
