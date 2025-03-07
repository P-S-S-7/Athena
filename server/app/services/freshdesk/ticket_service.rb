module Freshdesk
    class TicketService
        def initialize
            @client = ApiClient.new
        end

        def list_tickets(params = {})
            default_params = {
                order_by: 'created_at',
                order_type: 'desc'
            }

            query = default_params.merge(params)
            @client.request(:get, '/tickets', {}, query)
        end

        def get_ticket(id)
            @client.request(:get, "/tickets/#{id}")
        end

        def create_ticket(ticket_params, attachments = [])
            if attachments.empty?
                @client.request(:post, '/tickets', ticket_params)
            else
                @client.request_with_attachments('/tickets', ticket_params, attachments, :post)
            end
        end

        def update_ticket(id, ticket_params)
            @client.request(:put, "/tickets/#{id}", ticket_params)
        end

        def delete_ticket(id)
            @client.request(:delete, "/tickets/#{id}")
        end

        def get_ticket_fields
            @client.request(:get, '/ticket_fields')
        end

        def get_conversations(ticket_id)
            @client.request(:get, "/tickets/#{ticket_id}/conversations")
        end

        def add_reply(ticket_id, reply_data, attachments = [])
            if attachments.empty?
                @client.request(:post, "/tickets/#{ticket_id}/reply", reply_data)
            else
                @client.request_with_attachments("/tickets/#{ticket_id}/reply", reply_data, attachments, :post)
            end
        end

        def add_note(ticket_id, note_data, attachments = [])
            if attachments.empty?
                @client.request(:post, "/tickets/#{ticket_id}/notes", note_data)
            else
                @client.request_with_attachments("/tickets/#{ticket_id}/notes", note_data, attachments, :post)
            end
        end

        def forward_ticket(ticket_id, forward_data)
            endpoint = "/tickets/#{ticket_id}/forward"
            forward_data[:include_original_attachments] = false unless forward_data.key?(:include_original_attachments)

            @client.request(:post, endpoint, forward_data)
        end

        def delete_note(note_id)
            @client.request(:delete, "/conversations/#{note_id}")
        end

        def update_note(note_id, note_data, attachments = [])
            endpoint = "/conversations/#{note_id}"

            if attachments.empty?
                @client.request(:put, endpoint, note_data)
            else
                @client.request_with_attachments(endpoint, note_data, attachments, :put)
            end
        end
    end
end
