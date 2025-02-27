class Users::SessionsController < Devise::SessionsController
    def logout
        sign_out current_user
        cookies.delete(:user_id)
        render json: {message: 'Logged out successfully'}, status: :ok
    end
end
