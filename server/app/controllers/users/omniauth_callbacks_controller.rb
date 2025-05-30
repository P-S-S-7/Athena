class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
    def google_oauth2
        user = User.from_google(from_google_params)

        if user.present?
            sign_out_all_scopes

            token = JwtService.encode({ user_id: user.id })

            cookies[:jwt] = {
                value: token,
                httponly: true,
                secure: Rails.env.production?,
                expires: 7.days.from_now,
                same_site: :lax
            }

            redirect_to "#{ENV['FRONTEND_URL']}/login?status=success"
        else
            redirect_to "#{ENV['FRONTEND_URL']}/login?error=unauthorized"
        end
    end

    def failure
        redirect_to "#{ENV['FRONTEND_URL']}/login?error=google_auth_failed"
    end

    protected

    def after_omniauth_failure_path_for(scope)
    "#{ENV['FRONTEND_URL']}/login?error=google_auth_failed"
    end

    private

    def from_google_params
        @from_google_params ||= {
            email: auth.info.email,
            full_name: auth.info.name,
            avatar_url: auth.info.image,
            provider: auth.provider,
            uid: auth.uid,
        }
    end

    def auth
        @auth ||= request.env['omniauth.auth']
    end
end
