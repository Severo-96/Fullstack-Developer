require 'rails_helper'

RSpec.describe UserBulkImportJob, type: :job do
  include ActiveJob::TestHelper

  fixtures :users

  let(:admin_user) { users(:admin_user) }

  let(:csv_content) do
    <<~CSV
      full_name,email,password,role
      New User,new_user@example.com,securepass,non_admin
    CSV
  end

  let(:blob) do
    ActiveStorage::Blob.create_and_upload!(
      io: StringIO.new(csv_content),
      filename: 'bulk.csv',
      content_type: 'text/csv'
    )
  end

  around do |example|
    previous_adapter = ActiveJob::Base.queue_adapter
    ActiveJob::Base.queue_adapter = :test
    clear_enqueued_jobs
    clear_performed_jobs
    example.run
    clear_enqueued_jobs
    clear_performed_jobs
    ActiveJob::Base.queue_adapter = previous_adapter
  end

  it 'enqueues on the real_time_jobs queue' do
    expect {
      described_class.perform_later(blob.signed_id, nil, admin_user.id)
    }.to have_enqueued_job(described_class).on_queue('real_time_jobs')
  end

  it 'creates users from the spreadsheet and broadcasts progress' do
    allow(ActionCable.server).to receive(:broadcast)

    perform_enqueued_jobs do
      described_class.perform_later(blob.signed_id, nil, admin_user.id)
    end

    created_user = User.find_by(email: 'new_user@example.com')
    expect(created_user).to be_present
    expect(created_user.full_name).to eq('New User')
    expect(created_user).to be_non_admin

    expect(ActionCable.server).to have_received(:broadcast).with(
      a_string_matching(/^bulk_import:#{admin_user.id}:/),
      hash_including(event: 'finished', processed: 1, total: 1, failed: 0)
    )
  end
end


