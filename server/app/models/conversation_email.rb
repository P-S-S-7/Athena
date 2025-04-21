class ConversationEmail
  include Mongoid::Document

  field :email_type, type: String
  field :email, type: String

  belongs_to :conversation
end
