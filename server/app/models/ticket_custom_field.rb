class TicketCustomField < ApplicationRecord
    belongs_to :ticket, optional: true
end
