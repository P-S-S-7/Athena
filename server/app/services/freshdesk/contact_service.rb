module Freshdesk
    class ContactService
        def initialize
            @client = ApiClient.new
        end

        def list_contacts
            @client.request(:get, '/contacts')
        end
    end
end
