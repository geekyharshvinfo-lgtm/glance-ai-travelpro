// Chat starter tile type and data

export interface ChatStarterTile {
  id: string;
  icon: string;
  iconKey: string;
  title: string;
  subtitle: string;
  gradient: {
    from: string;
    to: string;
  };
  action: string;
}

import starterTilesJson from './chatStarterTiles.json';

export const starterTiles: ChatStarterTile[] = starterTilesJson.starterTiles;

export default {
  starterTiles,
};
