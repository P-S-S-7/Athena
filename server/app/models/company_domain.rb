class CompanyDomain < ApplicationRecord
  belongs_to :company, optional: true
end
