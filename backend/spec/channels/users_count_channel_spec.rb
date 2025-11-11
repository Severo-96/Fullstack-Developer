require 'rails_helper'

RSpec.describe UsersCountChannel, type: :channel do
  fixtures :users

  let(:admin_user) { users(:admin_user) }
  let(:non_admin_user) { users(:regular_user) }

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


