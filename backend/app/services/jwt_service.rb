require 'jwt'

class JwtService
  ALGORITHM = 'HS256'
  EXPIRATION_TIME = 24.hours
  DECODE_OPTIONS = { 
    algorithm: ALGORITHM, 
    verify_expiration: true 
  }

  def generate_token(user)
    payload = build_payload(user)
    JWT.encode(payload, secret_key, ALGORITHM)
  end

  def decode_token(token)
    decoded = JWT.decode(token, secret_key, true, DECODE_OPTIONS)[0]
    HashWithIndifferentAccess.new(decoded)
  rescue JWT::DecodeError, JWT::ExpiredSignature, JWT::VerificationError => e
    Rails.logger.error("JWT decode error: #{e.class} - #{e.message}")
    nil
  end

  private

  def secret_key
    @secret_key ||= Rails.application.credentials.dig(:secret_key_base) || Rails.application.secret_key_base
  end

  def build_payload(user)
    {
      user_id: user.id,
      email: user.email,
      role: user.role,
      exp: EXPIRATION_TIME.from_now.to_i
    }
  end
end

