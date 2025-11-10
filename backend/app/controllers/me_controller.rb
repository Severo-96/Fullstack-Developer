class MeController < ApplicationController
  before_action :authenticate_request!

  # GET /me
  def show
    user = User.find(current_user.id)
    render json: user.as_json(methods: :avatar_image_url), status: :ok
  end

  # PUT /me
  def update
    user = User.find(current_user.id)
    user.update!(user_params.compact_blank)
    render json: user.as_json(methods: :avatar_image_url), status: :ok
  end

  # DELETE /me
  def destroy
    user = User.find(current_user.id)
    user.destroy
    render json: { message: 'User deleted successfully' }, status: :ok
  end

  private

  def user_params
    params.require(:user).permit(:full_name, :email, :password, :avatar_image)
  end
end

