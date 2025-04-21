class Agent < ApplicationRecord
    has_many :tickets, foreign_key: 'responder_id', dependent: :nullify
    has_many :agent_group_mappings, dependent: :destroy
    has_many :groups, through: :agent_group_mappings
end
