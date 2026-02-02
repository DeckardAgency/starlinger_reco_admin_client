/**
 * Hydra API Type Definitions
 *
 * This file contains reusable types for Hydra-powered APIs.
 * Hydra is a vocabulary for hypermedia-driven Web APIs.
 *
 * @see https://www.hydra-cg.com/spec/latest/core/
 */

/**
 * Base interface for all Hydra resources
 */
export interface HydraResource {
  '@context': string;
  '@id': string;
  '@type': string;
}

/**
 * Hydra view for pagination
 */
export interface HydraView {
  '@id': string;
  '@type': string;
  'hydra:first'?: string;
  'hydra:last'?: string;
  'hydra:next'?: string;
  'hydra:previous'?: string;
}

/**
 * Hydra search mapping
 */
export interface HydraSearchMapping {
  '@type': string;
  variable: string;
  property: string;
  required: boolean;
}

/**
 * Hydra search template
 */
export interface HydraSearch {
  '@type': string;
  'hydra:template': string;
  'hydra:variableRepresentation': string;
  'hydra:mapping': HydraSearchMapping[];
}

/**
 * Generic Hydra collection interface
 * @template T The type of items in the collection
 */
export interface HydraCollection<T> extends HydraResource {
  'hydra:totalItems': number;
  'hydra:member': T[];
  'hydra:view'?: HydraView;
  'hydra:search'?: HydraSearch;
}

/**
 * Normalized collection response (without 'hydra:' prefixes)
 * Used internally after API response normalization
 * @template T The type of items in the collection
 */
export interface NormalizedCollection<T> {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: T[];
  view: HydraView | null;
  search?: HydraSearch;
  [key: string]: unknown;
}

/**
 * Type guard to check if a response is a Hydra collection
 */
export function isHydraCollection<T = unknown>(response: unknown): response is HydraCollection<T> {
  return response !== null && typeof response === 'object' && 'hydra:totalItems' in response;
}

/**
 * Normalizes a Hydra collection response to remove 'hydra:' prefixes
 * Handles both prefixed ('hydra:member') and already-normalized ('member') formats
 * @template T The type of items in the collection
 * @param response The Hydra API response
 * @returns Normalized collection with camelCase properties
 */
export function normalizeHydraCollection<T>(response: Record<string, unknown>): NormalizedCollection<T> {
  // Check if response already has normalized properties (without hydra: prefix)
  const hasNormalizedProps = 'member' in response && 'totalItems' in response;

  if (hasNormalizedProps) {
    // API already returns normalized format
    return {
      '@context': (response['@context'] as string) || '',
      '@id': (response['@id'] as string) || '',
      '@type': (response['@type'] as string) || '',
      totalItems: (response['totalItems'] as number) || 0,
      member: (response['member'] as T[]) || [],
      view: (response['view'] as HydraView | null) || null,
      search: response['search'] as HydraSearch | undefined
    };
  }

  // Handle Hydra-prefixed format
  return {
    '@context': (response['@context'] as string) || '',
    '@id': (response['@id'] as string) || '',
    '@type': (response['@type'] as string) || '',
    totalItems: (response['hydra:totalItems'] as number) || 0,
    member: (response['hydra:member'] as T[]) || [],
    view: (response['hydra:view'] as HydraView | null) || null,
    search: response['hydra:search'] as HydraSearch | undefined
  };
}
