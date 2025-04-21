class AgentGroupMapping < ApplicationRecord
    belongs_to :agent
    belongs_to :group
end
