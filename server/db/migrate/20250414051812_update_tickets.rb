class UpdateTickets < ActiveRecord::Migration[7.1]
  def change
    change_column :tickets, :email_config_id, :bigint
    change_column :tickets, :product_id, :bigint
    add_column :tickets, :associated_tickets_count, :integer
    add_column :tickets, :structured_description, :longtext
  end
end
