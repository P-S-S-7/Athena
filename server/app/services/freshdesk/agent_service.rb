module Freshdesk
    class AgentService
        def initialize
            @client = ApiClient.new
        end

        def list_agents
            @client.request(:get, '/agents')
        end
    end
end
