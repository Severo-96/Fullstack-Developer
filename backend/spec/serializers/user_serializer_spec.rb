require 'rails_helper'

RSpec.describe UserSerializer do
  fixtures :users

  describe '#as_json' do
    it 'returns only permitted attributes and avatar URL' do
      user = users(:regular_user)
      serializer = described_class.new(user)

      json = serializer.as_json

      expect(json).to include(
        'id' => user.id,
        'full_name' => user.full_name,
        'email' => user.email,
        'role' => user.role,
        'created_at' => user.created_at.as_json,
        'updated_at' => user.updated_at.as_json
      )
      expect(json).to have_key('avatar_image_url')
      expect(json.keys).not_to include('password_digest')
    end
  end
end

