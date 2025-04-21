class CreateCompanyDomains < ActiveRecord::Migration[7.1]
  def change
    create_table :company_domains do |t|
      t.references :company, null: true, foreign_key: true
      t.string :domain
    end
  end
end
