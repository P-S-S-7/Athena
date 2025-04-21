module Freshdesk
    class SyncService
        def initialize
            @client = ApiClient.new
            @company_service = Db::CompanyService.new
            @contact_service = Db::ContactService.new
            @ticket_service = Db::TicketService.new
        end

        def sync_companies
            begin
                companies = list_companies

                companies.each do |company|
                    db_company = Company.find_by(freshdesk_id: company['id'])

                    if db_company.present?
                        @company_service.update_company_from_freshdesk(db_company, company)
                    else
                        @company_service.create_company_from_freshdesk(company)
                    end
                end

                { success: true, message: "Successfully synced #{companies.size} companies" }
            rescue => e
                { success: false, message: "Failed to sync companies: #{e.message}" }
            end
        end

        def sync_contacts
            begin
                contacts = list_contacts

                contacts.each do |contact|
                    if contact['company_id'].present?
                        contact = @contact_service.translate_company_id_from_api(contact)
                    end

                    db_contact = Contact.find_by(freshdesk_id: contact['id'])

                    if db_contact.present?
                        @contact_service.update_contact_from_freshdesk(db_contact, contact)
                    else
                        @contact_service.create_contact_from_freshdesk(contact)
                    end
                end

                { success: true, message: "Successfully synced #{contacts.size} contacts" }
            rescue => e
                { success: false, message: "Failed to sync contacts: #{e.message}" }
            end
        end

        def sync_agents
            begin
                agents = list_agents

                agents.each do |agent|
                    db_agent = Agent.find_by(freshdesk_id: agent['id'])
                    agent_data = {
                        org_agent_id: agent['org_agent_id'],
                        available: agent['available'],
                        occasional: agent['occasional'],
                        ticket_scope: agent['ticket_scope'],
                        last_active_at: agent['last_active_at'],
                        deactivated: agent['deactivated'],
                        signature: agent['signature'],
                        focus_mode: agent['focus_mode'],
                        active: agent['contact']['active'],
                        email: agent['contact']['email'],
                        job_title: agent['contact']['job_title'],
                        language: agent['contact']['language'],
                        last_login_at: agent['contact']['last_login_at'],
                        mobile: agent['contact']['mobile'],
                        name: agent['contact']['name'],
                        phone: agent['contact']['phone'],
                        time_zone: agent['contact']['time_zone'],
                        scope: agent['scope'],
                        created_at: agent['contact']['created_at'],
                        updated_at: agent['contact']['updated_at'],
                    }

                    if db_agent.present?
                        db_agent.update(agent_data)
                    else
                        db_agent = Agent.new(agent_data.merge(
                            gid: SecureRandom.uuid,
                            freshdesk_id: agent['id']
                        ))
                        db_agent.save
                    end
                end

                { success: true, message: "Successfully synced #{agents.size} agents" }
            rescue => e
                { success: false, message: "Failed to sync agents: #{e.message}" }
            end
        end

        def sync_groups
            begin
                groups = list_groups

                groups.each do |group|
                    db_group = Group.find_by(freshdesk_id: group['id'])
                    group_data = {
                        name: group['name'],
                        description: group['description'],
                        escalate_to: group['escalate_to'],
                        unassigned_for: group['unassigned_for'],
                        group_type: group['type'],
                        business_calendar_id: group['business_calendar_id'],
                        allow_agents_to_change_availability: group['allow_agents_to_change_availability'],
                        agent_availability_status: group['agent_availability_status'],
                        automatic_agent_assignment: group['automatic_agent_assignment']['enabled'],
                        created_at: group['created_at'],
                        updated_at: group['updated_at']
                    }

                    if db_group.present?
                        db_group.update(group_data)
                        db_group.agent_group_mappings.destroy_all
                    else
                        db_group = Group.new(group_data.merge(
                            gid: SecureRandom.uuid,
                            freshdesk_id: group['id']
                        ))
                        db_group.save
                    end

                    create_agent_group_mappings(db_group, group['agent_ids'])
                end

                { success: true, message: "Successfully synced #{groups.size} groups" }
            rescue => e
                { success: false, message: "Failed to sync groups: #{e.message}" }
            end
        end

        def sync_tickets
            begin
                tickets = list_tickets

                tickets.each do |ticket|
                    ticket = @ticket_service.translate_ids_from_api(ticket)

                    db_ticket = Ticket.find_by(freshdesk_id: ticket['id'])

                    if db_ticket.present?
                        db_ticket.ticket_custom_fields.destroy_all
                        db_ticket.ticket_tags.destroy_all
                        db_ticket.ticket_emails.destroy_all

                        @ticket_service.update_ticket_from_freshdesk(db_ticket, ticket)

                        @ticket_service.create_ticket_related_data(db_ticket, ticket)
                    else
                        @ticket_service.create_ticket_from_freshdesk(ticket)
                    end

                    if ticket['description'].present?
                        db_ticket = Ticket.find_by(freshdesk_id: ticket['id'])
                        @ticket_service.update_or_create_ticket_conversation(db_ticket.id, {
                            'description' => ticket['description'],
                            'description_text' => ticket['description_text'],
                            'requester_id' => ticket['requester_id'],
                            'created_at' => ticket['created_at'],
                            'updated_at' => ticket['updated_at'],
                            'attachments' => ticket['attachments'] || []
                        })
                    end
                end

                { success: true, message: "Successfully synced #{tickets.size} tickets" }
            rescue => e
                { success: false, message: "Failed to sync tickets: #{e.message}" }
            end
        end

        def sync_canned_responses
            begin
                all_folders = @client.request(:get, "/canned_response_folders")

                all_folders.each do |folder|
                    folder_detail = @client.request(:get, "/canned_response_folders/#{folder['id']}")

                    db_folder = CannedResponseFolder.find_by(freshdesk_id: folder['id'])

                    folder_data = {
                        name: folder['name'],
                        created_at: folder['created_at'],
                        updated_at: folder['updated_at'],
                        responses_count: folder['responses_count']
                    }

                    if db_folder.present?
                        db_folder.update(folder_data)
                    else
                        db_folder = CannedResponseFolder.new(folder_data.merge(freshdesk_id: folder['id']))
                        db_folder.save
                    end

                    if folder_detail['canned_responses'].present?
                        folder_detail['canned_responses'].each do |response_brief|
                            response = @client.request(:get, "/canned_responses/#{response_brief['id']}")

                            db_response = CannedResponse.find_by(freshdesk_id: response['id'])

                            response_data = {
                                title: response['title'],
                                content: response['content'],
                                content_html: response['content_html'],
                                group_ids: response['group_ids'],
                                visibility: response['visibility'],
                                created_at: response['created_at'],
                                updated_at: response['updated_at'],
                                folder_id: db_folder.id
                            }

                            if db_response.present?
                                db_response.update(response_data)
                                db_response.canned_response_attachments.destroy_all
                            else
                                db_response = CannedResponse.new(response_data.merge(freshdesk_id: response['id']))
                                db_response.save
                            end

                            CannedResponseAttachment.destroy_all({ canned_response_id: db_response.id })

                            if response['attachments'].present?
                                response['attachments'].each do |attachment|
                                    CannedResponseAttachment.create({
                                        freshdesk_id: attachment['id'],
                                        name: attachment['name'],
                                        content_type: attachment['content_type'],
                                        size: attachment['size'],
                                        created_at: attachment['created_at'],
                                        updated_at: attachment['updated_at'],
                                        attachment_url: attachment['attachment_url'],
                                        canned_response_id: db_response.id
                                    })
                                end
                            end
                        end
                    end
                end

                { success: true, message: "Successfully synced canned responses" }
            rescue => e
                { success: false, message: "Failed to sync canned responses: #{e.message}" }
            end
        end

        private

        def create_agent_group_mappings(db_group, agent_ids)
            if agent_ids.present? && agent_ids.any?
                agent_ids.each do |agent_id|
                    agent = Agent.find_by(freshdesk_id: agent_id)
                    if agent.present?
                        db_group.agent_group_mappings.create(
                            agent_id: agent.id,
                            group_id: db_group.id
                        )
                    end
                end
            end
        end

        def list_companies
            begin
                all_companies = []
                page = 1
                per_page = 100
                has_more = true

                if Company.count == 0
                    while has_more
                        response = @client.request(:get, "/companies?page=#{page}&per_page=#{per_page}")
                        all_companies.concat(response)
                        has_more = response.size == per_page
                        page += 1
                    end
                else
                    most_recent_company = Company.order(updated_at: :desc).first
                    last_updated_at = most_recent_company&.updated_at
                    last_updated_at += 1.second if last_updated_at
                    while has_more
                        response = @client.request(:get, "/companies?updated_since=#{last_updated_at.iso8601}&page=#{page}&per_page=#{per_page}")
                        all_companies.concat(response)
                        has_more = response.size == per_page
                        page += 1
                    end
                end

                return all_companies
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to list companies: #{e.message}")
            end
        end

        def list_contacts
            begin
                all_contacts = []
                page = 1
                per_page = 100
                has_more = true

                if Contact.count == 0
                    while has_more
                        response = @client.request(:get, "/contacts?page=#{page}&per_page=#{per_page}")
                        all_contacts.concat(response)
                        has_more = response.size == per_page
                        page += 1
                    end
                else
                    most_recent_contact = Contact.order(updated_at: :desc).first
                    last_updated_at = most_recent_contact&.updated_at
                    last_updated_at += 1.second if last_updated_at
                    while has_more
                        response = @client.request(:get, "/contacts?updated_since=#{last_updated_at.iso8601}&page=#{page}&per_page=#{per_page}")
                        all_contacts.concat(response)
                        has_more = response.size == per_page
                        page += 1
                    end
                end

                return all_contacts
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to list contacts: #{e.message}")
            end
        end

        def list_agents
            begin
                @client.request(:get, '/agents')
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to list agents: #{e.message}")
            end
        end

        def list_groups
            begin
                @client.request(:get, '/admin/groups')
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to list groups: #{e.message}")
            end
        end

        def list_tickets
            begin
                all_tickets = []
                page = 1
                per_page = 100
                has_more = true

                if Ticket.count == 0
                    while has_more
                        response = @client.request(:get, "/tickets?page=#{page}&per_page=#{per_page}")
                        all_tickets.concat(response)
                        has_more = response.size == per_page
                        page += 1
                    end
                else
                    most_recent_ticket = Ticket.order(updated_at: :desc).first
                    last_updated_at = most_recent_ticket&.updated_at
                    last_updated_at += 1.second if last_updated_at

                    while has_more
                        response = @client.request(:get, "/tickets?updated_since=#{last_updated_at.iso8601}&page=#{page}&per_page=#{per_page}")
                        all_tickets.concat(response)
                        has_more = response.size == per_page
                        page += 1
                    end
                end

                return all_tickets
            rescue Freshdesk::Error => e
                raise e
            rescue => e
                raise Freshdesk::RequestError.new("Failed to list tickets: #{e.message}")
            end
        end
    end
end
