class User < ApplicationRecord
    devise :omniauthable, omniauth_providers: [:google_oauth2]

    enum role: { agent: 0, admin: 1 }

    def self.from_google(auth)
        user = find_by(email: auth[:email])

        if user
            user.update(full_name: auth[:full_name], avatar_url: auth[:avatar_url], provider: auth[:provider], uid: auth[:uid])
            user.save
        end

        user
    end
end
