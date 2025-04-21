class RenameTypeToGroupTypeInGroups < ActiveRecord::Migration[7.1]
  def change
    rename_column :groups, :type, :group_type
  end
end
