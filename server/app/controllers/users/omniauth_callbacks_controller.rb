class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
    def google_oauth2
        user = User.from_google(from_google_params)

        if user.present?
            sign_out_all_scopes
            sign_in_and_redirect user, event: :authentication
            cookies[:user_email] = user.email
            cookies[:user_full_name] = user.full_name
            cookies[:user_avatar_url] = user.avatar_url
            cookies[:user_role] = user.role
        else
            redirect_to "#{ENV['FRONTEND_URL']}/login?error=unauthorized"
        end
    end

    def failure
        redirect_to "#{ENV['FRONTEND_URL']}/login?error=google_auth_failed"
    end

    protected

    def after_sign_in_path_for(resource)
        return "#{ENV['FRONTEND_URL']}/admin_dashboard" if resource.admin?
    "#{ENV['FRONTEND_URL']}/agent_dashboard"
    end

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
