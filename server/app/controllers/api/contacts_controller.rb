module Api
    class ContactsController < ApplicationController
        before_action :authenticate_user!

        def index
            contact_service = Freshdesk::ContactService.new
            order_by = params[:order_by] || 'created_at'
            order_type = params[:order_type] || 'desc'

            contacts = contact_service.list_contacts(
                order_by: order_by,
                order_type: order_type
            )

            render json: {
                contacts: contacts,
                meta: {
                total: contacts.is_a?(Array) ? contacts.size : 0
            }
            }
        end

        def show
            contact_service = Freshdesk::ContactService.new
            contact = contact_service.get_contact(params[:id])
            render json: { contact: contact }
        end

        def create
            contact_service = Freshdesk::ContactService.new

            avatar = params[:avatar] if params[:avatar].present?
            contact_params_for_creation = contact_params.to_h

            contact = contact_service.create_contact(contact_params_for_creation, avatar)
            render json: { contact: contact }, status: :created
        end

        def update
            contact_service = Freshdesk::ContactService.new

            avatar = params[:avatar] if params[:avatar].present?
            contact_params_for_update = contact_params.to_h

            contact = contact_service.update_contact(params[:id], contact_params_for_update, avatar)
            render json: { contact: contact }
        end

        def destroy
            contact_service = Freshdesk::ContactService.new

            contact_service.delete_contact(params[:id])
            head :no_content
        end

        def fields
            contact_service = Freshdesk::ContactService.new
            fields = contact_service.get_contact_fields
            render json: { fields: fields }
        end

        def merge
          contact_service = Freshdesk::ContactService.new

          primary_id = params[:primary_contact_id]
          secondary_ids = params[:secondary_contact_ids]

          contact_data = nil
          if params[:contact].present?
            contact_data = params.require(:contact).permit(
              :email,
              :phone,
              :mobile,
              :unique_external_id,
              :view_all_tickets,
              other_emails: [],
              company_ids: []
            ).to_h
          end

            result = contact_service.merge_contacts(primary_id, secondary_ids, contact_data)
            render json: { result: result }
        end

        def count
            contact_service = Freshdesk::ContactService.new
            contacts = contact_service.list_contacts
            render json: { count: contacts.is_a?(Array) ? contacts.length : 0 }
        end

        def companies
            contact_service = Freshdesk::ContactService.new
            companies = contact_service.get_companies
            render json: { companies: companies }
        end

        private

        def contact_params
            params.require(:contact).permit(
                :name,
                :email,
                :phone,
                :mobile,
                :unique_external_id,
                :other_emails,
                :company_id,
                :view_all_tickets,
                :other_companies,
                :address,
                :job_title,
                :description,
                :tags,
                custom_fields: {}
            )
        end
    end
end
