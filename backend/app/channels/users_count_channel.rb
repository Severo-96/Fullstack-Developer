class UsersCountChannel < ApplicationCable::Channel
  def subscribed
    reject unless current_user&.admin?

    stream_from(stream_name)
    transmit UsersCountService.snapshot
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end

  private

  def stream_name
    "users_count"
  end
end


