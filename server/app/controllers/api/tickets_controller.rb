require 'csv'

module Api
    class TicketsController < ApplicationController
        def initialize
            super
            @freshdesk_service = Freshdesk::TicketService.new
            @db_service = Db::TicketService.new
        end

        def index
            order_by = params[:order_by] || 'created_at'
            order_type = params[:order_type] || 'desc'
            page = params[:page] || 1
            per_page = params[:per_page] || 20

            filters = params.permit(
                :search, :created_after, :created_before, :updated_after, :updated_before,
                status: [], priority: [], source: [], agent: [], group: [], ticket_type: []
            ).to_h

            params.each do |key, value|
                if key.start_with?('cf_')
                    filters[key] = value
                end
            end

            result = @db_service.list_tickets(order_by, order_type, page, per_page, filters)
            render json: result
        end

        def show
            ticket = @db_service.find_by_id(params[:id])

            if !ticket.present? || ticket.last_fetched_at.nil? || ticket.last_fetched_at < 5.minutes.ago
                db_ticket = @db_service.find_by_id(params[:id])
                freshdesk_ticket = @freshdesk_service.get_ticket(db_ticket.freshdesk_id)
                freshdesk_ticket = @db_service.translate_ids_from_api(freshdesk_ticket)
                @db_service.update_ticket_from_freshdesk(db_ticket, freshdesk_ticket)
                @db_service.update_or_create_ticket_conversation(params[:id], freshdesk_ticket)
                conversations = @freshdesk_service.get_conversations(db_ticket.freshdesk_id)
                conversations.each do |conversation|
                    db_conversation = Conversation.find_by(freshdesk_id: conversation['id'])
                    if db_conversation.present? && conversation['attachments'].present?
                        @db_service.update_conversation_attachments(db_conversation, conversation['attachments'])
                    end
                end
            end

            ticket_data = @db_service.get_ticket_data(params[:id])
            render json: { ticket: ticket_data }
        end

        def create
            ticket_data = ticket_params.to_h

            ticket_data[:status] = ticket_data[:status].to_i if ticket_data[:status].present?
            ticket_data[:priority] = ticket_data[:priority].to_i if ticket_data[:priority].present?
            ticket_data[:source] = ticket_data[:source].to_i if ticket_data[:source].present?

            ticket_data = @db_service.translate_ids_for_api(ticket_data)

            attachments = []
            if params[:attachments].present?
                params[:attachments].each do |key, attachment|
                    attachments << { filename: attachment.original_filename, file: attachment }
                end
            end

            freshdesk_ticket = @freshdesk_service.create_ticket(ticket_data, attachments)
            freshdesk_ticket = @db_service.translate_ids_from_api(freshdesk_ticket)
            @db_service.create_ticket_from_freshdesk(freshdesk_ticket)

            render json: { ticket: freshdesk_ticket }, status: :created
        end

        def update
            ticket_params_for_update = ticket_params.to_h
            db_ticket = @db_service.find_by_id(params[:id])

            ticket_params_for_update = @db_service.translate_ids_for_api(ticket_params_for_update)
            freshdesk_ticket = @freshdesk_service.update_ticket(db_ticket.freshdesk_id, ticket_params_for_update)
            freshdesk_ticket = @db_service.translate_ids_from_api(freshdesk_ticket)

            if freshdesk_ticket['description'].present?
                conversation = Conversation.where(ticket_id: params[:id].to_s, ticket_conversation: true).first
                if conversation.present?
                    @db_service.update_or_create_ticket_conversation(params[:id], freshdesk_ticket)
                end
            end

            @db_service.update_ticket_from_freshdesk(db_ticket, freshdesk_ticket)

            db_ticket.ticket_custom_fields.destroy_all
            db_ticket.ticket_tags.destroy_all
            db_ticket.ticket_emails.destroy_all
            @db_service.create_ticket_related_data(db_ticket, freshdesk_ticket)

            render json: { ticket: freshdesk_ticket }
        end

        def destroy
            db_ticket = @db_service.find_by_id(params[:id])
            @freshdesk_service.delete_ticket(db_ticket.freshdesk_id)
            @db_service.mark_ticket_deleted(params[:id])

            head :no_content
        end

        def fields
            fields = @freshdesk_service.get_ticket_fields
            render json: { fields: fields }
        end

        def count
            count = @db_service.count_tickets
            render json: { count: count }
        end

        def conversations
            conversations = @db_service.get_conversations(params[:id])
            render json: { conversations: conversations }
        end

        def reply
            db_ticket = @db_service.find_by_id(params[:id])

            attachments = []
            if params[:attachments].present?
                params[:attachments].each do |key, attachment|
                    attachments << { filename: attachment.original_filename, file: attachment }
                end
            end

            reply_data = reply_params.to_h
            response = @freshdesk_service.add_reply(db_ticket.freshdesk_id, reply_data, attachments)
            response = @db_service.translate_ids_from_api(response)
            @db_service.create_conversation(response, params[:id], 0)

            render json: { success: true, reply: response }, status: :created
        end

        def note
            db_ticket = @db_service.find_by_id(params[:id])

            attachments = []
            if params[:attachments].present?
                params[:attachments].each do |key, attachment|
                    attachments << { filename: attachment.original_filename, file: attachment }
                end
            end

            note_data = note_params.to_h
            note_data[:private] = ActiveModel::Type::Boolean.new.cast(note_data[:private]) if note_data[:private].present?
            response = @freshdesk_service.add_note(db_ticket.freshdesk_id, note_data, attachments)
            response = @db_service.translate_ids_from_api(response)
            @db_service.create_conversation(response, params[:id], 2)

            render json: { success: true, note: response }, status: :created
        end

        def forward
            db_ticket = @db_service.find_by_id(params[:id])

            forward_data = forward_params.to_h
            if forward_data.key?(:include_original_attachments)
                forward_data[:include_original_attachments] = ActiveModel::Type::Boolean.new.cast(forward_data[:include_original_attachments])
            end

            response = @freshdesk_service.forward_ticket(db_ticket.freshdesk_id, forward_data)
            response = @db_service.translate_ids_from_api(response)
            @db_service.create_conversation(response, params[:id], 8)

            render json: { success: true, forward: response }, status: :created
        end

        def delete_conversation
            conversation = Conversation.find_by(id: params[:id])
            @freshdesk_service.delete_conversation(conversation.freshdesk_id)
            @db_service.mark_conversation_deleted(params[:id])

            render json: { success: true }, status: :ok
        end

        def update_conversation
            conversation = Conversation.find_by(id: params[:id])

            attachments = []
            if params[:attachments].present?
                params[:attachments].each do |key, attachment|
                    attachments << { filename: attachment.original_filename, file: attachment }
                end
            end

            conversation_data = { body: params[:body] }
            response = @freshdesk_service.update_conversation(conversation.freshdesk_id, conversation_data, attachments)
            response = @db_service.translate_ids_from_api(response)
            @db_service.update_conversation(params[:id], response)

            render json: { success: true, conversation: response }, status: :ok
        end

        def merge
            begin
                primary_ticket = @db_service.find_by_id(params[:id])

                secondary_ticket_ids = params[:ticket_ids].map do |ticket_id|
                    ticket = @db_service.find_by_id(ticket_id)
                    ticket.freshdesk_id
                end

                response = @freshdesk_service.merge_tickets(primary_ticket.freshdesk_id, secondary_ticket_ids)
                freshdesk_ticket = @freshdesk_service.get_ticket(primary_ticket.freshdesk_id)
                @db_service.update_ticket_from_freshdesk(primary_ticket, freshdesk_ticket)

                conversations = @freshdesk_service.get_conversations(primary_ticket.freshdesk_id)
                conversations.each do |conversation|
                    db_conversation = Conversation.find_by(freshdesk_id: conversation['id'])
                    next if db_conversation.present?

                    conversation = @db_service.translate_ids_from_api(conversation)
                    @db_service.create_conversation(conversation, params[:id], 2)
                end

                secondary_ticket_ids.each do |secondary_freshdesk_id|
                    freshdesk_ticket = @freshdesk_service.get_ticket(secondary_freshdesk_id)
                    secondary_ticket = Ticket.find_by(freshdesk_id: secondary_freshdesk_id)

                    if secondary_ticket.present?
                        @db_service.update_ticket_from_freshdesk(secondary_ticket, freshdesk_ticket)

                        conversations = @freshdesk_service.get_conversations(secondary_freshdesk_id)
                        conversations.each do |conversation|
                            db_conversation = Conversation.find_by(freshdesk_id: conversation['id'])
                            next if db_conversation.present?

                            conversation = @db_service.translate_ids_from_api(conversation)
                            @db_service.create_conversation(conversation, secondary_ticket.id, 2)
                        end
                    end
                end

                render json: { success: true, merged: response }, status: :ok
            rescue => e
                render json: { success: false, error: e.message }, status: :unprocessable_entity
            end
        end

        def export
            tickets = @db_service.tickets_for_export

            csv_data = CSV.generate do |csv|
                csv << ['Ticket ID', 'Subject', 'Status', 'Priority', 'Requester ID', 'Responder ID', 'Group ID', 'Created At']
                tickets.each do |ticket|
                    csv << [
                        ticket.freshdesk_id,
                        ticket.subject,
                        ticket.status,
                        ticket.priority,
                        ticket.requester_id,
                        ticket.responder_id,
                        ticket.group_id,
                        ticket.created_at
                    ]
                end
            end

            send_data csv_data, filename: "tickets_#{Time.now.strftime('%Y%m%d%H%M%S')}.csv"
        end

        private

        def ticket_params
            params.require(:ticket).permit(
                :subject,
                :description,
                :status,
                :priority,
                :source,
                :responder_id,
                :requester_id,
                :group_id,
                :type,
                :email,
                :phone,
                :due_by,
                :tags => [],
                :custom_fields => {},
                :attachments => [],
                :cc_emails => [],
            )
        end

        def reply_params
            params.require(:reply).permit(:body, :user_id, :cc_emails => [])
        end

        def note_params
            params.require(:note).permit(:body, :private)
        end

        def forward_params
            params.permit(:body, :include_original_attachments, to_emails: [], cc_emails: [], bcc_emails: [])
        end
    end
end
