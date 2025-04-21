class UsersController < ApplicationController
  before_action :authenticate_user!, except: [:validate_token]

  def role
    render json: { role: current_user.role }, status: :ok
  end

  def profile
    render json: {
      id: current_user.id,
      role: current_user.role,
      email: current_user.email,
      full_name: current_user.full_name,
      avatar_url: current_user.avatar_url
    }, status: :ok
  end

  def validate_token
    if current_user
      render json: { valid: true, user_id: current_user.id }, status: :ok
    else
      render json: { valid: false }, status: :unauthorized
    end
  end
end
