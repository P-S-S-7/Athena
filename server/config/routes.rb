Rails.application.routes.draw do
    devise_for :users, controllers: {
        omniauth_callbacks: 'users/omniauth_callbacks'
    }, skip: [:sessions, :registrations, :passwords]

    devise_scope :user do
        get 'sign_in', to: 'devise/sessions#new', as: :new_user_session
        post 'logout', to: 'users/sessions#logout'

        get '/users/auth/failure', to: 'users/omniauth_callbacks#failure'
    end

    get '/auth/csrf', to: 'application#set_csrf_cookie'

    get '/users/role', to: 'users#role'
    get '/users/profile', to: 'users#profile'
end
