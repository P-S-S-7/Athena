Rails.application.routes.draw do
    devise_for :users, controllers: {
        omniauth_callbacks: 'users/omniauth_callbacks'
    }, skip: [:sessions, :registrations, :passwords]

    devise_scope :user do
        post 'logout', to: 'users/sessions#logout'
        get '/users/auth/failure', to: 'users/omniauth_callbacks#failure'
    end

    get '/auth/csrf', to: 'application#set_csrf_cookie'

    get '/users/role', to: 'users#role'
    get '/users/profile', to: 'users#profile'

    namespace :api do
        resources :tickets do
            collection do
                get :fields
                get :count
            end
            member do
                get :conversations
                post :reply
                post :note
                post :forward
                post :merge
            end
        end

        delete 'conversations/:id', to: 'tickets#delete_conversation'
        put 'conversations/:id', to: 'tickets#update_conversation'

        resources :canned_response_folders, only: [:index, :show]
        resources :canned_responses, only: [:show]

        resources :agents
        resources :groups
        resources :contacts do
            collection do
                get :fields
                get :count
                post :merge
                get :companies
            end
        end
    end
end
