class ContactCustomField < ApplicationRecord
    belongs_to :contact, optional: true
end
