module Freshdesk
    class ContactService
        def initialize
            @client = ApiClient.new
        end

        def list_contacts(params = {})
            begin
                default_params = {
                    order_by: 'created_at',
                    order_type: 'desc'
                }

                query = default_params.merge(params)
                @client.request(:get, '/contacts', {}, query)
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to list contacts: #{e.message}")
            end
        end

        def get_contact(id)
            begin
                @client.request(:get, "/contacts/#{id}")
            rescue Freshdesk::ResourceNotFoundError
                raise Freshdesk::ResourceNotFoundError.new("Contact ##{id} not found")
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to get contact ##{id}: #{e.message}")
            end
        end

        def create_contact(contact_params, avatar = nil)
            if contact_params["tags"].is_a?(String) && contact_params["tags"].start_with?("[")
                contact_params["tags"] = JSON.parse(contact_params["tags"])
            end

            if contact_params["other_emails"].is_a?(String) && contact_params["other_emails"].start_with?("[")
                contact_params["other_emails"] = JSON.parse(contact_params["other_emails"])
            end

            if contact_params["company_id"].is_a?(String)
                contact_params["company_id"] = contact_params["company_id"].to_i
            end

            begin
                if avatar
                    @client.request_with_attachments('/contacts', contact_params, [avatar], :post)
                else
                    @client.request(:post, '/contacts', contact_params)
                end
            rescue Freshdesk::ValidationError => e
                raise e
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to create contact: #{e.message}")
            end
        end

        def update_contact(id, contact_params, avatar = nil)

            if contact_params["tags"].is_a?(String) && contact_params["tags"].start_with?("[")
                contact_params["tags"] = JSON.parse(contact_params["tags"])
            end

            if contact_params["other_emails"].is_a?(String) && contact_params["other_emails"].start_with?("[")
                contact_params["other_emails"] = JSON.parse(contact_params["other_emails"])
            end

            if contact_params["company_id"].is_a?(String)
                contact_params["company_id"] = contact_params["company_id"].to_i
            end

            begin
                if avatar
                    @client.request_with_attachments("/contacts/#{id}", contact_params, [avatar], :put)
                else
                    @client.request(:put, "/contacts/#{id}", contact_params)
                end
            rescue Freshdesk::ResourceNotFoundError
                raise Freshdesk::ResourceNotFoundError.new("Contact ##{id} not found")
            rescue Freshdesk::ValidationError => e
                raise e
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to update contact ##{id}: #{e.message}")
            end
        end

        def delete_contact(id)
            begin
                @client.request(:delete, "/contacts/#{id}")
            rescue Freshdesk::ResourceNotFoundError
                raise Freshdesk::ResourceNotFoundError.new("Contact ##{id} not found")
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to delete contact ##{id}: #{e.message}")
            end
        end

        def merge_contacts(primary_contact_id, secondary_contact_ids, contact_data = nil)
            begin
                primary_contact_id = primary_contact_id.to_i
                secondary_contact_ids = [secondary_contact_ids].flatten.map(&:to_i)

                endpoint = "/contacts/merge"
                merge_data = {
                    primary_contact_id: primary_contact_id,
                    secondary_contact_ids: secondary_contact_ids
                }

                if contact_data.present?
                    if contact_data[:other_emails].present? && contact_data[:other_emails].is_a?(ActionController::Parameters)
                        contact_data[:other_emails] = contact_data[:other_emails].to_unsafe_h.values
                    end

                    if contact_data[:company_ids].present? && contact_data[:company_ids].is_a?(ActionController::Parameters)
                        contact_data[:company_ids] = contact_data[:company_ids].to_unsafe_h.values
                    end

                    merge_data[:contact] = contact_data
                end

                @client.request(:post, endpoint, merge_data)
            rescue Freshdesk::ResourceNotFoundError
                raise Freshdesk::ResourceNotFoundError.new("Primary contact ##{primary_contact_id} not found")
            rescue Freshdesk::ValidationError => e
                raise e
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to merge contacts: #{e.message}")
            end
        end

        def get_contact_fields
            begin
                @client.request(:get, '/contact_fields')
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to get contact fields: #{e.message}")
            end
        end

        def get_companies
            begin
                @client.request(:get, '/companies')
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to get companies: #{e.message}")
            end
        end
    end
end
