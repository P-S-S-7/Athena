require_relative '../services/api/errors'

class ApplicationController < ActionController::Base
  include ActionController::Cookies
  skip_before_action :verify_authenticity_token
  before_action :set_csrf_cookie

  rescue_from Api::Errors::ApiError do |e|
    render json: e.to_hash, status: e.status
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
