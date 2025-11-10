require 'rails_helper'

RSpec.describe ApplicationCable::Connection, type: :channel do
  let(:admin_user) do
    User.create!(
      full_name: 'Admin User',
      email: 'admin-connection@example.com',
      password: 'password123',
      role: :admin
    )
  end

  it 'successfully connects for admin user tokens' do
    allow(TokenAuthenticationService).to receive(:authenticate)
      .with('valid-token', require_admin: true)
      .and_return(admin_user)

    connect '/cable', params: { token: 'valid-token' }

    expect(connection.current_user).to eq(admin_user)
  end

  it 'rejects connection when token is invalid' do
    allow(TokenAuthenticationService).to receive(:authenticate)
      .with('invalid-token', require_admin: true)
      .and_return(nil)

    expect do
      connect '/cable', params: { token: 'invalid-token' }
    end.to have_rejected_connection
  end
end


