module Authenticable
  extend ActiveSupport::Concern

  def authenticate_request!
    @current_user = TokenAuthenticationService.authenticate(extract_token_from_header)

    return render json: { error: 'Unauthorized' }, status: :unauthorized unless @current_user
  end

  def current_user
    @current_user
  end

  def authenticate_admin_request!
    @current_user = TokenAuthenticationService.authenticate(extract_token_from_header, require_admin: true)

    return render json: { error: 'Unauthorized' }, status: :unauthorized unless @current_user
  end

  private

  def extract_token_from_header
    auth_header = request.headers['Authorization']
    return nil unless auth_header

    auth_header.split(' ').last if auth_header.start_with?('Bearer ')
  end
end
