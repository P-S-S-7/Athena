module Api
    class AgentsController < ApplicationController
        def index
            agents = Agent.all
            render json: { agents: agents }
        end
    end
end
