require 'rails_helper'

RSpec.describe UsersCountChannel, type: :channel do
  let!(:admin_user) do
    User.create!(
      full_name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: :admin
    )
  end

  let!(:non_admin_user) do
    User.create!(
      full_name: 'Regular User',
      email: 'user@example.com',
      password: 'password123',
      role: :non_admin
    )
  end

  it 'rejects non-admin users' do
    stub_connection current_user: non_admin_user

    subscribe

    expect(subscription).to be_rejected
  end

  it 'confirms subscription and streams for admins' do
    allow(UsersCountService).to receive(:snapshot).and_return({ total: 0 })
    stub_connection current_user: admin_user

    subscribe

    expect(subscription).to be_confirmed
    expect(subscription.send(:streams)).to include('users_count')
    expect(transmissions.last).to eq({ 'total' => 0 })
  end
end


