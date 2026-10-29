import type { ChurchMeetingType, SeedOriginChannel } from "@/server/domain/mvp";
import { SEED_ORIGIN_CHANNELS, SEED_ORIGIN_CHANNEL_LABELS } from "@/lib/seed-origin";
import { Button, Card, CardBody, CardHeader, Input, Select } from "@/ui/atalaia";
import type { DashSegment } from "@/ui/coord/dashboard/segments";

type Props = {
  segment: DashSegment;
  period: string;
  referenceDate: string;
  availableStates: string[];
  state: string;
  stateCities: string[];
  city: string;
  cityTenants: Array<{ id: string; name: string }>;
  tenantId: string;
  origin: SeedOriginChannel | null;
  /** Tipos de reunião: só são carregados (e mostrados) no segmento Igreja. */
  meetingTypes: ChurchMeetingType[];
  meetingTypeId: string;
  format: string;
  /** Resumo textual do recorte aplicado. */
  scopeLabel: string;
  exportHref: string;
};

/**
 * Barra de recorte única: um filtro só, válido para a página inteira e preservado na troca de
 * segmento. É um formulário GET para `/coord`, então funciona sem JavaScript e vira link salvável.
 * "Aplicar" é neutro de propósito: a única ação primária da página é "Novo contato".
 */
export function RecorteBar({
  segment,
  period,
  referenceDate,
  availableStates,
  state,
  stateCities,
  city,
  cityTenants,
  tenantId,
  origin,
  meetingTypes,
  meetingTypeId,
  format,
  scopeLabel,
  exportHref,
}: Props) {
  return (
    <Card aria-labelledby="recorte-heading" className="mb-4">
      <CardHeader id="recorte-heading" title="Recorte da página" meta={scopeLabel} />
      <CardBody>
        <form
          action="/coord"
          aria-label="Filtros do recorte"
          className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] items-end gap-3"
        >
          <input type="hidden" name="seg" value={segment} />
          <Select label="Período" name="period" defaultValue={period}>
            <option value="day">Dia</option>
            <option value="week">Semana</option>
            <option value="month">Mês</option>
          </Select>
          <Input label="Data" type="date" name="date" defaultValue={referenceDate} />
          <Select label="Estado" name="state" defaultValue={state}>
            {availableStates.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select label="Cidade" name="city" defaultValue={city}>
            <option value="">Todas</option>
            {stateCities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select label="Localidade" name="tenantId" defaultValue={tenantId}>
            <option value="">Todas</option>
            {cityTenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </Select>
          <Select label="Origem" name="origin" defaultValue={origin ?? ""}>
            <option value="">Todas</option>
            {SEED_ORIGIN_CHANNELS.map((channel) => (
              <option key={channel} value={channel}>
                {SEED_ORIGIN_CHANNEL_LABELS[channel]}
              </option>
            ))}
          </Select>
          {segment === "igreja" ? (
            <Select label="Tipo de reunião" name="meetingTypeId" defaultValue={meetingTypeId}>
              <option value="">Todos os tipos</option>
              {meetingTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Select>
          ) : meetingTypeId ? (
            // O seletor só faz sentido na Igreja, mas o formulário envia apenas os campos presentes:
            // sem este oculto, "Aplicar" descartaria o tipo de reunião que a troca de segmento preserva.
            <input type="hidden" name="meetingTypeId" value={meetingTypeId} />
          ) : null}
          <Select label="Relatório" name="format" defaultValue={format}>
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </Select>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" icon="filter">
              Aplicar
            </Button>
            <Button href={exportHref} icon="doc">
              Exportar
            </Button>
          </div>
        </form>
        <p className="mt-3 text-xs text-muted">
          A origem filtra contatos (Aquisição, Cuidado e o mapa). Cartões marcados como “retrato de agora” não seguem o período.
        </p>
      </CardBody>
    </Card>
  );
}
