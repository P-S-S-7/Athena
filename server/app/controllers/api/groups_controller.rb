module Api
    class GroupsController < ApplicationController
        def index
            group_service = Freshdesk::GroupService.new
            groups = group_service.list_groups
            render json: { groups: groups }
        end

        def show
            group_service = Freshdesk::GroupService.new
            group = group_service.get_group(params[:id])
            render json: { group: group }
        end
    end
end
