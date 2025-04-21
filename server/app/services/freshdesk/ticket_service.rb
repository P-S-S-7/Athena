module Freshdesk
    class TicketService
        def initialize
            @client = ApiClient.new
        end

        def get_ticket(id)
            begin
                @client.request(:get, "/tickets/#{id}")
            rescue Freshdesk::ResourceNotFoundError
                raise Freshdesk::ResourceNotFoundError.new("Ticket ##{id} not found")
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to get ticket ##{id}: #{e.message}")
            end
        end

        def create_ticket(ticket_params, attachments = [])
            begin
                if attachments.empty?
                    @client.request(:post, '/tickets', ticket_params)
                else
                    @client.request_with_attachments('/tickets', ticket_params, attachments, :post)
                end
            rescue Freshdesk::ValidationError => e
                raise e
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to create ticket: #{e.message}")
            end
        end

        def update_ticket(id, ticket_params)
            begin
                @client.request(:put, "/tickets/#{id}", ticket_params)
            rescue Freshdesk::ResourceNotFoundError
                raise Freshdesk::ResourceNotFoundError.new("Ticket ##{id} not found")
            rescue Freshdesk::ValidationError => e
                raise e
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to update ticket ##{id}: #{e.message}")
            end
        end

        def delete_ticket(id)
            begin
                @client.request(:delete, "/tickets/#{id}")
            rescue Freshdesk::ResourceNotFoundError
                raise Freshdesk::ResourceNotFoundError.new("Ticket ##{id} not found")
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to delete ticket ##{id}: #{e.message}")
            end
        end

        def get_ticket_fields
            begin
                @client.request(:get, '/ticket_fields')
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to get ticket fields: #{e.message}")
            end
        end

        def get_conversations(ticket_id)
            begin
                @client.request(:get, "/tickets/#{ticket_id}/conversations")
            rescue Freshdesk::ResourceNotFoundError
                raise Freshdesk::ResourceNotFoundError.new("Ticket ##{ticket_id} not found")
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to get conversations for ticket ##{ticket_id}: #{e.message}")
            end
        end

        def add_reply(ticket_id, reply_data, attachments = [])
            begin
                if attachments.empty?
                    @client.request(:post, "/tickets/#{ticket_id}/reply", reply_data)
                else
                    @client.request_with_attachments("/tickets/#{ticket_id}/reply", reply_data, attachments, :post)
                end
            rescue Freshdesk::ResourceNotFoundError
                raise Freshdesk::ResourceNotFoundError.new("Ticket ##{ticket_id} not found")
            rescue Freshdesk::ValidationError => e
                raise e
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to add reply to ticket ##{ticket_id}: #{e.message}")
            end
        end

        def add_note(ticket_id, note_data, attachments = [])
            begin
                if attachments.empty?
                    @client.request(:post, "/tickets/#{ticket_id}/notes", note_data)
                else
                    @client.request_with_attachments("/tickets/#{ticket_id}/notes", note_data, attachments, :post)
                end
            rescue Freshdesk::ResourceNotFoundError
                raise Freshdesk::ResourceNotFoundError.new("Ticket ##{ticket_id} not found")
            rescue Freshdesk::ValidationError => e
                raise e
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to add note to ticket ##{ticket_id}: #{e.message}")
            end
        end

        def forward_ticket(ticket_id, forward_data)
            begin
                endpoint = "/tickets/#{ticket_id}/forward"
                forward_data[:include_original_attachments] = false unless forward_data.key?(:include_original_attachments)

                @client.request(:post, endpoint, forward_data)
            rescue Freshdesk::ResourceNotFoundError
                raise Freshdesk::ResourceNotFoundError.new("Ticket ##{ticket_id} not found")
            rescue Freshdesk::ValidationError => e
                raise e
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to forward ticket ##{ticket_id}: #{e.message}")
            end
        end

        def delete_conversation(note_id)
            begin
                @client.request(:delete, "/conversations/#{note_id}")
            rescue Freshdesk::ResourceNotFoundError
                raise Freshdesk::ResourceNotFoundError.new("Note ##{note_id} not found")
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to delete note ##{note_id}: #{e.message}")
            end
        end

        def update_conversation(note_id, note_data, attachments = [])
            begin
                endpoint = "/conversations/#{note_id}"

                if attachments.empty?
                    @client.request(:put, endpoint, note_data)
                else
                    @client.request_with_attachments(endpoint, note_data, attachments, :put)
                end
            rescue Freshdesk::ResourceNotFoundError
                raise Freshdesk::ResourceNotFoundError.new("Note ##{note_id} not found")
            rescue Freshdesk::ValidationError => e
                raise e
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to update note ##{note_id}: #{e.message}")
            end
        end

        def merge_tickets(primary_ticket_id, secondary_ticket_ids)
            begin
              primary_ticket_id = primary_ticket_id.to_i

              secondary_ticket_ids = [secondary_ticket_ids].flatten.map(&:to_i)

              endpoint = "/tickets/merge"
              merge_data = { primary_id: primary_ticket_id, ticket_ids: secondary_ticket_ids }

              @client.request(:put, endpoint, merge_data)
            rescue Freshdesk::ResourceNotFoundError
              raise Freshdesk::ResourceNotFoundError.new("Primary ticket ##{primary_ticket_id} not found")
            rescue Freshdesk::ValidationError => e
              raise e
            rescue Freshdesk::Error => e
              raise e
            rescue => e
              raise Freshdesk::RequestError.new("Failed to merge tickets: #{e.message}")
            end
        end
    end
end
