class WebhooksController < ApplicationController
    def initialize
        super
        @ticket_service_freshdesk = Freshdesk::TicketService.new
        @company_service_freshdesk = Freshdesk::CompanyService.new
        @contact_service_freshdesk = Freshdesk::ContactService.new

        @ticket_service_db = Db::TicketService.new
        @company_service_db = Db::CompanyService.new
        @contact_service_db = Db::ContactService.new
    end

    def freshdesk
        begin
            payload = JSON.parse(request.body.read)

            if payload.dig("freshdesk_webhook", "triggered_event")
                event = payload.dig("freshdesk_webhook", "triggered_event")

                if event.include?("ticket_action:created")
                    handle_ticket_created(payload)
                elsif event.include?("note_type:private") || event.include?("note_type:public")
                    handle_note_created(payload)
                elsif event.include?("reply_sent:sent")
                    handle_reply_sent(payload)
                end
            end

            puts "Freshdesk Webhook Received: #{payload}"
            render json: { message: "Webhook received successfully" }, status: :ok
        rescue JSON::ParserError => e
            puts "JSON Parsing Error: #{e.message}"
            render json: { error: "Invalid JSON format" }, status: :bad_request
        rescue StandardError => e
            puts "Error processing webhook: #{e.message}"
            render json: { error: e.message }, status: :internal_server_error
        end
    end

    private

    def handle_ticket_created(payload)
        ticket_id = payload.dig("freshdesk_webhook", "ticket_id")
        db_ticket = Ticket.find_by(freshdesk_id: ticket_id)

        if db_ticket.nil?
            freshdesk_ticket = @ticket_service_freshdesk.get_ticket(ticket_id)

            if freshdesk_ticket['company_id'].present?
                company = handle_company(freshdesk_ticket['company_id'])
                freshdesk_ticket['company_id'] = company&.id
            end

            if freshdesk_ticket['requester_id'].present?
                requester = handle_contact(freshdesk_ticket['requester_id'])
                freshdesk_ticket['requester_id'] = requester&.id
            end

            if freshdesk_ticket['responder_id'].present?
                freshdesk_ticket['responder_id'] = Agent.find_by(freshdesk_id: freshdesk_ticket['responder_id'])&.id
            end

            if freshdesk_ticket['group_id'].present?
                freshdesk_ticket['group_id'] = Group.find_by(freshdesk_id: freshdesk_ticket['group_id'])&.id
            end

            @ticket_service_db.create_ticket_from_freshdesk(freshdesk_ticket)
        end
    end

    def handle_note_created(payload)
        ticket_id = payload.dig("freshdesk_webhook", "ticket_id")
        handle_new_conversation(ticket_id, 2)
    end

    def handle_reply_sent(payload)
        ticket_id = payload.dig("freshdesk_webhook", "ticket_id")
        handle_new_conversation(ticket_id, 0)
    end

    def handle_new_conversation(freshdesk_ticket_id, source)
        conversations = @ticket_service_freshdesk.get_conversations(freshdesk_ticket_id).as_json
        latest_conversation = conversations.sort_by { |c| Time.parse(c['created_at']) }.last

        db_conversation = Conversation.find_by(freshdesk_id: latest_conversation['id'])

        if db_conversation.nil?
            user_id = Contact.find_by(freshdesk_id: latest_conversation['user_id'])&.id
            user_id ||= Agent.find_by(freshdesk_id: latest_conversation['user_id'])&.id
            latest_conversation['user_id'] = user_id

            ticket = Ticket.find_by(freshdesk_id: freshdesk_ticket_id)
            latest_conversation['ticket_id'] = ticket&.id

            if latest_conversation['ticket_id'].present?
                @ticket_service_db.create_conversation(latest_conversation, latest_conversation['ticket_id'], source)
            end
        end
    end

    def handle_company(freshdesk_company_id)
        company = Company.find_by(freshdesk_id: freshdesk_company_id)

        if company.nil?
            freshdesk_company = @company_service_freshdesk.get_company(freshdesk_company_id)
            company = @company_service_db.create_company_from_freshdesk(freshdesk_company)
        end

        company
    end

    def handle_contact(freshdesk_contact_id)
        contact = Contact.find_by(freshdesk_id: freshdesk_contact_id)

        if contact.nil?
            freshdesk_contact = @contact_service_freshdesk.get_contact(freshdesk_contact_id)

            if freshdesk_contact['company_id'].present?
                company = Company.find_by(freshdesk_id: freshdesk_contact['company_id'])
                freshdesk_contact['company_id'] = company&.id
            end

            contact = @contact_service_db.create_contact_from_freshdesk(freshdesk_contact)
        end

        contact
    end
end
