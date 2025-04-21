class Conversation
  include Mongoid::Document

  field :gid, type: String
  field :freshdesk_id, type: Integer
  field :body, type: String
  field :body_text, type: String
  field :incoming, type: Boolean
  field :private, type: Boolean
  field :user_id, type: Integer
  field :support_email, type: String
  field :source, type: Integer
  field :category, type: Integer
  field :from_email, type: String
  field :email_failure_count, type: Integer
  field :outgoing_failures, type: Integer
  field :thread_id, type: Integer
  field :thread_message_id, type: Integer
  field :last_edited_at, type: DateTime
  field :last_edited_user_id, type: Integer
  field :automation_id, type: Integer
  field :automation_type_id, type: Integer
  field :auto_response, type: Boolean
  field :ticket_id, type: Integer
  field :threading_type, type: String
  field :source_additional_info, type: String
  field :is_deleted, type: Boolean
  field :deleted_at, type: DateTime
  field :created_at, type: DateTime
  field :updated_at, type: DateTime
  field :ticket_conversation, type: Boolean

  has_many :conversation_emails, dependent: :destroy
  has_many :conversation_delivery_details, dependent: :destroy
  has_many :conversation_attachments, dependent: :destroy
end
