require 'csv'

module Api
    class ContactsController < ApplicationController
        before_action :authenticate_user!

        def initialize
            super
            @freshdesk_service = Freshdesk::ContactService.new
            @db_service = Db::ContactService.new
        end

        def index
            order_by = params[:order_by] || 'name'
            order_type = params[:order_type] || 'asc'
            page = params[:page] || 1
            per_page = params[:per_page] || 50

            filters = params.permit(
                :search, :created_after, :created_before,
                :updated_after, :updated_before, :job_title, :company_id
            ).to_h

            result = @db_service.list_contacts(order_by, order_type, page, per_page, filters)
            render json: result
        end

        def show
            contact = @db_service.get_contact_with_relations(params[:id])
            if contact
                render json: { contact: contact }
            else
                render json: { error: "Contact not found" }, status: :not_found
            end
        end

        def create
            if contact_params[:email].present? && @db_service.contact_exists_by_email?(contact_params[:email])
                return render json: { error: "Contact with email (#{contact_params[:email]}) already exists" }, status: :unprocessable_entity
            end

            if contact_params[:unique_external_id].present? && @db_service.contact_exists_by_external_id?(contact_params[:unique_external_id])
                return render json: { error: "Contact with unique_external_id (#{contact_params[:unique_external_id]}) already exists" }, status: :unprocessable_entity
            end

            avatar = params[:avatar] if params[:avatar].present?
            contact_params_for_creation = contact_params.to_h
            contact_params_for_creation = @db_service.translate_company_id_for_api(contact_params_for_creation)
            contact = @freshdesk_service.create_contact(contact_params_for_creation, avatar)
            contact = @db_service.translate_company_id_from_api(contact)
            @db_service.create_contact_from_freshdesk(contact)

            render json: { contact: contact }, status: :created
        end

        def update
            if contact_params[:email].present? && @db_service.contact_exists_by_email?(contact_params[:email], params[:id])
                return render json: { error: "Contact with email (#{contact_params[:email]}) already exists" }, status: :unprocessable_entity
            end

            if contact_params[:unique_external_id].present? && @db_service.contact_exists_by_external_id?(contact_params[:unique_external_id], params[:id])
                return render json: { error: "Contact with unique_external_id (#{contact_params[:unique_external_id]}) already exists" }, status: :unprocessable_entity
            end

            avatar = params[:avatar] if params[:avatar].present?
            contact_params_for_update = contact_params.to_h
            db_contact = @db_service.find_by_id(params[:id])
            freshdesk_id = db_contact.freshdesk_id
            contact_params_for_update = @db_service.translate_company_id_for_api(contact_params_for_update)
            contact = @freshdesk_service.update_contact(freshdesk_id, contact_params_for_update, avatar)
            contact = @db_service.translate_company_id_from_api(contact)

            if contact['company_id'].present?
                @db_service.update_tickets_company(db_contact.id, contact['company_id'])
            end

            @db_service.update_contact_from_freshdesk(db_contact, contact)

            render json: { contact: contact }
        end

        def destroy
            db_contact = @db_service.find_by_id(params[:id])
            freshdesk_id = db_contact.freshdesk_id
            @freshdesk_service.delete_contact(freshdesk_id)
            @db_service.delete_contact(params[:id])
            head :no_content
        end

        def fields
            fields = @freshdesk_service.get_contact_fields
            render json: { fields: fields }
        end

        def merge
            primary_id, secondary_ids = @db_service.prepare_merge_ids(
                params[:primary_contact_id],
                params[:secondary_contact_ids]
            )

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

                if contact_data[:company_ids].present?
                    contact_data[:company_ids] = @db_service.prepare_company_ids_for_merge(contact_data[:company_ids])
                end

                contact_data[:phone] = contact_data[:phone].to_s if contact_data[:phone].present?
                contact_data[:mobile] = contact_data[:mobile].to_s if contact_data[:mobile].present?
            end

            result = @freshdesk_service.merge_contacts(primary_id, secondary_ids, contact_data)
            contact = @freshdesk_service.get_contact(primary_id)
            contact = @db_service.translate_company_id_from_api(contact)
            primary_contact = Contact.find_by(id: params[:primary_contact_id])
            @db_service.update_after_merge(primary_contact, contact, params[:secondary_contact_ids])

            render json: { result: result }
        end

        def count
            count = @db_service.count_contacts
            render json: { count: count }
        end

        def export
            contacts = @db_service.all_contacts_for_export

            csv_data = CSV.generate do |csv|
                csv << ["ID", "Name", "Email", "Phone", "Mobile", "Company ID", "Created At", "Updated At"]
                contacts.each do |contact|
                    csv << [
                        contact.id,
                        contact.name,
                        contact.email,
                        contact.phone,
                        contact.mobile,
                        contact.company_id,
                        contact.created_at,
                        contact.updated_at
                    ]
                end
            end

            send_data csv_data, filename: "contacts_#{Time.now.strftime('%Y%m%d%H%M%S')}.csv"
        end

        private

        def contact_params
            permitted = params.require(:contact).permit(
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

            if permitted[:custom_fields].is_a?(String)
                permitted[:custom_fields] = JSON.parse(permitted[:custom_fields]) rescue {}
            end

            if permitted[:other_emails].is_a?(String)
                permitted[:other_emails] = JSON.parse(permitted[:other_emails]) rescue []
            end

            if permitted[:other_companies].is_a?(String)
                permitted[:other_companies] = JSON.parse(permitted[:other_companies]) rescue []
            end

            if permitted[:tags].is_a?(String)
                permitted[:tags] = JSON.parse(permitted[:tags]) rescue []
            end

            permitted
        end
    end
end
