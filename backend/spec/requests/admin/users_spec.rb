require 'rails_helper'

RSpec.describe 'Admin::Users', type: :request do
  fixtures :users

  let(:admin_user) { users(:admin_user) }
  let(:existing_user) { users(:regular_user) }

  let(:token) { JwtService.new.generate_token(admin_user) }
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }

  describe 'authorization' do
    it 'rejects non authenticated access' do
      get '/admin/users'

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'CRUD actions' do
    context '#index' do
      it 'lists users' do
        get '/admin/users', headers: headers

        expect(response).to have_http_status(:ok)
        payload = JSON.parse(response.body, symbolize_names: true)

        expect(payload[:users].size).to eq(2)
        expect(payload[:users_count]).to eq({ total: 2, admin: 1, non_admin: 1 })
        expect(payload[:pagination]).to eq({ page: 1, per_page: 20, total_pages: 1, total_count: 2 })
      end
    end

    context '#show' do
      it 'shows existing user in payload' do
        get "/admin/users/#{existing_user.id}", headers: headers

        expect(response).to have_http_status(:ok)
        payload = JSON.parse(response.body, symbolize_names: true)
        expect(payload[:email]).to eq(existing_user.email)
      end

      it 'returns not found when the user do not exist' do
        get "/admin/users/999999", headers: headers

        expect(response).to have_http_status(:not_found)
        payload = JSON.parse(response.body, symbolize_names: true)
        expect(payload[:error]).to eq('User not found')
      end
    end

    context '#create' do
      it 'creates a user' do
        expect do
          post '/admin/users',
               params: { user: { full_name: 'New User', email: 'new@users.com', password: 'password123' } },
               headers: headers
        end.to change(User, :count).by(1)

        expect(response).to have_http_status(:created)
        payload = JSON.parse(response.body, symbolize_names: true)
        expect(payload[:email]).to eq('new@users.com')
      end

      it 'returns validation errors when payload is invalid' do
        post '/admin/users',
             params: { user: { full_name: '', email: '', password: '' } },
             headers: headers

        expect(response).to have_http_status(:unprocessable_content)
        payload = JSON.parse(response.body, symbolize_names: true)
        expect(payload[:error]).to eq('Failed to process user')
        expect(payload[:details]).to be_present
      end

      it 'returns error when email is already taken' do
        post '/admin/users',
             params: { user: { full_name: 'New User', email: existing_user.email, password: 'password123' } },
             headers: headers

        expect(response).to have_http_status(:unprocessable_content)
        payload = JSON.parse(response.body, symbolize_names: true)
        expect(payload[:error]).to eq('Failed to process user')
        expect(payload[:details]).to be_present
      end
    end

    context '#update' do
      it 'updates a user' do
        put "/admin/users/#{existing_user.id}", params: { user: { full_name: 'Changed Name' } }, headers: headers

        expect(response).to have_http_status(:ok)
        payload = JSON.parse(response.body, symbolize_names: true)
        expect(payload[:full_name]).to eq('Changed Name')
      end

      it 'returns not found when the user do not exist' do
        put "/admin/users/999999", params: { user: { full_name: 'Changed Name' } }, headers: headers

        expect(response).to have_http_status(:not_found)
        payload = JSON.parse(response.body, symbolize_names: true)
        expect(payload[:error]).to eq('User not found')
      end
    end

    context '#destroy' do
      it 'destroys a user' do
        expect do
          delete "/admin/users/#{existing_user.id}", headers: headers
        end.to change(User, :count).by(-1)

        expect(response).to have_http_status(:ok)
      end

      it 'returns not found when the user do not exist' do
        delete "/admin/users/999999", headers: headers

        expect(response).to have_http_status(:not_found)
        payload = JSON.parse(response.body, symbolize_names: true)
        expect(payload[:error]).to eq('User not found')
      end
    end
  end
end

