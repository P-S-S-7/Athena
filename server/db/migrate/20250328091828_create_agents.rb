class CreateAgents < ActiveRecord::Migration[7.1]
    def change
        create_table :agents do |t|
            t.string :gid, limit: 36
            t.bigint :freshdesk_id
            t.string :org_agent_id
            t.boolean :available
            t.boolean :occasional
            t.integer :ticket_scope
            t.datetime :last_active_at
            t.datetime :available_since
            t.string :agent_type
            t.boolean :deactivated
            t.text :signature
            t.boolean :focus_mode
            t.boolean :active
            t.string :email
            t.string :job_title
            t.string :language
            t.datetime :last_login_at
            t.string :mobile
            t.string :name
            t.string :phone
            t.string :time_zone
            t.integer :scope
            t.json :roles
            t.json :skills
            t.json :contribution_groups
            t.json :org_contribution_groups
            t.datetime :created_at
            t.datetime :updated_at
        end
    end
end
