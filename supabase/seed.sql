-- Shared taxonomy for local development.
-- User accounts, catalog records and activity start empty by design.

insert into public.genres (slug, name)
values
  ('accion', 'Acción'),
  ('aventura', 'Aventura'),
  ('drama', 'Drama'),
  ('fantasia', 'Fantasía'),
  ('ciencia-ficcion', 'Ciencia ficción')
on conflict do nothing;
