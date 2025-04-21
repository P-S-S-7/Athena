module Db
    class ContactService
        def list_contacts(order_by = 'name', order_type = 'asc', page = 1, per_page = 50, filters = {})
            page = page.to_i
            per_page = per_page.to_i

            page = 1 if page < 1
            per_page = 50 if per_page < 1 || per_page > 100

            query = Contact.all

            query = apply_filters(query, filters)

            total_count = query.count

            contacts = query.order(order_by => order_type)
                        .limit(per_page)
                        .offset((page - 1) * per_page)

            {
                contacts: contacts,
                meta: {
                    total: total_count,
                    per_page: per_page,
                    current_page: page,
                    total_pages: (total_count.to_f / per_page).ceil
                }
            }
        end

        def apply_filters(query, filters)
            filters = filters.symbolize_keys if filters.respond_to?(:symbolize_keys)

            if filters[:search].present?
                search_term = "%#{filters[:search].downcase}%"
                query = query.where("LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(phone) LIKE ?",
                                search_term, search_term, search_term)
            end

            if filters[:created_after].present?
                query = query.where("created_at >= ?", filters[:created_after])
            end

            if filters[:created_before].present?
                query = query.where("created_at <= ?", filters[:created_before])
            end

            if filters[:updated_after].present?
                query = query.where("updated_at >= ?", filters[:updated_after])
            end

            if filters[:updated_before].present?
                query = query.where("updated_at <= ?", filters[:updated_before])
            end

            if filters[:job_title].present?
                query = query.where("LOWER(job_title) LIKE ?", "%#{filters[:job_title].downcase}%")
            end

            if filters[:company_id].present?
                query = query.where(company_id: filters[:company_id])
            end

            query
        end

        def find_by_id(id)
            Contact.find_by(id: id)
        end

        def get_contact_with_relations(id)
            contact = Contact.find_by(id: id)
            return nil unless contact

            contact_data = contact.as_json
            contact_data["other_emails"] = JSON.parse(contact_data["other_emails"]) rescue []
            contact_data["other_companies"] = JSON.parse(contact_data["other_companies"]) rescue []
            contact_data["other_phone_numbers"] = JSON.parse(contact_data["other_phone_numbers"]) rescue []
            contact_data["tags"] = JSON.parse(contact_data["tags"]) rescue []

            avatar = Avatar.find_by(contact_id: contact_data["id"])
            contact_data = contact_data.merge(avatar: avatar) if avatar.present?

            contact_data
        end

        def contact_exists_by_email?(email, id = nil)
            query = Contact.where('lower(email) = ?', email.downcase)
            query = query.where.not(id: id) if id.present?
            query.exists?
        end

        def contact_exists_by_external_id?(external_id, id = nil)
            query = Contact.where('lower(unique_external_id) = ?', external_id.downcase)
            query = query.where.not(id: id) if id.present?
            query.exists?
        end

        def create_contact_from_freshdesk(contact_data)
            db_contact = Contact.new(
                gid: SecureRandom.uuid,
                freshdesk_id: contact_data['id'],
                active: contact_data['active'],
                address: contact_data['address'],
                description: contact_data['description'],
                job_title: contact_data['job_title'],
                language: contact_data['language'],
                name: contact_data['name'],
                email: contact_data['email'],
                mobile: contact_data['mobile'],
                phone: contact_data['phone'],
                twitter_id: contact_data['twitter_id'],
                unique_external_id: contact_data['unique_external_id'],
                preferred_source: contact_data['preferred_source'],
                time_zone: contact_data['time_zone'],
                visitor_id: contact_data['visitor_id'],
                org_contact_id: contact_data['org_contact_id'],
                other_emails: contact_data['other_emails'],
                other_companies: contact_data['other_companies'],
                other_phone_numbers: contact_data['other_phone_numbers'],
                tags: contact_data['tags'],
                company_id: contact_data['company_id'],
                created_at: contact_data['created_at'],
                updated_at: contact_data['updated_at'],
            )

            if db_contact.save
                create_contact_related_data(db_contact, contact_data)
            end

            db_contact
        end

        def create_contact_related_data(db_contact, contact_data)
            if contact_data['custom_fields'].present?
                contact_data['custom_fields'].each do |key, value|
                    db_contact.contact_custom_fields.create(field_name: key, field_value: value)
                end
            end

            if contact_data['avatar'].present?
                db_contact.create_avatar(
                    name: contact_data['avatar']['name'],
                    content_type: contact_data['avatar']['content_type'],
                    size: contact_data['avatar']['size'],
                    attachment_url: contact_data['avatar']['avatar_url'],
                    created_at: contact_data['avatar']['created_at'],
                    updated_at: contact_data['avatar']['updated_at'],
                )
            end
        end

        def update_contact_from_freshdesk(db_contact, contact_data)
            db_contact.update(
                freshdesk_id: contact_data['id'],
                active: contact_data['active'],
                address: contact_data['address'],
                description: contact_data['description'],
                job_title: contact_data['job_title'],
                language: contact_data['language'],
                name: contact_data['name'],
                email: contact_data['email'],
                mobile: contact_data['mobile'],
                phone: contact_data['phone'],
                twitter_id: contact_data['twitter_id'],
                unique_external_id: contact_data['unique_external_id'],
                preferred_source: contact_data['preferred_source'],
                time_zone: contact_data['time_zone'],
                visitor_id: contact_data['visitor_id'],
                org_contact_id: contact_data['org_contact_id'],
                other_emails: contact_data['other_emails'].to_json,
                other_companies: contact_data['other_companies'].to_json,
                other_phone_numbers: contact_data['other_phone_numbers'].to_json,
                tags: contact_data['tags'].to_json,
                company_id: contact_data['company_id'],
                created_at: contact_data['created_at'],
                updated_at: contact_data['updated_at'],
            )

            db_contact.contact_custom_fields.destroy_all
            if contact_data['custom_fields'].present?
                contact_data['custom_fields'].each do |key, value|
                    db_contact.contact_custom_fields.create(field_name: key, field_value: value)
                end
            end

            db_contact.avatar&.destroy if db_contact.avatar.present?
            if contact_data['avatar'].present?
                db_contact.create_avatar(
                    name: contact_data['avatar']['name'],
                    content_type: contact_data['avatar']['content_type'],
                    size: contact_data['avatar']['size'],
                    attachment_url: contact_data['avatar']['avatar_url'],
                    created_at: contact_data['avatar']['created_at'],
                    updated_at: contact_data['avatar']['updated_at'],
                )
            end

            db_contact.save
        end

        def delete_contact(id)
            db_contact = Contact.find_by(id: id)
            return false unless db_contact

            Ticket.where(requester_id: db_contact.id).destroy_all

            db_contact.contact_custom_fields.destroy_all
            db_contact.avatar&.destroy if db_contact.avatar.present?
            db_contact.destroy

            true
        end

        def translate_company_id_for_api(contact_params)
            return contact_params unless contact_params[:company_id].present?

            result = contact_params.dup
            company = Company.find_by(id: contact_params[:company_id].to_i)
            result[:company_id] = company&.freshdesk_id

            result
        end

        def translate_company_id_from_api(contact_data)
            return contact_data unless contact_data['company_id'].present?

            result = contact_data.dup
            company = Company.find_by(freshdesk_id: contact_data['company_id'])
            if company.present?
                result['company_id'] = company.id
            else
                result['company_id'] = nil
            end

            result
        end

        def update_tickets_company(contact_id, company_id)
            Ticket.where(requester_id: contact_id).update_all(company_id: company_id)
        end

        def count_contacts
            Contact.count
        end

        def all_contacts_for_export
            Contact.all
        end

        def prepare_merge_ids(primary_contact_id, secondary_contact_ids)
            primary_contact = Contact.find_by(id: primary_contact_id)
            primary_id = primary_contact&.freshdesk_id

            secondary_ids = secondary_contact_ids.map do |contact_id|
                contact = Contact.find_by(id: contact_id)
                contact&.freshdesk_id
            end

            secondary_ids = secondary_ids.compact.flatten.map(&:to_i)

            [primary_id, secondary_ids]
        end

        def prepare_company_ids_for_merge(company_ids)
            company_ids.map do |company_id|
                company = Company.find_by(id: company_id.to_i)
                company&.freshdesk_id
            end.compact
        end

        def update_after_merge(primary_contact, contact, secondary_contact_ids)
            primary_contact.update(
                freshdesk_id: contact['id'],
                active: contact['active'],
                address: contact['address'],
                description: contact['description'],
                job_title: contact['job_title'],
                language: contact['language'],
                name: contact['name'],
                email: contact['email'],
                mobile: contact['mobile'],
                phone: contact['phone'],
                twitter_id: contact['twitter_id'],
                unique_external_id: contact['unique_external_id'],
                preferred_source: contact['preferred_source'],
                time_zone: contact['time_zone'],
                visitor_id: contact['visitor_id'],
                org_contact_id: contact['org_contact_id'],
                other_emails: contact['other_emails'],
                other_companies: process_other_companies(contact['other_companies']),
                other_phone_numbers: contact['other_phone_numbers'],
                tags: contact['tags'],
                company_id: contact['company_id'],
                created_at: contact['created_at'],
                updated_at: contact['updated_at']
            )

            secondary_contact_ids.each do |contact_id|
                secondary_contact = Contact.find_by(id: contact_id)
                if secondary_contact.present?
                    Ticket.where(requester_id: secondary_contact.id).update_all(requester_id: primary_contact.id)
                    secondary_contact.contact_custom_fields.destroy_all
                    secondary_contact.avatar&.destroy if secondary_contact.avatar.present?
                    secondary_contact.destroy
                end
            end
        end

        private

        def process_other_companies(other_companies)
            return [] unless other_companies.present?

            other_companies.map do |company_data|
                company = Company.find_by(freshdesk_id: company_data['company_id'])
                company&.id
            end.compact
        end
    end
end
