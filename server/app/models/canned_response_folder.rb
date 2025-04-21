class CannedResponseFolder
    include Mongoid::Document

    field :freshdesk_id, type: Integer
    field :name, type: String
    field :created_at, type: DateTime
    field :updated_at, type: DateTime
    field :responses_count, type: Integer

    has_many :canned_responses, dependent: :destroy
end
