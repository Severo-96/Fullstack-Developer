class UsersCountService
  def self.snapshot
    counts = User.count_by_role

    {
      total: counts[:total],
      admin: counts[:admin],
      non_admin: counts[:non_admin],
      updated_at: Time.current.iso8601
    }
  end

  def self.broadcast
    ActionCable.server.broadcast(stream_name, snapshot)
  end

  def self.stream_name
    "users_count"
  end
end


