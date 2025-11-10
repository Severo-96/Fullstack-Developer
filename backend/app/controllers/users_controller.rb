class UsersController < ApplicationController
  before_action :authenticate_admin_request!

  # GET /users
  def index
    users = User.all
    users_count = User.count_by_role
    render json: { users: users.as_json(methods: :avatar_image_url), users_count: users_count }, status: :ok
  end

  # GET /users/:id
  def show
    user = User.find(params[:id])
    render json: user.as_json(methods: :avatar_image_url), status: :ok
  end

  # POST /users
  def create
    user = User.create(user_params)
    render json: user.as_json(methods: :avatar_image_url), status: :created
  end

  # POST /users/bulk_create
  def bulk_create
    uploaded_file = params[:file]

    unless uploaded_file
      return render json: { error: 'file parameter is required' }, status: :bad_request
    end

    unless allowed_file?(uploaded_file)
      return render json: { error: 'file must be a CSV or Excel spreadsheet' }, status: :unprocessable_entity
    end

    blob = persist_uploaded_file(uploaded_file)
    actor_id = current_user.id.to_s

    job = UserBulkImportJob.perform_later(blob.signed_id, nil, actor_id)
    render json: { import_id: job.job_id, actor_id:, status: 'queued' }, status: :accepted
  end

  # PUT /users/:id
  def update
    user = User.find(params[:id])
    user.update!(user_params.compact_blank)
    render json: user.as_json(methods: :avatar_image_url), status: :ok
  end

  # DELETE /users/:id
  def destroy
    user = User.find(params[:id])
    user.destroy
    render json: { message: 'User deleted successfully' }, status: :ok
  end

  private

  def user_params
    params.require(:user).permit(:full_name, :email, :password, :role, :avatar_image)
  end

  def allowed_file?(uploaded_file)
    extension = File.extname(uploaded_file.original_filename).delete('.').downcase
    allowed_extensions = %w[csv xls xlsx]

    return true if allowed_extensions.include?(extension)

    allowed_mime_types = %w[text/csv application/vnd.ms-excel application/vnd.openxmlformats-officedocument.spreadsheetml.sheet]
    allowed_mime_types.include?(uploaded_file.content_type)
  end

  def persist_uploaded_file(uploaded_file)
    tempfile = uploaded_file.tempfile
    tempfile.rewind

    ActiveStorage::Blob.create_and_upload!(
      io: tempfile,
      filename: uploaded_file.original_filename,
      content_type: uploaded_file.content_type
    )
  end
end

