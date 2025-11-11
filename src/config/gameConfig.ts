// Game configuration for Match-3 Candy Crush
export const GAME_CONFIG = {
  GRID_SIZE: 8,
  GEM_TYPES: 6,
  GEM_SYMBOLS: ['💖', '👑', '💎', '🦋', '⭐', '🌸'],
  MATCH_MIN: 3,
  
  // Special candies
  SPECIAL_TYPES: {
    STRIPED_H: 'striped_h',
    STRIPED_V: 'striped_v',
    WRAPPED: 'wrapped',
    COLOR_BOMB: 'color_bomb',
  },
  
  // Obstacles
  OBSTACLE_TYPES: {
    ICE: 'ice',
    LOCK: 'lock',
    STONE: 'stone',
    MONSTER: 'monster',
  },
  
  // Levels configuration (1-20)
  LEVELS: Array.from({ length: 20 }, (_, i) => ({
    level: i + 1,
    moves: 30 - Math.floor(i / 5) * 2,
    targetScore: 1000 + i * 500,
    obstacles: i > 4 ? ['ice', 'lock'] : [],
    hasMonster: (i + 1) % 5 === 0,
    monsterHealth: Math.floor((i + 1) / 5) * 100,
  })),
};

export const FU_TOKEN_CONFIG = {
  CONTRACT_ADDRESS: '0x8bD5796A709663BDC2279b87fFdA3214f0ea078B',
  DECIMALS: 18,
  SYMBOL: 'F.U',
  NAME: 'Fun Profile Token',
};

export const TREASURY_ADDRESS = '0x000000000000000000000000000000000000dEaD';

export const SHOP_CONFIG = {
  THUNDER_HAMMER: { name: 'Búa Sấm ⚡', price: 5, description: 'Phá 1 ô bất kỳ' },
  RAINBOW: { name: 'Cầu Vồng 🌈', price: 12, description: 'Xóa tất cả 1 loại gem' },
  ROYAL_WIND: { name: 'Gió Hoàng Gia 🌪️', price: 10, description: 'Xóa 1 hàng hoặc cột' },
  EXTRA_MOVES: { name: '+5 Lượt ➕', price: 6, description: 'Thêm 5 lượt chơi' },
  ICE_BREAKER: { name: 'Băng Hộ Mệnh ❄️', price: 8, description: 'Phá băng/khóa hàng loạt' },
};
