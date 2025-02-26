class User < ApplicationRecord
	devise :omniauthable, omniauth_providers: [:google_oauth2]
  
  enum role: { agent: 0, admin: 1 }

	def self.from_google(auth)
    where(email: auth[:email]).first
  end
end
