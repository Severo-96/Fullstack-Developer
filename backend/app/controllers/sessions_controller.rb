class SessionsController < ApplicationController

  # POST /login
  def login
    user = User.find_by!(email: login_params[:email])
    unless user&.authenticate(login_params[:password])
      return render json: { error: 'Invalid credentials' }, status: :unauthorized
    end

    token = JwtService.new.generate_token(user)
    render json: { token: }, status: :ok
  end

  # POST /register
  def register
    user = User.create!(register_params)

    token = JwtService.new.generate_token(user)
    render json: { token: }, status: :created
  end

  private

  def login_params
    params.permit(:email, :password)
  end

  def register_params
    params.permit(:full_name, :email, :password, :avatar_image)
  end
end
