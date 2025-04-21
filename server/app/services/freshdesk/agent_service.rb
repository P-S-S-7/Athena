module Freshdesk
    class AgentService
        def initialize
            @client = ApiClient.new
        end
    end
end
