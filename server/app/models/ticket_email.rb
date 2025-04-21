class TicketEmail < ApplicationRecord
    belongs_to :ticket, optional: true
end
