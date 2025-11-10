require 'rails_helper'

RSpec.describe 'Users', type: :request do
  let!(:admin_user) do
    User.create!(
      full_name: 'Admin User',
      email: 'admin-users@example.com',
      password: 'password123',
      role: :admin
    )
  end

  let!(:existing_user) do
    User.create!(
      full_name: 'Existing User',
      email: 'existing@example.com',
      password: 'password123',
      role: :non_admin
    )
  end

  let(:token) { JwtService.new.generate_token(admin_user) }
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }

  describe 'authorization' do
    it 'rejects non authenticated access' do
      get '/users'

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'CRUD actions' do
    it 'lists users' do
      get '/users', headers: headers

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload['users'].size).to be >= 1
      expect(payload['users_count']).to include('total')
    end

    it 'shows a user' do
      get "/users/#{existing_user.id}", headers: headers

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload['email']).to eq('existing@example.com')
    end

    it 'creates a user' do
      expect do
        post '/users', params: { user: { full_name: 'New User', email: 'new@users.com', password: 'password123' } }, headers: headers
      end.to change(User, :count).by(1)

      expect(response).to have_http_status(:created)
    end

    it 'updates a user' do
      put "/users/#{existing_user.id}", params: { user: { full_name: 'Changed Name' } }, headers: headers

      expect(response).to have_http_status(:ok)
      expect(existing_user.reload.full_name).to eq('Changed Name')
    end

    it 'destroys a user' do
      expect do
        delete "/users/#{existing_user.id}", headers: headers
      end.to change(User, :count).by(-1)

      expect(response).to have_http_status(:ok)
    end
  end

  describe 'POST /users/bulk_create' do
    let(:file_path) { Rails.root.join('spec/fixtures/files/bulk_users.csv') }

    it 'enqueues a bulk import job when file is valid' do
      adapter = ActiveJob::Base.queue_adapter
      previous = adapter.perform_enqueued_jobs
      adapter.perform_enqueued_jobs = false

      expect do
        post '/users/bulk_create',
             params: { file: Rack::Test::UploadedFile.new(file_path, 'text/csv') },
             headers: headers
      end.to have_enqueued_job(UserBulkImportJob)

      expect(response).to have_http_status(:accepted)
    ensure
      adapter.perform_enqueued_jobs = previous
    end

    it 'returns bad request when file is missing' do
      post '/users/bulk_create', headers: headers

      expect(response).to have_http_status(:bad_request)
    end
  end
end


