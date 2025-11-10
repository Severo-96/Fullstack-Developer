require 'rails_helper'

RSpec.describe TokenAuthenticationService do
  let(:token) { 'valid-token' }
  let(:jwt_service) { instance_double(JwtService) }
  let!(:admin_user) do
    User.create!(
      full_name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: :admin
    )
  end

  before do
    allow(JwtService).to receive(:new).and_return(jwt_service)
  end

  describe '.authenticate' do
    context 'with a valid token' do
      before do
        allow(jwt_service).to receive(:decode_token).with(token).and_return({ user_id: admin_user.id })
      end

      it 'returns the user' do
        expect(described_class.authenticate(token)).to eq(admin_user)
      end
    end

    context 'when token is blank' do
      it 'returns nil' do
        expect(described_class.authenticate(nil)).to be_nil
        expect(described_class.authenticate('')).to be_nil
      end
    end

    context 'when token is invalid' do
      before do
        allow(jwt_service).to receive(:decode_token).with(token).and_return(nil)
      end

      it 'returns nil' do
        expect(described_class.authenticate(token)).to be_nil
      end
    end

    context 'when require_admin is true' do
      let!(:non_admin_user) do
        User.create!(
          full_name: 'Regular User',
          email: 'user@example.com',
          password: 'password123',
          role: :non_admin
        )
      end

      it 'returns the user if admin' do
        allow(jwt_service).to receive(:decode_token).with(token).and_return({ user_id: admin_user.id })
        expect(described_class.authenticate(token, require_admin: true)).to eq(admin_user)
      end

      it 'returns nil if user is not admin' do
        allow(jwt_service).to receive(:decode_token).with(token).and_return({ user_id: non_admin_user.id })
        expect(described_class.authenticate(token, require_admin: true)).to be_nil
      end
    end
  end
end


