class UpdateGroups < ActiveRecord::Migration[7.1]
  def change
    remove_column :groups, :auto_ticket_assign, :integer
    remove_column :groups, :business_hour_id, :integer
    remove_column :groups, :group_type, :string

    add_column :groups, :type, :string
    add_column :groups, :business_calendar_id, :bigint
    add_column :groups, :allow_agents_to_change_availability, :boolean
    add_column :groups, :agent_availability_status, :boolean
    add_column :groups, :automatic_agent_assignment, :boolean
    change_column :groups, :escalate_to, :bigint
  end
end
