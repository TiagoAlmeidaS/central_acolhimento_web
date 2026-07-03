-- Seed inicial do MVP do monolito
-- Compatível com 20260702220000_create_mvp_monolith_schema.sql

DO $$
DECLARE
  tenant_sape UUID;
  tenant_mari UUID;
  caregiver_maria UUID;
  caregiver_joao UUID;
  seed_gabriel UUID;
  member_gabriel UUID;
  member_ana UUID;
BEGIN
  INSERT INTO public.tenants (name, city, state, status, coordinator_name)
  SELECT 'Central Sapé', 'Sapé', 'PB', 'active', 'Tiago'
  WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE name = 'Central Sapé');

  INSERT INTO public.tenants (name, city, state, status, coordinator_name)
  SELECT 'Central Mari', 'Mari', 'PB', 'active', 'Priscila'
  WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE name = 'Central Mari');

  SELECT id INTO tenant_sape FROM public.tenants WHERE name = 'Central Sapé' LIMIT 1;
  SELECT id INTO tenant_mari FROM public.tenants WHERE name = 'Central Mari' LIMIT 1;

  INSERT INTO public.caregivers (tenant_id, name, phone, email, active, notes)
  SELECT tenant_sape, 'Maria Oliveira', '(83) 99999-1111', 'maria@igreja.org', TRUE, 'Cuidadora base da demo'
  WHERE NOT EXISTS (SELECT 1 FROM public.caregivers WHERE email = 'maria@igreja.org');

  INSERT INTO public.caregivers (tenant_id, name, phone, email, active, notes)
  SELECT tenant_mari, 'João Silva', '(83) 99999-2222', 'joao@igreja.org', TRUE, 'Cuidador base da demo'
  WHERE NOT EXISTS (SELECT 1 FROM public.caregivers WHERE email = 'joao@igreja.org');

  SELECT id INTO caregiver_maria FROM public.caregivers WHERE email = 'maria@igreja.org' LIMIT 1;
  SELECT id INTO caregiver_joao FROM public.caregivers WHERE email = 'joao@igreja.org' LIMIT 1;

  INSERT INTO public.seeds (tenant_id, reference_name, source, status, notes, first_contact_at)
  SELECT tenant_sape, 'Gabriel Santos', 'Culto de domingo', 'contacted', 'Indicacao inicial para acompanhamento', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM public.seeds WHERE reference_name = 'Gabriel Santos');

  SELECT id INTO seed_gabriel FROM public.seeds WHERE reference_name = 'Gabriel Santos' LIMIT 1;

  INSERT INTO public.members (tenant_id, caregiver_id, seed_id, name, phone, address, city, status, notes)
  SELECT tenant_sape, caregiver_maria, seed_gabriel, 'Gabriel Santos', '(83) 98888-1111', 'Rua das Flores, 123', 'Sapé', 'in_progress', 'Primeira pessoa acompanhada na demo'
  WHERE NOT EXISTS (SELECT 1 FROM public.members WHERE name = 'Gabriel Santos');

  INSERT INTO public.members (tenant_id, caregiver_id, seed_id, name, phone, address, city, status, notes)
  SELECT tenant_mari, caregiver_joao, NULL, 'Ana Souza', '(83) 98888-2222', 'Rua Nova, 45', 'Mari', 'new', 'Aguardando primeira visita'
  WHERE NOT EXISTS (SELECT 1 FROM public.members WHERE name = 'Ana Souza');

  SELECT id INTO member_gabriel FROM public.members WHERE name = 'Gabriel Santos' LIMIT 1;
  SELECT id INTO member_ana FROM public.members WHERE name = 'Ana Souza' LIMIT 1;

  INSERT INTO public.followups (tenant_id, member_id, caregiver_id, type, occurred_at, notes, next_action_at)
  SELECT tenant_sape, member_gabriel, caregiver_maria, 'call', NOW() - INTERVAL '1 day', 'Ligação feita. Receptivo e aberto para próxima conversa.', NOW() + INTERVAL '6 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.followups WHERE member_id = member_gabriel AND notes = 'Ligação feita. Receptivo e aberto para próxima conversa.'
  );

  INSERT INTO public.followups (tenant_id, member_id, caregiver_id, type, occurred_at, notes, next_action_at)
  SELECT tenant_mari, member_ana, caregiver_joao, 'visit', NOW() - INTERVAL '2 days', 'Primeira visita agendada com o cuidador local.', NOW() + INTERVAL '3 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.followups WHERE member_id = member_ana AND notes = 'Primeira visita agendada com o cuidador local.'
  );
END $$;
