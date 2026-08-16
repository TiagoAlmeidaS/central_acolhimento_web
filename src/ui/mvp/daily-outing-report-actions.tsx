"use client";

import { Button } from "@/ui/v2-components/ui";
import { IconDoc } from "@/ui/v2-components/icons";

export function DailyOutingReportActions({ tenantId, version }: { tenantId: string; version: string }) {
  function printReport() {
    console.info("daily_outing_report_print_requested", { tenantId, version });
    window.print();
  }

  return (
    <div className="report-actions">
      <Button type="button" variant="primary" size="md" icon={<IconDoc />} onClick={printReport}>
        Imprimir / salvar PDF
      </Button>
    </div>
  );
}
