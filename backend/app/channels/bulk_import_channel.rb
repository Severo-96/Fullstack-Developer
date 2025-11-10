class BulkImportChannel < ApplicationCable::Channel
  def subscribed
    import_id = params[:import_id].presence
    actor_id = params[:actor_id].presence
    return reject unless import_id && actor_id && actor_id == current_user.id.to_s

    stream_from(stream_name(actor_id, import_id))
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end

  private

  def stream_name(actor_id, import_id)
    "bulk_import:#{actor_id}:#{import_id}"
  end
end


