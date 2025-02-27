class UsersController < ApplicationController
  before_action :authenticate_user!

  def role
    if current_user
      render json: { role: current_user.role }, status: :ok
    else
      render json: { error: "User not authenticated" }, status: :unauthorized
    end
  end

  def profile
    render json: {
      role: current_user.role,
      email: current_user.email,
      full_name: current_user.full_name,
      avatar_url: current_user.avatar_url
    }, status: :ok
  end
end
