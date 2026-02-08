export interface MediaItem {
  '@context'?: string;     // JSON-LD context
  '@id': string;           // The IRI identifier for the media item
  '@type': string;         // The JSON-LD type
  id: string;              // The local ID
  filename: string;
  mimeType: string;
  filePath: string;
  fileSize?: number | null;
  createdAt: string;
  updatedAt: string;
}
