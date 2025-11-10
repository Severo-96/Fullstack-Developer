require 'rails_helper'

RSpec.describe JwtService do
  let(:service) { described_class.new }
  let(:user) do
    User.create!(
      full_name: 'JWT User',
      email: 'jwt@example.com',
      password: 'password123',
      role: :non_admin
    )
  end

  describe '#generate_token' do
    it 'returns a JWT string' do
      token = service.generate_token(user)

      expect(token).to be_a(String)
      expect(token).not_to be_empty
    end
  end

  describe '#decode_token' do
    it 'returns the payload for a valid token' do
      token = service.generate_token(user)

      payload = service.decode_token(token)

      expect(payload['user_id']).to eq(user.id)
      expect(payload['email']).to eq('jwt@example.com')
    end

    it 'returns nil for invalid tokens' do
      payload = service.decode_token('not-a-token')

      expect(payload).to be_nil
    end
  end
end


