module Freshdesk
    class GroupService
        def initialize
            @client = ApiClient.new
        end

        def list_groups
            @client.request(:get, '/groups')
        end

        def get_group(id)
            @client.request(:get, "/groups/#{id}")
        end
    end
end
