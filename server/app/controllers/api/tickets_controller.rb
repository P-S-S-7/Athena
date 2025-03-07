module Api
    class TicketsController < ApplicationController
        def index
            ticket_service = Freshdesk::TicketService.new
            order_by = params[:order_by] || 'created_at'
            order_type = params[:order_type] || 'desc'

            tickets = ticket_service.list_tickets(
                order_by: order_by,
                order_type: order_type
            )

            render json: {
                tickets: tickets,
                meta: {
                total: tickets.is_a?(Array) ? tickets.length : 0
            }
            }
        end

        def show
            ticket_service = Freshdesk::TicketService.new
            ticket = ticket_service.get_ticket(params[:id])
            render json: { ticket: ticket }
        end

        def create
            ticket_service = Freshdesk::TicketService.new

            attachments = []
            if params[:attachments].present?
                params[:attachments].each do |key, attachment|
                    attachments << { filename: attachment.original_filename, file: attachment }
                end
            end

            begin
                ticket_data = ticket_params.to_h

                ticket_data[:status] = ticket_data[:status].to_i if ticket_data[:status].present?
                ticket_data[:priority] = ticket_data[:priority].to_i if ticket_data[:priority].present?
                ticket_data[:source] = ticket_data[:source].to_i if ticket_data[:source].present?
                ticket_data[:group_id] = ticket_data[:group_id].to_i if ticket_data[:group_id].present?
                ticket_data[:responder_id] = ticket_data[:responder_id].to_i if ticket_data[:responder_id].present?
                ticket_data[:requester_id] = ticket_data[:requester_id].to_i if ticket_data[:requester_id].present?

                ticket = ticket_service.create_ticket(ticket_data, attachments)
                render json: { ticket: ticket }, status: :created
            end
        end

        def update
            ticket_service = Freshdesk::TicketService.new
            ticket = ticket_service.update_ticket(params[:id], ticket_params)
            render json: { ticket: ticket }
        end

        def destroy
            ticket_service = Freshdesk::TicketService.new
            ticket_service.delete_ticket(params[:id])
            head :no_content
        end

        def fields
            ticket_service = Freshdesk::TicketService.new
            fields = ticket_service.get_ticket_fields
            render json: { fields: fields }
        end

        def count
            ticket_service = Freshdesk::TicketService.new
            tickets = ticket_service.list_tickets()
            render json: { count: tickets.is_a?(Array) ? tickets.length : 0 }
        end

        def conversations
            ticket_service = Freshdesk::TicketService.new
            conversations = ticket_service.get_conversations(params[:id])
            render json: { conversations: conversations }
        end

        def reply
            ticket_service = Freshdesk::TicketService.new

            attachments = []
            if params[:attachments].present?
                params[:attachments].each do |key, attachment|
                    attachments << { filename: attachment.original_filename, file: attachment }
                end
            end

            begin
                reply_data = reply_params.to_h
                response = ticket_service.add_reply(params[:id], reply_data, attachments)
                render json: { success: true, reply: response }, status: :created
            rescue => e
                render json: { error: e.message }, status: :unprocessable_entity
            end
        end

        def note
            ticket_service = Freshdesk::TicketService.new

            attachments = []
            if params[:attachments].present?
                params[:attachments].each do |key, attachment|
                    attachments << { filename: attachment.original_filename, file: attachment }
                end
            end

            begin
                note_data = note_params.to_h
                note_data[:private] = ActiveModel::Type::Boolean.new.cast(note_data[:private]) if note_data[:private].present?

                response = ticket_service.add_note(params[:id], note_data, attachments)
                render json: { success: true, note: response }, status: :created
            rescue => e
                render json: { error: e.message }, status: :unprocessable_entity
            end
        end


        def forward
            ticket_service = Freshdesk::TicketService.new

            begin
                forward_data = forward_params.to_h

                if forward_data.key?(:include_original_attachments)
                    forward_data[:include_original_attachments] = ActiveModel::Type::Boolean.new.cast(forward_data[:include_original_attachments])
                end

                response = ticket_service.forward_ticket(params[:id], forward_data)
                render json: { success: true, forward: response }, status: :created
            rescue => e
                render json: { error: e.message }, status: :unprocessable_entity
            end
        end

        def delete_conversation
            ticket_service = Freshdesk::TicketService.new

            begin
                ticket_service.delete_note(params[:id])
                render json: { success: true }, status: :ok
            rescue => e
                render json: { error: e.message }, status: :unprocessable_entity
            end
        end

        def update_conversation
            ticket_service = Freshdesk::TicketService.new

            attachments = []
            if params[:attachments].present?
                params[:attachments].each do |key, attachment|
                    attachments << { filename: attachment.original_filename, file: attachment }
                end
            end

            begin
                conversation_data = { body: params[:body] }

                response = ticket_service.update_note(params[:id], conversation_data, attachments)
                render json: { success: true, conversation: response }, status: :ok
            rescue => e
                render json: { error: e.message }, status: :unprocessable_entity
            end
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
                tags: [],
                custom_fields: {}
            )
        end

        def reply_params
            params.require(:reply).permit(:body, :user_id, :cc_emails => [])
        end

        def note_params
            params.require(:note).permit(:body, :private)
        end

        def forward_params
            params.require(:ticket).permit(:body, :include_original_attachments, to_emails: [], cc_emails: [], bcc_emails: [])
        end
    end
end
