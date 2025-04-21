class CreateTickets < ActiveRecord::Migration[7.1]
    def change
        create_table :tickets do |t|
            t.string :gid, limit: 36
            t.bigint :freshdesk_id
            t.integer :priority
            t.integer :source
            t.integer :status
            t.text :subject
            t.string :ticket_type
            t.datetime :due_by
            t.datetime :fr_due_by
            t.boolean :is_escalated
            t.datetime :created_at
            t.datetime :updated_at
            t.datetime :nr_due_by
            t.boolean :nr_escalated
            t.integer :email_config_id
            t.integer :product_id
            t.boolean :fr_escalated
            t.boolean :spam
            t.string :association_type
            t.string :support_email
            t.float :sentiment_score
            t.float :initial_sentiment_score
            t.text :source_additional_info
            t.boolean :is_deleted, default: false
            t.references :requester, foreign_key: { to_table: :contacts }, null: true
            t.references :responder, foreign_key: { to_table: :agents }, null: true
            t.references :company, null: true, foreign_key: true
            t.references :group, null: true, foreign_key: true
        end
    end
end
