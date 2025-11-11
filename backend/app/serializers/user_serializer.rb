class UserSerializer
  ATTRIBUTES = %i[id full_name email role created_at updated_at].freeze

  def initialize(user)
    @user = user
  end

  def as_json(_options = {})
    @user.as_json(
      only: ATTRIBUTES,
      methods: :avatar_image_url
    )
  end
end
