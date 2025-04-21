module Freshdesk
  class CompanyService
    def initialize
      @client = ApiClient.new
    end

    def get_company(id)
      begin
        @client.request(:get, "/companies/#{id}")
      rescue Freshdesk::ResourceNotFoundError
        raise Freshdesk::ResourceNotFoundError.new("Company ##{id} not found")
      rescue Freshdesk::Error => e
        raise e
      rescue => e
        raise Freshdesk::RequestError.new("Failed to get company ##{id}: #{e.message}")
      end
    end

    def create_company(company_params)
      begin
        @client.request(:post, '/companies', company_params)
      rescue Freshdesk::ValidationError => e
        raise e
      rescue Freshdesk::Error => e
        raise e
      rescue => e
        raise Freshdesk::RequestError.new("Failed to create company: #{e.message}")
      end
    end

    def update_company(id, company_params)
      begin
        @client.request(:put, "/companies/#{id}", company_params)
      rescue Freshdesk::ResourceNotFoundError
        raise Freshdesk::ResourceNotFoundError.new("Company ##{id} not found")
      rescue Freshdesk::ValidationError => e
        raise e
      rescue Freshdesk::Error => e
        raise e
      rescue => e
        raise Freshdesk::RequestError.new("Failed to update company ##{id}: #{e.message}")
      end
    end

    def delete_company(id)
      begin
        @client.request(:delete, "/companies/#{id}")
      rescue Freshdesk::ResourceNotFoundError
        raise Freshdesk::ResourceNotFoundError.new("Company ##{id} not found")
      rescue Freshdesk::Error => e
        raise e
      rescue => e
        raise Freshdesk::RequestError.new("Failed to delete company ##{id}: #{e.message}")
      end
    end

    def get_company_fields
      begin
        @client.request(:get, '/company_fields')
      rescue Freshdesk::Error => e
        raise e
      rescue => e
        raise Freshdesk::RequestError.new("Failed to get company fields: #{e.message}")
      end
    end
  end
end
