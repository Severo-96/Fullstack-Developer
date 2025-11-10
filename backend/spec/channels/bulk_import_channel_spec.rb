require 'rails_helper'

RSpec.describe BulkImportChannel, type: :channel do
  let(:admin_user) do
    User.create!(
      full_name: 'Admin User',
      email: 'bulk-admin@example.com',
      password: 'password123',
      role: :admin
    )
  end

  before do
    stub_connection current_user: admin_user
  end

  it 'streams from the bulk import channel when actor matches current user' do
    subscribe(actor_id: admin_user.id.to_s, import_id: 'job-123')

    expect(subscription).to be_confirmed
    expect(subscription.send(:streams)).to include("bulk_import:#{admin_user.id}:job-123")
  end

  it 'rejects the subscription when actor does not match' do
    subscribe(actor_id: 'different-user', import_id: 'job-123')

    expect(subscription).to be_rejected
  end

  it 'rejects the subscription when params are missing' do
    subscribe

    expect(subscription).to be_rejected
  end
end


