class Users::SessionsController < Devise::SessionsController
  def logout
    sign_out current_user
    cookies.delete(:user_role)
    cookies.delete(:user_email)
    render json: { success: true }
  end
end
