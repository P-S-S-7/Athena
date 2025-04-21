class CompanyCustomField < ApplicationRecord
    belongs_to :company, optional: true
end
