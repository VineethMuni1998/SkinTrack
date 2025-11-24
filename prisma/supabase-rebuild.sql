-- Reset and recreate the SkinTrack backend schema on Supabase/Postgres.
-- Run this in Supabase SQL editor or via psql after setting DATABASE_URL.

begin;

-- Drop existing tables to allow a clean rebuild.
drop table if exists "Analysis" cascade;
drop table if exists "Photo" cascade;
drop table if exists "RoutineProduct" cascade;
drop table if exists "Routine" cascade;
drop table if exists "Product" cascade;
drop table if exists "VerificationToken" cascade;
drop table if exists "Session" cascade;
drop table if exists "Account" cascade;
drop table if exists "User" cascade;
drop type if exists "RoutineTimeOfDay" cascade;

-- Enums
create type "RoutineTimeOfDay" as enum ('MORNING', 'NIGHT', 'BOTH');
create type "SkinType" as enum ('DRY', 'OILY', 'COMBINATION', 'NORMAL');

-- Core tables
create table "User" (
    "id" text primary key,
    "email" text not null unique,
    "password" text not null,
    "name" text,
    "emailVerified" timestamp(3),
    "image" text,
    "age" integer,
    "dateOfBirth" timestamp(3),
    "skinType" "SkinType",
    "createdAt" timestamp(3) not null default current_timestamp,
    "updatedAt" timestamp(3) not null
);

create table "Account" (
    "id" text primary key,
    "userId" text not null,
    "type" text not null,
    "provider" text not null,
    "providerAccountId" text not null,
    "refresh_token" text,
    "access_token" text,
    "expires_at" integer,
    "token_type" text,
    "scope" text,
    "id_token" text,
    "session_state" text,
    constraint "Account_provider_providerAccountId_key" unique ("provider", "providerAccountId"),
    constraint "Account_userId_fkey" foreign key ("userId") references "User"("id") on delete cascade on update cascade
);

create table "Session" (
    "id" text primary key,
    "sessionToken" text not null unique,
    "userId" text not null,
    "expires" timestamp(3) not null,
    constraint "Session_userId_fkey" foreign key ("userId") references "User"("id") on delete cascade on update cascade
);

create table "VerificationToken" (
    "identifier" text not null,
    "token" text not null,
    "expires" timestamp(3) not null,
    constraint "VerificationToken_token_key" unique ("token"),
    constraint "VerificationToken_identifier_token_key" unique ("identifier", "token")
);

create table "Product" (
    "id" text primary key,
    "name" text not null,
    "brand" text,
    "ingredients" text,
    "category" text,
    "createdAt" timestamp(3) not null default current_timestamp
);

create table "Routine" (
    "id" text primary key,
    "userId" text not null,
    "name" text,
    "startDate" timestamp(3) not null default current_timestamp,
    "status" text not null default 'active',
    "createdAt" timestamp(3) not null default current_timestamp,
    "updatedAt" timestamp(3) not null,
    constraint "Routine_userId_fkey" foreign key ("userId") references "User"("id") on delete cascade on update cascade
);

create table "RoutineProduct" (
    "id" text primary key,
    "routineId" text not null,
    "productId" text not null,
    "addedAt" timestamp(3) not null default current_timestamp,
    "removedAt" timestamp(3),
    "removalReason" text,
    "timeOfDay" "RoutineTimeOfDay" not null default 'MORNING',
    "expectedResultsTimeframe" text,
    "stepOrder" integer not null default 0,
    "skipDays" text[] not null default array[]::text[],
    constraint "RoutineProduct_routineId_productId_addedAt_key" unique ("routineId", "productId", "addedAt"),
    constraint "RoutineProduct_routineId_fkey" foreign key ("routineId") references "Routine"("id") on delete cascade on update cascade,
    constraint "RoutineProduct_productId_fkey" foreign key ("productId") references "Product"("id") on delete cascade on update cascade
);

create table "Photo" (
    "id" text primary key,
    "userId" text not null,
    "routineId" text,
    "routineProductId" text,
    "url" text not null,
    "type" text not null,
    "takenAt" timestamp(3) not null default current_timestamp,
    "createdAt" timestamp(3) not null default current_timestamp,
    constraint "Photo_userId_fkey" foreign key ("userId") references "User"("id") on delete cascade on update cascade,
    constraint "Photo_routineId_fkey" foreign key ("routineId") references "Routine"("id") on delete cascade on update cascade
);

create table "Analysis" (
    "id" text primary key,
    "routineId" text not null,
    "products" jsonb not null,
    "timeline" jsonb not null,
    "interactions" jsonb not null,
    "recommendations" jsonb not null,
    "createdAt" timestamp(3) not null default current_timestamp,
    constraint "Analysis_routineId_fkey" foreign key ("routineId") references "Routine"("id") on delete cascade on update cascade
);

commit;

-- Optional: insert a test user (password hash needs bcrypt). Run only if you need seed data.
-- insert into "User" ("id","email","password","createdAt","updatedAt")
-- values ('test-user-id','test@example.com','$2a$10$examplehash...nowNRUlJx1i','now()','now()');
