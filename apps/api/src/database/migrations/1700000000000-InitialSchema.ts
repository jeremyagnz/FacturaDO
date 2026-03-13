import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Users table
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('super_admin', 'admin', 'accountant', 'viewer');
      CREATE TYPE "user_status_enum" AS ENUM ('active', 'inactive', 'pending', 'suspended');

      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "name" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'viewer',
        "status" "user_status_enum" NOT NULL DEFAULT 'pending',
        "phone" varchar(20),
        "email_verified" boolean NOT NULL DEFAULT false,
        "email_verification_token" varchar(255),
        "last_login_at" TIMESTAMPTZ,
        "metadata" jsonb,
        CONSTRAINT "pk_users" PRIMARY KEY ("id"),
        CONSTRAINT "uq_users_email" UNIQUE ("email")
      );
      CREATE INDEX "idx_users_email" ON "users" ("email");
    `);

    // Refresh tokens table
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "token" varchar(512) NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "is_revoked" boolean NOT NULL DEFAULT false,
        "ip_address" varchar(45),
        "user_agent" varchar(255),
        "user_id" uuid NOT NULL,
        CONSTRAINT "pk_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "fk_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
      CREATE INDEX "idx_refresh_tokens_token" ON "refresh_tokens" ("token");
      CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id");
    `);

    // Companies table
    await queryRunner.query(`
      CREATE TYPE "company_status_enum" AS ENUM ('active', 'inactive', 'suspended', 'pending_approval');
      CREATE TYPE "tax_regime_enum" AS ENUM ('ordinario', 'simplificado', 'rst');

      CREATE TABLE "companies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "name" varchar(255) NOT NULL,
        "rnc" varchar(11) NOT NULL,
        "commercial_name" varchar(255),
        "status" "company_status_enum" NOT NULL DEFAULT 'pending_approval',
        "tax_regime" "tax_regime_enum" NOT NULL DEFAULT 'ordinario',
        "address" varchar(500),
        "city" varchar(100),
        "phone" varchar(20),
        "email" varchar(255),
        "website" varchar(255),
        "logo_url" varchar(255),
        "certificate_path" varchar(255),
        "certificate_password" varchar(255),
        "dgii_registered" boolean NOT NULL DEFAULT false,
        "settings" jsonb,
        "metadata" jsonb,
        CONSTRAINT "pk_companies" PRIMARY KEY ("id"),
        CONSTRAINT "uq_companies_rnc" UNIQUE ("rnc")
      );
      CREATE INDEX "idx_companies_rnc" ON "companies" ("rnc");
    `);

    // User-Company junction table
    await queryRunner.query(`
      CREATE TABLE "user_companies" (
        "user_id" uuid NOT NULL,
        "company_id" uuid NOT NULL,
        CONSTRAINT "pk_user_companies" PRIMARY KEY ("user_id", "company_id"),
        CONSTRAINT "fk_user_companies_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user_companies_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
      );
    `);

    // Invoices table
    await queryRunner.query(`
      CREATE TYPE "ecf_type_enum" AS ENUM ('31', '32', '33', '34', '41', '43', '44', '45', '46', '47');
      CREATE TYPE "invoice_status_enum" AS ENUM ('draft', 'signed', 'submitted', 'accepted', 'rejected', 'cancelled');
      CREATE TYPE "payment_method_enum" AS ENUM ('efectivo', 'cheque', 'transferencia', 'tarjeta_credito', 'tarjeta_debito', 'credito', 'bono', 'permuta', 'otro');

      CREATE TABLE "invoices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "company_id" uuid NOT NULL,
        "ecf_number" varchar(50),
        "ecf_type" "ecf_type_enum" NOT NULL,
        "status" "invoice_status_enum" NOT NULL DEFAULT 'draft',
        "issue_date" date NOT NULL,
        "due_date" date,
        "buyer_rnc" varchar(11),
        "buyer_name" varchar(255),
        "buyer_address" varchar(500),
        "buyer_email" varchar(255),
        "subtotal" numeric(18, 2) NOT NULL DEFAULT 0,
        "tax_amount" numeric(18, 2) NOT NULL DEFAULT 0,
        "discount_amount" numeric(18, 2) NOT NULL DEFAULT 0,
        "total_amount" numeric(18, 2) NOT NULL DEFAULT 0,
        "currency" varchar(3) NOT NULL DEFAULT 'DOP',
        "exchange_rate" numeric(10, 6) NOT NULL DEFAULT 1,
        "payment_method" "payment_method_enum" NOT NULL DEFAULT 'credito',
        "digital_signature" text,
        "signed_at" TIMESTAMPTZ,
        "dgii_tracking_id" varchar(255),
        "submitted_at" TIMESTAMPTZ,
        "accepted_at" TIMESTAMPTZ,
        "dgii_response" jsonb,
        "xml_path" varchar(512),
        "pdf_path" varchar(512),
        "notes" text,
        "metadata" jsonb,
        CONSTRAINT "pk_invoices" PRIMARY KEY ("id"),
        CONSTRAINT "fk_invoices_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
      );
      CREATE INDEX "idx_invoices_company_id" ON "invoices" ("company_id");
      CREATE INDEX "idx_invoices_ecf_number" ON "invoices" ("ecf_number");
      CREATE INDEX "idx_invoices_status" ON "invoices" ("status");
      CREATE INDEX "idx_invoices_issue_date" ON "invoices" ("issue_date");
      CREATE UNIQUE INDEX "uq_invoices_company_ecf" ON "invoices" ("company_id", "ecf_number") WHERE "ecf_number" IS NOT NULL;
    `);

    // Invoice items table
    await queryRunner.query(`
      CREATE TABLE "invoice_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "invoice_id" uuid NOT NULL,
        "line_number" integer NOT NULL,
        "code" varchar(100),
        "description" varchar(1000) NOT NULL,
        "quantity" numeric(18, 4) NOT NULL DEFAULT 1,
        "unit" varchar(50),
        "unit_price" numeric(18, 4) NOT NULL,
        "tax_rate" numeric(5, 2) NOT NULL DEFAULT 18,
        "discount_rate" numeric(5, 2) NOT NULL DEFAULT 0,
        "subtotal" numeric(18, 2) NOT NULL,
        "tax_amount" numeric(18, 2) NOT NULL,
        "discount_amount" numeric(18, 2) NOT NULL,
        "total_amount" numeric(18, 2) NOT NULL,
        CONSTRAINT "pk_invoice_items" PRIMARY KEY ("id"),
        CONSTRAINT "fk_invoice_items_invoice" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE
      );
      CREATE INDEX "idx_invoice_items_invoice_id" ON "invoice_items" ("invoice_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "invoice_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_companies" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "companies" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);

    await queryRunner.query(`DROP TYPE IF EXISTS "ecf_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "invoice_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_method_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "company_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tax_regime_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_status_enum"`);
  }
}
