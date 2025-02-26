class Users::SessionsController < Devise::SessionsController
    def logout
        sign_out current_user
        cookies.delete(:user_email)
        cookies.delete(:user_full_name)
        cookies.delete(:user_avatar_url)
        cookies.delete(:user_role)
        render json: {message: 'Logged out successfully'}, status: :ok
    end
end
