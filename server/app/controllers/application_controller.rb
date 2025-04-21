require_relative '../services/api/errors'

class ApplicationController < ActionController::Base
  include ActionController::Cookies
  skip_before_action :verify_authenticity_token
  before_action :set_csrf_cookie

  rescue_from Api::Errors::ApiError do |e|
    render json: e.to_hash, status: e.status
  end

  protected

  def authenticate_user!
    render json: { error: "Unauthorized" }, status: :unauthorized unless current_user
  end

  def current_user
    @current_user ||= begin
      token = extract_token
      if token
        decoded_token = JwtService.decode(token)
        User.find_by(id: decoded_token[:user_id]) if decoded_token
      end
    end
  end

  def extract_token
    auth_header = request.headers['Authorization']
    if auth_header && auth_header.start_with?('Bearer ')
      auth_header.split(' ').last
    else
      cookies[:jwt]
    end
  end

  private

  def set_csrf_cookie
    cookies["CSRF-TOKEN"] = {
      value: form_authenticity_token,
      secure: true,
      same_site: :strict
    }
  end
end
