Rails.application.config.middleware.insert_before 0, Rack::Cors do
    allow do
        origins ENV['FRONTEND_URL'] || 'http://localhost:5173'
        resource '*',
        headers: :any,
        methods: [:get, :post, :put, :patch, :delete, :options, :head],
        credentials: true,
        expose: ['Set-Cookie']
    end
end
