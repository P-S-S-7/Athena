module Api
    class AgentsController < ApplicationController
        def index
            agent_service = Freshdesk::AgentService.new
            agents = agent_service.list_agents
            render json: { agents: agents }
        end
    end
end
