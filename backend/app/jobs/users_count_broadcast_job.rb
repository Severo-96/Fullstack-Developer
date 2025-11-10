class UsersCountBroadcastJob < ApplicationJob
  queue_as :real_time_jobs

  def perform
    UsersCountService.broadcast
  end
end


