require 'rails_helper'

RSpec.describe UsersCountBroadcastJob, type: :job do
  include ActiveJob::TestHelper

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
    expect { described_class.perform_later }.to have_enqueued_job(described_class).on_queue('real_time_jobs')
  end

  it 'broadcasts the counts when performed' do
    allow(UsersCountService).to receive(:broadcast)

    perform_enqueued_jobs do
      described_class.perform_later
    end

    expect(UsersCountService).to have_received(:broadcast)
  end
end


