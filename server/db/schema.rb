# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2025_04_14_052508) do
  create_table "agent_group_mappings", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.bigint "agent_id", null: false
    t.bigint "group_id", null: false
    t.index ["agent_id", "group_id"], name: "index_agent_group_mappings_on_agent_id_and_group_id", unique: true
    t.index ["agent_id"], name: "index_agent_group_mappings_on_agent_id"
    t.index ["group_id"], name: "index_agent_group_mappings_on_group_id"
  end

  create_table "agents", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.string "gid", limit: 36
    t.bigint "freshdesk_id"
    t.string "org_agent_id"
    t.boolean "available"
    t.boolean "occasional"
    t.integer "ticket_scope"
    t.datetime "last_active_at"
    t.datetime "available_since"
    t.string "agent_type"
    t.boolean "deactivated"
    t.text "signature"
    t.boolean "focus_mode"
    t.boolean "active"
    t.string "email"
    t.string "job_title"
    t.string "language"
    t.datetime "last_login_at"
    t.string "mobile"
    t.string "name"
    t.string "phone"
    t.string "time_zone"
    t.integer "scope"
    t.text "roles", size: :long, collation: "utf8mb4_bin"
    t.text "skills", size: :long, collation: "utf8mb4_bin"
    t.text "contribution_groups", size: :long, collation: "utf8mb4_bin"
    t.text "org_contribution_groups", size: :long, collation: "utf8mb4_bin"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.check_constraint "json_valid(`contribution_groups`)", name: "contribution_groups"
    t.check_constraint "json_valid(`org_contribution_groups`)", name: "org_contribution_groups"
    t.check_constraint "json_valid(`roles`)", name: "roles"
    t.check_constraint "json_valid(`skills`)", name: "skills"
  end

  create_table "avatars", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.string "name"
    t.string "content_type"
    t.integer "size"
    t.text "attachment_url"
    t.bigint "contact_id", null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.index ["contact_id"], name: "index_avatars_on_contact_id"
  end

  create_table "companies", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.string "gid", limit: 36
    t.bigint "freshdesk_id"
    t.string "name"
    t.text "description"
    t.text "note"
    t.string "health_score"
    t.string "account_tier"
    t.datetime "renewal_date"
    t.string "industry"
    t.string "org_company_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "company_custom_fields", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.bigint "company_id"
    t.string "field_name"
    t.text "field_value"
    t.index ["company_id"], name: "index_company_custom_fields_on_company_id"
  end

  create_table "company_domains", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.bigint "company_id"
    t.string "domain"
    t.index ["company_id"], name: "index_company_domains_on_company_id"
  end

  create_table "contact_custom_fields", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.bigint "contact_id"
    t.string "field_name"
    t.text "field_value"
    t.index ["contact_id"], name: "index_contact_custom_fields_on_contact_id"
  end

  create_table "contacts", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.string "gid", limit: 36
    t.bigint "freshdesk_id"
    t.boolean "active"
    t.text "address"
    t.text "description"
    t.string "job_title"
    t.string "language"
    t.string "name"
    t.string "email"
    t.bigint "mobile"
    t.bigint "phone"
    t.string "twitter_id"
    t.string "unique_external_id"
    t.string "preferred_source"
    t.string "time_zone"
    t.string "visitor_id"
    t.string "org_contact_id"
    t.text "other_emails", size: :long, collation: "utf8mb4_bin"
    t.text "other_companies", size: :long, collation: "utf8mb4_bin"
    t.text "other_phone_numbers", size: :long, collation: "utf8mb4_bin"
    t.text "tags", size: :long, collation: "utf8mb4_bin"
    t.bigint "company_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.index ["company_id"], name: "index_contacts_on_company_id"
    t.index ["email"], name: "index_contacts_on_email", unique: true
    t.index ["unique_external_id"], name: "index_contacts_on_unique_external_id", unique: true
    t.check_constraint "json_valid(`other_companies`)", name: "other_companies"
    t.check_constraint "json_valid(`other_emails`)", name: "other_emails"
    t.check_constraint "json_valid(`other_phone_numbers`)", name: "other_phone_numbers"
    t.check_constraint "json_valid(`tags`)", name: "tags"
  end

  create_table "groups", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.string "gid", limit: 36
    t.bigint "freshdesk_id"
    t.string "name"
    t.text "description"
    t.bigint "escalate_to"
    t.string "unassigned_for"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string "group_type"
    t.bigint "business_calendar_id"
    t.boolean "allow_agents_to_change_availability"
    t.boolean "agent_availability_status"
    t.boolean "automatic_agent_assignment"
  end

  create_table "ticket_custom_fields", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.bigint "ticket_id"
    t.string "field_name"
    t.text "field_value"
    t.index ["ticket_id"], name: "index_ticket_custom_fields_on_ticket_id"
  end

  create_table "ticket_emails", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.bigint "ticket_id"
    t.string "email"
    t.string "email_type"
    t.index ["ticket_id"], name: "index_ticket_emails_on_ticket_id"
  end

  create_table "ticket_tags", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.bigint "ticket_id"
    t.string "tag"
    t.index ["ticket_id"], name: "index_ticket_tags_on_ticket_id"
  end

  create_table "tickets", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.string "gid", limit: 36
    t.bigint "freshdesk_id"
    t.integer "priority"
    t.integer "source"
    t.integer "status"
    t.text "subject"
    t.string "ticket_type"
    t.datetime "due_by"
    t.datetime "fr_due_by"
    t.boolean "is_escalated"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.datetime "nr_due_by"
    t.boolean "nr_escalated"
    t.bigint "email_config_id"
    t.bigint "product_id"
    t.boolean "fr_escalated"
    t.boolean "spam"
    t.string "association_type"
    t.string "support_email"
    t.float "sentiment_score"
    t.float "initial_sentiment_score"
    t.boolean "is_deleted", default: false
    t.bigint "requester_id"
    t.bigint "responder_id"
    t.bigint "company_id"
    t.bigint "group_id"
    t.integer "associated_tickets_count"
    t.text "structured_description", size: :long
    t.datetime "deleted_at"
    t.datetime "last_fetched_at"
    t.index ["company_id"], name: "index_tickets_on_company_id"
    t.index ["group_id"], name: "index_tickets_on_group_id"
    t.index ["requester_id"], name: "index_tickets_on_requester_id"
    t.index ["responder_id"], name: "index_tickets_on_responder_id"
  end

  create_table "users", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "email", null: false
    t.string "full_name"
    t.string "avatar_url"
    t.string "provider"
    t.string "uid"
    t.integer "role", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "agent_group_mappings", "agents"
  add_foreign_key "agent_group_mappings", "groups"
  add_foreign_key "avatars", "contacts"
  add_foreign_key "company_custom_fields", "companies"
  add_foreign_key "company_domains", "companies"
  add_foreign_key "contact_custom_fields", "contacts"
  add_foreign_key "contacts", "companies"
  add_foreign_key "ticket_custom_fields", "tickets"
  add_foreign_key "ticket_emails", "tickets"
  add_foreign_key "ticket_tags", "tickets"
  add_foreign_key "tickets", "agents", column: "responder_id"
  add_foreign_key "tickets", "companies"
  add_foreign_key "tickets", "contacts", column: "requester_id"
  add_foreign_key "tickets", "groups"
end
