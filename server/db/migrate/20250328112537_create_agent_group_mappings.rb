class CreateAgentGroupMappings < ActiveRecord::Migration[7.1]
    def change
        create_table :agent_group_mappings do |t|
            t.references :agent, null: false, foreign_key: true
            t.references :group, null: false, foreign_key: true
        end

        add_index :agent_group_mappings, [:agent_id, :group_id], unique: true
    end
end
