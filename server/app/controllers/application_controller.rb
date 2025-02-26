class ApplicationController < ActionController::Base
  include ActionController::Cookies
	skip_before_action :verify_authenticity_token 
  before_action :set_csrf_cookie

  private

  def set_csrf_cookie
    cookies["CSRF-TOKEN"] = {
      value: form_authenticity_token,
      secure: true,
      same_site: :strict
    }
  end
end
