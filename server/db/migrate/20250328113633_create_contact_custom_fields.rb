class CreateContactCustomFields < ActiveRecord::Migration[7.1]
    def change
        create_table :contact_custom_fields do |t|
            t.references :contact, null: true, foreign_key: true
            t.string :field_name
            t.text :field_value
        end
    end
end
