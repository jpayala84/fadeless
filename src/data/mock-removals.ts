import type { RemovalEventDTO } from '@/lib/db/removal-repository';

export type DemoRemoval = RemovalEventDTO;

export const mockWeeklyRemovals: DemoRemoval[] = [
  {
    id: '1',
    trackId: '4iV5W9uYEdYUVa79Axb7Rh',
    trackName: 'Satellite (Acoustic)',
    artists: ['Maggie Rogers'],
    albumName: 'Notes from the Archive',
    playlistNames: ['Coding Flow', 'Sunday Reset'],
    playlistIds: ['demo-coding-flow', 'demo-sunday-reset'],
    removedAt: new Date('2024-07-15'),
    replacementTrackId: null,
    replacementTrackName: null
  },
  {
    id: '2',
    trackId: '6cfx6hBJPvwQBxLXGwSgAd',
    trackName: 'Seventeen (Re-Release)',
    artists: ['Sharon Van Etten'],
    albumName: 'Are We There (Deluxe)',
    playlistNames: ['Roadtrip 2022'],
    playlistIds: ['demo-roadtrip-2022'],
    removedAt: new Date('2024-07-17'),
    replacementTrackId: '6gU1kf4ZOOGc4Sztkekn3n',
    replacementTrackName: 'Seventeen (Remastered)'
  },
  {
    id: '3',
    trackId: '2FXd8t0m1w4ljA6zY7nd7Q',
    trackName: 'Golden Hour - Live at Electric Lady',
    artists: ['Kacey Musgraves'],
    albumName: 'Live Sessions',
    playlistNames: ['Curatorial Mix'],
    playlistIds: ['demo-curatorial-mix'],
    removedAt: new Date('2024-07-18'),
    replacementTrackId: null,
    replacementTrackName: null
  }
];

export const mockAllRemovals: DemoRemoval[] = [
  ...mockWeeklyRemovals,
  {
    id: '4',
    trackId: '5daB32nA2c7nEocHxVh9Yq',
    trackName: 'Right Down the Line',
    artists: ['Gerry Rafferty'],
    albumName: 'City to City (2011 Remaster)',
    playlistNames: ['Vinyl Nights'],
    playlistIds: ['demo-vinyl-nights'],
    removedAt: new Date('2024-06-22'),
    replacementTrackId: null,
    replacementTrackName: null
  },
  {
    id: '5',
    trackId: '0ZNU020wNYvgW84iljPkPP',
    trackName: 'Dancing in the Moonlight',
    artists: ['King Harvest'],
    albumName: 'Dancing in the Moonlight (Single)',
    playlistNames: ['Summer Forever', 'Cabin Campfire'],
    playlistIds: ['demo-summer-forever', 'demo-cabin-campfire'],
    removedAt: new Date('2024-05-30'),
    replacementTrackId: '11Fv1B8Z6xkIkd3lhcXQxo',
    replacementTrackName: 'Dancing in the Moonlight (2024 Mix)'
  }
];
