class CannedResponse
    include Mongoid::Document

    field :freshdesk_id, type: Integer
    field :title, type: String
    field :content, type: String
    field :content_html, type: String
    field :created_at, type: DateTime
    field :updated_at, type: DateTime
    field :group_ids, type: Array, default: []
    field :visibility, type: Integer

    belongs_to :canned_response_folder, class_name: 'CannedResponseFolder', foreign_key: :folder_id, optional: true

    has_many :canned_response_attachments, dependent: :destroy
end
