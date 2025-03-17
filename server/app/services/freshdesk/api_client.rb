require 'net/http/post/multipart'

module Freshdesk
    class ApiClient
        include HTTParty

        attr_reader :domain, :api_key

        def initialize
            @domain = ENV['FRESHDESK_DOMAIN']
            @api_key = ENV['FRESHDESK_API_KEY']
            @auth = { username: @api_key, password: 'X' }
            self.class.base_uri "https://#{@domain}.freshdesk.com/api/v2"
            self.class.headers 'Content-Type' => 'application/json'
        end

        def request(req_type, endpoint, body = {}, query = {})
            handle_response do
                case req_type.downcase.to_sym
                when :get
                    self.class.get(endpoint, basic_auth: @auth, query: query)
                when :post
                    self.class.post(endpoint, basic_auth: @auth, body: body.to_json)
                when :put
                    self.class.put(endpoint, basic_auth: @auth, body: body.to_json)
                when :delete
                    self.class.delete(endpoint, basic_auth: @auth)
                else
                    raise Freshdesk::RequestError.new("Unsupported request type: #{req_type}")
                end
            end
        end

        def request_with_attachments(endpoint, body = {}, attachments = [], method = :post)
            if body.respond_to?(:to_unsafe_h)
                body = body.to_unsafe_h
            end

            body = deep_transform_boolean_strings(body)

            body_with_attachments = {
                basic_auth: @auth,
                multipart: true,
                body: {}
            }

            body.each do |key, value|
                if value.is_a?(Hash)
                    body_with_attachments[:body][key] = value.to_json
                else
                    body_with_attachments[:body][key] = value
                end
            end

            is_contact_endpoint = endpoint.include?('/contacts')

            if attachments.any?
                files_to_close = []

                if is_contact_endpoint
                    avatar = attachments.first

                    if avatar.is_a?(ActionDispatch::Http::UploadedFile)
                        file = File.open(avatar.tempfile.path)
                        files_to_close << file

                        body_with_attachments[:body][:avatar] = UploadIO.new(
                            file,
                            avatar.content_type || 'application/octet-stream',
                            avatar.original_filename
                        )
                    elsif avatar.is_a?(Hash) && avatar[:file].is_a?(ActionDispatch::Http::UploadedFile)
                        uploaded_file = avatar[:file]
                        file = File.open(uploaded_file.tempfile.path)
                        files_to_close << file

                        body_with_attachments[:body][:avatar] = UploadIO.new(
                            file,
                            uploaded_file.content_type || 'application/octet-stream',
                            avatar[:filename] || uploaded_file.original_filename
                        )
                    elsif avatar
                        body_with_attachments[:body][:avatar] = avatar
                    end
                else
                    body_with_attachments[:body][:attachments] = attachments.map do |attachment|
                        if attachment.is_a?(ActionDispatch::Http::UploadedFile)
                            file = File.open(attachment.tempfile.path)
                            files_to_close << file

                            UploadIO.new(
                                file,
                                attachment.content_type || 'application/octet-stream',
                                attachment.original_filename
                            )
                        elsif attachment.is_a?(Hash) && attachment[:file].is_a?(ActionDispatch::Http::UploadedFile)
                            uploaded_file = attachment[:file]
                            file = File.open(uploaded_file.tempfile.path)
                            files_to_close << file

                            UploadIO.new(
                                file,
                                uploaded_file.content_type || 'application/octet-stream',
                                attachment[:filename] || uploaded_file.original_filename
                            )
                        else
                            attachment
                        end
                    end
                end
            end

            response = case method.to_sym
                       when :post
                           self.class.post(endpoint, body_with_attachments)
                       when :put
                           self.class.put(endpoint, body_with_attachments)
                       else
                           raise Freshdesk::RequestError.new("Unsupported method for multipart: #{method}")
                       end

            if defined?(files_to_close) && files_to_close.any?
                files_to_close.each do |file|
                    file.close if file.respond_to?(:close) && !file.closed?
                end
            end

            handle_response { response }
        end

        private

        def deep_transform_boolean_strings(hash)
            return hash unless hash.is_a?(Hash)

            hash = hash.to_h if hash.is_a?(ActionController::Parameters)

            hash.transform_values do |value|
                if value == 'true'
                    true
                elsif value == 'false'
                    false
                elsif value.is_a?(Hash) || value.is_a?(ActionController::Parameters)
                    deep_transform_boolean_strings(value)
                elsif value.is_a?(Array)
                    value.map { |item| item.is_a?(Hash) || item.is_a?(ActionController::Parameters) ? deep_transform_boolean_strings(item) : item }
                else
                    value
                end
            end
        end

        def handle_response
            response = yield

            case response.code
            when 200..299
                response.parsed_response
            when 401
                raise Freshdesk::AuthenticationError
            when 403
                raise Freshdesk::PermissionError
            when 404
                raise Freshdesk::ResourceNotFoundError
            when 422
                error_message = begin
                    error_details = JSON.parse(response.body)
                    message = error_details['description'] || error_details['message'] || "Validation failed"
                    errors = error_details['errors'] ? ": #{error_details['errors'].inspect}" : ""
                    "#{message}#{errors}"
                rescue
                    "Validation failed"
                end
                raise Freshdesk::ValidationError.new(error_message)
            when 429
                raise Freshdesk::RateLimitError
            when 500..599
                raise Freshdesk::ServiceUnavailableError.new("Freshdesk service error (#{response.code}): #{response.message}")
            else
                error_message = begin
                    error_details = JSON.parse(response.body)
                    if error_details.is_a?(Hash) && error_details['errors'].present?
                        "API request failed: #{error_details['description'] || error_details['message']} - #{error_details['errors'].inspect}"
                    else
                        "API request failed: #{error_details['description'] || error_details['message'] || response.body}"
                    end
                rescue
                    "API request failed with status code #{response.code}: #{response.message}"
                end
                Rails.logger.error("Freshdesk API response: #{response.body}")
                raise Freshdesk::RequestError.new(error_message)
            end
        end
    end

    class Error < Api::Errors::ApiError
    end

    class AuthenticationError < Error
        def initialize(message = "Authentication failed. Please check your API key.")
            super("authentication_failed", :unauthorized, message)
        end
    end

    class PermissionError < Error
        def initialize(message = "You don't have permission to access this resource.")
            super("permission_denied", :forbidden, message)
        end
    end

    class ResourceNotFoundError < Error
        def initialize(message = "The requested resource was not found.")
            super("resource_not_found", :not_found, message)
        end
    end

    class RateLimitError < Error
        def initialize(message = "Rate limit exceeded. Please try again later.")
            super("rate_limit_exceeded", :too_many_requests, message)
        end
    end

    class ValidationError < Error
        def initialize(message = "Validation failed.")
            super("validation_error", :unprocessable_entity, message)
        end
    end

    class RequestError < Error
        def initialize(message = "Request failed.")
            super("request_error", :bad_request, message)
        end
    end

    class ServiceUnavailableError < Error
        def initialize(message = "Freshdesk service is currently unavailable.")
            super("service_unavailable", :service_unavailable, message)
        end
    end
end
