class TokenAuthenticationService
  def self.authenticate(token, require_admin: false)
    return nil if token.blank?

    payload = JwtService.new.decode_token(token)
    return nil unless payload

    user = User.find_by(id: payload[:user_id])
    return nil unless user
    return nil if require_admin && !user.admin?

    user
  end
end


