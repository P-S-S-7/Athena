module Freshdesk
    class CannedResponseService
        def initialize
            @client = ApiClient.new
        end

        def list_folders
            begin
                @client.request(:get, '/canned_response_folders')
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to list canned response folders: #{e.message}")
            end
        end

        def get_folder(id)
            begin
                @client.request(:get, "/canned_response_folders/#{id}")
            rescue Freshdesk::ResourceNotFoundError
                raise Freshdesk::ResourceNotFoundError.new("Canned response folder ##{id} not found")
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to get canned response folder ##{id}: #{e.message}")
            end
        end

        def get_response(id)
            begin
                @client.request(:get, "/canned_responses/#{id}")
            rescue Freshdesk::ResourceNotFoundError
                raise Freshdesk::ResourceNotFoundError.new("Canned response ##{id} not found")
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to get canned response ##{id}: #{e.message}")
            end
        end
    end
end
