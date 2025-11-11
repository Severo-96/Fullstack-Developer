require 'rails_helper'

RSpec.describe 'Sessions', type: :request do
  fixtures :users

  let(:existing_user) { users(:regular_user) }

  describe '#login' do
    it 'authenticates with valid credentials' do
      post '/login', params: { email: existing_user.email, password: 'password123' }

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body, symbolize_names: true)
      expect(payload[:token]).to be_present
    end

    it 'returns unauthorized with invalid credentials' do
      post '/login', params: { email: existing_user.email, password: 'wrong-password' }

      expect(response).to have_http_status(:unauthorized)
      payload = JSON.parse(response.body, symbolize_names: true)
      expect(payload[:error]).to eq('Invalid credentials')
    end

    it 'returns not found when user email does not exist' do
      post '/login', params: { email: 'missing@example.com', password: 'password123' }

      expect(response).to have_http_status(:not_found)
      payload = JSON.parse(response.body, symbolize_names: true)
      expect(payload[:error]).to eq('User not found')
    end
  end

  describe '#register' do
    it 'creates a user and returns a token' do
      expect do
        post '/register', params: { full_name: 'New User', email: 'new@example.com', password: 'password123' }
      end.to change(User, :count).by(1)

      expect(response).to have_http_status(:created)
      payload = JSON.parse(response.body, symbolize_names: true)
      expect(payload[:token]).to be_present
      expect(User.find_by(email: 'new@example.com')).to be_present
    end

    it 'returns errors when payload is invalid' do
      post '/register', params: { full_name: '', email: '', password: '' }

      expect(response).to have_http_status(:unprocessable_content)
      payload = JSON.parse(response.body, symbolize_names: true)
      expect(payload[:errors]).to be_an(Array)
      expect(payload[:errors]).not_to be_empty
    end

    it 'returns errors when email is already taken' do
      post '/register', params: { full_name: 'Duplicate', email: existing_user.email, password: 'password123' }

      expect(response).to have_http_status(:unprocessable_content)
      payload = JSON.parse(response.body, symbolize_names: true)
      expect(payload[:errors]).to include('Email has already been taken')
    end
  end
end


