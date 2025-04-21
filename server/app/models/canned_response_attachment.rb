class CannedResponseAttachment
    include Mongoid::Document

    field :freshdesk_id, type: Integer
    field :name, type: String
    field :content_type, type: String
    field :size, type: Integer
    field :created_at, type: DateTime
    field :updated_at, type: DateTime
    field :attachment_url, type: String

    belongs_to :canned_response
end
