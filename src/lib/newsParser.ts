/**
 * newsParser.ts
 * Parser RSS en servidor para Eurogamer.es con categorización inteligente para Gamio.
 */

export interface NewsItem {
  id?: string;
  title: string;
  summary: string;
  tags: string[];
  created_at: string; // Usamos ISO String compatible con la base de datos
  image: string;
  content: string;
  link: string;
  matchedGames: string[];
}

const gameKeywords: Record<string, string[]> = {
  "League of Legends": ["league of legends", "lol", "riot games", "summoner's rift", "wild rift", "arcane", "summoner"],
  "Valorant": ["valorant", "vct", "riot games", "vct emea", "tactical shooter"],
  "Counter-Strike 2": ["counter-strike", "cs2", "cs:go", "global offensive", "valve", "steam deck", "source 2"],
  "Dead By Daylight": ["dead by daylight", "dbd", "behaviour", "killer", "survivor", "auric cells", "células áuricas"],
  "Fortnite": ["fortnite", "pavos", "battle royale", "epic games", "v-bucks"],
  "Apex Legends": ["apex legends", "apex", "respawn", "ea games"],
  "Overwatch 2": ["overwatch", "blizzard"],
  "Call of Duty: Warzone": ["call of duty", "warzone", "cod", "activision", "modern warfare", "black ops"],
  "Rocket League": ["rocket league", "psyonix", "epic games"],
  "EA FC 25": ["ea sports fc", "ea fc", "fifa", "fc 25", "fc25", "ultimate team", "ea sports"]
};

/**
 * Decodifica entidades HTML habituales de RSS y texto en español.
 */
function decodeHtmlEntities(str: string): string {
  const entities: Record<string, string> = {
    '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú',
    '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó', '&Uacute;': 'Ú',
    '&ntilde;': 'ñ', '&Ntilde;': 'Ñ', '&uuml;': 'ü', '&Uuml;': 'Ü',
    '&ldquo;': '"', '&rdquo;': '"', '&lsquo;': "'", '&rsquo;': "'",
    '&quot;': '"', '&apos;': "'", '&#039;': "'", '&amp;': '&',
    '&lt;': '<', '&gt;': '>', '&nbsp;': ' ', '&middot;': '·',
    '&bull;': '•', '&hellip;': '...', '&ndash;': '–', '&mdash;': '—',
    '&iquot;': '"', '&iquest;': '¿', '&iexcl;': '¡', '&deg;': '°',
    '&reg;': '®', '&copy;': '©'
  };
  
  return str.replace(/&[a-zA-Z0-9#]+;/g, (match) => {
    if (entities[match]) return entities[match];
    if (match.startsWith('&#')) {
      const code = parseInt(match.slice(2, -1));
      if (!isNaN(code)) return String.fromCharCode(code);
    }
    return match;
  });
}

/**
 * Limpia el texto de la descripción del RSS, quitando tags HTML,
 * la imagen inicial que incluye Eurogamer y terminaciones como "Leer más".
 */
function cleanDescription(html: string): string {
  if (!html) return '';

  // 1. Quitar etiquetas <img> completas
  let text = html.replace(/<img[^>]*>/gi, '');
  
  // 2. Quitar enlaces del estilo "Leer más"
  text = text.replace(/<a[^>]*>Leer más<\/a>/gi, '');
  
  // 3. Quitar cualquier etiqueta HTML restante
  text = text.replace(/<\/?[^>]+(>|$)/g, '');
  
  // 4. Decodificar entidades HTML
  text = decodeHtmlEntities(text);
  
  // 5. Limpieza general de espaciado y colas redundantes
  text = text.trim();
  text = text.replace(/\s*Leer más\s*$/i, '');
  
  return text;
}

/**
 * Consulta el feed RSS de Eurogamer.es y realiza el análisis inteligente.
 */
export async function fetchAndParseNews(timeoutMs = 6000): Promise<NewsItem[]> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch('https://www.eurogamer.es/feed/news', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'GamioNewsAggregator/1.0 (Web App)'
      }
    });

    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`Error en respuesta HTTP: ${response.status}`);
    }

    const xml = await response.text();
    const items: NewsItem[] = [];

    // Regex global para extraer los items de forma ágil y compatible con SSR sin dependencias XML
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemContent = match[1];

      // 1. Extraer título
      const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:]]>)?<\/title>/i);
      const rawTitle = titleMatch ? titleMatch[1].trim() : '';
      const title = decodeHtmlEntities(rawTitle);

      // 2. Extraer enlace original
      const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/i);
      const link = linkMatch ? linkMatch[1].trim() : '';

      // 3. Extraer fecha de publicación
      const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
      const pubDateStr = pubDateMatch ? pubDateMatch[1].trim() : '';
      let created_at = new Date().toISOString();
      if (pubDateStr) {
        const parsedDate = new Date(pubDateStr);
        if (!isNaN(parsedDate.getTime())) {
          created_at = parsedDate.toISOString();
        }
      }

      // 4. Extraer imagen (Media Content o fallback de la descripción)
      let image = '';
      const mediaMatch = itemContent.match(/<media:content[^>]+url=["']([^"']+)["']/i);
      if (mediaMatch) {
        image = mediaMatch[1].replace(/&amp;/g, '&');
      } else {
        const imgInDesc = itemContent.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgInDesc) {
          image = imgInDesc[1].replace(/&amp;/g, '&');
        }
      }

      // 5. Extraer descripción / resumen
      const descMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/i);
      let rawDesc = descMatch ? descMatch[1].trim() : '';
      if (rawDesc.startsWith('<![CDATA[')) {
        rawDesc = rawDesc.replace(/^<!\[CDATA\[/, '').replace(/]]>$/, '');
      }
      const summary = cleanDescription(rawDesc);

      // 6. Extraer categorías originales del feed como tags
      const originalTags: string[] = [];
      const categoryRegex = /<category>(?:<!\[CDATA\[)?([\s\S]*?)(?:]]>)?<\/category>/gi;
      let catMatch;
      while ((catMatch = categoryRegex.exec(itemContent)) !== null) {
        originalTags.push(decodeHtmlEntities(catMatch[1].trim()));
      }

      // 7. Mapeo inteligente con nuestro diccionario de 10 juegos
      const matchedGames: string[] = [];
      const searchString = `${title} ${summary} ${originalTags.join(' ')}`.toLowerCase();

      for (const [game, keywords] of Object.entries(gameKeywords)) {
        const hasKeyword = keywords.some(keyword => searchString.includes(keyword.toLowerCase()));
        if (hasKeyword) {
          matchedGames.push(game);
        }
      }

      // Consolidar tags finales (las categorías de Eurogamer o las de nuestro mapeo)
      // Mantenemos categorías principales y agregamos la del juego mapeado para que la UI lo pinte espectacular
      const finalTags = matchedGames.length > 0 ? [...matchedGames] : originalTags.slice(0, 3);

      items.push({
        title,
        summary,
        tags: finalTags,
        created_at,
        image,
        content: summary, // Usamos la descripción limpia como contenido
        link,
        matchedGames
      });
    }

    return items;
  } catch (error) {
    console.error("Error al consultar o parsear el feed RSS de Eurogamer.es:", error);
    return []; // Retorna un array vacío para que el componente gestiones el fallback
  }
}
