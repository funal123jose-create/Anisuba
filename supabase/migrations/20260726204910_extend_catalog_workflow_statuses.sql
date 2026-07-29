-- Workflow enum changes live in their own committed migration because a newly
-- added PostgreSQL enum value cannot be referenced safely in the same
-- transaction that introduces it.

alter type public.catalog_record_status
  add value if not exists 'in_review' after 'draft';

alter type public.catalog_record_status
  add value if not exists 'rejected' after 'in_review';
