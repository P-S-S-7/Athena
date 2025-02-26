OmniAuth.config.allowed_request_methods = [:post, :get]
OmniAuth.config.silence_get_warning = true

OmniAuth.config.on_failure = Proc.new { |env|
    OmniAuth::FailureEndpoint.new(env).redirect_to_failure
}
