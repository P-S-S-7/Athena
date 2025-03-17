require_relative "boot"
require "rails/all"

require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_view/railtie"

Bundler.require(*Rails.groups)

module Server
    class Application < Rails::Application
        config.load_defaults 7.1
        config.autoload_lib(ignore: %w(assets tasks))
        config.api_only = true
        config.middleware.use ActionDispatch::Cookies
        config.middleware.use ActionDispatch::Session::CookieStore
        config.middleware.use ActionDispatch::Flash
        config.session_store :cookie_store, key: '_server_session'

        config.generators do |g|
            g.orm :active_record, primary: true
            g.orm :mongoid
        end
    end
end
