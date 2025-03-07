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
                    raise "Unsupported request type: #{req_type}"
                end
            end
        end

        def request_with_attachments(endpoint, body = {}, attachments = [], method = :post)
            body = deep_transform_boolean_strings(body)

            body_with_attachments = {
                basic_auth: @auth,
                multipart: true,
                body: body
            }

            if attachments.any?
                files_to_close = []

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

            response = case method.to_sym
                       when :post
                           self.class.post(endpoint, body_with_attachments)
                       when :put
                           self.class.put(endpoint, body_with_attachments)
                       else
                           raise "Unsupported method for multipart: #{method}"
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

            hash.transform_values do |value|
                case value
                when 'true'
                    true
                when 'false'
                    false
                when Hash
                    deep_transform_boolean_strings(value)
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
                raise "Authentication failed. Please check your API key."
            when 403
                raise "You don't have permission to access this resource."
            when 404
                raise "The requested resource was not found."
            when 429
                raise "Rate limit exceeded. Please try again later."
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
                raise error_message
            end
        end
    end
end
