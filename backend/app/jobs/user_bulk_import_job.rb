require 'securerandom'

class UserBulkImportJob < ApplicationJob
  queue_as :real_time_jobs

  def perform(blob_signed_id, import_id, actor_id)
    @actor_id = actor_id.to_s
    @import_id = import_id.presence || job_id
    @processed = 0
    @errors = []

    broadcast(event: 'started', message: 'Bulk import started')

    blob = ActiveStorage::Blob.find_signed(blob_signed_id)
    rows = parse_rows(blob)

    total = rows.size
    broadcast(event: 'processing', total:)

    rows.each_with_index do |row, index|
      process_row(row)
      @processed = index + 1
      broadcast(event: 'progress', processed: @processed, total:)
    rescue StandardError => e
      register_error(row, e)
      broadcast(
        event: 'row_failed',
        processed: @processed,
        total: total,
        row_data: row,
        error: e.message
      )
      Rails.logger.error("Bulk import row failed: #{e.message}")
    end

    broadcast(
      event: 'finished',
      processed: @processed,
      total: total,
      failed: @errors.size,
      errors: @errors
    )
  rescue StandardError => e
    Rails.logger.error("Bulk import failed: #{e.class} - #{e.message}")
    broadcast(
      event: 'failed',
      error: e.message,
      processed: @processed,
      failed: @errors.size,
      errors: @errors
    )
    raise
  ensure
    blob&.purge_later if defined?(blob) && blob.present?
  end

  private

  def parse_rows(blob)
    blob.open do |file|
      UserImports::SpreadsheetParser.new(file.path, filename: blob.filename.to_s).rows
    end
  end

  def process_row(row)
    validate_required_fields!(row, :email, :full_name, :password)

    attributes = {
      full_name: row[:full_name],
      email: row[:email],
      password: row[:password],
      role: row[:role].presence || 'non_admin'
    }

    User.create!(attributes)
  end

  def broadcast(payload)
    ActionCable.server.broadcast(stream_name, payload.merge(import_id: @import_id, actor_id: @actor_id))
  end

  def stream_name
    "bulk_import:#{@actor_id}:#{@import_id}"
  end
  
  def validate_required_fields!(row, *fields)
    fields.each do |field|
      value = row[field]
      raise UserImports::RowError, "#{field.to_s.humanize} is required" if value.blank?
    end
  end

  def register_error(row, exception)
    @errors << {
      row: row,
      error: exception.message
    }
  end
end


