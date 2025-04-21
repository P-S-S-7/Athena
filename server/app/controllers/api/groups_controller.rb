module Api
    class GroupsController < ApplicationController
        def index
            groups = Group.all
            render json: { groups: groups }
        end

        def show
            group = Group.find_by(id: params[:id])
            agent_ids = AgentGroupMapping.where(group_id: group.id).pluck(:agent_id)
            group = group.as_json
            group = group.merge(agent_ids: agent_ids) if group.present?
            render json: { group: group }
        end
    end
end
