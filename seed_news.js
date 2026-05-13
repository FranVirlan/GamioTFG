import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing supabase credentials in env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const realNews = [
  {
    title: 'Valorant: Notas del Parche 12.09 y Cambios al Sistema MMR',
    summary: 'Riot Games introduce nerfeos significativos a Neon y ajustes a todas las escopetas para fomentar un juego más táctico.',
    tags: ['Actualizaciones', 'Parches', 'Valorant'],
    image: '/images/news/game_update_patch.png',
    content: 'El parche 12.09 de Valorant ya está aquí y trae consigo cambios que sacudirán el meta. Neon recibe un nerfeo importante a su habilidad "High Gear", reduciendo su evasión y movilidad. Además, todas las escopetas han sido ajustadas para ser menos efectivas al moverse y saltar. Riot también ha anunciado que el esperado sistema de repeticiones llegará en el próximo parche 12.10, permitiendo revisar partidas directamente desde el perfil de tus amigos.'
  },
  {
    title: 'League of Legends: Llega el Parche 26.10 con ajustes masivos',
    summary: 'Lee Sin recibe una actualización completa de su kit, mientras que el Emporio de Esencias Azules regresa temporalmente.',
    tags: ['Actualizaciones', 'League of Legends'],
    image: '/images/news/esports_tournament.png',
    content: 'La temporada 2026 continúa con el Parche 26.10 de League of Legends. El cambio más destacado es la modernización del kit de Lee Sin, que incluye ajustes en sus escudos y enfriamientos para adaptarlo al meta actual. Otros campeones como Ashe, Zed, Zeri y Galio también han recibido balances. Para los coleccionistas, el Emporio de Esencias ha vuelto y estará disponible hasta junio, trayendo consigo el nuevo título exclusivo "Big Serious Gamer".'
  },
  {
    title: 'Fortnite: Épica colaboración con Overwatch y Temporada 3',
    summary: 'D.Va, Genji, Tracer y Mercy llegan a la isla junto con armas y emotes temáticos de Overwatch.',
    tags: ['Actualizaciones', 'Fortnite'],
    image: '',
    content: 'Una de las colaboraciones más esperadas se ha hecho realidad. A partir del 14 de mayo, los jugadores de Fortnite podrán adquirir las skins de los icónicos héroes de Overwatch: D.Va, Genji, Tracer y Mercy. La actualización también incluye elementos de los mapas de Overwatch y nuevas armas míticas. Mientras tanto, la comunidad se prepara para el final del Capítulo 7 Temporada 2 "Showdown" y el inminente inicio de la Temporada 3 este próximo mes de junio.'
  },
  {
    title: 'EDward Gaming se corona campeón del VCT China Stage 1',
    summary: 'EDG derrota a Xi Lai Gaming en una final de infarto y asegura su pase al Masters de Londres.',
    tags: ['Esports', 'Torneos', 'Valorant'],
    image: '',
    content: 'El panorama competitivo de Valorant en China tiene un nuevo rey indiscutible. EDward Gaming (EDG) ha logrado asegurar la victoria en el VCT China Stage 1 tras derrotar a Xi Lai Gaming (XLG) en una espectacular gran final. Con este triunfo, EDG se posiciona como uno de los grandes favoritos para el próximo Masters de Londres. Riot Games también confirmó que a finales de año compartirán más detalles sobre la reestructuración del circuito VCT para 2027.'
  },
  {
    title: 'Guía EA FC 26: Formaciones y tácticas para Ultimate Team',
    summary: 'Domina el modo competitivo con esta guía detallada sobre el nuevo meta y las formaciones tradicionales.',
    tags: ['Guías', 'Estrategia', 'EA FC 26'],
    image: '',
    content: 'Con la llegada de la nueva temporada en EA FC 26, el meta ha evolucionado significativamente. En esta guía exploramos las formaciones más sólidas para Ultimate Team, haciendo especial énfasis en cómo adaptar tu estilo de juego al dinámico modo 5v5 Rush. Aprenderás a configurar las instrucciones de los jugadores para maximizar la presión alta sin dejar huecos en la defensa, y descubrirás qué perfiles de jugadores rinden mejor en el actual motor gráfico.'
  }
];

async function seed() {
  const { error: delError } = await supabase.from('news').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (delError) {
    console.error("Error deleting old news:", delError);
  }

  const { data, error } = await supabase.from('news').insert(realNews).select();
  if (error) {
    console.error("Error inserting real news:", error);
  } else {
    console.log("Successfully inserted real news into DB!");
  }
}

seed();
