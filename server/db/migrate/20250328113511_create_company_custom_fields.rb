class CreateCompanyCustomFields < ActiveRecord::Migration[7.1]
    def change
        create_table :company_custom_fields do |t|
            t.references :company, null: true, foreign_key: true
            t.string :field_name
            t.text :field_value
        end
    end
end
