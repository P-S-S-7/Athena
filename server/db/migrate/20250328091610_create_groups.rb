class CreateGroups < ActiveRecord::Migration[7.1]
    def change
        create_table :groups do |t|
            t.string :gid, limit: 36
            t.bigint :freshdesk_id
            t.string :name
            t.text :description
            t.integer :escalate_to
            t.string :unassigned_for
            t.integer :business_hour_id
            t.string :group_type
            t.integer :auto_ticket_assign
            t.datetime :created_at
            t.datetime :updated_at
        end
    end
end
