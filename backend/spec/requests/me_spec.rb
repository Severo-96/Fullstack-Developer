require 'rails_helper'

RSpec.describe 'Me', type: :request do
  let!(:user) do
    User.create!(
      full_name: 'Self User',
      email: 'self@example.com',
      password: 'password123',
      role: :non_admin
    )
  end

  let(:token) { JwtService.new.generate_token(user) }
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }

  describe 'GET /me' do
    it 'returns the current user' do
      get '/me', headers: headers

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload['email']).to eq('self@example.com')
    end
  end

  describe 'PUT /me' do
    it 'updates the current user profile' do
      put '/me', params: { user: { full_name: 'Updated Name' } }, headers: headers

      expect(response).to have_http_status(:ok)
      expect(user.reload.full_name).to eq('Updated Name')
    end
  end

  describe 'DELETE /me' do
    it 'destroys the current user' do
      expect do
        delete '/me', headers: headers
      end.to change(User, :count).by(-1)

      expect(response).to have_http_status(:ok)
    end
  end

  it 'returns unauthorized without a token' do
    get '/me'

    expect(response).to have_http_status(:unauthorized)
  end
end


