require 'rails_helper'

RSpec.describe 'Sessions', type: :request do
  describe 'POST /login' do
    let!(:user) do
      User.create!(
        full_name: 'Login User',
        email: 'login@example.com',
        password: 'password123',
        role: :non_admin
      )
    end

    it 'authenticates with valid credentials' do
      post '/login', params: { email: 'login@example.com', password: 'password123' }

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload['token']).to be_present
      expect(payload.dig('user', 'id')).to eq(user.id)
    end

    it 'returns unauthorized with invalid credentials' do
      post '/login', params: { email: 'login@example.com', password: 'wrong-password' }

      expect(response).to have_http_status(:unauthorized)
      payload = JSON.parse(response.body)
      expect(payload['error']).to eq('Invalid credentials')
    end
  end

  describe 'POST /register' do
    it 'creates a user and returns a token' do
      post '/register', params: { full_name: 'New User', email: 'new@example.com', password: 'password123' }

      expect(response).to have_http_status(:created)
      payload = JSON.parse(response.body)
      expect(payload['token']).to be_present
      expect(payload.dig('user', 'email')).to eq('new@example.com')
      expect(User.find_by(email: 'new@example.com')).to be_present
    end

    it 'returns errors when record is invalid' do
      post '/register', params: { full_name: '', email: '', password: '' }

      expect(response).to have_http_status(:unprocessable_entity)
      payload = JSON.parse(response.body)
      expect(payload['errors']).to be_an(Array)
    end
  end
end


