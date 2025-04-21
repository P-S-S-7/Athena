class UpdateModels < ActiveRecord::Migration[7.1]
  def change
    remove_column :tickets, :source_additional_info, :text
    add_column :tickets, :deleted_at, :datetime
    add_column :tickets, :last_fetched_at, :datetime
    remove_column :contacts, :is_deleted, :boolean
  end
end
