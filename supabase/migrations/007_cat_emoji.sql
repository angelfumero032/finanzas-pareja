-- Migration 007: Añadir campo icono (emoji) a categorías
alter table categorias
  add column if not exists icono text;

comment on column categorias.icono is
  'Emoji o icono corto (1-2 caracteres) para identificar visualmente la categoría';
