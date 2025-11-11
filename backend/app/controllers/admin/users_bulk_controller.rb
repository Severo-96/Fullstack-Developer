module Admin
  class UsersBulkController < ApplicationController
    before_action :authenticate_admin_request!

    # POST /admin/users/bulk
    def create
      uploaded_file = file_params

    if uploaded_file.size > 5.megabytes
      return render json: { error: 'file size must be 5MB or less' }, status: :content_too_large
      end

      unless allowed_file?(uploaded_file)
      return render json: { error: 'file must be a CSV or Excel spreadsheet' }, status: :unprocessable_content
      end

      blob = persist_uploaded_file(uploaded_file)
      actor_id = current_user.id.to_s

      job = UserBulkImportJob.perform_later(blob.signed_id, nil, actor_id)
      render json: { import_id: job.job_id, actor_id:, status: 'queued' }, status: :accepted
    end

    private

    def file_params
      params.require(:file)
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
end
