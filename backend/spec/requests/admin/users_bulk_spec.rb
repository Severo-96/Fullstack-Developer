require 'rails_helper'

RSpec.describe 'Admin::UsersBulk', type: :request do
  fixtures :users

  let(:admin_user) { users(:admin_user) }
  let(:token) { JwtService.new.generate_token(admin_user) }
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }
  let(:file_path) { Rails.root.join('spec/fixtures/files/bulk_users.csv') }

  describe 'POST /admin/users/bulk' do
    it 'enqueues a bulk import job when file is valid' do
      adapter = ActiveJob::Base.queue_adapter
      previous = adapter.perform_enqueued_jobs
      adapter.perform_enqueued_jobs = false

      expect do
        post '/admin/users/bulk',
             params: { file: Rack::Test::UploadedFile.new(file_path, 'text/csv') },
             headers: headers
      end.to have_enqueued_job(UserBulkImportJob)

      expect(response).to have_http_status(:accepted)
    ensure
      adapter.perform_enqueued_jobs = previous
    end

    it 'returns bad request when file is missing' do
      post '/admin/users/bulk', headers: headers

      expect(response).to have_http_status(:bad_request)
    end

    it 'returns unprocessable entity when file type is invalid' do
      Tempfile.create(['invalid', '.txt']) do |file|
        file.write('invalid content')
        file.rewind

        post '/admin/users/bulk',
             params: { file: Rack::Test::UploadedFile.new(file.path, 'text/plain') },
             headers: headers
      end

      expect(response).to have_http_status(:unprocessable_content)
      expect(response).to have_http_status(:unprocessable_content)
      payload = JSON.parse(response.body)
      expect(payload['error']).to eq('file must be a CSV or Excel spreadsheet')
    end

    it 'returns payload too large when file exceeds 5MB' do
      Tempfile.create(['large', '.csv']) do |file|
        file.write('a' * (5.megabytes + 1))
        file.rewind

        post '/admin/users/bulk',
             params: { file: Rack::Test::UploadedFile.new(file.path, 'text/csv') },
             headers: headers
      end

      expect(response).to have_http_status(:content_too_large)
      payload = JSON.parse(response.body)
      expect(payload['error']).to eq('file size must be 5MB or less')
    end
  end
end

