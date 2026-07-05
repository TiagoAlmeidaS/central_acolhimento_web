-- Seed inicial do MVP do monolito
-- Credenciais de demo:
-- tiago@igreja.org / 12345678
-- maria@igreja.org / 12345678
-- joao@igreja.org / 12345678

DO $$
DECLARE
  tenant_sape UUID;
  tenant_mari UUID;
  app_user_tiago UUID;
  app_user_maria UUID;
  app_user_joao UUID;
  tenant_user_tiago_sape UUID;
  tenant_user_tiago_mari UUID;
  tenant_user_maria UUID;
  tenant_user_joao UUID;
  caregiver_maria UUID;
  caregiver_joao UUID;
  seed_gabriel UUID;
  member_gabriel UUID;
  member_ana UUID;
BEGIN
  DELETE FROM public.followups
  WHERE member_id IN (
    SELECT id FROM public.members WHERE name IN ('Gabriel Santos', 'Ana Souza', 'Teste Cache')
  );

  DELETE FROM public.members
  WHERE name IN ('Gabriel Santos', 'Ana Souza', 'Teste Cache');

  DELETE FROM public.seeds
  WHERE reference_name IN ('Gabriel Santos', 'Teste Cache');

  DELETE FROM public.caregivers
  WHERE email IN ('maria@igreja.org', 'joao@igreja.org');

  DELETE FROM public.tenant_users
  WHERE lower(email) IN (lower('tiago@igreja.org'), lower('maria@igreja.org'), lower('joao@igreja.org'));

  DELETE FROM public.app_users
  WHERE lower(email) IN (lower('tiago@igreja.org'), lower('maria@igreja.org'), lower('joao@igreja.org'));

  DELETE FROM public.tenants
  WHERE name IN ('Central Sape', 'Central Sapé', 'Central Mari');

  INSERT INTO public.tenants (name, city, state, status, coordinator_name)
  SELECT 'Central Sape', 'Sape', 'PB', 'active', 'Tiago Almeida'
  WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE name = 'Central Sape');

  INSERT INTO public.tenants (name, city, state, status, coordinator_name)
  SELECT 'Central Mari', 'Mari', 'PB', 'active', 'Priscila'
  WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE name = 'Central Mari');

  SELECT id INTO tenant_sape FROM public.tenants WHERE name = 'Central Sape' LIMIT 1;
  SELECT id INTO tenant_mari FROM public.tenants WHERE name = 'Central Mari' LIMIT 1;

  INSERT INTO public.app_users (first_name, last_name, email, phone, password_hash, active)
  SELECT 'Tiago', 'Almeida', 'tiago@igreja.org', '(83) 99999-0001',
    '99472bd6938fb6ca73c0958e5ab3d4f6:c4eb33439927a78c3b73116fab5b75839d337b426f7e67be1d8832fe6c645f495899f8f8691238d064fb8c620e62e73534eb6c3fcd663a1bacdf5986fe0dc8a4',
    TRUE
  WHERE NOT EXISTS (SELECT 1 FROM public.app_users WHERE lower(email) = lower('tiago@igreja.org'));

  INSERT INTO public.app_users (first_name, last_name, email, phone, password_hash, active)
  SELECT 'Maria', 'Oliveira', 'maria@igreja.org', '(83) 99999-1111',
    '0165d0399735da6858b350fd82721287:d46ae1173571be026e08ee378161b70984fc5de829b0407eae6dbd9c3622c2030c6deb2a5ef1fc3b713b92808e03fd62c5ab5847023b82ba5ed1b8c8547ef7a8',
    TRUE
  WHERE NOT EXISTS (SELECT 1 FROM public.app_users WHERE lower(email) = lower('maria@igreja.org'));

  INSERT INTO public.app_users (first_name, last_name, email, phone, password_hash, active)
  SELECT 'Joao', 'Silva', 'joao@igreja.org', '(83) 99999-2222',
    '03cf7589f6cdadef157bf4209401e343:cd549f5581e6612b2a3acb5e932b2e6e29e956172c5ad47f37bd26ee85f2d37b7b759204b1f11f90fd3b0b60d46e797bd55440447af976dae5bfbee9daf5eb89',
    TRUE
  WHERE NOT EXISTS (SELECT 1 FROM public.app_users WHERE lower(email) = lower('joao@igreja.org'));

  SELECT id INTO app_user_tiago FROM public.app_users WHERE lower(email) = lower('tiago@igreja.org') LIMIT 1;
  SELECT id INTO app_user_maria FROM public.app_users WHERE lower(email) = lower('maria@igreja.org') LIMIT 1;
  SELECT id INTO app_user_joao FROM public.app_users WHERE lower(email) = lower('joao@igreja.org') LIMIT 1;

  INSERT INTO public.tenant_users (tenant_id, auth_user_id, app_user_id, name, email, role, active)
  SELECT tenant_sape, app_user_tiago::text, app_user_tiago, 'Tiago Almeida', 'tiago@igreja.org', 'coordinator', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM public.tenant_users WHERE tenant_id = tenant_sape AND app_user_id = app_user_tiago AND role = 'coordinator'
  );

  INSERT INTO public.tenant_users (tenant_id, auth_user_id, app_user_id, name, email, role, active)
  SELECT tenant_mari, app_user_tiago::text, app_user_tiago, 'Tiago Almeida', 'tiago@igreja.org', 'coordinator', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM public.tenant_users WHERE tenant_id = tenant_mari AND app_user_id = app_user_tiago AND role = 'coordinator'
  );

  INSERT INTO public.tenant_users (tenant_id, auth_user_id, app_user_id, name, email, role, active)
  SELECT tenant_sape, app_user_maria::text, app_user_maria, 'Maria Oliveira', 'maria@igreja.org', 'caregiver', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM public.tenant_users WHERE tenant_id = tenant_sape AND app_user_id = app_user_maria AND role = 'caregiver'
  );

  INSERT INTO public.tenant_users (tenant_id, auth_user_id, app_user_id, name, email, role, active)
  SELECT tenant_mari, app_user_joao::text, app_user_joao, 'Joao Silva', 'joao@igreja.org', 'caregiver', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM public.tenant_users WHERE tenant_id = tenant_mari AND app_user_id = app_user_joao AND role = 'caregiver'
  );

  SELECT id INTO tenant_user_tiago_sape FROM public.tenant_users WHERE tenant_id = tenant_sape AND app_user_id = app_user_tiago LIMIT 1;
  SELECT id INTO tenant_user_tiago_mari FROM public.tenant_users WHERE tenant_id = tenant_mari AND app_user_id = app_user_tiago LIMIT 1;
  SELECT id INTO tenant_user_maria FROM public.tenant_users WHERE tenant_id = tenant_sape AND app_user_id = app_user_maria LIMIT 1;
  SELECT id INTO tenant_user_joao FROM public.tenant_users WHERE tenant_id = tenant_mari AND app_user_id = app_user_joao LIMIT 1;

  INSERT INTO public.caregivers (tenant_id, tenant_user_id, name, phone, email, active, notes)
  SELECT tenant_sape, tenant_user_maria, 'Maria Oliveira', '(83) 99999-1111', 'maria@igreja.org', TRUE, 'Cuidadora base da demo'
  WHERE NOT EXISTS (SELECT 1 FROM public.caregivers WHERE email = 'maria@igreja.org');

  INSERT INTO public.caregivers (tenant_id, tenant_user_id, name, phone, email, active, notes)
  SELECT tenant_mari, tenant_user_joao, 'Joao Silva', '(83) 99999-2222', 'joao@igreja.org', TRUE, 'Cuidador base da demo'
  WHERE NOT EXISTS (SELECT 1 FROM public.caregivers WHERE email = 'joao@igreja.org');

  UPDATE public.caregivers
    SET tenant_user_id = tenant_user_maria
  WHERE email = 'maria@igreja.org' AND tenant_user_id IS DISTINCT FROM tenant_user_maria;

  UPDATE public.caregivers
    SET tenant_user_id = tenant_user_joao
  WHERE email = 'joao@igreja.org' AND tenant_user_id IS DISTINCT FROM tenant_user_joao;

  SELECT id INTO caregiver_maria FROM public.caregivers WHERE email = 'maria@igreja.org' LIMIT 1;
  SELECT id INTO caregiver_joao FROM public.caregivers WHERE email = 'joao@igreja.org' LIMIT 1;

  INSERT INTO public.seeds (tenant_id, caregiver_id, reference_name, phone, city, source, status, notes, first_contact_at)
  SELECT tenant_sape, caregiver_maria, 'Gabriel Santos', '(83) 98888-1111', 'Sape', 'Culto de domingo', 'contacted', 'Indicacao inicial para acompanhamento', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM public.seeds WHERE reference_name = 'Gabriel Santos');

  SELECT id INTO seed_gabriel FROM public.seeds WHERE reference_name = 'Gabriel Santos' LIMIT 1;

  INSERT INTO public.members (tenant_id, caregiver_id, seed_id, name, phone, address, city, status, notes)
  SELECT tenant_sape, caregiver_maria, seed_gabriel, 'Gabriel Santos', '(83) 98888-1111', 'Rua das Flores, 123', 'Sape', 'in_progress', 'Primeira pessoa acompanhada na demo'
  WHERE NOT EXISTS (SELECT 1 FROM public.members WHERE name = 'Gabriel Santos');

  INSERT INTO public.members (tenant_id, caregiver_id, seed_id, name, phone, address, city, status, notes)
  SELECT tenant_mari, caregiver_joao, NULL, 'Ana Souza', '(83) 98888-2222', 'Rua Nova, 45', 'Mari', 'new', 'Aguardando primeira visita'
  WHERE NOT EXISTS (SELECT 1 FROM public.members WHERE name = 'Ana Souza');

  SELECT id INTO member_gabriel FROM public.members WHERE name = 'Gabriel Santos' LIMIT 1;
  SELECT id INTO member_ana FROM public.members WHERE name = 'Ana Souza' LIMIT 1;

  INSERT INTO public.followups (tenant_id, member_id, caregiver_id, type, occurred_at, notes, next_action_at)
  SELECT tenant_sape, member_gabriel, caregiver_maria, 'call', NOW() - INTERVAL '1 day', 'Ligacao feita. Receptivo e aberto para proxima conversa.', NOW() + INTERVAL '6 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.followups WHERE member_id = member_gabriel AND notes = 'Ligacao feita. Receptivo e aberto para proxima conversa.'
  );

  INSERT INTO public.followups (tenant_id, member_id, caregiver_id, type, occurred_at, notes, next_action_at)
  SELECT tenant_mari, member_ana, caregiver_joao, 'visit', NOW() - INTERVAL '2 days', 'Primeira visita agendada com o cuidador local.', NOW() + INTERVAL '3 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.followups WHERE member_id = member_ana AND notes = 'Primeira visita agendada com o cuidador local.'
  );
END $$;
