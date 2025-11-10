require 'rails_helper'
require 'stringio'

RSpec.describe User, type: :model do
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

  describe 'callbacks' do
    it 'enqueues UsersCountBroadcastJob after commit' do
      expect do
        User.create!(
          full_name: 'Test User',
          email: 'test_user@example.com',
          password: 'password123',
          role: :non_admin
        )
      end.to have_enqueued_job(UsersCountBroadcastJob).on_queue('real_time_jobs')
    end
  end

  describe '#avatar_image_url' do
    let(:user) do
      User.create!(
        full_name: 'Avatar User',
        email: 'avatar@example.com',
        password: 'password123',
        role: :non_admin
      )
    end

    it 'returns nil when no avatar is attached' do
      expect(user.avatar_image_url).to be_nil
    end

    it 'returns a URL when an avatar is attached' do
      user.avatar_image.attach(io: StringIO.new('avatar'), filename: 'avatar.png', content_type: 'image/png')

      expect(user.avatar_image_url).to include('http://example.com')
    end
  end
end


