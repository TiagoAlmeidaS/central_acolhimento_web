"use client";

import { Card, CardBody, CardHeader } from "@/ui/atalaia";

export function PanelShell({
  title,
  description,
  children,
}: Readonly<{
  title: string;
  description: string;
  children: React.ReactNode;
}>) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody>
        <p className="mb-4 text-muted">{description}</p>
        {children}
      </CardBody>
    </Card>
  );
}
