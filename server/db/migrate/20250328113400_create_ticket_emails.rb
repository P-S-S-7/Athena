class CreateTicketEmails < ActiveRecord::Migration[7.1]
    def change
        create_table :ticket_emails do |t|
            t.references :ticket, null: true, foreign_key: true
            t.string :email
            t.string :email_type
        end
    end
end
