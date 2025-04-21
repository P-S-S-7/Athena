class Users::SessionsController < Devise::SessionsController
    def logout
        sign_out current_user if current_user
        cookies.delete(:jwt)
        render json: {message: 'Logged out successfully'}, status: :ok
    end
end
