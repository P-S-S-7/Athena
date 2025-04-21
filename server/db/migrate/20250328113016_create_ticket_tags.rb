class CreateTicketTags < ActiveRecord::Migration[7.1]
    def change
        create_table :ticket_tags do |t|
            t.references :ticket, null: true, foreign_key: true
            t.string :tag
        end
    end
end
