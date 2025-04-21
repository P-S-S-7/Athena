module Api
    class CompaniesController < ApplicationController
        before_action :authenticate_user!

        def initialize
            super
            @freshdesk_service = Freshdesk::CompanyService.new
            @db_service = Db::CompanyService.new
        end

        def index
            order_by = params[:order_by] || 'name'
            order_type = params[:order_type] || 'asc'
            page = params[:page] || 1
            per_page = params[:per_page] || 50

            result = @db_service.list_companies(order_by, order_type, page, per_page)
            render json: result
        end

        def show
            company = @db_service.get_company_with_domains(params[:id])

            if company
                render json: { company: company }
            else
                render json: { error: "Company not found" }, status: :not_found
            end
        end

        def create
            if company_params[:domains].present?
                duplicate_domains = @db_service.check_duplicate_domains(company_params[:domains])

                if duplicate_domains.present?
                    error_message = if duplicate_domains.size == 1
                                        "(#{duplicate_domains.join(', ')}) domain is already used by some other company"
                                    else
                                        "[#{duplicate_domains.join(', ')}] domains are already used by some other company"
                                    end

                    return render json: { error: error_message }, status: :unprocessable_entity
                end
            end

            if @db_service.company_exists_by_name?(company_params[:name])
                return render json: { error: "Company with name (#{company_params[:name]}) already exists" }, status: :unprocessable_entity
            end

            company = @freshdesk_service.create_company(company_params.to_h)

            @db_service.create_company_from_freshdesk(company)

            render json: { company: company }, status: :created
        end

        def update
            if company_params[:domains].present?
                duplicate_domains = @db_service.check_duplicate_domains(company_params[:domains], params[:id])

                if duplicate_domains.present?
                    error_message = if duplicate_domains.size == 1
                                        "(#{duplicate_domains.join(', ')}) domain is already used by some other company"
                                    else
                                        "[#{duplicate_domains.join(', ')}] domains are already used by some other company"
                                    end

                    return render json: { error: error_message }, status: :unprocessable_entity
                end
            end

            db_company = @db_service.find_by_id(params[:id])

            if company_params[:name].present? &&
               company_params[:name].downcase != db_company.name.downcase &&
               @db_service.company_exists_by_name?(company_params[:name])
                return render json: { error: "Company with name (#{company_params[:name]}) already exists" }, status: :unprocessable_entity
            end

            freshdesk_id = db_company.freshdesk_id
            company = @freshdesk_service.update_company(freshdesk_id, company_params.to_h)

            @db_service.update_company_from_freshdesk(db_company, company)

            render json: { company: company }
        end

        def destroy
            db_company = @db_service.find_by_id(params[:id])
            freshdesk_id = db_company.freshdesk_id

            @freshdesk_service.delete_company(freshdesk_id)

            @db_service.delete_company(params[:id])

            head :no_content
        end

        def fields
            fields = @freshdesk_service.get_company_fields
            render json: { fields: fields }
        end

        private

        def company_params
            params.require(:company).permit(
                :name,
                :description,
                :note,
                :health_score,
                :account_tier,
                :industry,
                :renewal_date,
                domains: [],
                custom_fields: {}
            )
        end
    end
end
