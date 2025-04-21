module Db
    class CompanyService
        def list_companies(order_by = 'name', order_type = 'asc', page = 1, per_page = 50)
            page = page.to_i
            per_page = per_page.to_i

            page = 1 if page < 1
            per_page = 50 if per_page < 1 || per_page > 100

            total_count = Company.count

            companies = Company.order(order_by => order_type)
                             .limit(per_page)
                             .offset((page - 1) * per_page)

            {
                companies: companies,
                meta: {
                    total: total_count,
                    per_page: per_page,
                    current_page: page,
                    total_pages: (total_count.to_f / per_page).ceil
                }
            }
        end

        def find_by_id(id)
            Company.find_by(id: id)
        end

        def get_company_with_domains(id)
            company = Company.find_by(id: id)
            return nil unless company

            company_domains = company.company_domains.pluck(:domain)
            company_data = company.as_json
            company_data.merge(domains: company_domains || [])
        end

        def check_duplicate_domains(domains, company_id = nil)
            duplicate_domains = []

            domains.each do |domain|
                query = CompanyDomain.where('lower(domain) = ?', domain.downcase)
                query = query.where.not(company_id: company_id) if company_id.present?

                if query.exists?
                    duplicate_domains << domain
                end
            end

            duplicate_domains
        end

        def company_exists_by_name?(name, company_id = nil)
            query = Company.where('lower(name) = ?', name.downcase)
            query = query.where.not(id: company_id) if company_id.present?
            query.exists?
        end

        def create_company_from_freshdesk(company_data)
            db_company = Company.new(
                gid: SecureRandom.uuid,
                freshdesk_id: company_data['id'],
                name: company_data['name'],
                description: company_data['description'],
                note: company_data['note'],
                health_score: company_data['health_score'],
                account_tier: company_data['account_tier'],
                renewal_date: company_data['renewal_date'],
                industry: company_data['industry'],
                org_company_id: company_data['org_company_id'],
                created_at: company_data['created_at'],
                updated_at: company_data['updated_at'],
            )

            if db_company.save
                create_company_related_data(db_company, company_data)
            end

            db_company
        end

        def create_company_related_data(db_company, company_data)
            if company_data['domains'].present?
                company_data['domains'].each do |domain|
                    db_company.company_domains.create(domain: domain)
                end
            end

            if company_data['custom_fields'].present?
                company_data['custom_fields'].each do |key, value|
                    db_company.company_custom_fields.create(key: key, value: value)
                end
            end
        end

        def update_company_from_freshdesk(db_company, company_data)
            db_company.update(
                name: company_data['name'],
                description: company_data['description'],
                note: company_data['note'],
                health_score: company_data['health_score'],
                account_tier: company_data['account_tier'],
                renewal_date: company_data['renewal_date'],
                industry: company_data['industry'],
                org_company_id: company_data['org_company_id'],
                created_at: company_data['created_at'],
                updated_at: company_data['updated_at'],
            )

            db_company.company_domains.destroy_all
            if company_data['domains'].present?
                company_data['domains'].each do |domain|
                    db_company.company_domains.create(domain: domain)
                end
            end

            db_company.company_custom_fields.destroy_all
            if company_data['custom_fields'].present?
                company_data['custom_fields'].each do |key, value|
                    db_company.company_custom_fields.create(key: key, value: value)
                end
            end

            db_company
        end

        def delete_company(id)
            db_company = Company.find_by(id: id)
            return false unless db_company

            db_company.company_domains.destroy_all
            db_company.company_custom_fields.destroy_all
            db_company.destroy

            true
        end
    end
end
