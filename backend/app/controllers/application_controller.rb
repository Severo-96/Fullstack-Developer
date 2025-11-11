class ApplicationController < ActionController::API
  include Pagy::Backend
  include Authenticable

  rescue_from ActiveRecord::RecordInvalid, with: :render_unprocessable_entity
  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
  rescue_from ActionController::ParameterMissing, with: :render_missing_parameter

  private

  def render_unprocessable_entity(e)
    render json: { error: 'Failed to process user', details: e.record.errors.full_messages }, status: :unprocessable_content
  end

  def render_not_found
    render json: { error: 'User not found' }, status: :not_found
  end

  def render_missing_parameter(e)
    missing_keys = e.param.to_s.split(',').map(&:strip)
    render json: { error: 'Missing parameter', details: missing_keys }, status: :bad_request
  end
end
