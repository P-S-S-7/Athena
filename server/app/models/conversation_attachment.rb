class ConversationAttachment
  include Mongoid::Document

  field :freshdesk_id, type: Integer
  field :size, type: Integer
  field :name, type: String
  field :content_type, type: String
  field :attachment_url, type: String
  field :created_at, type: DateTime
  field :updated_at, type: DateTime

  belongs_to :conversation
end
