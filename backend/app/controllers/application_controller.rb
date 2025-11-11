class ApplicationController < ActionController::API
  include Pagy::Backend
  include Authenticable

  rescue_from ActiveRecord::RecordInvalid, with: :render_unprocessable_entity
  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
  rescue_from ActionController::ParameterMissing, with: :render_missing_parameter

  private

  def render_unprocessable_entity(e)
    render json: { error: 'Failed to process user', details: e.message }, status: :unprocessable_content
  end

  def render_not_found
    render json: { error: 'User not found' }, status: :not_found
  end

  def render_missing_parameter(e)
    render json: { error: 'Missing parameter', details: e.message }, status: :bad_request
  end
end
