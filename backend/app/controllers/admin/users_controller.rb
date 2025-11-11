module Admin
  class UsersController < ApplicationController
    before_action :authenticate_admin_request!

    # GET /admin/users
    def index
      pagy, users = pagy(User.order(created_at: :desc), items: per_page_param)

      render json: {
        users: users.as_json(methods: :avatar_image_url),
        users_count: User.count_by_role,
        pagination: {
          page: pagy.page,
          per_page: pagy.items,
          total_pages: pagy.pages,
          total_count: pagy.count
        }
      }, status: :ok
    end

    # GET /admin/users/:id
    def show
      user = find_user
      render json: user.as_json(methods: :avatar_image_url), status: :ok
    end

    # POST /admin/users
    def create
      user = User.create!(user_params)
      render json: user.as_json(methods: :avatar_image_url), status: :created
    end

    # PUT /admin/users/:id
    def update
      user = find_user
      user.update!(user_params.compact_blank)
      render json: user.as_json(methods: :avatar_image_url), status: :ok
    end

    # DELETE /admin/users/:id
    def destroy
      user = find_user
      user.destroy!
      render json: { message: 'User deleted successfully' }, status: :ok
    rescue ActiveRecord::RecordNotDestroyed => e
      render json: { error: "Failed to delete user: #{e.message}" }, status: :unprocessable_content
    end

    private

    def user_params
      params.require(:user).permit(:full_name, :email, :password, :role, :avatar_image)
    end

    def find_user
      User.find(params[:id])
    end

    def per_page_param
      per_page = params[:per_page].to_i
      per_page = Pagy::DEFAULT[:items] unless per_page.positive?
      [per_page, 100].min
    end
  end
end
