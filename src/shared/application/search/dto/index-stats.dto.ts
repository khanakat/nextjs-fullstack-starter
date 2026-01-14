export interface IndexStatsDto {
  indexName: string;
  documentCount: number;
  storageSize: number;
  primaryShards: number;
  replicaShards: number;
  health: 'green' | 'yellow' | 'red';
  lastUpdated: string;
}
