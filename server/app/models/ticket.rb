class Ticket < ApplicationRecord
    belongs_to :requester, class_name: 'Contact', optional: true
    belongs_to :responder, class_name: 'Agent', optional: true
    belongs_to :company, optional: true
    belongs_to :group, optional: true

    has_many :ticket_custom_fields, dependent: :destroy
    has_many :ticket_tags, dependent: :destroy
    has_many :ticket_emails, dependent: :destroy
end
