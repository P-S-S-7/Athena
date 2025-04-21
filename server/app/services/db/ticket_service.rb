module Db
    class TicketService
        def find_by_id(id)
            Ticket.find_by(id: id)
        end

        def list_tickets(order_by = 'created_at', order_type = 'desc', page = 1, per_page = 20, filters = {})
            page = page.to_i
            per_page = per_page.to_i

            page = 1 if page < 1
            per_page = 20 if per_page < 1

            query = Ticket.where(is_deleted: false, spam: false)

            query = apply_filters(query, filters)

            ticket_count = query.count

            tickets = query.order(order_by => order_type)
                        .limit(per_page)
                        .offset((page - 1) * per_page)

            {
                tickets: tickets,
                meta: {
                    total: ticket_count,
                    per_page: per_page,
                    current_page: page,
                    total_pages: (ticket_count.to_f / per_page).ceil,
                }
            }
        end

        def apply_filters(query, filters)
            return query if filters.nil? || filters.empty?

            filters = filters.symbolize_keys if filters.respond_to?(:symbolize_keys)

            if filters[:search].present?
                search_term = "%#{filters[:search].downcase}%"
                query = query.where(
                    "LOWER(subject) LIKE ? OR CAST(id AS CHAR) LIKE ?",
                    search_term, search_term
                )
            end

            if filters[:created_after].present?
                query = query.where("tickets.created_at >= ?", Time.parse(filters[:created_after].to_s))
            end

            if filters[:created_before].present?
                query = query.where("tickets.created_at <= ?", Time.parse(filters[:created_before].to_s))
            end

            if filters[:updated_after].present?
                query = query.where("tickets.updated_at >= ?", Time.parse(filters[:updated_after].to_s))
            end

            if filters[:updated_before].present?
                query = query.where("tickets.updated_at <= ?", Time.parse(filters[:updated_before].to_s))
            end

            if filters[:due_after].present?
                query = query.where("tickets.due_by >= ?", Time.parse(filters[:due_after].to_s))
            end

            if filters[:due_before].present?
                query = query.where("tickets.due_by <= ?", Time.parse(filters[:due_before].to_s))
            end

            if filters[:status].present?
                if filters[:status].is_a?(Array)
                    query = query.where(status: filters[:status]) if filters[:status].any?
                else
                    query = query.where(status: filters[:status])
                end
            end

            if filters[:priority].present?
                if filters[:priority].is_a?(Array)
                    query = query.where(priority: filters[:priority]) if filters[:priority].any?
                else
                    query = query.where(priority: filters[:priority])
                end
            end

            if filters[:source].present?
                if filters[:source].is_a?(Array)
                    query = query.where(source: filters[:source]) if filters[:source].any?
                else
                    query = query.where(source: filters[:source])
                end
            end

            if filters[:agent].present? || filters[:responder_id].present?
                agent_id = filters[:agent] || filters[:responder_id]
                if agent_id.is_a?(Array)
                    query = query.where(responder_id: agent_id) if agent_id.any?
                else
                    query = query.where(responder_id: agent_id)
                end
            end

            if filters[:group].present? || filters[:group_id].present?
                group_id = filters[:group] || filters[:group_id]
                if group_id.is_a?(Array)
                    query = query.where(group_id: group_id) if group_id.any?
                else
                    query = query.where(group_id: group_id)
                end
            end

            if filters[:company_id].present?
                if filters[:company_id].is_a?(Array)
                    query = query.where(company_id: filters[:company_id]) if filters[:company_id].any?
                else
                    query = query.where(company_id: filters[:company_id])
                end
            end

            if filters[:requester_id].present?
                if filters[:requester_id].is_a?(Array)
                    query = query.where(requester_id: filters[:requester_id]) if filters[:requester_id].any?
                else
                    query = query.where(requester_id: filters[:requester_id])
                end
            end

            if filters[:ticket_type].present? || filters[:type].present?
                ticket_type = filters[:ticket_type] || filters[:type]
                if ticket_type.is_a?(Array)
                    query = query.where(ticket_type: ticket_type) if ticket_type.any?
                else
                    query = query.where(ticket_type: ticket_type)
                end
            end

            if filters[:tags].present?
                if filters[:tags].is_a?(Array)
                    if filters[:tags].any?
                        tag_ticket_ids = TicketTag.where(tag: filters[:tags]).pluck(:ticket_id).uniq
                        query = query.where(id: tag_ticket_ids)
                    end
                else
                    tag_ticket_ids = TicketTag.where(tag: filters[:tags]).pluck(:ticket_id)
                    query = query.where(id: tag_ticket_ids)
                end
            end

            custom_field_filters = {}

            filters.each do |key, value|
                if key.to_s.start_with?('cf_') && value.present?
                    custom_field_filters[key.to_s] = value
                end
            end

            if custom_field_filters.any?
                matching_ticket_ids = nil

                custom_field_filters.each do |field_name, field_value|
                    ticket_ids_query = TicketCustomField.where(field_name: field_name)

                    if field_value.is_a?(Array)
                        ticket_ids_query = ticket_ids_query.where(field_value: field_value) if field_value.any?
                    else
                        ticket_ids_query = ticket_ids_query.where(field_value: field_value)
                    end

                    ticket_ids = ticket_ids_query.pluck(:ticket_id).uniq

                    if matching_ticket_ids.nil?
                        matching_ticket_ids = ticket_ids
                    else
                        matching_ticket_ids &= ticket_ids
                    end

                    break if matching_ticket_ids.empty?
                end

                if matching_ticket_ids && matching_ticket_ids.any?
                    query = query.where(id: matching_ticket_ids)
                elsif custom_field_filters.any?
                    query = query.where(id: nil)
                end
            end

            query
        end

        def update_ticket_from_freshdesk(db_ticket, ticket_data)
            db_ticket.update(
                priority: ticket_data['priority'],
                source: ticket_data['source'],
                status: ticket_data['status'],
                subject: ticket_data['subject'],
                ticket_type: ticket_data['type'],
                due_by: ticket_data['due_by'],
                fr_due_by: ticket_data['fr_due_by'],
                is_escalated: ticket_data['is_escalated'],
                created_at: ticket_data['created_at'],
                updated_at: ticket_data['updated_at'],
                nr_due_by: ticket_data['nr_due_by'],
                nr_escalated: ticket_data['nr_escalated'],
                email_config_id: ticket_data['email_config_id'],
                product_id: ticket_data['product_id'],
                fr_escalated: ticket_data['fr_escalated'],
                spam: ticket_data['spam'],
                association_type: ticket_data['association_type'],
                support_email: ticket_data['support_email'],
                sentiment_score: ticket_data['sentiment_score'],
                initial_sentiment_score: ticket_data['initial_sentiment_score'],
                is_deleted: false,
                requester_id: ticket_data['requester_id'],
                responder_id: ticket_data['responder_id'],
                group_id: ticket_data['group_id'],
                company_id: ticket_data['company_id'],
                associated_tickets_count: ticket_data['associated_tickets_count'],
                structured_description: ticket_data['structured_description'],
                last_fetched_at: Time.now,
            )
        end

        def update_or_create_ticket_conversation(ticket_id, conversation_data)
            conversation = Conversation.where(ticket_id: ticket_id, ticket_conversation: true).first

            if !conversation.present?
                conversation = Conversation.create(
                    ticket_id: ticket_id,
                    ticket_conversation: true,
                    body: conversation_data['description'],
                    body_text: conversation_data['description_text'],
                    user_id: conversation_data['requester_id'],
                    created_at: conversation_data['created_at'],
                    updated_at: conversation_data['updated_at'],
                    is_deleted: false,
                )

                if conversation_data['attachments'].present?
                    create_conversation_attachments(conversation, conversation_data['attachments'])
                end
            else
                conversation.update(
                    body: conversation_data['description'],
                    body_text: conversation_data['description_text'],
                    updated_at: conversation_data['updated_at']
                )

                if conversation_data['attachments'].present?
                    update_conversation_attachments(conversation, conversation_data['attachments'])
                end
            end

            conversation
        end

        def update_conversation_attachments(conversation, attachments)
            attachments.each do |attachment|
                conversation.conversation_attachments.update(
                    freshdesk_id: attachment['id'],
                    attachment_url: attachment['attachment_url'],
                )
            end
        end

        def create_conversation_attachments(conversation, attachments)
            attachments.each do |attachment|
                conversation.conversation_attachments.create(
                    freshdesk_id: attachment['id'],
                    name: attachment['name'],
                    content_type: attachment['content_type'],
                    size: attachment['size'],
                    attachment_url: attachment['attachment_url'],
                    created_at: attachment['created_at'],
                    updated_at: attachment['updated_at'],
                )
            end
        end

        def get_ticket_data(ticket_id)
            ticket = Ticket.find_by(id: ticket_id)
            ticket_conversation = Conversation.where(ticket_id: ticket_id, ticket_conversation: true).first
            ticket_attachments = ticket_conversation.conversation_attachments
            ticket_tags = ticket.ticket_tags
            ticket_emails = ticket.ticket_emails

            ticket_json = ticket.as_json
            ticket_json.merge(
                {
                    'description' => ticket_conversation.body,
                    'description_text' => ticket_conversation.body_text,
                    'attachments' => ticket_attachments.map do |attachment|
                        {
                            'id' => attachment.id,
                            'freshdesk_id' => attachment.freshdesk_id,
                            'name' => attachment.name,
                            'content_type' => attachment.content_type,
                            'size' => attachment.size,
                            'attachment_url' => attachment.attachment_url,
                            'created_at' => attachment.created_at,
                            'updated_at' => attachment.updated_at,
                        }
                    end,
                    'tags' => ticket_tags.map(&:tag),
                    'cc_emails' => ticket_emails.select { |e| e.email_type == 'cc_emails' }.map(&:email),
                    'fwd_emails' => ticket_emails.select { |e| e.email_type == 'fwd_emails' }.map(&:email),
                    'reply_cc_emails' => ticket_emails.select { |e| e.email_type == 'reply_cc_emails' }.map(&:email),
                    'ticket_cc_emails' => ticket_emails.select { |e| e.email_type == 'ticket_cc_emails' }.map(&:email),
                    'ticket_bcc_emails' => ticket_emails.select { |e| e.email_type == 'ticket_bcc_emails' }.map(&:email),
                    'to_emails' => ticket_emails.select { |e| e.email_type == 'to_emails' }.map(&:email),
                }
            )
        end

        def create_ticket_from_freshdesk(ticket_data)
            db_ticket = Ticket.new(
                gid: SecureRandom.uuid,
                freshdesk_id: ticket_data['id'],
                priority: ticket_data['priority'],
                source: ticket_data['source'],
                status: ticket_data['status'],
                subject: ticket_data['subject'],
                ticket_type: ticket_data['type'],
                due_by: ticket_data['due_by'],
                fr_due_by: ticket_data['fr_due_by'],
                is_escalated: ticket_data['is_escalated'],
                created_at: ticket_data['created_at'],
                updated_at: ticket_data['updated_at'],
                nr_due_by: ticket_data['nr_due_by'],
                nr_escalated: ticket_data['nr_escalated'],
                email_config_id: ticket_data['email_config_id'],
                product_id: ticket_data['product_id'],
                fr_escalated: ticket_data['fr_escalated'],
                spam: ticket_data['spam'],
                association_type: ticket_data['association_type'],
                support_email: ticket_data['support_email'],
                sentiment_score: ticket_data['sentiment_score'],
                initial_sentiment_score: ticket_data['initial_sentiment_score'],
                is_deleted: false,
                requester_id: ticket_data['requester_id'],
                responder_id: ticket_data['responder_id'],
                group_id: ticket_data['group_id'],
                company_id: ticket_data['company_id'],
                associated_tickets_count: ticket_data['associated_tickets_count'],
                structured_description: ticket_data['structured_description'],
            )

            if db_ticket.save
                create_ticket_related_data(db_ticket, ticket_data)
            end

            db_ticket
        end

        def create_ticket_related_data(db_ticket, ticket_data)
            if ticket_data['custom_fields'].present?
                ticket_data['custom_fields'].each do |field_name, field_value|
                    db_ticket.ticket_custom_fields.create(field_name: field_name, field_value: field_value)
                end
            end

            if ticket_data['tags'].present?
                ticket_data['tags'].each do |tag|
                    db_ticket.ticket_tags.create(tag: tag)
                end
            end

            email_types = ['cc_emails', 'fwd_emails', 'reply_cc_emails', 'ticket_cc_emails', 'ticket_bcc_emails', 'to_emails']
            email_types.each do |email_type|
                if ticket_data[email_type].present?
                    ticket_data[email_type].each do |email|
                        db_ticket.ticket_emails.create(email: email, email_type: email_type)
                    end
                end
            end
        end

        def mark_ticket_deleted(ticket_id)
            db_ticket = Ticket.find_by(id: ticket_id)
            db_ticket.update(
                is_deleted: true,
                deleted_at: Time.now,
            )
        end

        def get_conversations(ticket_id)
            conversations = Conversation.where(ticket_id: ticket_id.to_s, ticket_conversation: false, is_deleted: false)
                                        .order('created_at DESC')

            conversations.map do |conversation|
                conversation_attachments = conversation.conversation_attachments
                conversation_emails = conversation.conversation_emails
                conversation_delivery_details = conversation.conversation_delivery_details
                conversation_data = conversation.as_json

                conversation_data.merge(
                    'attachments' => conversation_attachments.map do |attachment|
                        {
                            'id' => attachment.id,
                            'freshdesk_id' => attachment.freshdesk_id,
                            'name' => attachment.name,
                            'content_type' => attachment.content_type,
                            'size' => attachment.size,
                            'attachment_url' => attachment.attachment_url,
                            'created_at' => attachment.created_at,
                            'updated_at' => attachment.updated_at,
                        }
                    end,
                    'cc_emails' => conversation_emails.select { |e| e.email_type == 'cc_emails' }.map(&:email),
                    'to_emails' => conversation_emails.select { |e| e.email_type == 'to_emails' }.map(&:email),
                    'bcc_emails' => conversation_emails.select { |e| e.email_type == 'bcc_emails' }.map(&:email),
                    'failed_emails' => conversation_delivery_details.select{ |e| e.status == 'failed' }.map(&:email),
                    'pending_emails' => conversation_delivery_details.select{ |e| e.status == 'pending' }.map(&:email),
                )
            end
        end

        def create_conversation(conversation_data, ticket_id, source)
            db_conversation = Conversation.create!(
                gid: SecureRandom.uuid,
                freshdesk_id: conversation_data['id'],
                body: conversation_data['body'],
                body_text: conversation_data['body_text'],
                user_id: conversation_data['user_id'],
                source: conversation_data['source'] || source,
                from_email: conversation_data['from_email'],
                incoming: conversation_data['incoming'],
                private: conversation_data['private'],
                support_email: conversation_data['support_email'],
                ticket_id: ticket_id,
                created_at: conversation_data['created_at'],
                updated_at: conversation_data['updated_at'],
                is_deleted: false,
                ticket_conversation: false,
                category: conversation_data['category'],
                email_failure_count: conversation_data['email_failure_count'],
                outgoing_failures: conversation_data['outgoing_failures'],
                thread_id: conversation_data['thread_id'],
                thread_message_id: conversation_data['thread_message_id'],
                last_edited_at: conversation_data['last_edited_at'],
                last_edited_user_id: conversation_data['last_edited_user_id'],
                automation_id: conversation_data['automation_id'],
                automation_type_id: conversation_data['automation_type_id'],
                auto_response: conversation_data['auto_response'],
                threading_type: conversation_data['threading_type'],
                source_additional_info: conversation_data['source_additional_info']
            )

            create_conversation_related_data(db_conversation, conversation_data)

            db_conversation
        end

        def create_conversation_related_data(conversation, conversation_data)
            if conversation_data['attachments'].present?
                conversation_data['attachments'].each do |attachment|
                    conversation.conversation_attachments.create!(
                        freshdesk_id: attachment['id'],
                        name: attachment['name'],
                        content_type: attachment['content_type'],
                        size: attachment['size'],
                        attachment_url: attachment['attachment_url'],
                        created_at: attachment['created_at'],
                        updated_at: attachment['updated_at'],
                    )
                end
            end

            email_types = ['cc_emails', 'to_emails', 'bcc_emails']
            email_types.each do |email_type|
                if conversation_data[email_type].present?
                    conversation_data[email_type].each do |email|
                        conversation.conversation_emails.create!(
                            email: email,
                            email_type: email_type
                        )
                    end
                end
            end

            if conversation_data['delivery_details'].present?
                conversation_data['delivery_details'].each do |status, emails|
                    emails.each do |email|
                        conversation.conversation_delivery_details.create!(
                            email: email,
                            status: status == 'failed_emails' ? 'failed' : 'pending'
                        )
                    end
                end
            end
        end

        def mark_conversation_deleted(conversation_id)
            db_conversation = Conversation.find_by(id: conversation_id)
            db_conversation.update(
                is_deleted: true,
                deleted_at: Time.now,
            )
        end

        def update_conversation(conversation_id, conversation_data)
            db_conversation = Conversation.find_by(id: conversation_id)
            db_conversation.update(
                body: conversation_data['body'],
                body_text: conversation_data['body_text'],
                user_id: conversation_data['user_id'],
                incoming: conversation_data['incoming'],
                private: conversation_data['private'],
                source: conversation_data['source'] || 2,
                support_email: conversation_data['support_email'],
                ticket_id: conversation_data['ticket_id'],
                created_at: conversation_data['created_at'],
                updated_at: conversation_data['updated_at'],
                is_deleted: false,
                ticket_conversation: false
            )

            db_conversation.conversation_attachments.destroy_all
            db_conversation.conversation_emails.destroy_all
            db_conversation.conversation_delivery_details.destroy_all

            create_conversation_related_data(db_conversation, conversation_data)

            db_conversation
        end

        def tickets_for_export
            Ticket.where(is_deleted: false, spam: false).order('created_at DESC')
        end

        def count_tickets
            Ticket.where(is_deleted: false).count
        end

        def translate_ids_for_api(ticket_data)
            result = ticket_data.dup

            if result[:group_id].present?
                group = Group.find_by(id: result[:group_id].to_i)
                result[:group_id] = group&.freshdesk_id
            end

            if result[:requester_id].present?
                contact = Contact.find_by(id: result[:requester_id].to_i)
                result[:requester_id] = contact&.freshdesk_id
            end

            if result[:responder_id].present?
                agent = Agent.find_by(id: result[:responder_id].to_i)
                result[:responder_id] = agent&.freshdesk_id
            end

            if result[:company_id].present?
                company = Company.find_by(id: result[:company_id].to_i)
                result[:company_id] = company&.freshdesk_id
            end

            result
        end

        def translate_ids_from_api(ticket_data)
            result = ticket_data.dup

            if result['group_id'].present?
                group = Group.find_by(freshdesk_id: result['group_id'])
                result['group_id'] = group&.id
            end

            if result['requester_id'].present?
                contact = Contact.find_by(freshdesk_id: result['requester_id'])
                result['requester_id'] = contact&.id
            end

            if result['responder_id'].present?
                agent = Agent.find_by(freshdesk_id: result['responder_id'])
                result['responder_id'] = agent&.id
            end

            if result['company_id'].present?
                company = Company.find_by(freshdesk_id: result['company_id'])
                result['company_id'] = company&.id
            end

            if result['user_id'].present?
                agent = Agent.find_by(freshdesk_id: result['user_id'])
                result['user_id'] = agent&.id
            end

            if result['ticket_id'].present?
                ticket = Ticket.find_by(freshdesk_id: result['ticket_id'])
                result['ticket_id'] = ticket&.id
            end

            result
        end
    end
end
