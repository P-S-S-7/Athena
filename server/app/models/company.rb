class Company < ApplicationRecord
    has_many :contacts, dependent: :nullify
    has_many :tickets, dependent: :nullify
    has_many :company_custom_fields, dependent: :destroy
    has_many :company_domains, dependent: :destroy
end
