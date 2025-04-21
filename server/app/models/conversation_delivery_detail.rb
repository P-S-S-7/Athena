class ConversationDeliveryDetail
  include Mongoid::Document

  field :email, type: String
  field :status, type: String

  belongs_to :conversation
end
