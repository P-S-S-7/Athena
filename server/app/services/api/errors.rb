module Api
  module Errors
    class ApiError < StandardError
      attr_reader :status, :error, :message

      def initialize(error = nil, status = nil, message = nil)
        @error = error || "api_error"
        @status = status || :unprocessable_entity
        @message = message || "Something went wrong"
        super(@message)
      end

      def to_hash
        {
          error: @error,
          status: @status,
          message: @message
        }
      end
    end
  end
end
