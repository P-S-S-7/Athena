class JwtService
    ALGORITHM = 'HS256'.freeze

    def self.encode(payload, expiration = 7.days.from_now)
        payload[:exp] = expiration.to_i
        JWT.encode(payload, jwt_secret, ALGORITHM)
    end

    def self.decode(token)
        decoded = JWT.decode(token, jwt_secret, true, { algorithm: ALGORITHM })[0]
        ActiveSupport::HashWithIndifferentAccess.new(decoded)
    rescue JWT::DecodeError, JWT::ExpiredSignature
        nil
    end

    def self.jwt_secret
        ENV['JWT_SECRET_KEY'] || Rails.application.credentials.secret_key_base
    end
end
