class CreateCompanies < ActiveRecord::Migration[7.1]
    def change
        create_table :companies do |t|
            t.string :gid, limit: 36
            t.bigint :freshdesk_id
            t.string :name
            t.text :description
            t.text :note
            t.string :health_score
            t.string :account_tier
            t.datetime :renewal_date
            t.string :industry
            t.string :org_company_id
            t.json :domains
            t.datetime :created_at
            t.datetime :updated_at
        end
    end
end
