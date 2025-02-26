class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def google_oauth2
    user = User.from_google(from_google_params)

    if user.present?
      sign_out_all_scopes
      sign_in_and_redirect user, event: :authentication
      cookies[:user_role] = user.role
      cookies[:user_email] = user.email
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
      uid: auth.uid,
      email: auth.info.email,
      full_name: auth.info.name,
      avatar_url: auth.info.image
    }
  end

  def auth
    @auth ||= request.env['omniauth.auth']
  end
end
