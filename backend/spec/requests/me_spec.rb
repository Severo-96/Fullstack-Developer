require 'rails_helper'

RSpec.describe 'Me', type: :request do
  fixtures :users

  let(:user) { users(:regular_user) }
  let(:token) { JwtService.new.generate_token(user) }
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }

  describe '#show' do
    it 'returns the current user profile' do
      get '/me', headers: headers

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body, symbolize_names: true)
      expect(payload[:email]).to eq(user.email)
      expect(payload[:full_name]).to eq(user.full_name)
    end
  end

  describe '#update' do
    it 'updates the current user profile' do
      put '/me',
          params: { user: { full_name: 'Updated Name' } },
          headers: headers

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body, symbolize_names: true)
      expect(payload[:full_name]).to eq('Updated Name')
      expect(user.reload.full_name).to eq('Updated Name')
    end

    it 'returns validation errors when payload is invalid' do
      put '/me',
          params: { user: { email: 'invalid-email' } },
          headers: headers

      expect(response).to have_http_status(:unprocessable_content)
      payload = JSON.parse(response.body, symbolize_names: true)
      expect(payload[:error]).to eq('Failed to process user')
      expect(payload[:details]).to be_present
    end
  end

  describe '#destroy' do
    it 'destroys the current user' do
      expect do
        delete '/me', headers: headers
      end.to change(User, :count).by(-1)

      expect(response).to have_http_status(:ok)
    end
  end

  describe 'authentication' do
    it 'returns unauthorized without a token' do
      get '/me'

      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns unauthorized with invalid token' do
      get '/me', headers: { 'Authorization' => 'Bearer invalid-token' }

      expect(response).to have_http_status(:unauthorized)
    end
  end
end


