class CreateContacts < ActiveRecord::Migration[7.1]
    def change
        create_table :contacts do |t|
            t.string :gid, limit: 36
            t.bigint :freshdesk_id
            t.boolean :active
            t.text :address
            t.text :description
            t.string :job_title
            t.string :language
            t.string :name
            t.string :email
            t.bigint :mobile
            t.bigint :phone
            t.string :twitter_id
            t.string :unique_external_id
            t.string :preferred_source
            t.string :time_zone
            t.string :visitor_id
            t.string :org_contact_id
            t.boolean :is_deleted, default: false
            t.json :other_emails
            t.json :other_companies
            t.json :other_phone_numbers
            t.json :tags
            t.references :company, null: true, foreign_key: true
            t.datetime :created_at
            t.datetime :updated_at
        end

        add_index :contacts, :email, unique: true
        add_index :contacts, :unique_external_id, unique: true
    end
end
