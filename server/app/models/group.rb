class Group < ApplicationRecord
    has_many :tickets, dependent: :nullify
    has_many :agent_group_mappings, dependent: :destroy
    has_many :agents, through: :agent_group_mappings
end
