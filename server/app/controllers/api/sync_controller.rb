module Api
    class SyncController < ApplicationController
        before_action :authenticate_user!

        def sync_all
            sync_service = Freshdesk::SyncService.new
            company_result = sync_service.sync_companies
            contact_result = sync_service.sync_contacts
            agent_result = sync_service.sync_agents
            group_result = sync_service.sync_groups
            ticket_result = sync_service.sync_tickets
            canned_response_result = sync_service.sync_canned_responses

            render json: {
                companies: company_result,
                contacts: contact_result,
                agents: agent_result,
                groups: group_result,
                tickets: ticket_result,
                canned_responses: canned_response_result
            }
        end
    end
end
