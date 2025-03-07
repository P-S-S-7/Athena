module Api
    class ContactsController < ApplicationController
        def index
            contact_service = Freshdesk::ContactService.new
            contacts = contact_service.list_contacts
            render json: { contacts: contacts }
        end
    end
end
