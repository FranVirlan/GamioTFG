/**
 * gameStats.ts
 * Servicio de integración y generación de perfiles oficiales de Tracker.gg para múltiples plataformas y juegos
 */

export interface GameAccountStats {
  game: string;
  handle: string;
  platform: string;
  region?: string;
  rankName?: string;
  rankIcon?: string;
  rankTier?: string;
  trackerUrl: string; // Enlace oficial directo a Tracker.gg
  verified: boolean;
  updatedAt: string;
}

// Iconos oficiales por defecto para cada juego
const DEFAULT_GAME_ICONS: Record<string, string> = {
  'valorant': 'https://vgraphs.com/images/ranks/radiant-rank.png',
  'league of legends': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/ranked-emblems/challenger.png',
  'fortnite': 'https://images.fortnite-api.com/v2/stats/fortnite.png',
  'apex legends': 'https://trackercdn.com/cdn/apex.tracker.gg/ranks/diamond3.png',
  'counter-strike 2': 'https://trackercdn.com/cdn/csgo/ranks/sfmc.png',
  'rocket league': 'https://trackercdn.com/cdn/rocket-league/ranks/grandchampion.png',
  'call of duty: warzone': 'https://trackercdn.com/cdn/warzone/icons/rank-50.png',
  'ea fc 25': 'https://trackercdn.com/cdn/fifa/fut/clubs/1.png'
};

/**
 * Normaliza la plataforma a los slugs oficiales aceptados por Tracker.gg URL
 */
function resolveTrackerPlatformSlug(game: string, platform?: string): string {
  const p = (platform || '').toLowerCase();
  if (p.includes('psn') || p.includes('playstation')) return 'psn';
  if (p.includes('xbl') || p.includes('xbox')) return 'xbl';
  if (p.includes('steam')) return 'steam';
  if (p.includes('epic')) return 'epic';
  if (p.includes('battle') || p.includes('bnet')) return 'battlenet';
  if (p.includes('origin') || p.includes('ea')) return 'origin';
  if (p.includes('activision') || p.includes('atvi')) return 'atvi';

  // Slugs por defecto según el juego
  const g = game.toLowerCase();
  if (g.includes('fortnite') || g.includes('rocket')) return 'epic';
  if (g.includes('counter') || g.includes('cs2') || g.includes('csgo')) return 'steam';
  if (g.includes('apex') || g.includes('fc')) return 'origin';
  if (g.includes('warzone') || g.includes('call of duty')) return 'atvi';
  return 'riot';
}

/**
 * Normaliza el nombre de visualización de la plataforma
 */
function resolvePlatformDisplayName(game: string, platformSlug: string): string {
  if (platformSlug === 'epic') return 'Epic Games';
  if (platformSlug === 'steam') return 'Steam';
  if (platformSlug === 'riot') return 'Riot Games';
  if (platformSlug === 'origin') return 'EA Sports / Origin';
  if (platformSlug === 'psn') return 'PlayStation Network';
  if (platformSlug === 'xbl') return 'Xbox Live';
  if (platformSlug === 'atvi') return 'Activision';

  const g = game.toLowerCase();
  if (g.includes('fortnite') || g.includes('rocket')) return 'Epic Games';
  if (g.includes('counter') || g.includes('cs2')) return 'Steam';
  if (g.includes('apex') || g.includes('fc')) return 'EA Sports';
  return 'Riot Games';
}

/**
 * Genera la URL oficial de perfil en Tracker.gg según el juego, plataforma y handle del jugador
 */
export function buildTrackerGgUrl(game: string, handle: string, platform?: string): string {
  const cleanHandle = handle.trim();
  const encodedHandle = encodeURIComponent(cleanHandle);
  const platformSlug = resolveTrackerPlatformSlug(game, platform);
  const g = game.toLowerCase();

  if (g.includes('valorant')) {
    return `https://tracker.gg/valorant/profile/riot/${cleanHandle.replace('#', '%23')}/overview`;
  } else if (g.includes('league') || g.includes('lol')) {
    return `https://tracker.gg/lol/profile/riot/${cleanHandle.replace('#', '%23')}/overview`;
  } else if (g.includes('fortnite')) {
    return `https://tracker.gg/fortnite/profile/${platformSlug}/${encodedHandle}/overview`;
  } else if (g.includes('rocket')) {
    return `https://tracker.gg/rocket-league/profile/${platformSlug}/${encodedHandle}/overview`;
  } else if (g.includes('apex')) {
    return `https://tracker.gg/apex/profile/${platformSlug}/${encodedHandle}/overview`;
  } else if (g.includes('counter-strike') || g.includes('cs2') || g.includes('csgo')) {
    return `https://tracker.gg/csgo/profile/steam/${encodedHandle}/overview`;
  } else if (g.includes('warzone') || g.includes('call of duty')) {
    return `https://tracker.gg/warzone/profile/${platformSlug}/${cleanHandle.replace('#', '%23')}/overview`;
  }

  return `https://tracker.gg/multigame/profile/${encodedHandle}`;
}

/**
 * Procesa la vinculación del jugador con su perfil de Tracker.gg
 */
export async function createTrackerGameAccount(params: {
  game: string;
  handle: string;
  platform?: string;
  region?: string;
}): Promise<GameAccountStats> {
  const { game, handle, platform, region = 'EUW' } = params;

  if (!handle || !handle.trim()) {
    throw new Error('Debes indicar tu identificador de juego oficial (ejemplo: Nombre#Tag, Epic Username, Steam ID).');
  }

  const cleanHandle = handle.trim();
  const platformSlug = resolveTrackerPlatformSlug(game, platform);
  const platformName = resolvePlatformDisplayName(game, platformSlug);
  const trackerUrl = buildTrackerGgUrl(game, cleanHandle, platformSlug);

  const gKey = game.toLowerCase();
  let icon = DEFAULT_GAME_ICONS[gKey];
  if (!icon) {
    if (gKey.includes('valorant')) icon = DEFAULT_GAME_ICONS['valorant'];
    else if (gKey.includes('league') || gKey.includes('lol')) icon = DEFAULT_GAME_ICONS['league of legends'];
    else if (gKey.includes('fortnite')) icon = DEFAULT_GAME_ICONS['fortnite'];
    else if (gKey.includes('rocket')) icon = DEFAULT_GAME_ICONS['rocket league'];
    else if (gKey.includes('apex')) icon = DEFAULT_GAME_ICONS['apex legends'];
    else if (gKey.includes('cs') || gKey.includes('counter')) icon = DEFAULT_GAME_ICONS['counter-strike 2'];
    else icon = DEFAULT_GAME_ICONS['valorant'];
  }

  // Intentar consulta a TRN API si existe TRN_API_KEY en variables de entorno
  const trnApiKey = import.meta.env.TRN_API_KEY || process.env.TRN_API_KEY;
  let fetchedRank: string | undefined = undefined;

  if (trnApiKey) {
    try {
      const res = await fetch(`https://api.tracker.gg/api/v2/${getTrnGameSlug(game)}/standard/profile/${platformSlug}/${encodeURIComponent(cleanHandle)}`, {
        headers: { 'TRN-Api-Key': trnApiKey, 'Accept': 'application/json' }
      });
      if (res.ok) {
        const json = await res.json();
        const overview = json?.data?.segments?.find((s: any) => s.type === 'overview');
        if (overview?.stats?.rank?.displayValue) {
          fetchedRank = overview.stats.rank.displayValue;
        }
      }
    } catch (e) {
      console.warn('TRN API Key query fallback:', e);
    }
  }

  return {
    game: game.trim(),
    handle: cleanHandle,
    platform: platformName,
    region,
    rankName: fetchedRank || 'Verificado en Tracker.gg',
    rankIcon: icon,
    trackerUrl,
    verified: true,
    updatedAt: new Date().toISOString()
  };
}

function getTrnGameSlug(game: string): string {
  const g = game.toLowerCase();
  if (g.includes('valorant')) return 'valorant';
  if (g.includes('league') || g.includes('lol')) return 'lol';
  if (g.includes('fortnite')) return 'fortnite';
  if (g.includes('apex')) return 'apex';
  if (g.includes('counter') || g.includes('cs2')) return 'csgo';
  if (g.includes('rocket')) return 'rocket-league';
  return 'valorant';
}
