class Contact < ApplicationRecord
    belongs_to :company, optional: true
    has_one :avatar, dependent: :destroy

    has_many :tickets, foreign_key: 'requester_id', dependent: :nullify
    has_many :contact_custom_fields, dependent: :destroy

    validates :email, uniqueness: true, allow_nil: true
    validates :unique_external_id, uniqueness: true, allow_nil: true
end
