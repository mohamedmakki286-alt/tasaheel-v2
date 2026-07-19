-- Complete the workshop profile fields introduced after the initial schema.
-- This migration is additive and safe for the existing trial database.
alter table workshops add column if not exists description text;
alter table workshops add column if not exists logo_url varchar(255);
alter table workshops add column if not exists cover_image_url varchar(255);
alter table workshops add column if not exists whatsapp varchar(255);
alter table workshops add column if not exists website varchar(255);
alter table workshops add column if not exists instagram_url varchar(255);
alter table workshops add column if not exists x_url varchar(255);
alter table workshops add column if not exists youtube_url varchar(255);
alter table workshops add column if not exists features text;
alter table workshops add column if not exists beneficiary_name varchar(255);
alter table workshops add column if not exists bank_name varchar(255);
alter table workshops add column if not exists iban varchar(255);
alter table workshops add column if not exists tax_number varchar(255);
alter table workshops add column if not exists commission_percentage double precision;
alter table workshops add column if not exists admin_notes text;
alter table workshops add column if not exists contract_url varchar(255);
alter table workshops add column if not exists contract_signed_at date;
alter table workshops add column if not exists contract_expires_at date;
alter table workshops add column if not exists password_setup_completed boolean default false;
alter table workshops add column if not exists last_invitation_sent_at timestamp(6);
