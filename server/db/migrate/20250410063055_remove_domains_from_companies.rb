class RemoveDomainsFromCompanies < ActiveRecord::Migration[7.1]
  def change
    remove_column :companies, :domains, :json
  end
end
