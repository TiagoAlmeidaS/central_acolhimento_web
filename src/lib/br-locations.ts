/**
 * Fonte única de verdade para estados brasileiros e cidades por UF.
 * Usado por TenantManager, MemberManager e qualquer outro formulário
 * que precise de localização brasileira.
 */

export const ESTADOS_BRASIL: string[] = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF",
  "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS",
  "RO", "RR", "SC", "SP", "SE", "TO",
];

/**
 * Cidades agrupadas por UF.
 * Inclui: capitais de todos os estados + cidades operacionais da Central (PB) +
 * principais municípios por população (> 200 mil hab.).
 */
export const CIDADES_POR_ESTADO: Record<string, string[]> = {
  AC: ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira", "Tarauacá", "Feijó"],
  AL: ["Maceió", "Arapiraca", "Rio Largo", "Palmeira dos Índios", "Penedo", "União dos Palmares"],
  AP: ["Macapá", "Santana", "Laranjal do Jari", "Oiapoque", "Mazagão"],
  AM: ["Manaus", "Parintins", "Itacoatiara", "Manacapuru", "Tefé", "Coari"],
  BA: [
    "Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari",
    "Itabuna", "Juazeiro", "Lauro de Freitas", "Ilhéus", "Jequié", "Barreiras",
    "Alagoinhas", "Porto Seguro",
  ],
  CE: [
    "Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú", "Sobral",
    "Crato", "Itapipoca", "Maranguape", "Iguatu", "Quixadá",
  ],
  DF: ["Brasília", "Taguatinga", "Ceilândia", "Samambaia", "Plano Piloto"],
  ES: ["Vitória", "Vila Velha", "Serra", "Cariacica", "Cachoeiro de Itapemirim", "Linhares", "São Mateus"],
  GO: [
    "Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde",
    "Luziânia", "Águas Lindas de Goiás", "Valparaíso de Goiás", "Catalão",
  ],
  MA: ["São Luís", "Imperatriz", "São José de Ribamar", "Timon", "Caxias", "Codó", "Paço do Lumiar"],
  MT: ["Cuiabá", "Várzea Grande", "Rondonópolis", "Sinop", "Tangará da Serra", "Cáceres"],
  MS: ["Campo Grande", "Dourados", "Três Lagoas", "Corumbá", "Grande Dourados", "Ponta Porã"],
  MG: [
    "Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim",
    "Montes Claros", "Ribeirão das Neves", "Uberaba", "Governador Valadares",
    "Ipatinga", "Sete Lagoas", "Divinópolis", "Santa Luzia", "Ibirité",
  ],
  PA: [
    "Belém", "Ananindeua", "Santarém", "Marabá", "Castanhal",
    "Parauapebas", "Altamira", "Abaetetuba", "Cametá", "Bragança",
  ],
  PB: [
    "João Pessoa", "Campina Grande", "Guarabira", "Cabedelo", "Bayeux",
    "Santa Rita", "Rio Tinto", "Mamaguape", "Cruz do Espírito Santo",
    "Sapé", "Mari", "Sobrado", "Caldas Brandão", "Gurinhém", "Mulungu",
    "Alagoinha", "Araçagi", "Itabaiana", "Pilar", "Bananeiras", "Solânea",
    "Patos", "Sousa", "Cajazeiras", "Pombal", "Monteiro", "Sumé",
  ],
  PR: [
    "Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel",
    "São José dos Pinhais", "Foz do Iguaçu", "Colombo", "Guarapuava", "Paranaguá",
  ],
  PE: [
    "Recife", "Caruaru", "Petrolina", "Olinda", "Paulista",
    "Jaboatão dos Guararapes", "Gravatá", "Vitória de Santo Antão", "Garanhuns",
  ],
  PI: ["Teresina", "Parnaíba", "Picos", "Piripiri", "Floriano", "Campo Maior"],
  RJ: [
    "Rio de Janeiro", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu",
    "Niterói", "Belford Roxo", "São João de Meriti", "Petrópolis",
    "Volta Redonda", "Macaé", "Campos dos Goytacazes",
  ],
  RN: ["Natal", "Mossoró", "Parnamirim", "São Gonçalo do Amarante", "Macaíba", "Caicó"],
  RS: [
    "Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Santa Maria",
    "Gravataí", "Viamão", "Novo Hamburgo", "São Leopoldo", "Rio Grande",
  ],
  RO: ["Porto Velho", "Ji-Paraná", "Ariquemes", "Vilhena", "Cacoal", "Rolim de Moura"],
  RR: ["Boa Vista", "Caracaraí", "Rorainópolis", "Alto Alegre"],
  SC: [
    "Florianópolis", "Joinville", "Blumenau", "São José", "Chapecó",
    "Itajaí", "Criciúma", "Jaraguá do Sul", "Palhoça", "Lages",
  ],
  SP: [
    "São Paulo", "Guarulhos", "Campinas", "São Bernardo do Campo", "Santo André",
    "Osasco", "São José dos Campos", "Ribeirão Preto", "Sorocaba", "Mauá",
    "Santos", "São José do Rio Preto", "Mogi das Cruzes", "Diadema",
    "Jundiaí", "Carapicuíba", "Piracicaba", "Bauru",
  ],
  SE: ["Aracaju", "Nossa Senhora do Socorro", "Lagarto", "Itabaiana", "São Cristóvão"],
  TO: ["Palmas", "Araguaína", "Gurupi", "Porto Nacional", "Paraíso do Tocantins"],
};

/**
 * Lista completa de todas as cidades, ordenada alfabeticamente.
 * Usada como fallback quando nenhum estado está selecionado.
 */
export const ALL_CIDADES: string[] = Object.values(CIDADES_POR_ESTADO)
  .flat()
  .sort((a, b) => a.localeCompare(b, "pt-BR"));

/**
 * Retorna a lista de cidades para um dado estado.
 * Se o estado não tiver mapeamento, retorna ALL_CIDADES como fallback.
 */
export function getCidadesByEstado(estado: string): string[] {
  if (!estado) return ALL_CIDADES;
  return CIDADES_POR_ESTADO[estado] ?? ALL_CIDADES;
}
