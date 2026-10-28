"use client";

import { Button } from "@/ui/atalaia";

export function DailyOutingReportActions({ tenantId, version }: { tenantId: string; version: string }) {
  function printReport() {
    console.info("daily_outing_report_print_requested", { tenantId, version });
    window.print();
  }

  return (
    <div className="report-actions">
      <Button type="button" variant="primary" icon="doc" onClick={printReport}>
        Imprimir / salvar PDF
      </Button>
    </div>
  );
}
